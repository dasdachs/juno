# Juno security and privacy review — 2026-11-10

Scope: the encryption and secrets handling (`src/lib/crypto.ts`, `db.ts`, `exportImport.ts`, `sync/`), and everything around it that decides what leaves the encryption: storage schema, backup and sync files, lock behaviour, CSP, and the deploy pipeline.

This supersedes `SECURITY_REVIEW.md`, which describes the earlier HealthVault code.

## Summary

The cryptographic primitives were sound (libsodium, Argon2id at 4 passes / 128 MB, authenticated encryption, random nonces). The problems were in what sat outside the ciphertext.

- **The sync file was plaintext.** "Push (Export)" downloaded every record, cycle and the profile as readable JSON.
- **Period start dates, entry types and edit times were stored unencrypted** in IndexedDB as index columns. Anyone with the device, and no password, could read when each period started and when an intimacy entry was logged.
- **Deleted entries were not deleted.** They kept their full content, encrypted, and were included in every backup and sync file.
- **Changing the password did not change the key.** An old copy of the browser profile plus the old password still opened everything, including data written later.
- **The avatar URL told a third-party server** the user's IP address and each time they opened the app.

All of these are fixed, along with the lower-severity items below. Nothing rated Medium or above remains open. The work is uncommitted in the working tree.

## Verification

| Check | Result |
|---|---|
| `npx tsc -b` | clean |
| `npm run lint` | 0 errors, 6 warnings (all `react-refresh`, in files that already had them) |
| `npm run test:run` | 42 files, 379 tests, all passing (258 before this work) |
| `npm run build` | succeeds |

Not checked: nothing was exercised in a real browser. That matters for three things the test environment cannot run: the avatar image resize (needs a canvas), the cross-tab lock (needs two real tabs), and the upgrade of a real pre-existing vault. The upgrade is covered by tests against rows built in the old format, but please try it on a copy of real data before deploying.

## How it was reviewed

I audited and fixed; subagents checked the work in three rounds.

- **Opus, three independent read-only reviews.** Each reviewed the latest changes and looked for what had been missed. Round one confirmed the core format change and found the tombstone, import and auto-lock issues. Round two found the multi-tab problems caused by key rotation and judged the avatar, cycle deletion and export-abort items not defensible to leave open. Round three found nothing at Medium or above.
- **Sonnet, three test passes.** Fixed the tests the changes broke and wrote nearly all of the 121 new tests, using real libsodium and a real (in-memory) IndexedDB rather than mocks for the crypto paths. It reported no source bugs.

## Findings and fixes

Severity reflects the threat model that matters for this app: a seized or borrowed device without the password, a leaked backup or sync file, and injected content.

### Critical

**1. Sync file contained all data in plaintext.**
`SyncEngine.push` serialised decrypted data straight to the downloaded `.junosync` file; a comment claimed it was already encrypted.
Fix: the payload is sealed with a passphrase (Argon2id + secretbox), entered and confirmed in Settings. Plaintext-era files are refused on pull.

### High

**2. Period dates, entry types and edit times stored unencrypted.**
`cycles.startDate`, `records.category`, `records.timestamp` and `records.cycleId` were plaintext index columns.
Fix: stored rows are now only `{id, nonce, ciphertext, version}`. A Dexie schema upgrade drops the indexes and erases those values from existing rows. Filtering and sorting happen after decryption. `settings.lastUnlockedAt` (when the app was last opened) is also gone.

**3. Deleted entries kept their content.**
Deleting a record set a flag and re-encrypted the whole entry. It stayed in the database, backups and sync files indefinitely.
Fix: a deleted record becomes a tombstone holding only its ID and deletion time; its type, creation time, data and tags are erased. Records deleted before this change are scrubbed at next unlock. Import and sync pull scrub deleted records too, so an old backup cannot bring content back.

**4. Password change did not rotate the vault key.**
Fix: `changePassword` generates a new vault key and re-encrypts every row with it, in one transaction with the new key store.

**5. Remote avatar URL.**
Each unlock fetched a user-pasted image URL from a third party, and `img-src https:` in the CSP gave injected content a way to send data out.
Fix: the avatar is now a picture chosen from the device, shrunk to 128 px and stored inside the encrypted profile. `https:` is removed from `img-src`. Remote URLs saved earlier are never loaded.
**This changes a feature you designed** (`docs/superpowers/specs/2026-08-11-avatar-design.md` is now out of date): pasting a link no longer works. Both reviewers independently called the old behaviour indefensible for this app, so I changed it, but it is your call; it is contained in `Avatar.tsx`, `ProfilePage.tsx`, `avatarImage.ts` and the two CSP strings.

### Medium

**6. Ciphertext length revealed entry type and note size.** Plaintext is now padded to 256-byte blocks.

**7. Per-item keys used only 24 bits of the ID, and ciphertexts were not bound to their row.** Unrelated items could share a key, and a ciphertext could be moved to another row with a colliding key. Keys are now derived from the full ID (keyed BLAKE2b), and decryption checks that the decrypted item's ID matches its row. Old rows remain readable and are upgraded at next unlock.

**8. Weak password bar.** The minimum was zxcvbn score 2 (under 10^8 guesses), and the change-password form checked only length. All four password forms (vault, change, backup, sync) now share one rule: 12+ characters and score 3. Existing weaker passwords keep working; users are not prompted to upgrade.

**9. Importing with "replace" could destroy the vault.** It cleared the tables, then imported without a transaction or validation. Import now validates the whole file first and applies in one transaction.

**10. "Delete all data" was incomplete.** It emptied tables, left the vault unlocked in memory, and another open tab could quietly recreate the database. It now locks, deletes the whole database, clears local storage, tells other tabs to lock and reload, and reports failure instead of failing silently.

**11. Other tabs after a password change or wipe.** A side effect of fix 4: a second tab holding the old key would write rows nothing could open. Other tabs are now told to lock (BroadcastChannel), and export, import and sync pull check that the tab's key is still the stored one before running.

**12. Deleted cycles could come back.** Cycles were removed outright, so a merge-import or sync pull restored them. They now leave tombstones like records.

**13. Auto-lock gaps.** Lock on page hide waited on a database read, so a frozen page could come back unlocked; it is now synchronous. A password change that overlapped an auto-lock put the key back in memory behind the lock screen; it now stays locked.

### Low

- **Backup manifest** no longer states record and cycle counts (it is readable without the password).
- **One damaged row** no longer aborts export or sync, or empties the cycle view. Damaged rows are skipped and the count is shown. If nothing at all is readable, export fails rather than producing an empty backup.
- **An unreadable profile** no longer triggers first-run setup, which would have overwritten it.
- **Backup and sync contents are shape-checked** before anything is stored, with a 50 MB cap.
- **Key material**: replaced keys and intermediate buffers are wiped on every path, including errors.
- **CSP** is also sent as a response header (`public/_headers`), so `frame-ancestors` takes effect; `Referrer-Policy` is `no-referrer`.
- **Deploy workflow**: actions are pinned to commit SHAs, and pull requests are built and tested but not deployed.
- **Docs**: `CLAUDE.md` said XChaCha20-Poly1305; the code uses XSalsa20-Poly1305 (`crypto_secretbox`). Corrected, and the new invariants are listed there.

## Open items

None is Medium or above. Each is here because it is a judgement call or a larger change.

1. **Writes in the instant after a password change in another tab.** A second tab that saves an entry in the milliseconds before it receives the lock message writes a row under the old key, which is then skipped as unreadable. Closing it fully means checking the key store inside every write transaction.
2. **Field-level validation of imported data.** The shape of each entry is checked, but not every field inside `data` or the numeric profile fields. A hostile file that also has the right password could store values that break rendering. It cannot run code.
3. **Plaintext `deviceId` and `lastSyncAt`** in the settings table, and `deviceId` plus a timestamp in sync file metadata. `deviceId` feeds nothing useful and could be dropped.
4. **Unlock rate limiting** lives in React state and resets on reload. This is acceptable: the real limit against a seized device is Argon2, and persisting attempt counts would itself be plaintext metadata.
5. **Sync pull is still not wired into the UI** (it was a stub before; the engine now works and is tested, the button still says "coming soon").
6. **Password-strength meters** are missing on the change-password and sync fields; the rule is enforced there, only the visual hint is absent.

## Limits that no code change removes

- **Old data on disk.** Erasing a field or re-encrypting a row writes a new version; the browser's storage engine can keep the old bytes until it compacts. A forensic image taken soon after upgrading may still hold old plaintext columns or old ciphertexts. The same applies to copies of the browser profile and to backup or sync files made before this change — in particular, **any existing `.junosync` file is plaintext and should be deleted.**
- **While unlocked**, the key and decrypted entries are in page memory.
- **A weak password** can be guessed offline from a seized device; Argon2 only slows it.
- **Someone who can write to IndexedDB** can delete rows or roll them back to older versions; encryption detects forgery, not deletion.
- **File names, sizes and dates** of backups and sync files are visible without the password.

## What changed on disk

- **Schema**: Dexie version 2 (indexes removed, plaintext fields erased). Runs automatically on first load.
- **Ciphertext format**: version 3. Version 2 rows are read and rewritten at next unlock; nothing is needed from the user.
- **Backup files** (`.juno`): same format; older backups still import.
- **Sync files** (`.junosync`): new encrypted format; old plaintext files are refused.
- **Tabs running the old code** against an upgraded database will be told to reload.

New source files: `src/lib/passwordPolicy.ts`, `payloadValidation.ts`, `vaultEvents.ts`, `avatarImage.ts`.
