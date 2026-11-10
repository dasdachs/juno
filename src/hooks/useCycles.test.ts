import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCycles } from './useCycles';
import { initCrypto, createVault, lock, decryptCycleData, encryptCycleData, generateId } from '../lib/crypto';
import { db, clearAllData } from '../lib/db';

const DAY = 24 * 60 * 60 * 1000;

describe('useCycles tombstones (real crypto + db)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('cycles hook password');
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await db.cycles.clear();
  });

  it('deleteCycle keeps an encrypted tombstone row and hides the cycle', async () => {
    const { result } = renderHook(() => useCycles());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let id = '';
    await act(async () => {
      id = (await result.current.startNewCycle(1700000000000)).id;
    });
    await waitFor(() => expect(result.current.cycles).toHaveLength(1));
    expect(decryptCycleData((await db.cycles.get(id))!).startDate).toBeGreaterThan(0);

    await act(async () => {
      await result.current.deleteCycle(id);
    });

    const row = await db.cycles.get(id);
    expect(row).toBeDefined();
    const stored = decryptCycleData(row!);
    expect(stored).toEqual({ id, cycleNumber: 0, startDate: 0, deletedAt: expect.any(Number) });
    await waitFor(() => expect(result.current.cycles).toHaveLength(0));
    expect(result.current.currentCycle).toBeNull();
  });

  it('an undecryptable cycle row does not empty the list', async () => {
    await db.cycles.put(encryptCycleData({ id: generateId(), cycleNumber: 1, startDate: 1700000000000 }));
    await db.cycles.put(
      encryptCycleData({ id: generateId(), cycleNumber: 2, startDate: 1700000000000 + 30 * DAY })
    );
    await db.cycles.put({ id: 'garbage', nonce: 'AAAA', ciphertext: 'AAAA', version: 3 } as never);

    const { result } = renderHook(() => useCycles());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.cycles.map((c) => c.cycleNumber)).toEqual([1, 2]);
  });
});
