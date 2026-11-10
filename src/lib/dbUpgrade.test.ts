import { describe, it, expect, afterAll } from 'vitest';
import Dexie from 'dexie';
import { db, clearAllData } from './db';

describe('db schema v2 upgrade', () => {
  afterAll(async () => {
    await clearAllData();
  });

  it('strips plaintext metadata fields from rows written under schema v1', async () => {
    db.close();
    await Dexie.delete('JunoVault');

    const legacy = new Dexie('JunoVault');
    legacy.version(1).stores({
      records: 'id, category, timestamp, cycleId',
      keyStore: 'id',
      settings: 'id',
      userProfile: 'id',
      cycles: 'id, startDate',
    });
    await legacy.open();
    await legacy.table('records').bulkPut([
      { id: 'r1', nonce: 'n1', ciphertext: 'c1', version: 2, category: 'period', timestamp: 111, cycleId: 'cy1' },
      { id: 'r2', nonce: 'n2', ciphertext: 'c2', version: 2, category: 'note', timestamp: 222 },
    ]);
    await legacy.table('cycles').put({ id: 'cy1', nonce: 'n3', ciphertext: 'c3', version: 2, startDate: 999 });
    await legacy.table('settings').put({ id: 'primary', sessionTimeout: 5000, lastUnlockedAt: 12345 });
    await legacy.table('userProfile').put({ id: 'primary', nonce: 'n4', ciphertext: 'c4', version: 2 });
    legacy.close();

    await db.open();

    const records = await db.records.toArray();
    expect(records).toHaveLength(2);
    expect(records.find((r) => r.id === 'r1')).toEqual({ id: 'r1', nonce: 'n1', ciphertext: 'c1', version: 2 });
    expect(records.find((r) => r.id === 'r2')).toEqual({ id: 'r2', nonce: 'n2', ciphertext: 'c2', version: 2 });

    expect(await db.cycles.toArray()).toEqual([{ id: 'cy1', nonce: 'n3', ciphertext: 'c3', version: 2 }]);

    const settings = (await db.settings.get('primary'))!;
    expect(settings).not.toHaveProperty('lastUnlockedAt');
    expect(settings.sessionTimeout).toBe(5000);

    expect(await db.userProfile.get('primary')).toEqual({ id: 'primary', nonce: 'n4', ciphertext: 'c4', version: 2 });

    // Plaintext indexes are gone
    expect(db.records.schema.indexes).toHaveLength(0);
    expect(db.cycles.schema.indexes).toHaveLength(0);
  });
});
