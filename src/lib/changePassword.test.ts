import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sodium from 'libsodium-wrappers-sumo';
import {
  initCrypto,
  createVault,
  unlock,
  lock,
  isUnlocked,
  changePassword,
  encryptRecord,
  decryptRecord,
  encryptCycleData,
  decryptCycleData,
  encryptUserProfile,
  decryptUserProfile,
  deriveKeyFromPassword,
  generateId,
} from './crypto';
import { db, clearAllData } from './db';
import type { HealthRecord, NoteData, CycleData, UserProfile, KeyStore } from './types';

const u8 = (str: string): Uint8Array => new Uint8Array(sodium.from_string(str));
const b64 = (s: string): Uint8Array => sodium.from_base64(s, sodium.base64_variants.ORIGINAL);
const PW1 = 'first vault password 111';
const PW2 = 'second vault password 222';
const PW3 = 'third vault password 333';

async function recoverVaultKey(ks: KeyStore, password: string): Promise<Uint8Array> {
  const master = await deriveKeyFromPassword(password, b64(ks.salt));
  return sodium.crypto_secretbox_open_easy(b64(ks.encryptedVaultKey), b64(ks.vaultKeyNonce), master);
}

function v3Key(vaultKey: Uint8Array, id: string): Uint8Array {
  return sodium.crypto_generichash(32, u8('junoREC\0' + id), vaultKey);
}

const record: HealthRecord = {
  id: generateId(),
  type: 'note',
  createdAt: 1700000000000,
  updatedAt: 1700000001000,
  data: { date: 1700000000000, title: 'T', content: 'rotate me' } as NoteData,
  tags: ['a'],
};
const cycle: CycleData = { id: generateId(), cycleNumber: 2, startDate: 1700000000000, periodLength: 5 };
const profile: UserProfile = {
  id: 'primary',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  weekStartsOn: 1,
  createdAt: 1,
  updatedAt: 2,
};
const BROKEN_ID = 'broken-row';
const broken = {
  id: BROKEN_ID,
  nonce: sodium.to_base64(new Uint8Array(24).fill(1), sodium.base64_variants.ORIGINAL),
  ciphertext: sodium.to_base64(new Uint8Array(64).fill(2), sodium.base64_variants.ORIGINAL),
  version: 3,
};

async function snapshot() {
  return JSON.stringify({
    ks: await db.keyStore.get('primary'),
    r: await db.records.orderBy('id').toArray(),
    c: await db.cycles.orderBy('id').toArray(),
    p: await db.userProfile.toArray(),
  });
}

function expectDataIntact() {
  return (async () => {
    expect(decryptRecord((await db.records.get(record.id))!)).toEqual(record);
    expect(decryptCycleData((await db.cycles.get(cycle.id))!)).toEqual(cycle);
    expect(decryptUserProfile((await db.userProfile.get('primary'))!)).toEqual(profile);
  })();
}

describe('changePassword (vault key rotation)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault(PW1);
    await db.records.put(encryptRecord(record));
    await db.records.put(broken);
    await db.cycles.put(encryptCycleData(cycle));
    await db.userProfile.put(encryptUserProfile(profile));
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  it('wrong current password returns false and changes nothing', async () => {
    const before = await snapshot();
    expect(await changePassword('definitely wrong pw', PW2)).toBe(false);
    expect(await snapshot()).toBe(before);
    expect(isUnlocked()).toBe(true);
  }, 20000);

  it('rotates the vault key, re-encrypts all rows and switches the password', async () => {
    const oldKs = (await db.keyStore.get('primary'))!;
    const oldVaultKey = await recoverVaultKey(oldKs, PW1);
    const oldRecordRow = (await db.records.get(record.id))!;
    const brokenBefore = JSON.stringify(await db.records.get(BROKEN_ID));

    expect(await changePassword(PW1, PW2)).toBe(true);

    // Unlocked and readable
    expect(isUnlocked()).toBe(true);
    await expectDataIntact();

    // Wrapped key changed, and holds a different vault key
    const newKs = (await db.keyStore.get('primary'))!;
    expect(newKs.encryptedVaultKey).not.toBe(oldKs.encryptedVaultKey);
    expect(newKs.salt).not.toBe(oldKs.salt);
    const newVaultKey = await recoverVaultKey(newKs, PW2);
    expect(Buffer.from(newVaultKey).equals(Buffer.from(oldVaultKey))).toBe(false);

    // Row re-encrypted: opens only under the key derived from the new vault key
    const row = (await db.records.get(record.id))!;
    expect(row.ciphertext).not.toBe(oldRecordRow.ciphertext);
    const nonce = b64(row.nonce);
    const ct = b64(row.ciphertext);
    expect(() => sodium.crypto_secretbox_open_easy(ct, nonce, v3Key(oldVaultKey, row.id))).toThrow();
    expect(() => sodium.crypto_secretbox_open_easy(ct, nonce, v3Key(newVaultKey, row.id))).not.toThrow();

    // Undecryptable row left untouched, did not fail the change
    expect(JSON.stringify(await db.records.get(BROKEN_ID))).toBe(brokenBefore);

    // New password unlocks after lock, old does not
    lock();
    expect(await unlock(PW1)).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(await unlock(PW2)).toBe(true);
    await expectDataIntact();
  }, 30000);

  it('succeeds while locked, re-encrypts, and stays locked', async () => {
    const oldKs = (await db.keyStore.get('primary'))!;
    const oldVaultKey = await recoverVaultKey(oldKs, PW2);
    lock();
    expect(isUnlocked()).toBe(false);

    expect(await changePassword(PW2, PW3)).toBe(true);
    expect(isUnlocked()).toBe(false);

    const newKs = (await db.keyStore.get('primary'))!;
    const newVaultKey = await recoverVaultKey(newKs, PW3);
    expect(Buffer.from(newVaultKey).equals(Buffer.from(oldVaultKey))).toBe(false);
    const row = (await db.records.get(record.id))!;
    expect(() =>
      sodium.crypto_secretbox_open_easy(b64(row.ciphertext), b64(row.nonce), v3Key(oldVaultKey, row.id))
    ).toThrow();

    expect(await unlock(PW3)).toBe(true);
    await expectDataIntact();
  }, 30000);
});
