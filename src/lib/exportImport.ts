import sodium from 'libsodium-wrappers-sumo';
import { db } from './db';
import {
  initCrypto,
  deriveKeyFromPassword,
  arrayToBase64,
  base64ToArray,
  decryptRecord,
  decryptCycleData,
  decryptUserProfile,
  encryptRecord,
  encryptCycleData,
  encryptUserProfile,
} from './crypto';
import type { HealthRecord, CycleData, UserProfile } from './types';

// ============================================
// EXPORT FORMAT
// ============================================

export interface ExportManifest {
  version: 1;
  exportedAt: number;
  recordCount: number;
  cycleCount: number;
  hasProfile: boolean;
}

export interface ExportFile {
  manifest: ExportManifest;
  salt: string;
  nonce: string;
  ciphertext: string;
}

interface ExportPayload {
  records: HealthRecord[];
  cycles: CycleData[];
  profile: UserProfile | null;
  settings: {
    sessionTimeout: number;
    periodReminderEnabled: boolean;
    periodReminderDays: number;
  };
}

// ============================================
// EXPORT
// ============================================

export async function exportData(backupPassword: string): Promise<Blob> {
  await initCrypto();

  // Decrypt all records
  const encryptedRecords = await db.records.toArray();
  const records: HealthRecord[] = encryptedRecords.map((er) => decryptRecord(er));

  // Decrypt all cycles
  const encryptedCycles = await db.cycles.toArray();
  const cycles: CycleData[] = encryptedCycles.map((ec) => decryptCycleData(ec));

  // Decrypt profile
  const encryptedProfile = await db.userProfile.get('primary');
  const profile = encryptedProfile ? decryptUserProfile(encryptedProfile) : null;

  // Get exportable settings
  const appSettings = await db.settings.get('primary');
  const settings = {
    sessionTimeout: appSettings?.sessionTimeout ?? 15 * 60 * 1000,
    periodReminderEnabled: appSettings?.periodReminderEnabled ?? false,
    periodReminderDays: appSettings?.periodReminderDays ?? 3,
  };

  const payload: ExportPayload = { records, cycles, profile, settings };

  // Derive encryption key from backup password
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const key = await deriveKeyFromPassword(backupPassword, salt);

  // Encrypt payload
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const plaintext = sodium.from_string(JSON.stringify(payload));
  const ciphertext = sodium.crypto_secretbox_easy(new Uint8Array(plaintext), nonce, key);

  sodium.memzero(key);

  const manifest: ExportManifest = {
    version: 1,
    exportedAt: Date.now(),
    recordCount: records.length,
    cycleCount: cycles.length,
    hasProfile: profile !== null,
  };

  const exportFile: ExportFile = {
    manifest,
    salt: arrayToBase64(salt),
    nonce: arrayToBase64(nonce),
    ciphertext: arrayToBase64(ciphertext),
  };

  return new Blob([JSON.stringify(exportFile)], { type: 'application/json' });
}

// ============================================
// IMPORT
// ============================================

export function parseManifest(fileContent: string): ExportManifest {
  const parsed = JSON.parse(fileContent) as ExportFile;
  if (!parsed.manifest || parsed.manifest.version !== 1) {
    throw new Error('Invalid or unsupported backup file format');
  }
  return parsed.manifest;
}

export async function importData(
  fileContent: string,
  backupPassword: string,
  strategy: 'replace' | 'merge'
): Promise<{ recordsImported: number; cyclesImported: number; profileImported: boolean }> {
  await initCrypto();

  const exportFile = JSON.parse(fileContent) as ExportFile;
  if (!exportFile.manifest || exportFile.manifest.version !== 1) {
    throw new Error('Invalid or unsupported backup file format');
  }

  // Derive key from backup password
  const salt = base64ToArray(exportFile.salt);
  const key = await deriveKeyFromPassword(backupPassword, salt);

  // Decrypt payload
  let payload: ExportPayload;
  try {
    const nonce = base64ToArray(exportFile.nonce);
    const ciphertext = base64ToArray(exportFile.ciphertext);
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
    payload = JSON.parse(sodium.to_string(plaintextBytes)) as ExportPayload;
  } catch {
    sodium.memzero(key);
    throw new Error('Incorrect backup password');
  }

  sodium.memzero(key);

  let recordsImported = 0;
  let cyclesImported = 0;
  let profileImported = false;

  if (strategy === 'replace') {
    // Clear existing data (keep keyStore and settings)
    await db.records.clear();
    await db.cycles.clear();
    await db.userProfile.clear();
  }

  // Import records
  for (const record of payload.records) {
    if (strategy === 'merge') {
      const existing = await db.records.get(record.id);
      if (existing) continue;
    }
    const encrypted = encryptRecord(record);
    await db.records.put(encrypted);
    recordsImported++;
  }

  // Import cycles
  for (const cycle of payload.cycles) {
    if (strategy === 'merge') {
      const existing = await db.cycles.get(cycle.id);
      if (existing) continue;
    }
    const encrypted = encryptCycleData(cycle);
    await db.cycles.put(encrypted);
    cyclesImported++;
  }

  // Import profile
  if (payload.profile) {
    if (strategy === 'replace' || !(await db.userProfile.get(payload.profile.id))) {
      const encrypted = encryptUserProfile(payload.profile);
      await db.userProfile.put(encrypted);
      profileImported = true;
    }
  }

  return { recordsImported, cyclesImported, profileImported };
}
