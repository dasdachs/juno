import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import sodium from 'libsodium-wrappers-sumo';
import {
  assertValidPayload,
  AVATAR_DATA_URL_PATTERN,
  MAX_IMPORT_FILE_SIZE,
} from './payloadValidation';
import { initCrypto, createVault, lock, sealWithPassword, generateId, encryptRecord } from './crypto';
import { db, clearAllData } from './db';
import { importData } from './exportImport';
import { SyncEngine } from './sync/SyncEngine';
import type { SyncAdapter, SyncMetadata, SyncResult } from './sync/types';

const u8 = (str: string): Uint8Array => new Uint8Array(sodium.from_string(str));

const goodRecord = () => ({
  id: 'r1',
  type: 'note',
  createdAt: 1,
  updatedAt: 2,
  data: { date: 1, title: 't', content: 'c' },
  tags: ['a'],
});
const goodCycle = () => ({ id: 'c1', cycleNumber: 1, startDate: 1700000000000 });
const goodProfile = () => ({
  id: 'primary',
  weekStartsOn: 1,
  createdAt: 1,
  updatedAt: 2,
  averageCycleLength: 28,
  averagePeriodLength: 5,
});
const payload = (over: Record<string, unknown> = {}) => ({
  records: [goodRecord()],
  cycles: [goodCycle()],
  profile: goodProfile(),
  ...over,
});

describe('assertValidPayload', () => {
  it('accepts a well-formed payload', () => {
    expect(() => assertValidPayload(payload())).not.toThrow();
  });

  it('accepts tombstones with empty data and a null profile', () => {
    const tomb = { ...goodRecord(), deletedAt: 5, data: {}, tags: [] };
    const cycleTomb = { id: 'c2', cycleNumber: 0, startDate: 0, deletedAt: 5 };
    expect(() =>
      assertValidPayload(payload({ records: [tomb], cycles: [cycleTomb], profile: null }))
    ).not.toThrow();
  });

  const bad: Array<[string, unknown]> = [
    ['a non-object', 'nope'],
    ['null', null],
    ['an array', []],
    ['records that are not an array', payload({ records: {} })],
    ['cycles that are not an array', payload({ cycles: 'x' })],
    ['a record without an id', payload({ records: [{ ...goodRecord(), id: undefined }] })],
    ['a record with an empty id', payload({ records: [{ ...goodRecord(), id: '' }] })],
    ['a record with a non-string id', payload({ records: [{ ...goodRecord(), id: 5 }] })],
    ['an unknown record type', payload({ records: [{ ...goodRecord(), type: 'weight' }] })],
    ['a non-finite updatedAt', payload({ records: [{ ...goodRecord(), updatedAt: Infinity }] })],
    ['a NaN updatedAt', payload({ records: [{ ...goodRecord(), updatedAt: NaN }] })],
    ['a string updatedAt', payload({ records: [{ ...goodRecord(), updatedAt: '2' }] })],
    ['a string deletedAt', payload({ records: [{ ...goodRecord(), deletedAt: '5' }] })],
    ['null data', payload({ records: [{ ...goodRecord(), data: null }] })],
    ['array data', payload({ records: [{ ...goodRecord(), data: [] }] })],
    ['non-string tags', payload({ records: [{ ...goodRecord(), tags: ['a', 3] }] })],
    ['a cycle with a non-numeric startDate', payload({ cycles: [{ ...goodCycle(), startDate: 'x' }] })],
    ['a profile with another id', payload({ profile: { ...goodProfile(), id: 'other' } })],
    ['a profile with weekStartsOn 2', payload({ profile: { ...goodProfile(), weekStartsOn: 2 } })],
    ['a profile with a non-string avatarUrl', payload({ profile: { ...goodProfile(), avatarUrl: 5 } })],
  ];
  it.each(bad)('rejects %s', (_label, value) => {
    expect(() => assertValidPayload(value)).toThrow('File contents are invalid');
  });
});

describe('AVATAR_DATA_URL_PATTERN', () => {
  it('accepts embedded raster images', () => {
    expect(AVATAR_DATA_URL_PATTERN.test('data:image/jpeg;base64,AAAA')).toBe(true);
    expect(AVATAR_DATA_URL_PATTERN.test('data:image/png;base64,AAAA')).toBe(true);
    expect(AVATAR_DATA_URL_PATTERN.test('data:image/webp;base64,AAAA')).toBe(true);
  });
  it.each([
    'https://x/y.jpg',
    'data:image/svg+xml;base64,AAAA',
    'data:text/html;base64,AAAA',
    'javascript:alert(1)',
    'data:image/jpeg;base64,AAAA"onerror="x',
  ])('rejects %s', (url) => {
    expect(AVATAR_DATA_URL_PATTERN.test(url)).toBe(false);
  });
});

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

describe('size and shape limits on import / sync', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('validation vault pw 1');
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await db.records.clear();
    await db.cycles.clear();
    await db.userProfile.clear();
  });

  it('importData rejects a file larger than MAX_IMPORT_FILE_SIZE', async () => {
    const huge = 'a'.repeat(MAX_IMPORT_FILE_SIZE + 1);
    await expect(importData(huge, 'whatever', 'merge')).rejects.toThrow('Backup file is too large');
  });

  it('SyncEngine.pull rejects a correctly sealed but malformed payload and leaves the db unchanged', async () => {
    const existing = {
      id: generateId(),
      type: 'note' as const,
      createdAt: 1,
      updatedAt: 2,
      data: { date: 1, title: 't', content: 'keep' },
      tags: [],
    };
    await db.records.put(encryptRecord(existing as never));
    const before = JSON.stringify(await db.records.toArray());

    const malformed = { records: [{ ...goodRecord(), type: 'evil' }], cycles: [], profile: null };
    const sealed = await sealWithPassword(JSON.stringify(malformed), 'sync passphrase 1234');
    const adapter = new FakeAdapter();
    adapter.stored = {
      data: u8(JSON.stringify(sealed)),
      metadata: { deviceId: 'other', timestamp: Date.now(), version: 3 },
    };

    await expect(new SyncEngine(adapter).pull('sync passphrase 1234')).rejects.toThrow(
      'Sync file contents are invalid'
    );
    expect(JSON.stringify(await db.records.toArray())).toBe(before);
  });
});
