import { describe, it, expect, beforeEach } from 'vitest';
import { db, clearAllData, hasExistingVault, getSettings, updateSettings } from './db';
import type { EncryptedRecord, KeyStore, AppSettings } from './types';

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
        category: 'note',
        version: 1,
        timestamp: Date.now(),
      };

      await db.records.put(record);
      const retrieved = await db.records.get('test-1');

      expect(retrieved).toEqual(record);
    });

    it('should query records by category', async () => {
      const noteRecord: EncryptedRecord = {
        id: 'note-1',
        nonce: 'nonce1',
        ciphertext: 'data1',
        category: 'note',
        version: 1,
        timestamp: Date.now(),
      };

      const vitalRecord: EncryptedRecord = {
        id: 'vital-1',
        nonce: 'nonce2',
        ciphertext: 'data2',
        category: 'vital',
        version: 1,
        timestamp: Date.now(),
      };

      await db.records.bulkPut([noteRecord, vitalRecord]);

      const notes = await db.records.where('category').equals('note').toArray();
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('note-1');

      const vitals = await db.records.where('category').equals('vital').toArray();
      expect(vitals).toHaveLength(1);
      expect(vitals[0].id).toBe('vital-1');
    });

    it('should delete records', async () => {
      const record: EncryptedRecord = {
        id: 'delete-me',
        nonce: 'nonce',
        ciphertext: 'data',
        category: 'note',
        version: 1,
        timestamp: Date.now(),
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
        category: 'note',
        version: 1,
        timestamp: Date.now(),
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
      });

      expect(await db.records.count()).toBe(1);
      expect(await db.keyStore.count()).toBe(1);
      expect(await db.settings.count()).toBe(1);

      await clearAllData();

      expect(await db.records.count()).toBe(0);
      expect(await db.keyStore.count()).toBe(0);
      expect(await db.settings.count()).toBe(0);
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
      };

      await db.settings.put(customSettings);

      const settings = await getSettings();
      expect(settings.sessionTimeout).toBe(30 * 60 * 1000);
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
        lastUnlockedAt: 12345,
        periodReminderEnabled: true,
        periodReminderDays: 3,
      });

      await updateSettings({ sessionTimeout: 20 * 60 * 1000 });

      const settings = await db.settings.get('primary');
      expect(settings?.sessionTimeout).toBe(20 * 60 * 1000);
      expect(settings?.lastUnlockedAt).toBe(12345);
    });
  });
});
