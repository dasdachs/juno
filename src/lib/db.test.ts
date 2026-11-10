import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, clearAllData, hasExistingVault, getSettings, updateSettings } from './db';
import type { EncryptedRecord, KeyStore, AppSettings } from './types';

vi.mock('./dateFormat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./dateFormat')>();
  return { ...actual, inferDateFormatStyle: () => 'iso' };
});

describe('db', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('database structure', () => {
    it('should have records table', () => {
      expect(db.records).toBeDefined();
    });

    it('should have keyStore table', () => {
      expect(db.keyStore).toBeDefined();
    });

    it('should have settings table', () => {
      expect(db.settings).toBeDefined();
    });
  });

  describe('records operations', () => {
    it('should store and retrieve encrypted records', async () => {
      const record: EncryptedRecord = {
        id: 'test-1',
        nonce: 'abc123',
        ciphertext: 'encrypted-data',
        version: 1,
      };

      await db.records.put(record);
      const retrieved = await db.records.get('test-1');

      expect(retrieved).toEqual(record);
    });

    it('should not index plaintext metadata columns', async () => {
      expect(db.records.schema.indexes.map((i) => i.name)).toEqual([]);
      expect(db.cycles.schema.indexes.map((i) => i.name)).toEqual([]);
      await expect(db.records.where('category').equals('note').toArray()).rejects.toThrow();
    });

    it('should delete records', async () => {
      const record: EncryptedRecord = {
        id: 'delete-me',
        nonce: 'nonce',
        ciphertext: 'data',
        version: 1,
      };

      await db.records.put(record);
      expect(await db.records.get('delete-me')).toBeDefined();

      await db.records.delete('delete-me');
      expect(await db.records.get('delete-me')).toBeUndefined();
    });
  });

  describe('clearAllData', () => {
    it('should clear all tables', async () => {
      await db.records.put({
        id: 'r1',
        nonce: 'n',
        ciphertext: 'c',
        version: 1,
      });

      await db.keyStore.put({
        id: 'primary',
        salt: 'salt',
        encryptedVaultKey: 'key',
        vaultKeyNonce: 'nonce',
      });

      await db.settings.put({
        id: 'primary',
        sessionTimeout: 60000,
        periodReminderEnabled: false,
        periodReminderDays: 2,
        autoLockOnHidden: true,
        autoLockGracePeriod: 30000,
      });

      expect(await db.records.count()).toBe(1);
      expect(await db.keyStore.count()).toBe(1);
      expect(await db.settings.count()).toBe(1);

      await clearAllData();

      expect(await db.records.count()).toBe(0);
      expect(await db.keyStore.count()).toBe(0);
      expect(await db.settings.count()).toBe(0);
    });

    it('empties all five tables, removes the vault and leaves the db usable', async () => {
      await db.records.put({ id: 'r1', nonce: 'n', ciphertext: 'c', version: 3 });
      await db.cycles.put({ id: 'c1', nonce: 'n', ciphertext: 'c', version: 3 });
      await db.userProfile.put({ id: 'primary', nonce: 'n', ciphertext: 'c', version: 3 });
      await db.keyStore.put({ id: 'primary', salt: 's', encryptedVaultKey: 'k', vaultKeyNonce: 'n' });
      await db.settings.put({
        id: 'primary',
        sessionTimeout: 1,
        periodReminderEnabled: false,
        periodReminderDays: 2,
        autoLockOnHidden: true,
        autoLockGracePeriod: 1,
      });
      expect(await hasExistingVault()).toBe(true);

      await clearAllData();

      expect(await db.records.count()).toBe(0);
      expect(await db.cycles.count()).toBe(0);
      expect(await db.userProfile.count()).toBe(0);
      expect(await db.keyStore.count()).toBe(0);
      expect(await db.settings.count()).toBe(0);
      expect(await hasExistingVault()).toBe(false);

      await db.records.put({ id: 'after', nonce: 'n', ciphertext: 'c', version: 3 });
      expect((await db.records.get('after'))?.id).toBe('after');
    });
  });

  describe('hasExistingVault', () => {
    it('should return false when no vault exists', async () => {
      expect(await hasExistingVault()).toBe(false);
    });

    it('should return true when vault exists', async () => {
      const keyStore: KeyStore = {
        id: 'primary',
        salt: 'salt',
        encryptedVaultKey: 'key',
        vaultKeyNonce: 'nonce',
      };

      await db.keyStore.put(keyStore);
      expect(await hasExistingVault()).toBe(true);
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await getSettings();

      expect(settings.id).toBe('primary');
      expect(settings.sessionTimeout).toBe(15 * 60 * 1000);
    });

    it('should return existing settings', async () => {
      const customSettings: AppSettings = {
        id: 'primary',
        sessionTimeout: 30 * 60 * 1000,
        periodReminderEnabled: false,
        periodReminderDays: 2,
        autoLockOnHidden: true,
        autoLockGracePeriod: 30000,
      };

      await db.settings.put(customSettings);

      const settings = await getSettings();
      expect(settings.sessionTimeout).toBe(30 * 60 * 1000);
    });

    it('should infer dateFormat from system locale for newly created settings', async () => {
      const settings = await getSettings();
      expect(settings.dateFormat).toBe('iso');
    });

    it('should not overwrite dateFormat on existing settings', async () => {
      await db.settings.put({
        id: 'primary',
        sessionTimeout: 15 * 60 * 1000,
        periodReminderEnabled: false,
        periodReminderDays: 3,
        autoLockOnHidden: true,
        autoLockGracePeriod: 30000,
        dateFormat: 'us',
      });

      const settings = await getSettings();
      expect(settings.dateFormat).toBe('us');
    });

    it('should leave dateFormat undefined for settings that predate the field', async () => {
      await db.settings.put({
        id: 'primary',
        sessionTimeout: 15 * 60 * 1000,
        periodReminderEnabled: false,
        periodReminderDays: 3,
        autoLockOnHidden: true,
        autoLockGracePeriod: 30000,
      });

      const settings = await getSettings();
      expect(settings.dateFormat).toBeUndefined();
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      await getSettings();

      await updateSettings({ sessionTimeout: 5 * 60 * 1000 });

      const settings = await db.settings.get('primary');
      expect(settings?.sessionTimeout).toBe(5 * 60 * 1000);
    });

    it('should preserve other settings when updating', async () => {
      await db.settings.put({
        id: 'primary',
        sessionTimeout: 10 * 60 * 1000,
        deviceId: 'dev-1',
        periodReminderEnabled: true,
        periodReminderDays: 3,
        autoLockOnHidden: true,
        autoLockGracePeriod: 30000,
      });

      await updateSettings({ sessionTimeout: 20 * 60 * 1000 });

      const settings = await db.settings.get('primary');
      expect(settings?.sessionTimeout).toBe(20 * 60 * 1000);
      expect(settings?.deviceId).toBe('dev-1');
    });
  });
});
