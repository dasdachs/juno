import sodium from 'libsodium-wrappers-sumo';
import { db } from './db';
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

function deriveRecordKey(recordId: string): Uint8Array {
  if (!vaultKey) throw new Error('Vault is locked');
  const subkeyId = idToSubkeyId(recordId);
  return sodium.crypto_kdf_derive_from_key(
    sodium.crypto_secretbox_KEYBYTES,
    subkeyId,
    RECORD_CONTEXT,
    vaultKey
  );
}

function deriveCycleKey(cycleId: string): Uint8Array {
  if (!vaultKey) throw new Error('Vault is locked');
  const subkeyId = idToSubkeyId(cycleId);
  return sodium.crypto_kdf_derive_from_key(
    sodium.crypto_secretbox_KEYBYTES,
    subkeyId,
    CYCLE_CONTEXT,
    vaultKey
  );
}

function deriveProfileKey(profileId: string): Uint8Array {
  if (!vaultKey) throw new Error('Vault is locked');
  const subkeyId = idToSubkeyId(profileId);
  return sodium.crypto_kdf_derive_from_key(
    sodium.crypto_secretbox_KEYBYTES,
    subkeyId,
    PROFILE_CONTEXT,
    vaultKey
  );
}

// ============================================
// SHARED ENCRYPT / DECRYPT HELPERS
// ============================================

function encryptWithKey(plaintext: string, key: Uint8Array): { nonce: string; ciphertext: string } {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintextBytes = sodium.from_string(plaintext);
  const message = new Uint8Array(plaintextBytes);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, new Uint8Array(key));

  return {
    nonce: arrayToBase64(nonce),
    ciphertext: arrayToBase64(ciphertext),
  };
}

function decryptWithKey(ciphertextB64: string, nonceB64: string, key: Uint8Array): string {
  const nonce = base64ToArray(nonceB64);
  const ciphertext = base64ToArray(ciphertextB64);
  const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, new Uint8Array(key));
  return sodium.to_string(plaintextBytes);
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
  vaultKey = newVaultKey;

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

    vaultKey = decryptedVaultKey;
    sodium.memzero(masterKey);
    result = true;
  } catch {
    sodium.memzero(masterKey);
    result = false;
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

  // Generate new salt and encrypt vault key with new password
  const newSalt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const newMasterKey = await deriveKeyFromPassword(newPassword, newSalt);
  const newVaultKeyNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const newEncryptedVaultKey = sodium.crypto_secretbox_easy(
    currentVaultKey,
    newVaultKeyNonce,
    newMasterKey
  );

  // Update key store
  const newKeyStore: KeyStore = {
    id: 'primary',
    salt: arrayToBase64(newSalt),
    encryptedVaultKey: arrayToBase64(newEncryptedVaultKey),
    vaultKeyNonce: arrayToBase64(newVaultKeyNonce),
  };

  await db.keyStore.put(newKeyStore);

  // Update in-memory vault key
  vaultKey = currentVaultKey;

  sodium.memzero(newMasterKey);

  return true;
}

// ============================================
// RECORD ENCRYPTION (HKDF per-record keys)
// ============================================

export function encryptRecord(record: HealthRecord): EncryptedRecord {
  const key = deriveRecordKey(record.id);
  try {
    const { nonce, ciphertext } = encryptWithKey(JSON.stringify(record), key);
    return {
      id: record.id,
      nonce,
      ciphertext,
      category: record.type,
      version: 2,
      timestamp: record.updatedAt,
    };
  } finally {
    sodium.memzero(key);
  }
}

export function decryptRecord(encryptedRecord: EncryptedRecord): HealthRecord {
  const key = deriveRecordKey(encryptedRecord.id);
  try {
    const plaintext = decryptWithKey(encryptedRecord.ciphertext, encryptedRecord.nonce, key);
    return JSON.parse(plaintext) as HealthRecord;
  } finally {
    sodium.memzero(key);
  }
}

export function generateId(): string {
  const bytes = sodium.randombytes_buf(16);
  return arrayToBase64(bytes).replace(/[+/=]/g, '');
}

// ============================================
// CYCLE DATA ENCRYPTION (HKDF per-cycle keys)
// ============================================

export function encryptCycleData(cycle: CycleData): EncryptedCycleData {
  const key = deriveCycleKey(cycle.id);
  try {
    const { nonce, ciphertext } = encryptWithKey(JSON.stringify(cycle), key);
    return {
      id: cycle.id,
      nonce,
      ciphertext,
      startDate: cycle.startDate, // Keep unencrypted for indexing
      version: 2,
    };
  } finally {
    sodium.memzero(key);
  }
}

export function decryptCycleData(encrypted: EncryptedCycleData): CycleData {
  const key = deriveCycleKey(encrypted.id);
  try {
    const plaintext = decryptWithKey(encrypted.ciphertext, encrypted.nonce, key);
    return JSON.parse(plaintext) as CycleData;
  } finally {
    sodium.memzero(key);
  }
}

// ============================================
// USER PROFILE ENCRYPTION (HKDF per-profile keys)
// ============================================

export function encryptUserProfile(profile: UserProfile): EncryptedUserProfile {
  const key = deriveProfileKey(profile.id);
  try {
    const { nonce, ciphertext } = encryptWithKey(JSON.stringify(profile), key);
    return {
      id: profile.id,
      nonce,
      ciphertext,
      version: 2,
    };
  } finally {
    sodium.memzero(key);
  }
}

export function decryptUserProfile(encrypted: EncryptedUserProfile): UserProfile {
  const key = deriveProfileKey(encrypted.id);
  try {
    const plaintext = decryptWithKey(encrypted.ciphertext, encrypted.nonce, key);
    return JSON.parse(plaintext) as UserProfile;
  } finally {
    sodium.memzero(key);
  }
}
