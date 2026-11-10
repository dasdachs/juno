import { db } from './db';
import {
  initCrypto,
  sealWithPassword,
  openWithPassword,
  decryptRecord,
  decryptCycleData,
  decryptUserProfile,
  encryptRecord,
  encryptCycleData,
  encryptUserProfile,
  scrubIfDeleted,
  scrubCycleIfDeleted,
  isUnlocked,
  isVaultKeyCurrent,
} from './crypto';
import { assertValidPayload, MAX_IMPORT_FILE_SIZE, type VaultPayload } from './payloadValidation';
import type { HealthRecord, CycleData, UserProfile } from './types';

// ============================================
// EXPORT FORMAT
// ============================================

export interface ExportManifest {
  version: 1;
  exportedAt: number;
  // Written only by older versions. The manifest is readable without the
  // password, so it no longer says how much data the backup holds.
  recordCount?: number;
  cycleCount?: number;
  hasProfile?: boolean;
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

/**
 * Decrypt everything in the vault. Rows that cannot be decrypted are skipped
 * and counted rather than aborting: one damaged row must not make it
 * impossible to ever take a backup.
 */
export async function readVault(): Promise<VaultPayload & { unreadable: number }> {
  if (!(await isVaultKeyCurrent())) {
    throw new Error('Vault is locked');
  }

  let unreadable = 0;
  const readAll = <E, T>(rows: E[], decrypt: (row: E) => T): T[] =>
    rows.flatMap((row) => {
      try {
        return [decrypt(row)];
      } catch (error) {
        // A locked vault is not a damaged row
        if (!isUnlocked()) throw error;
        unreadable++;
        return [];
      }
    });

  const records = readAll(await db.records.toArray(), decryptRecord);
  const cycles = readAll(await db.cycles.toArray(), decryptCycleData);
  const [profile = null] = readAll(
    await db.userProfile.where('id').equals('primary').toArray(),
    decryptUserProfile
  );

  // Everything unreadable means the key is wrong, not that rows are damaged.
  // An empty backup that looks successful would be worse than an error.
  if (unreadable > 0 && records.length === 0 && cycles.length === 0 && !profile) {
    throw new Error('Your data could not be read. Lock the app, unlock it again and retry.');
  }

  return { records, cycles, profile, unreadable };
}

/**
 * @param onUnreadable called with the number of rows that could not be
 *   decrypted and were therefore left out of the backup, if any.
 */
export async function exportData(
  backupPassword: string,
  onUnreadable?: (count: number) => void
): Promise<Blob> {
  await initCrypto();

  const { records, cycles, profile, unreadable } = await readVault();
  if (unreadable > 0) onUnreadable?.(unreadable);

  // Get exportable settings
  const appSettings = await db.settings.get('primary');
  const settings = {
    sessionTimeout: appSettings?.sessionTimeout ?? 15 * 60 * 1000,
    periodReminderEnabled: appSettings?.periodReminderEnabled ?? false,
    periodReminderDays: appSettings?.periodReminderDays ?? 3,
  };

  const payload: ExportPayload = { records, cycles, profile, settings };

  const sealed = await sealWithPassword(JSON.stringify(payload), backupPassword);

  const manifest: ExportManifest = {
    version: 1,
    exportedAt: Date.now(),
  };

  const exportFile: ExportFile = {
    manifest,
    ...sealed,
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

  if (fileContent.length > MAX_IMPORT_FILE_SIZE) {
    throw new Error('Backup file is too large');
  }

  const exportFile = JSON.parse(fileContent) as ExportFile;
  if (!exportFile.manifest || exportFile.manifest.version !== 1) {
    throw new Error('Invalid or unsupported backup file format');
  }

  // Decrypt payload
  let payload: ExportPayload;
  try {
    payload = JSON.parse(await openWithPassword(exportFile, backupPassword)) as ExportPayload;
  } catch {
    throw new Error('Incorrect backup password');
  }

  if (!(await isVaultKeyCurrent())) {
    throw new Error('Vault is locked');
  }

  // Validate before touching the database, so a malformed backup cannot
  // leave the vault cleared and half-restored.
  try {
    assertValidPayload(payload);
  } catch {
    throw new Error('Backup file contents are invalid');
  }

  let recordsImported = 0;
  let cyclesImported = 0;
  let profileImported = false;

  // One transaction: either the whole import applies or nothing changes.
  await db.transaction('rw', db.records, db.cycles, db.userProfile, async () => {
    if (strategy === 'replace') {
      // Clear existing data (keep keyStore and settings)
      await db.records.clear();
      await db.cycles.clear();
      await db.userProfile.clear();
    }

    for (const record of payload.records) {
      if (strategy === 'merge' && (await db.records.get(record.id))) continue;
      // Older backups may hold deleted entries with their content intact
      await db.records.put(encryptRecord(scrubIfDeleted(record)));
      recordsImported++;
    }

    for (const cycle of payload.cycles) {
      if (strategy === 'merge' && (await db.cycles.get(cycle.id))) continue;
      await db.cycles.put(encryptCycleData(scrubCycleIfDeleted(cycle)));
      cyclesImported++;
    }

    if (payload.profile) {
      if (strategy === 'replace' || !(await db.userProfile.get(payload.profile.id))) {
        await db.userProfile.put(encryptUserProfile(payload.profile));
        profileImported = true;
      }
    }
  });

  return { recordsImported, cyclesImported, profileImported };
}
