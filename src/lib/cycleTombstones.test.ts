import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import sodium from 'libsodium-wrappers-sumo';
import {
  initCrypto,
  createVault,
  lock,
  sealWithPassword,
  encryptCycleData,
  decryptCycleData,
  generateId,
} from './crypto';
import { db, clearAllData } from './db';
import { exportData, importData } from './exportImport';
import { SyncEngine } from './sync/SyncEngine';
import type { SyncAdapter, SyncMetadata, SyncResult } from './sync/types';
import type { CycleData } from './types';

const u8 = (str: string): Uint8Array => new Uint8Array(sodium.from_string(str));
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
  async upload() {}
  async download() {
    return this.stored;
  }
  async dispose() {}
}

async function backupFile(cycles: unknown[]): Promise<string> {
  const sealed = await sealWithPassword(
    JSON.stringify({ records: [], cycles, profile: null }),
    BACKUP_PW
  );
  return JSON.stringify({ manifest: { version: 1, exportedAt: Date.now() }, ...sealed });
}

async function syncAdapterWith(cycles: unknown[]): Promise<SyncEngine> {
  const sealed = await sealWithPassword(
    JSON.stringify({ records: [], cycles, profile: null }),
    SYNC_PW
  );
  const adapter = new FakeAdapter();
  const metadata: SyncMetadata = { deviceId: 'other', timestamp: Date.now(), version: 3 };
  adapter.stored = { data: u8(JSON.stringify(sealed)), metadata };
  return new SyncEngine(adapter);
}

const live = (): CycleData => ({ id: generateId(), cycleNumber: 3, startDate: 1700000000000 });
const readCycle = async (id: string) => decryptCycleData((await db.cycles.get(id))!);

describe('cycle tombstones in import and sync', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('tombstone vault password');
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await db.cycles.clear();
  });

  describe('importData (merge)', () => {
    it('does not resurrect a cycle that is tombstoned locally', async () => {
      const c = live();
      await db.cycles.put(encryptCycleData(c));
      const backup = await readBlob(await exportData(BACKUP_PW));
      await db.cycles.put(encryptCycleData({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 99 }));

      const res = await importData(backup, BACKUP_PW, 'merge');
      expect(res.cyclesImported).toBe(0);
      expect(await readCycle(c.id)).toEqual({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 99 });
    });

    it('stores a backup cycle with deletedAt and real dates scrubbed', async () => {
      const c = { ...live(), endDate: 1700000000000 + 28 * 86400000, periodLength: 5, deletedAt: 1234 };
      const res = await importData(await backupFile([c]), BACKUP_PW, 'merge');
      expect(res.cyclesImported).toBe(1);
      expect(await readCycle(c.id)).toEqual({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 1234 });
    });
  });

  describe('SyncEngine.pull', () => {
    it('a remote tombstone replaces a live local cycle', async () => {
      const c = live();
      await db.cycles.put(encryptCycleData(c));
      // Older start date than local: deletion must still win
      const engine = await syncAdapterWith([
        { id: c.id, cycleNumber: 3, startDate: c.startDate - 1000, deletedAt: 777 },
      ]);
      const res = await engine.pull(SYNC_PW);
      expect(res.cyclesUpdated).toBe(1);
      expect(await readCycle(c.id)).toEqual({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 777 });
    });

    it('a local tombstone is not replaced by a live remote cycle', async () => {
      const c = live();
      await db.cycles.put(encryptCycleData({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 55 }));
      const engine = await syncAdapterWith([{ ...c, startDate: c.startDate + 365 * 86400000 }]);
      const res = await engine.pull(SYNC_PW);
      expect(res.cyclesUpdated).toBe(0);
      expect(res.cyclesAdded).toBe(0);
      expect(await readCycle(c.id)).toEqual({ id: c.id, cycleNumber: 0, startDate: 0, deletedAt: 55 });
    });
  });
});
