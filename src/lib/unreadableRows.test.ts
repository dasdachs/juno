import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  initCrypto,
  createVault,
  lock,
  encryptRecord,
  encryptCycleData,
  generateId,
  decryptRecord,
} from './crypto';
import { db, clearAllData } from './db';
import { exportData, importData } from './exportImport';
import { SyncEngine } from './sync/SyncEngine';
import type { SyncAdapter, SyncMetadata, SyncResult } from './sync/types';
import type { HealthRecord, NoteData } from './types';

const BACKUP_PW = 'backup password 456';
const SYNC_PW = 'sync passphrase 4321';

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

class FakeAdapter implements SyncAdapter {
  readonly name = 'fake';
  stored: SyncResult | null = null;
  async initialize() {}
  async isConfigured() {
    return true;
  }
  async upload(blob: Uint8Array, metadata: SyncMetadata) {
    this.stored = { data: new Uint8Array(blob), metadata };
  }
  async download() {
    return this.stored;
  }
  async dispose() {}
}

const good: HealthRecord = {
  id: generateId(),
  type: 'note',
  createdAt: 1,
  updatedAt: 2,
  data: { date: 1, title: 't', content: 'good row' } as NoteData,
  tags: [],
};
const garbage = { id: 'garbage-row', nonce: 'AAAA', ciphertext: 'AAAA', version: 3 };

describe('unreadable rows (real crypto + db)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('unreadable vault password');
    await db.records.put(encryptRecord(good));
    await db.cycles.put(encryptCycleData({ id: generateId(), cycleNumber: 1, startDate: 5 }));
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  it('does not call onUnreadable when every row decrypts', async () => {
    const cb = vi.fn();
    await exportData(BACKUP_PW, cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it('exportData skips and reports a garbage row; import restores the good rows', async () => {
    await db.records.put(garbage as never);
    const cb = vi.fn();
    const blob = await readBlob(await exportData(BACKUP_PW, cb));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(1);

    await db.records.clear();
    await db.cycles.clear();
    const res = await importData(blob, BACKUP_PW, 'replace');
    expect(res.recordsImported).toBe(1);
    expect(res.cyclesImported).toBe(1);
    expect(decryptRecord((await db.records.get(good.id))!)).toEqual(good);
    expect(await db.records.get('garbage-row')).toBeUndefined();

    await db.records.put(encryptRecord(good));
    await db.records.put(garbage as never);
  });

  it('SyncEngine.push returns the unreadable count and still uploads', async () => {
    await db.records.put(garbage as never);
    const adapter = new FakeAdapter();
    const res = await new SyncEngine(adapter).push(SYNC_PW);
    expect(res).toEqual({ unreadable: 1 });
    expect(adapter.stored).not.toBeNull();
  });

  it('a locked vault rejects instead of reporting everything unreadable', async () => {
    await db.records.put(garbage as never);
    const cb = vi.fn();
    lock();
    await expect(exportData(BACKUP_PW, cb)).rejects.toThrow('Vault is locked');
    expect(cb).not.toHaveBeenCalled();
  });
});
