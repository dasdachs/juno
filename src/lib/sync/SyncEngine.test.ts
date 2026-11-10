import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import sodium from 'libsodium-wrappers-sumo';
import { sealWithPassword, initCrypto, createVault, lock, encryptRecord, decryptRecord, encryptCycleData, generateId } from '../crypto';
import { db, clearAllData } from '../db';
import { SyncEngine } from './SyncEngine';
import type { SyncAdapter, SyncMetadata, SyncResult } from './types';
import type { HealthRecord, NoteData, CycleData } from '../types';

// libsodium under jsdom needs Uint8Arrays of the test realm
const u8 = (str: string): Uint8Array => new Uint8Array(sodium.from_string(str));

const PASSPHRASE = 'a long sync passphrase 987';
const NOTE_TEXT = 'SYNC-SECRET-NOTE-TEXT';

class FakeAdapter implements SyncAdapter {
  readonly name = 'fake';
  stored: SyncResult | null = null;
  async initialize() {}
  async isConfigured() {
    return true;
  }
  async upload(blob: Uint8Array, metadata: SyncMetadata) {
    this.stored = { data: new Uint8Array(blob), metadata: { ...metadata } };
  }
  async download() {
    return this.stored;
  }
  async dispose() {}
}

let rec: HealthRecord;
let cycle: CycleData;
let adapter: FakeAdapter;
let engine: SyncEngine;

describe('SyncEngine', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('vault password 123');
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await db.records.clear();
    await db.cycles.clear();
    await db.userProfile.clear();
    rec = {
      id: generateId(),
      type: 'note',
      createdAt: 1700000000000,
      updatedAt: 1700000000500,
      data: { date: 1700000000000, title: 'T', content: NOTE_TEXT } as NoteData,
      tags: [],
    };
    cycle = { id: generateId(), cycleNumber: 1, startDate: 1700000000000 };
    await db.records.put(encryptRecord(rec));
    await db.cycles.put(encryptCycleData(cycle));
    adapter = new FakeAdapter();
    engine = new SyncEngine(adapter);
  });

  it('uploads only passphrase-sealed data', async () => {
    await engine.push(PASSPHRASE);

    expect(adapter.stored).not.toBeNull();
    expect(adapter.stored!.metadata.version).toBe(3);
    expect(adapter.stored!.metadata).not.toHaveProperty('recordCount');

    const text = sodium.to_string(adapter.stored!.data);
    expect(text).not.toContain(NOTE_TEXT);
    expect(text).not.toContain('"note"');
    expect(text).not.toContain(rec.id);
    expect(text).not.toContain(cycle.id);

    const parsed = JSON.parse(text);
    expect(Object.keys(parsed).sort()).toEqual(['ciphertext', 'nonce', 'salt']);
  });

  it('push rejects an empty passphrase and uploads nothing', async () => {
    await expect(engine.push('')).rejects.toThrow();
    expect(adapter.stored).toBeNull();
  });

  it('pull with the right passphrase merges into an emptied db', async () => {
    await engine.push(PASSPHRASE);
    await db.records.clear();
    await db.cycles.clear();

    const result = await engine.pull(PASSPHRASE);
    expect(result.recordsAdded).toBe(1);
    expect(result.cyclesAdded).toBe(1);

    const row = (await db.records.get(rec.id))!;
    expect(Object.keys(row).sort()).toEqual(['ciphertext', 'id', 'nonce', 'version']);
    expect(decryptRecord(row)).toEqual(rec);
    expect(await db.cycles.get(cycle.id)).toBeDefined();
  });

  it('pull with a wrong passphrase rejects and changes nothing', async () => {
    await engine.push(PASSPHRASE);
    await db.records.clear();
    await expect(engine.pull('wrong passphrase!!')).rejects.toThrow(/passphrase/i);
    expect(await db.records.count()).toBe(0);
  });

  it('pull rejects a v2 (plaintext) sync blob', async () => {
    const plaintext = JSON.stringify({ records: [rec], cycles: [cycle], profile: null });
    adapter.stored = {
      data: u8(plaintext),
      metadata: { deviceId: 'other', timestamp: Date.now(), version: 2 },
    };
    await db.records.clear();

    await expect(engine.pull(PASSPHRASE)).rejects.toThrow('Unsupported sync file format');
    expect(await db.records.count()).toBe(0);
  });

  it('pull with nothing on the remote adds nothing', async () => {
    const result = await engine.pull(PASSPHRASE);
    expect(result.recordsAdded).toBe(0);
  });

  it('pull stores a remote soft-deleted record with content as a scrubbed tombstone', async () => {
    const remote: HealthRecord = {
      id: generateId(),
      type: 'mood',
      createdAt: 1700000000000,
      updatedAt: 1700000000900,
      deletedAt: 1700000000900,
      data: { date: 1700000000000, title: 'T', content: 'REMOTE-DELETED-CONTENT' } as NoteData,
      tags: ['t'],
    };
    const sealed = await sealWithPassword(
      JSON.stringify({ records: [remote], cycles: [], profile: null }),
      PASSPHRASE
    );
    adapter.stored = {
      data: u8(JSON.stringify(sealed)),
      metadata: { deviceId: 'other', timestamp: Date.now(), version: 3 },
    };
    const result = await engine.pull(PASSPHRASE);
    expect(result.recordsAdded).toBe(1);
    const stored = decryptRecord((await db.records.get(remote.id))!);
    expect(stored.data).toEqual({});
    expect(stored.tags).toEqual([]);
    expect(stored.type).toBe('note');
    expect(stored.deletedAt).toBe(remote.deletedAt);
  });
});
