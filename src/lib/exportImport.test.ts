import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initCrypto, createVault, lock, encryptRecord, decryptRecord, encryptCycleData, encryptUserProfile, generateId, sealWithPassword } from './crypto';
import { db, clearAllData } from './db';
import { exportData, importData, parseManifest } from './exportImport';
import type { HealthRecord, NoteData, CycleData, UserProfile } from './types';

const VAULT_PW = 'vault password 123';
const BACKUP_PW = 'backup password 456';
const NOTE_TEXT = 'PRIVATE-NOTE-TEXT-QWERTY';

function note(content: string): HealthRecord {
  return {
    id: generateId(),
    type: 'note',
    createdAt: 1700000000000,
    updatedAt: 1700000000500,
    data: { date: 1700000000000, title: 'Title', content } as NoteData,
    tags: [],
  };
}

const profile: UserProfile = {
  id: 'primary',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  weekStartsOn: 1,
  createdAt: 1,
  updatedAt: 2,
};

// jsdom's Blob has no .text()
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

let seeded: HealthRecord;
let cycle: CycleData;
let blobText: string;

async function wipeData() {
  await db.records.clear();
  await db.cycles.clear();
  await db.userProfile.clear();
}

describe('exportImport', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault(VAULT_PW);
    seeded = note(NOTE_TEXT);
    cycle = { id: generateId(), cycleNumber: 1, startDate: 1700000000000 };
    await db.records.put(encryptRecord(seeded));
    await db.cycles.put(encryptCycleData(cycle));
    await db.userProfile.put(encryptUserProfile(profile));
    blobText = await readBlob(await exportData(BACKUP_PW));
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await wipeData();
  });

  it('exports a blob with a manifest and no plaintext content', () => {
    expect(blobText).not.toContain(NOTE_TEXT);
    expect(blobText).not.toContain(seeded.id);
    const manifest = parseManifest(blobText);
    expect(manifest.version).toBe(1);
    // The manifest is readable without the password: it must not say how much data is inside
    expect(Object.keys(manifest).sort()).toEqual(['exportedAt', 'version']);
    const parsed = JSON.parse(blobText);
    expect(Object.keys(parsed).sort()).toEqual(['ciphertext', 'manifest', 'nonce', 'salt']);
  });

  it('rejects a wrong backup password', async () => {
    await expect(importData(blobText, 'not the password', 'replace')).rejects.toThrow(
      'Incorrect backup password'
    );
    expect(await db.records.count()).toBe(0);
  });

  it('rejects a tampered file as incorrect password', async () => {
    const parsed = JSON.parse(blobText);
    parsed.ciphertext = parsed.ciphertext.slice(0, -4) + 'AAAA';
    await expect(importData(JSON.stringify(parsed), BACKUP_PW, 'replace')).rejects.toThrow(
      'Incorrect backup password'
    );
  });

  it('replace: restores data and removes pre-existing rows', async () => {
    const stray = note('stray');
    await db.records.put(encryptRecord(stray));

    const result = await importData(blobText, BACKUP_PW, 'replace');
    expect(result).toEqual({ recordsImported: 1, cyclesImported: 1, profileImported: true });

    expect(await db.records.get(stray.id)).toBeUndefined();
    const row = (await db.records.get(seeded.id))!;
    expect(Object.keys(row).sort()).toEqual(['ciphertext', 'id', 'nonce', 'version']);
    expect(decryptRecord(row)).toEqual(seeded);
    expect(await db.cycles.count()).toBe(1);
    expect(await db.userProfile.count()).toBe(1);
  });

  it('merge: keeps existing rows and skips duplicates', async () => {
    const existingOther = note('other');
    const edited = { ...seeded, data: { ...seeded.data, content: 'local edit' } as NoteData };
    await db.records.bulkPut([encryptRecord(existingOther), encryptRecord(edited)]);

    const result = await importData(blobText, BACKUP_PW, 'merge');
    expect(result.recordsImported).toBe(0); // seeded id already present
    expect(result.cyclesImported).toBe(1);
    expect(result.profileImported).toBe(true);

    expect(await db.records.count()).toBe(2);
    expect(((decryptRecord((await db.records.get(seeded.id))!)).data as NoteData).content).toBe('local edit');
  });

  it('merge into empty db imports everything', async () => {
    const result = await importData(blobText, BACKUP_PW, 'merge');
    expect(result).toEqual({ recordsImported: 1, cyclesImported: 1, profileImported: true });
  });

  it('rejects files without a valid manifest', async () => {
    await expect(importData('{"foo":1}', BACKUP_PW, 'merge')).rejects.toThrow(
      'Invalid or unsupported backup file format'
    );
  });

  describe('hand-made payloads', () => {
    async function backupOf(payload: unknown): Promise<string> {
      const sealed = await sealWithPassword(JSON.stringify(payload), BACKUP_PW);
      return JSON.stringify({ manifest: { version: 1, exportedAt: Date.now() }, ...sealed });
    }
    const emptySettings = { sessionTimeout: 1, periodReminderEnabled: false, periodReminderDays: 3 };

    let deletedBackup: string;
    let deleted: HealthRecord;
    beforeAll(async () => {
      deleted = { ...note('DELETED-CONTENT'), type: 'mood', tags: ['x'], deletedAt: 1700000009999 };
      deletedBackup = await backupOf({ records: [deleted], cycles: [], profile: null, settings: emptySettings });
    });

    for (const strategy of ['merge', 'replace'] as const) {
      it(`${strategy}: soft-deleted record with content is stored as a tombstone`, async () => {
        const result = await importData(deletedBackup, BACKUP_PW, strategy);
        expect(result.recordsImported).toBe(1);
        const stored = decryptRecord((await db.records.get(deleted.id))!);
        expect(stored.data).toEqual({});
        expect(stored.tags).toEqual([]);
        expect(stored.type).toBe('note');
        expect(stored.deletedAt).toBe(deleted.deletedAt);
        expect(JSON.stringify(stored)).not.toContain('DELETED-CONTENT');
      });
    }

    it('replace with a record lacking id rejects and clears nothing', async () => {
      await db.records.put(encryptRecord(seeded));
      await db.cycles.put(encryptCycleData(cycle));
      await db.userProfile.put(encryptUserProfile(profile));
      const bad = await backupOf({ records: [{ type: 'note', data: {} }], cycles: [], profile: null, settings: emptySettings });
      await expect(importData(bad, BACKUP_PW, 'replace')).rejects.toThrow('Backup file contents are invalid');
      expect(await db.records.count()).toBe(1);
      expect(await db.cycles.count()).toBe(1);
      expect(await db.userProfile.count()).toBe(1);
    });

    it('replace with non-array records rejects and clears nothing', async () => {
      await db.records.put(encryptRecord(seeded));
      const bad = await backupOf({ records: 'nope', cycles: [], profile: null, settings: emptySettings });
      await expect(importData(bad, BACKUP_PW, 'replace')).rejects.toThrow('Backup file contents are invalid');
      expect(await db.records.count()).toBe(1);
    });

    it('parseManifest accepts old manifests carrying counts', () => {
      const old = JSON.stringify({
        manifest: { version: 1, exportedAt: 1, recordCount: 3, cycleCount: 2, hasProfile: true },
      });
      expect(parseManifest(old)).toEqual({ version: 1, exportedAt: 1, recordCount: 3, cycleCount: 2, hasProfile: true });
    });
  });
});
