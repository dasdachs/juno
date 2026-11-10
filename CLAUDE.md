# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compile + Vite production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Vitest with coverage report
```

## Architecture Overview

Juno is a privacy-focused period tracking PWA. All user data is encrypted client-side and stored in IndexedDB—no server communication.

### Core Security Model

**Encryption Layer** (`src/lib/crypto.ts`):
- Uses libsodium (Argon2id + XSalsa20-Poly1305 via `crypto_secretbox`)
- Password → master key → vault key derivation
- Vault key held in memory only while unlocked; cleared via `sodium.memzero()` on lock
- All records, cycles, and profile data encrypted before storage
- Stored rows are `{id, nonce, ciphertext, version}` only: entry type, dates and timestamps live inside the ciphertext and must never be copied into plaintext columns or indexes (filter/sort after decryption)
- Format v3: per-item key = keyed BLAKE2b over context + full ID; plaintext padded to 256-byte blocks; v2 rows are re-encrypted on unlock
- Deletions leave content-free tombstones (records and cycles); backups and sync files are passphrase-sealed (`sealWithPassword`)
- Changing the password rotates the vault key and re-encrypts every row; other tabs are told to lock via `src/lib/vaultEvents.ts`
- No remote resources: the avatar is an embedded `data:` image, and CSP `img-src` has no `https:`
- See `docs/SECURITY_REVIEW_2026-11-10.md` for the latest audit and open items

**Database** (`src/lib/db.ts`):
- Dexie wrapper over IndexedDB (database name: `JunoVault`)
- Tables: `records`, `keyStore`, `settings`, `userProfile`, `cycles`
- Encrypted wrappers: `EncryptedRecord`, `EncryptedCycleData`, `EncryptedUserProfile`
- Includes migration logic from legacy `HealthVault` database

### Application Flow

1. `AuthProvider` initializes crypto and checks vault existence
2. `UnlockScreen` handles vault creation or password unlock
3. `OnboardingCheck` ensures profile setup before main app access
4. Main app renders within `Layout` with bottom navigation

### Data Types (`src/lib/types.ts`)

Record types: `period`, `intimacy`, `symptom`, `mood`, `note`

Each record stores encrypted JSON containing typed data (`PeriodData`, `IntimacyData`, etc.) with `HealthRecord` as the base interface.

### Prediction Engine (`src/lib/predictions.ts`)

- Weighted moving average of last 6-12 cycles with recency bias
- Confidence levels (low/medium/high) based on cycle count and standard deviation
- Exports: `predictNextCycle()`, `getCurrentCycleDay()`, `getDaysUntilNextPeriod()`

### Key React Patterns

- **Contexts**: `AuthContext` manages vault state and session timeout
- **Hooks**: `useProfile`, `useCycles`, `useRecords`, `usePredictions`, `usePWAUpdate`
- **Pages**: Calendar (default), Insights, History, Settings, Profile
- **Components**: Calendar grid, logging forms (Period, Mood, Symptom, Intimacy, Note), common pickers

### PWA Configuration

Configured in `vite.config.ts` with `vite-plugin-pwa`:
- `registerType: 'autoUpdate'` with `skipWaiting` and `clientsClaim`
- Service worker caches JS, CSS, HTML, and WASM files
- `UpdateNotification` component shows banner when updates are available

### Testing

- Vitest with jsdom environment
- `fake-indexeddb` for IndexedDB mocking
- Setup file: `src/test/setup.ts`
- Coverage thresholds: 60% lines/functions/statements, 50% branches
