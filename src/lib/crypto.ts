import sodium from 'libsodium-wrappers-sumo';
import { db } from './db';
import { announce } from './vaultEvents';
import type {
  HealthRecord,
  EncryptedRecord,
  KeyStore,
  CycleData,
  EncryptedCycleData,
  UserProfile,
  EncryptedUserProfile,
} from './types';

let isInitialized = false;
let vaultKey: Uint8Array | null = null;
// The wrapped vault key as stored when this tab obtained its key. If the
// stored value has since changed (password changed in another tab), the key
// held here is stale.
let unlockedKeyTag: string | null = null;

/**
 * False if the vault key in the database is no longer the one this tab
 * unlocked with. A stale tab is locked on the spot.
 */
export async function isVaultKeyCurrent(): Promise<boolean> {
  if (!vaultKey) return false;
  const keyStore = await db.keyStore.get('primary');
  if (keyStore?.encryptedVaultKey === unlockedKeyTag) return true;
  lock();
  return false;
}

export async function initCrypto(): Promise<void> {
  if (isInitialized) return;
  await sodium.ready;
  isInitialized = true;
}

export function isUnlocked(): boolean {
  return vaultKey !== null;
}

export function lock(): void {
  if (vaultKey) {
    sodium.memzero(vaultKey);
  }
  vaultKey = null;
}

export function arrayToBase64(arr: Uint8Array): string {
  return sodium.to_base64(arr, sodium.base64_variants.ORIGINAL);
}

// Copy into a Uint8Array of this realm: libsodium rejects arrays created in
// another realm (as happens under jsdom).
function utf8(str: string): Uint8Array {
  const encoded = sodium.from_string(str);
  const copy = new Uint8Array(encoded);
  encoded.fill(0);
  return copy;
}

export function base64ToArray(str: string): Uint8Array {
  return sodium.from_base64(str, sodium.base64_variants.ORIGINAL);
}

// ============================================
// PASSWORD KEY DERIVATION (Argon2id)
// ============================================

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  await initCrypto();

  // Argon2id key derivation with OWASP-recommended parameters
  const key = sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    password,
    salt,
    4, // ops limit (OWASP minimum for interactive)
    134217728, // mem limit (128 MB - OWASP recommended)
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );

  return key;
}

// ============================================
// PER-RECORD HKDF KEY DERIVATION (BLAKE2B)
// ============================================

// 8-byte contexts for domain separation
const RECORD_CONTEXT = 'junoREC\0';
const CYCLE_CONTEXT = 'junoCYC\0';
const PROFILE_CONTEXT = 'junoPRF\0';

/**
 * Derive a deterministic numeric subkey ID from a string ID.
 * Uses crypto_generichash (BLAKE2B) to hash the string, then reads
 * the first 4 bytes as a uint32 (fits in JS number safely, and
 * crypto_kdf_derive_from_key accepts up to uint64).
 */
function idToSubkeyId(id: string): number {
  const idBytes = new Uint8Array(sodium.from_string(id));
  const hash = sodium.crypto_generichash(16, idBytes);
  // Read first 3 bytes as little-endian uint24 (always positive, fits in JS integer)
  return hash[0] + (hash[1] << 8) + (hash[2] << 16);
}

/** Current on-disk ciphertext format. */
export const CURRENT_FORMAT_VERSION = 3;

/**
 * Derive the per-item key.
 *
 * - Format v3+: keyed BLAKE2b over `context || id` with the vault key as the
 *   key. The whole ID is bound into the key, so every item gets its own key.
 * - Format v2 and older (legacy, decrypt-only): crypto_kdf with a 24-bit
 *   subkey ID, which lets unrelated items share a key.
 */
function deriveItemKey(
  context: string,
  id: string,
  version: number,
  rootKey: Uint8Array | null
): Uint8Array {
  if (!rootKey) throw new Error('Vault is locked');
  if (version >= 3) {
    return sodium.crypto_generichash(
      sodium.crypto_secretbox_KEYBYTES,
      utf8(context + id),
      rootKey
    );
  }
  return sodium.crypto_kdf_derive_from_key(
    sodium.crypto_secretbox_KEYBYTES,
    idToSubkeyId(id),
    context,
    rootKey
  );
}

// ============================================
// SHARED ENCRYPT / DECRYPT HELPERS
// ============================================

// Plaintext is padded to a multiple of this before encryption so that the
// ciphertext length does not reveal the kind of entry or the size of a note.
const PAD_BLOCK_SIZE = 256;

function encryptWithKey(plaintext: string, key: Uint8Array): { nonce: string; ciphertext: string } {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const unpadded = utf8(plaintext);
  const message = sodium.pad(unpadded, PAD_BLOCK_SIZE);
  sodium.memzero(unpadded);
  try {
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
    return {
      nonce: arrayToBase64(nonce),
      ciphertext: arrayToBase64(ciphertext),
    };
  } finally {
    sodium.memzero(message);
  }
}

function decryptWithKey(
  ciphertextB64: string,
  nonceB64: string,
  key: Uint8Array,
  version: number
): string {
  const nonce = base64ToArray(nonceB64);
  const ciphertext = base64ToArray(ciphertextB64);
  const opened = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  // Only v3+ plaintexts are padded. unpad returns a view of a fresh copy, so
  // both buffers need wiping.
  const plaintextBytes = version >= 3 ? sodium.unpad(opened, PAD_BLOCK_SIZE) : opened;
  try {
    return sodium.to_string(plaintextBytes);
  } finally {
    sodium.memzero(plaintextBytes);
    sodium.memzero(opened);
  }
}

interface EncryptedEnvelope {
  id: string;
  nonce: string;
  ciphertext: string;
  version: number;
}

function encryptItem<T extends { id: string }>(
  context: string,
  item: T,
  rootKey: Uint8Array | null
): EncryptedEnvelope {
  const key = deriveItemKey(context, item.id, CURRENT_FORMAT_VERSION, rootKey);
  try {
    const { nonce, ciphertext } = encryptWithKey(JSON.stringify(item), key);
    return { id: item.id, nonce, ciphertext, version: CURRENT_FORMAT_VERSION };
  } finally {
    sodium.memzero(key);
  }
}

function decryptItem<T extends { id: string }>(
  context: string,
  encrypted: EncryptedEnvelope,
  rootKey: Uint8Array | null
): T {
  const key = deriveItemKey(context, encrypted.id, encrypted.version, rootKey);
  try {
    const plaintext = decryptWithKey(encrypted.ciphertext, encrypted.nonce, key, encrypted.version);
    const item = JSON.parse(plaintext) as T;
    // Bind the ciphertext to its row: a ciphertext moved onto another row's ID
    // must not be accepted as that row's content.
    if (item.id !== encrypted.id) {
      throw new Error('Decrypted item does not match its ID');
    }
    return item;
  } finally {
    sodium.memzero(key);
  }
}

// ============================================
// PASSWORD-BASED SEALING (backups, sync files)
// ============================================

export interface PasswordSealed {
  salt: string;
  nonce: string;
  ciphertext: string;
}

/** Encrypt a string under a key derived from `password` (Argon2id + secretbox). */
export async function sealWithPassword(plaintext: string, password: string): Promise<PasswordSealed> {
  await initCrypto();
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const key = await deriveKeyFromPassword(password, salt);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = utf8(plaintext);
  try {
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
    return {
      salt: arrayToBase64(salt),
      nonce: arrayToBase64(nonce),
      ciphertext: arrayToBase64(ciphertext),
    };
  } finally {
    sodium.memzero(key);
    sodium.memzero(message);
  }
}

/** Inverse of sealWithPassword. Throws if the password is wrong or the data was altered. */
export async function openWithPassword(sealed: PasswordSealed, password: string): Promise<string> {
  await initCrypto();
  const key = await deriveKeyFromPassword(password, base64ToArray(sealed.salt));
  try {
    const opened = sodium.crypto_secretbox_open_easy(
      base64ToArray(sealed.ciphertext),
      base64ToArray(sealed.nonce),
      key
    );
    try {
      return sodium.to_string(opened);
    } finally {
      sodium.memzero(opened);
    }
  } finally {
    sodium.memzero(key);
  }
}

// ============================================
// VAULT MANAGEMENT
// ============================================

export async function createVault(password: string): Promise<void> {
  await initCrypto();

  // Generate salt for password derivation
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

  // Derive master key from password
  const masterKey = await deriveKeyFromPassword(password, salt);

  // Generate random vault key
  const newVaultKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);

  // Encrypt vault key with master key
  const vaultKeyNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encryptedVaultKey = sodium.crypto_secretbox_easy(newVaultKey, vaultKeyNonce, masterKey);

  // Store encrypted vault key
  const keyStore: KeyStore = {
    id: 'primary',
    salt: arrayToBase64(salt),
    encryptedVaultKey: arrayToBase64(encryptedVaultKey),
    vaultKeyNonce: arrayToBase64(vaultKeyNonce),
  };

  await db.keyStore.put(keyStore);

  // Keep vault key in memory
  lock();
  vaultKey = newVaultKey;
  unlockedKeyTag = keyStore.encryptedVaultKey;

  // Clear master key from memory
  sodium.memzero(masterKey);
}

// Minimum time for unlock operation to prevent timing attacks (in ms)
const MIN_UNLOCK_TIME = 100;

export async function unlock(password: string): Promise<boolean> {
  await initCrypto();

  const startTime = Date.now();
  let result = false;

  const keyStore = await db.keyStore.get('primary');
  if (!keyStore) {
    throw new Error('No vault found. Please create one first.');
  }

  const salt = base64ToArray(keyStore.salt);
  const encryptedVaultKey = base64ToArray(keyStore.encryptedVaultKey);
  const vaultKeyNonce = base64ToArray(keyStore.vaultKeyNonce);

  // Derive master key from password
  const masterKey = await deriveKeyFromPassword(password, salt);

  try {
    // Decrypt vault key
    const decryptedVaultKey = sodium.crypto_secretbox_open_easy(
      encryptedVaultKey,
      vaultKeyNonce,
      masterKey
    );

    lock();
    vaultKey = decryptedVaultKey;
    unlockedKeyTag = keyStore.encryptedVaultKey;
    sodium.memzero(masterKey);
    result = true;
  } catch {
    sodium.memzero(masterKey);
    result = false;
  }

  if (result) {
    await upgradeLegacyCiphertexts();
  }

  // Constant-time delay to prevent timing attacks
  const elapsed = Date.now() - startTime;
  const delay = Math.max(0, MIN_UNLOCK_TIME - elapsed);
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return result;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  await initCrypto();

  // First verify current password and get vault key
  const keyStore = await db.keyStore.get('primary');
  if (!keyStore) {
    throw new Error('No vault found.');
  }

  const oldSalt = base64ToArray(keyStore.salt);
  const encryptedVaultKey = base64ToArray(keyStore.encryptedVaultKey);
  const oldVaultKeyNonce = base64ToArray(keyStore.vaultKeyNonce);

  const oldMasterKey = await deriveKeyFromPassword(currentPassword, oldSalt);

  let currentVaultKey: Uint8Array;
  try {
    currentVaultKey = sodium.crypto_secretbox_open_easy(
      encryptedVaultKey,
      oldVaultKeyNonce,
      oldMasterKey
    );
  } catch {
    sodium.memzero(oldMasterKey);
    return false;
  }

  sodium.memzero(oldMasterKey);

  // Rotate the vault key: a new random key, wrapped under the new password,
  // with every row re-encrypted under it. Without this, an old copy of the
  // key store plus the old password would still open all current data.
  const newVaultKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  let keepNewKey = false;

  try {
    const newSalt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const newMasterKey = await deriveKeyFromPassword(newPassword, newSalt);
    let newKeyStore: KeyStore;
    try {
      const newVaultKeyNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
      newKeyStore = {
        id: 'primary',
        salt: arrayToBase64(newSalt),
        encryptedVaultKey: arrayToBase64(
          sodium.crypto_secretbox_easy(newVaultKey, newVaultKeyNonce, newMasterKey)
        ),
        vaultKeyNonce: arrayToBase64(newVaultKeyNonce),
      };
    } finally {
      sodium.memzero(newMasterKey);
    }

    const tables = [
      { table: db.records, context: RECORD_CONTEXT },
      { table: db.cycles, context: CYCLE_CONTEXT },
      { table: db.userProfile, context: PROFILE_CONTEXT },
    ] as const;

    // One transaction: the new key store and the re-encrypted rows land
    // together or not at all.
    await db.transaction('rw', db.records, db.cycles, db.userProfile, db.keyStore, async () => {
      for (const { table, context } of tables) {
        const rows = (await table.toArray()) as EncryptedEnvelope[];
        for (const row of rows) {
          let item: { id: string };
          try {
            item = decryptItem(context, row, currentVaultKey);
          } catch {
            // Already unreadable under the old key: leave as is
            continue;
          }
          await (table as unknown as { put(row: EncryptedEnvelope): Promise<unknown> }).put(
            encryptItem(context, item, newVaultKey)
          );
        }
      }
      await db.keyStore.put(newKeyStore);
    });

    // Any other open tab still holds the old key: make it lock.
    announce('rotated');

    // Stay unlocked under the new key, unless the vault was locked (e.g. by
    // auto-lock) while the password was being changed: then it stays locked.
    if (vaultKey) {
      lock();
      vaultKey = newVaultKey;
      unlockedKeyTag = newKeyStore.encryptedVaultKey;
      keepNewKey = true;
    }

    return true;
  } finally {
    sodium.memzero(currentVaultKey);
    if (!keepNewKey) sodium.memzero(newVaultKey);
  }
}

// ============================================
// RECORD / CYCLE / PROFILE ENCRYPTION
// ============================================
//
// The stored wrapper carries nothing but the row ID, nonce, ciphertext and
// format version. Entry type, dates and timestamps live only inside the
// ciphertext; they must never be copied into plaintext columns.

/**
 * A deleted record keeps only what sync needs to propagate the deletion: its
 * ID and when it was deleted. What kind of entry it was and when it was
 * created are erased along with its content.
 */
export function toTombstone(record: HealthRecord, deletedAt: number): HealthRecord {
  return {
    id: record.id,
    type: 'note',
    createdAt: deletedAt,
    updatedAt: deletedAt,
    deletedAt,
    data: {} as HealthRecord['data'],
    tags: [],
  };
}

/** Deleted records coming from a backup or sync file must never carry content. */
export function scrubIfDeleted(record: HealthRecord): HealthRecord {
  return record.deletedAt ? toTombstone(record, record.deletedAt) : record;
}

/** A deleted cycle keeps only its ID and deletion time. */
export function toCycleTombstone(id: string, deletedAt: number): CycleData {
  return { id, cycleNumber: 0, startDate: 0, deletedAt };
}

export function scrubCycleIfDeleted(cycle: CycleData): CycleData {
  return cycle.deletedAt ? toCycleTombstone(cycle.id, cycle.deletedAt) : cycle;
}

export function encryptRecord(record: HealthRecord): EncryptedRecord {
  return encryptItem(RECORD_CONTEXT, record, vaultKey);
}

export function decryptRecord(encryptedRecord: EncryptedRecord): HealthRecord {
  return decryptItem<HealthRecord>(RECORD_CONTEXT, encryptedRecord, vaultKey);
}

export function generateId(): string {
  const bytes = sodium.randombytes_buf(16);
  return arrayToBase64(bytes).replace(/[+/=]/g, '');
}

export function encryptCycleData(cycle: CycleData): EncryptedCycleData {
  return encryptItem(CYCLE_CONTEXT, cycle, vaultKey);
}

export function decryptCycleData(encrypted: EncryptedCycleData): CycleData {
  return decryptItem<CycleData>(CYCLE_CONTEXT, encrypted, vaultKey);
}

export function encryptUserProfile(profile: UserProfile): EncryptedUserProfile {
  return encryptItem(PROFILE_CONTEXT, profile, vaultKey);
}

export function decryptUserProfile(encrypted: EncryptedUserProfile): UserProfile {
  return decryptItem<UserProfile>(PROFILE_CONTEXT, encrypted, vaultKey);
}

// ============================================
// LEGACY FORMAT UPGRADE
// ============================================

/**
 * Re-encrypt rows stored in an older format with the current one (full-ID
 * keys, padded plaintext, no plaintext metadata), and strip the content of
 * records that were deleted before deletions scrubbed their data.
 *
 * Runs after every successful unlock; a no-op once everything is current.
 * Rows that fail to decrypt are left untouched. Never throws: a failed
 * upgrade must not block unlocking, and is retried on the next unlock.
 */
export async function upgradeLegacyCiphertexts(): Promise<void> {
  if (!vaultKey) return;
  const isLegacy = (row: { version: number }) => !(row.version >= CURRENT_FORMAT_VERSION);

  try {
    await db.transaction('rw', db.records, db.cycles, db.userProfile, async () => {
      for (const row of (await db.records.toArray()).filter(isLegacy)) {
        try {
          const record = decryptRecord(row);
          await db.records.put(encryptRecord(scrubIfDeleted(record)));
        } catch {
          // Undecryptable row: leave as is
        }
      }
      for (const row of (await db.cycles.toArray()).filter(isLegacy)) {
        try {
          await db.cycles.put(encryptCycleData(scrubCycleIfDeleted(decryptCycleData(row))));
        } catch {
          // Undecryptable row: leave as is
        }
      }
      for (const row of (await db.userProfile.toArray()).filter(isLegacy)) {
        try {
          await db.userProfile.put(encryptUserProfile(decryptUserProfile(row)));
        } catch {
          // Undecryptable row: leave as is
        }
      }
    });
  } catch {
    // Retried on next unlock
  }
}
