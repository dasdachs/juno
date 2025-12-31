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

function arrayToBase64(arr: Uint8Array): string {
  return sodium.to_base64(arr, sodium.base64_variants.ORIGINAL);
}

function base64ToArray(str: string): Uint8Array {
  return sodium.from_base64(str, sodium.base64_variants.ORIGINAL);
}

async function deriveKeyFromPassword(
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

export function encryptRecord(record: HealthRecord): EncryptedRecord {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const plaintext = JSON.stringify(record);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintextBytes = sodium.from_string(plaintext);
  // Ensure we have a plain Uint8Array, not a subclass
  const message = new Uint8Array(plaintextBytes);
  const key = new Uint8Array(vaultKey);
  const ciphertext = sodium.crypto_secretbox_easy(
    message,
    nonce,
    key
  );

  return {
    id: record.id,
    nonce: arrayToBase64(nonce),
    ciphertext: arrayToBase64(ciphertext),
    category: record.type,
    version: 1,
    timestamp: record.updatedAt,
  };
}

export function decryptRecord(encryptedRecord: EncryptedRecord): HealthRecord {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const nonce = base64ToArray(encryptedRecord.nonce);
  const ciphertext = base64ToArray(encryptedRecord.ciphertext);
  const key = new Uint8Array(vaultKey);

  const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  const plaintext = sodium.to_string(plaintextBytes);
  const record = JSON.parse(plaintext) as HealthRecord;

  return record;
}

export function generateId(): string {
  const bytes = sodium.randombytes_buf(16);
  return arrayToBase64(bytes).replace(/[+/=]/g, '');
}

// ============================================
// CYCLE DATA ENCRYPTION
// ============================================

export function encryptCycleData(cycle: CycleData): EncryptedCycleData {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const plaintext = JSON.stringify(cycle);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintextBytes = sodium.from_string(plaintext);
  const message = new Uint8Array(plaintextBytes);
  const key = new Uint8Array(vaultKey);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  return {
    id: cycle.id,
    nonce: arrayToBase64(nonce),
    ciphertext: arrayToBase64(ciphertext),
    startDate: cycle.startDate, // Keep unencrypted for indexing
    version: 1,
  };
}

export function decryptCycleData(encrypted: EncryptedCycleData): CycleData {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const nonce = base64ToArray(encrypted.nonce);
  const ciphertext = base64ToArray(encrypted.ciphertext);
  const key = new Uint8Array(vaultKey);

  const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  const plaintext = sodium.to_string(plaintextBytes);
  const cycle = JSON.parse(plaintext) as CycleData;

  return cycle;
}

// ============================================
// USER PROFILE ENCRYPTION
// ============================================

export function encryptUserProfile(profile: UserProfile): EncryptedUserProfile {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const plaintext = JSON.stringify(profile);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintextBytes = sodium.from_string(plaintext);
  const message = new Uint8Array(plaintextBytes);
  const key = new Uint8Array(vaultKey);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);

  return {
    id: profile.id,
    nonce: arrayToBase64(nonce),
    ciphertext: arrayToBase64(ciphertext),
    version: 1,
  };
}

export function decryptUserProfile(encrypted: EncryptedUserProfile): UserProfile {
  if (!vaultKey) {
    throw new Error('Vault is locked');
  }

  const nonce = base64ToArray(encrypted.nonce);
  const ciphertext = base64ToArray(encrypted.ciphertext);
  const key = new Uint8Array(vaultKey);

  const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  const plaintext = sodium.to_string(plaintextBytes);
  const profile = JSON.parse(plaintext) as UserProfile;

  return profile;
}
