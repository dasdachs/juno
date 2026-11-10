import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import sodium from 'libsodium-wrappers-sumo';
import {
  initCrypto,
  createVault,
  unlock,
  lock,
  isUnlocked,
  encryptRecord,
  decryptRecord,
  encryptCycleData,
  decryptCycleData,
  encryptUserProfile,
  decryptUserProfile,
  deriveKeyFromPassword,
  generateId,
  sealWithPassword,
  openWithPassword,
  toTombstone,
  CURRENT_FORMAT_VERSION,
} from './crypto';
import { db, clearAllData } from './db';
import type { HealthRecord, NoteData, CycleData, UserProfile, EncryptedRecord } from './types';

// libsodium under jsdom needs Uint8Arrays of the test realm
const u8 = (str: string): Uint8Array => new Uint8Array(sodium.from_string(str));

const PASSWORD = 'correct horse battery staple';
const SECRET_TEXT = 'my very private diary entry ZEBRA-42';

function b64(s: string): Uint8Array {
  return sodium.from_base64(s, sodium.base64_variants.ORIGINAL);
}

function makeNote(content = SECRET_TEXT, overrides: Partial<HealthRecord> = {}): HealthRecord {
  return {
    id: generateId(),
    type: 'note',
    createdAt: 1700000000000,
    updatedAt: 1700000001234,
    data: { date: 1700000000000, title: 'T', content } as NoteData,
    tags: ['secret-tag'],
    ...overrides,
  };
}

function makeCycle(): CycleData {
  return { id: generateId(), cycleNumber: 3, startDate: 1699999999999, periodLength: 5, cycleLength: 28 };
}

function makeProfile(): UserProfile {
  return {
    id: 'primary',
    birthYear: 1990,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    weekStartsOn: 1,
    createdAt: 1,
    updatedAt: 2,
  };
}

// Legacy (format v2) helpers, built directly on libsodium
let vaultKeyBytes: Uint8Array;
const LEGACY_CTX = { record: 'junoREC\0', cycle: 'junoCYC\0', profile: 'junoPRF\0' } as const;

function legacyEncrypt(ctx: string, item: { id: string }) {
  const h = sodium.crypto_generichash(16, u8(item.id));
  const subkeyId = h[0] + (h[1] << 8) + (h[2] << 16);
  const key = sodium.crypto_kdf_derive_from_key(32, subkeyId, ctx, vaultKeyBytes);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ct = sodium.crypto_secretbox_easy(u8(JSON.stringify(item)), nonce, key);
  return {
    id: item.id,
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL),
    ciphertext: sodium.to_base64(ct, sodium.base64_variants.ORIGINAL),
    version: 2,
  };
}

describe('crypto format v3', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault(PASSWORD);
    // Recover the vault key so legacy rows can be forged
    const ks = (await db.keyStore.get('primary'))!;
    const master = await deriveKeyFromPassword(PASSWORD, b64(ks.salt));
    vaultKeyBytes = sodium.crypto_secretbox_open_easy(b64(ks.encryptedVaultKey), b64(ks.vaultKeyNonce), master);
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    if (!isUnlocked()) await unlock(PASSWORD);
  });

  describe('stored wrapper shape', () => {
    it('contains only id, nonce, ciphertext, version (v3) for records, cycles and profile', () => {
      const wrappers = [
        encryptRecord(makeNote()),
        encryptCycleData(makeCycle()),
        encryptUserProfile(makeProfile()),
      ];
      for (const w of wrappers) {
        expect(Object.keys(w).sort()).toEqual(['ciphertext', 'id', 'nonce', 'version']);
        expect(w.version).toBe(3);
        expect(CURRENT_FORMAT_VERSION).toBe(3);
      }
    });

    it('leaks no type, dates or note text in the serialized wrapper', () => {
      const record = makeNote();
      const cycle = makeCycle();
      const rJson = JSON.stringify(encryptRecord(record));
      const cJson = JSON.stringify(encryptCycleData(cycle));
      expect(rJson).not.toContain('note');
      expect(rJson).not.toContain('ZEBRA');
      expect(rJson).not.toContain(String(record.updatedAt));
      expect(rJson).not.toContain(String(record.createdAt));
      expect(cJson).not.toContain(String(cycle.startDate));
      expect(cJson).not.toContain('startDate');
    });

    it('round-trips all three kinds', () => {
      const r = makeNote();
      const c = makeCycle();
      const p = makeProfile();
      expect(decryptRecord(encryptRecord(r))).toEqual(r);
      expect(decryptCycleData(encryptCycleData(c))).toEqual(c);
      expect(decryptUserProfile(encryptUserProfile(p))).toEqual(p);
    });
  });

  describe('padding', () => {
    it('gives equal ciphertext lengths for short and moderately longer notes', () => {
      // Same id so the JSON differs only by content length
      const id = generateId();
      // Both plaintexts (~330 and ~480 bytes of JSON) fall in the same 512-byte block
      const shortNote = makeNote('s'.repeat(100), { id });
      const longNote = makeNote('s'.repeat(250), { id });
      expect(JSON.stringify(shortNote).length).toBeGreaterThan(256);
      expect(JSON.stringify(longNote).length).toBeLessThan(511);
      const short = encryptRecord(shortNote);
      const longer = encryptRecord(longNote);
      expect(short.ciphertext.length).toBe(longer.ciphertext.length);
    });

    it('ciphertext minus MAC is a multiple of 256 bytes', () => {
      for (const content of ['', 'a', 'b'.repeat(300), 'c'.repeat(1000)]) {
        const len = b64(encryptRecord(makeNote(content)).ciphertext).length;
        expect((len - sodium.crypto_secretbox_MACBYTES) % 256).toBe(0);
      }
      const cycleLen = b64(encryptCycleData(makeCycle()).ciphertext).length;
      expect((cycleLen - sodium.crypto_secretbox_MACBYTES) % 256).toBe(0);
    });
  });

  describe('ID binding', () => {
    it('fails to decrypt when only the wrapper id is changed', () => {
      const enc = encryptRecord(makeNote());
      expect(() => decryptRecord({ ...enc, id: generateId() })).toThrow();
    });

    it('fails when ciphertext and nonce from record A are placed in record B', () => {
      const a = encryptRecord(makeNote());
      const b = encryptRecord(makeNote());
      expect(() => decryptRecord({ ...b, nonce: a.nonce, ciphertext: a.ciphertext })).toThrow();
    });

    it('rejects a decrypted item whose inner id differs from the wrapper id (same key)', () => {
      // Encrypt item X under key(ids=B) is impossible via the API, so check
      // that swapping across kinds with the same id also fails.
      const id = generateId();
      const rec = encryptRecord(makeNote(SECRET_TEXT, { id }));
      const cyc = encryptCycleData({ ...makeCycle(), id });
      expect(() => decryptCycleData({ ...rec })).toThrow();
      expect(() => decryptRecord({ ...cyc })).toThrow();
    });

    it('fails on tampered ciphertext', () => {
      const enc = encryptRecord(makeNote());
      const bytes = b64(enc.ciphertext);
      bytes[0] ^= 1;
      const tampered = sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
      expect(() => decryptRecord({ ...enc, ciphertext: tampered })).toThrow();
    });
  });

  describe('toTombstone', () => {
    it('keeps only the id and deletion time; erases type, creation time, data and tags', () => {
      const rec = makeNote(SECRET_TEXT, { type: 'intimacy' });
      const t = toTombstone(rec, 5000);
      expect(t).toEqual({
        id: rec.id,
        type: 'note',
        createdAt: 5000,
        updatedAt: 5000,
        deletedAt: 5000,
        data: {},
        tags: [],
      });
    });
  });

  describe('legacy version 2 compatibility', () => {
    it('decryptRecord/Cycle/Profile read genuine v2 rows', () => {
      const rec = makeNote();
      const cyc = makeCycle();
      const prof = makeProfile();
      expect(decryptRecord(legacyEncrypt(LEGACY_CTX.record, rec))).toEqual(rec);
      expect(decryptCycleData(legacyEncrypt(LEGACY_CTX.cycle, cyc))).toEqual(cyc);
      expect(decryptUserProfile(legacyEncrypt(LEGACY_CTX.profile, prof))).toEqual(prof);
    });

    it('upgrades all legacy rows to v3 on unlock, scrubbing deleted records', async () => {
      await db.records.clear();
      await db.cycles.clear();
      await db.userProfile.clear();

      const live = makeNote();
      const deleted = makeNote('deleted secret text', {
        deletedAt: 1700000009999,
        updatedAt: 1700000009999,
        tags: ['sensitive-tag'],
      });
      const cyc = makeCycle();
      const prof = makeProfile();

      await db.records.bulkPut([
        { ...legacyEncrypt(LEGACY_CTX.record, live), category: 'note', timestamp: live.updatedAt },
        { ...legacyEncrypt(LEGACY_CTX.record, deleted), category: 'note', timestamp: deleted.updatedAt },
      ] as unknown as EncryptedRecord[]);
      await db.cycles.put({ ...legacyEncrypt(LEGACY_CTX.cycle, cyc), startDate: cyc.startDate } as never);
      await db.userProfile.put(legacyEncrypt(LEGACY_CTX.profile, prof));

      lock();
      expect(await unlock(PASSWORD)).toBe(true);

      const rows = await db.records.toArray();
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.version).toBe(3);
        expect(Object.keys(row).sort()).toEqual(['ciphertext', 'id', 'nonce', 'version']);
      }
      expect(decryptRecord((await db.records.get(live.id))!)).toEqual(live);

      const tomb = decryptRecord((await db.records.get(deleted.id))!);
      expect(tomb.data).toEqual({});
      expect(tomb.tags).toEqual([]);
      expect(tomb.deletedAt).toBe(deleted.deletedAt);
      expect(tomb.id).toBe(deleted.id);

      const cRow = (await db.cycles.get(cyc.id))!;
      expect(cRow.version).toBe(3);
      expect(cRow).not.toHaveProperty('startDate');
      expect(decryptCycleData(cRow)).toEqual(cyc);

      const pRow = (await db.userProfile.get('primary'))!;
      expect(pRow.version).toBe(3);
      expect(decryptUserProfile(pRow)).toEqual(prof);
    });

    it('leaves undecryptable legacy rows untouched and does not fail unlock', async () => {
      await db.records.clear();
      const good = makeNote();
      const garbage = {
        id: generateId(),
        nonce: sodium.to_base64(sodium.randombytes_buf(24), sodium.base64_variants.ORIGINAL),
        ciphertext: sodium.to_base64(sodium.randombytes_buf(64), sodium.base64_variants.ORIGINAL),
        version: 2,
      };
      await db.records.bulkPut([legacyEncrypt(LEGACY_CTX.record, good), garbage]);

      lock();
      expect(await unlock(PASSWORD)).toBe(true);

      expect(await db.records.get(garbage.id)).toEqual(garbage);
      const goodRow = (await db.records.get(good.id))!;
      expect(goodRow.version).toBe(3);
      expect(decryptRecord(goodRow)).toEqual(good);
    });
  });

  describe('sealWithPassword / openWithPassword', () => {
    it('round-trips, and rejects wrong password and tampering', async () => {
      const sealed = await sealWithPassword('hello sealed world', 'pw-one');
      expect(Object.keys(sealed).sort()).toEqual(['ciphertext', 'nonce', 'salt']);
      expect(JSON.stringify(sealed)).not.toContain('hello');
      expect(await openWithPassword(sealed, 'pw-one')).toBe('hello sealed world');

      await expect(openWithPassword(sealed, 'pw-two')).rejects.toThrow();

      const bytes = b64(sealed.ciphertext);
      bytes[bytes.length - 1] ^= 1;
      await expect(
        openWithPassword({ ...sealed, ciphertext: sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL) }, 'pw-one')
      ).rejects.toThrow();
    }, 30000);

    it('uses a fresh salt and nonce each time', async () => {
      const a = await sealWithPassword('x', 'pw');
      const b = await sealWithPassword('x', 'pw');
      expect(a.salt).not.toBe(b.salt);
      expect(a.nonce).not.toBe(b.nonce);
    }, 30000);
  });
});
