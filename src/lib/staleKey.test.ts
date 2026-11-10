import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initCrypto,
  createVault,
  lock,
  unlock,
  isUnlocked,
  isVaultKeyCurrent,
  encryptRecord,
  decryptRecord,
  generateId,
  sealWithPassword,
} from './crypto';
import { db, clearAllData } from './db';
import { exportData, readVault } from './exportImport';
import { SyncEngine } from './sync/SyncEngine';
import type { SyncAdapter, SyncResult } from './sync/types';
import type { HealthRecord, NoteData } from './types';

const PASSWORD = 'stale key vault password';
const SYNC_PW = 'sync passphrase 4321';

function note(id: string, content: string, updatedAt: number): HealthRecord {
  return {
    id,
    type: 'note',
    createdAt: 1,
    updatedAt,
    data: { date: 1, title: 't', content } as NoteData,
    tags: [],
  };
}

function adapterWith(result: SyncResult): SyncAdapter {
  return {
    name: 'fake',
    initialize: async () => {},
    isConfigured: async () => true,
    upload: async () => {},
    download: async () => result,
    dispose: async () => {},
  };
}

describe('stale key and unreadable-vault guards (real crypto + db)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault(PASSWORD);
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  it('reports the key as current after create and after unlock', async () => {
    expect(await isVaultKeyCurrent()).toBe(true);
    lock();
    expect(await isVaultKeyCurrent()).toBe(false);
    expect(await unlock(PASSWORD)).toBe(true);
    expect(await isVaultKeyCurrent()).toBe(true);
  });

  it('pull replaces an unreadable local row with the remote copy instead of failing', async () => {
    const id = generateId();
    await db.records.put({ id, nonce: 'AAAA', ciphertext: 'AAAA', version: 3 });

    const sealed = await sealWithPassword(
      JSON.stringify({ records: [note(id, 'from remote', 10)], cycles: [], profile: null }),
      SYNC_PW
    );
    const data = new TextEncoder().encode(JSON.stringify(sealed));
    const engine = new SyncEngine(
      adapterWith({
        data: new Uint8Array(data),
        metadata: { deviceId: 'other', timestamp: 1, version: 3 },
      })
    );

    const result = await engine.pull(SYNC_PW);
    expect(result.recordsAdded).toBe(1);
    const stored = await db.records.get(id);
    expect((decryptRecord(stored!).data as NoteData).content).toBe('from remote');
  });

  it('refuses to export when nothing at all can be read', async () => {
    await db.records.clear();
    await db.cycles.clear();
    await db.userProfile.clear();
    await db.records.put({ id: 'garbage', nonce: 'AAAA', ciphertext: 'AAAA', version: 3 });

    await expect(readVault()).rejects.toThrow('could not be read');
    await expect(exportData('backup password 456')).rejects.toThrow('could not be read');
    await db.records.clear();
  });

  it('locks and refuses to read once the stored vault key has been replaced elsewhere', async () => {
    await db.records.put(encryptRecord(note(generateId(), 'mine', 1)));
    const keyStore = await db.keyStore.get('primary');
    // Simulate another tab having rotated the key
    await db.keyStore.put({ ...keyStore!, encryptedVaultKey: 'c29tZXRoaW5nIGVsc2U=' });

    expect(isUnlocked()).toBe(true);
    await expect(readVault()).rejects.toThrow('Vault is locked');
    expect(isUnlocked()).toBe(false);
    expect(await isVaultKeyCurrent()).toBe(false);
  });
});
