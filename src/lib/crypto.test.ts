import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initCrypto,
  createVault,
  unlock,
  lock,
  isUnlocked,
  encryptRecord,
  decryptRecord,
  generateId,
  changePassword,
} from './crypto';
import { db } from './db';
import type { HealthRecord, NoteData } from './types';

describe('crypto', () => {
  beforeEach(async () => {
    await initCrypto();
    await db.keyStore.clear();
    await db.records.clear();
    lock();
  });

  afterEach(() => {
    lock();
  });

  describe('initCrypto', () => {
    it('should initialize libsodium without error', async () => {
      await expect(initCrypto()).resolves.toBeUndefined();
    });

    it('should be idempotent', async () => {
      await initCrypto();
      await initCrypto();
      await expect(initCrypto()).resolves.toBeUndefined();
    });
  });

  describe('isUnlocked', () => {
    it('should return false when vault is locked', () => {
      expect(isUnlocked()).toBe(false);
    });

    it('should return true after creating vault', async () => {
      await createVault('testpassword123');
      expect(isUnlocked()).toBe(true);
    });
  });

  describe('lock', () => {
    it('should lock the vault', async () => {
      await createVault('testpassword123');
      expect(isUnlocked()).toBe(true);

      lock();
      expect(isUnlocked()).toBe(false);
    });

    it('should be safe to call when already locked', () => {
      lock();
      lock();
      expect(isUnlocked()).toBe(false);
    });
  });

  describe('createVault', () => {
    it('should create a vault and unlock it', async () => {
      await createVault('mysecretpassword');
      expect(isUnlocked()).toBe(true);

      const keyStore = await db.keyStore.get('primary');
      expect(keyStore).toBeDefined();
      expect(keyStore?.salt).toBeDefined();
      expect(keyStore?.encryptedVaultKey).toBeDefined();
      expect(keyStore?.vaultKeyNonce).toBeDefined();
    });
  });

  describe('unlock', () => {
    const password = 'correctPassword123';

    beforeEach(async () => {
      await createVault(password);
      lock();
    });

    it('should unlock with correct password', async () => {
      const result = await unlock(password);
      expect(result).toBe(true);
      expect(isUnlocked()).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      const result = await unlock('wrongpassword');
      expect(result).toBe(false);
      expect(isUnlocked()).toBe(false);
    });

    it('should throw when no vault exists', async () => {
      await db.keyStore.clear();
      await expect(unlock(password)).rejects.toThrow('No vault found');
    });
  });

  describe('changePassword', () => {
    const oldPassword = 'oldPassword123';
    const newPassword = 'newPassword456';

    beforeEach(async () => {
      await createVault(oldPassword);
    });

    it('should change password successfully', async () => {
      const result = await changePassword(oldPassword, newPassword);
      expect(result).toBe(true);

      lock();

      const unlockWithOld = await unlock(oldPassword);
      expect(unlockWithOld).toBe(false);

      const unlockWithNew = await unlock(newPassword);
      expect(unlockWithNew).toBe(true);
    });

    it('should fail with wrong current password', async () => {
      const result = await changePassword('wrongPassword', newPassword);
      expect(result).toBe(false);
    });

    it('should preserve data after password change', async () => {
      const record = createTestRecord();
      const encrypted = encryptRecord(record);
      await db.records.put(encrypted);

      await changePassword(oldPassword, newPassword);

      const retrievedEncrypted = await db.records.get(record.id);
      expect(retrievedEncrypted).toBeDefined();

      const decrypted = decryptRecord(retrievedEncrypted!);
      expect(decrypted.id).toBe(record.id);
      expect((decrypted.data as NoteData).title).toBe('Test Note');
    });
  });

  describe('encryptRecord / decryptRecord', () => {
    beforeEach(async () => {
      await createVault('testpassword');
    });

    it('should encrypt and decrypt a record', () => {
      const record = createTestRecord();

      const encrypted = encryptRecord(record);

      expect(encrypted.id).toBe(record.id);
      expect(encrypted.category).toBe(record.type);
      expect(encrypted.nonce).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toContain('Test Note');

      const decrypted = decryptRecord(encrypted);

      expect(decrypted.id).toBe(record.id);
      expect(decrypted.type).toBe(record.type);
      expect((decrypted.data as NoteData).title).toBe('Test Note');
      expect((decrypted.data as NoteData).content).toBe('This is test content');
    });

    it('should produce different ciphertexts for same record', () => {
      const record = createTestRecord();

      const encrypted1 = encryptRecord(record);
      const encrypted2 = encryptRecord(record);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
    });

    it('should throw when vault is locked', () => {
      const record = createTestRecord();

      lock();

      expect(() => encryptRecord(record)).toThrow('Vault is locked');
      expect(() => decryptRecord({ id: '1', nonce: '', ciphertext: '', category: 'note', version: 1, timestamp: Date.now() }))
        .toThrow('Vault is locked');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate IDs without special characters', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateId();
        expect(id).not.toContain('+');
        expect(id).not.toContain('/');
        expect(id).not.toContain('=');
      }
    });
  });
});

function createTestRecord(): HealthRecord {
  return {
    id: generateId(),
    type: 'note',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {
      title: 'Test Note',
      content: 'This is test content',
    } as NoteData,
    tags: ['test'],
  };
}
