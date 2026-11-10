import Dexie, { type EntityTable } from 'dexie';
import type {
  EncryptedRecord,
  EncryptedUserProfile,
  EncryptedCycleData,
  KeyStore,
  AppSettings,
} from './types';
import { logger } from './logger';
import { inferDateFormatStyle } from './dateFormat';
import { announce, emitLocal } from './vaultEvents';

class JunoVaultDB extends Dexie {
  records!: EntityTable<EncryptedRecord, 'id'>;
  keyStore!: EntityTable<KeyStore, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  userProfile!: EntityTable<EncryptedUserProfile, 'id'>;
  cycles!: EntityTable<EncryptedCycleData, 'id'>;

  constructor() {
    super('JunoVault');

    this.version(1).stores({
      records: 'id, category, timestamp, cycleId',
      keyStore: 'id',
      settings: 'id',
      userProfile: 'id',
      cycles: 'id, startDate',
    });

    // v2: nothing about an entry may sit outside its ciphertext. Drop the
    // plaintext indexes (entry type, edit time, cycle link, period start
    // date) and erase those values from rows written by earlier versions.
    this.version(2)
      .stores({
        records: 'id',
        cycles: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('records')
          .toCollection()
          .modify((row) => {
            delete row.category;
            delete row.timestamp;
            delete row.cycleId;
          });
        await tx
          .table('cycles')
          .toCollection()
          .modify((row) => {
            delete row.startDate;
          });
        await tx
          .table('settings')
          .toCollection()
          .modify((row) => {
            delete row.lastUnlockedAt;
          });
      });
  }
}

export const db = new JunoVaultDB();

// Another tab is deleting or upgrading the database. Dexie's default handler
// closes and then silently reopens on the next call, which would recreate a
// database the user just asked to erase. Close for good and let the app
// lock and reload instead.
db.on('versionchange', () => {
  db.close({ disableAutoOpen: true });
  emitLocal('wiped');
  return false;
});

// ============================================
// MIGRATION FROM HEALTHVAULT
// ============================================

export async function migrateFromHealthVault(): Promise<boolean> {
  try {
    // Check if old database exists
    const databases = await indexedDB.databases();
    const healthVaultExists = databases.some((dbInfo) => dbInfo.name === 'HealthVault');

    if (!healthVaultExists) {
      return false;
    }

    // Open old database
    const oldDb = new Dexie('HealthVault');
    oldDb.version(1).stores({
      records: 'id, category, timestamp',
      keyStore: 'id',
      settings: 'id',
    });

    // Migrate keyStore (critical for encryption continuity)
    const oldKeyStore = await oldDb.table('keyStore').toArray();
    for (const key of oldKeyStore) {
      const existingKey = await db.keyStore.get(key.id);
      if (!existingKey) {
        await db.keyStore.put(key);
      }
    }

    // Migrate settings with new defaults
    const oldSettings = await oldDb.table('settings').toArray();
    for (const setting of oldSettings) {
      const existingSetting = await db.settings.get(setting.id);
      if (!existingSetting) {
        const migratedSetting: AppSettings = {
          id: setting.id,
          sessionTimeout: setting.sessionTimeout || 15 * 60 * 1000,
          periodReminderEnabled: false,
          periodReminderDays: 3,
          autoLockOnHidden: true,
          autoLockGracePeriod: 30000,
        };
        await db.settings.put(migratedSetting);
      }
    }

    // Note: Old health records are NOT migrated as the data model is incompatible
    // User starts fresh with period tracking

    // Delete old database after successful migration
    await oldDb.delete();

    logger.info('Migration from HealthVault completed successfully');
    return true;
  } catch (error) {
    logger.error('Migration from HealthVault failed:', error);
    return false;
  }
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Erase everything. Deletes the whole database rather than emptying its
 * tables, so the wrapped vault key goes too and nothing is left to unlock.
 */
export async function clearAllData(): Promise<void> {
  announce('wiped');
  await db.delete();
  await db.open();
}

export async function hasExistingVault(): Promise<boolean> {
  const keyStore = await db.keyStore.get('primary');
  return keyStore !== undefined;
}

export async function getSettings(): Promise<AppSettings> {
  let settings = await db.settings.get('primary');
  if (!settings) {
    settings = {
      id: 'primary',
      sessionTimeout: 15 * 60 * 1000, // 15 minutes default
      periodReminderEnabled: false,
      periodReminderDays: 3,
      autoLockOnHidden: true,
      autoLockGracePeriod: 30000, // 30 seconds
      dateFormat: inferDateFormatStyle(),
    };
    await db.settings.put(settings);
  }
  return settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const settings = await getSettings();
  await db.settings.put({ ...settings, ...updates });
  emitLocal('settings');
}

// ============================================
// USER PROFILE OPERATIONS
// ============================================

export async function hasUserProfile(): Promise<boolean> {
  const profile = await db.userProfile.get('primary');
  return profile !== undefined;
}

// ============================================
// INITIALIZATION
// ============================================

export async function initializeDatabase(): Promise<void> {
  // Attempt migration from old database
  await migrateFromHealthVault();
}
