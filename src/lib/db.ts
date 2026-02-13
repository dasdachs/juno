import Dexie, { type EntityTable } from 'dexie';
import type {
  EncryptedRecord,
  EncryptedUserProfile,
  EncryptedCycleData,
  KeyStore,
  AppSettings,
} from './types';
import { logger } from './logger';

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
  }
}

export const db = new JunoVaultDB();

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
          lastUnlockedAt: setting.lastUnlockedAt,
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

export async function clearAllData(): Promise<void> {
  await db.records.clear();
  await db.keyStore.clear();
  await db.settings.clear();
  await db.userProfile.clear();
  await db.cycles.clear();
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
    };
    await db.settings.put(settings);
  }
  return settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const settings = await getSettings();
  await db.settings.put({ ...settings, ...updates });
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
