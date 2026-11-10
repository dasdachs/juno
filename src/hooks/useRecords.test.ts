import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecords } from './useRecords';
import { initCrypto, createVault, lock, decryptRecord } from '../lib/crypto';
import { db, clearAllData } from '../lib/db';
import type { NoteData } from '../lib/types';

const note = (content: string, date = 1700000000000) => ({
  type: 'note' as const,
  data: { date, title: 't', content } as NoteData,
  tags: [] as string[],
});

describe('useRecords (real crypto + db)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault('hook test password');
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  beforeEach(async () => {
    await db.records.clear();
  });

  it('stores wrappers with no plaintext metadata and loads/filters after decryption', async () => {
    const { result } = renderHook(() => useRecords({ type: 'note' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addRecord(note('hello world'));
    });

    const rows = await db.records.toArray();
    expect(Object.keys(rows[0]).sort()).toEqual(['ciphertext', 'id', 'nonce', 'version']);
    await waitFor(() => expect(result.current.records.length).toBe(1));

    const { result: other } = renderHook(() => useRecords({ type: 'mood' }));
    await waitFor(() => expect(other.current.isLoading).toBe(false));
    expect(other.current.records).toHaveLength(0);
  });

  it('sorts newest-updated first', async () => {
    const { result } = renderHook(() => useRecords());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let a!: { id: string };
    await act(async () => {
      a = await result.current.addRecord({ ...note('first'), updatedAt: 100 } as never);
      await result.current.addRecord({ ...note('second'), updatedAt: 200 } as never);
    });
    await waitFor(() => expect(result.current.records).toHaveLength(2));
    expect((result.current.records[0].data as NoteData).content).toBe('second');
    expect(a.id).toBeDefined();
  });

  it('deleteRecord leaves a scrubbed tombstone and hides the record', async () => {
    const { result } = renderHook(() => useRecords());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let id = '';
    await act(async () => {
      id = (await result.current.addRecord({ ...note('to be deleted'), tags: ['private'] })).id;
    });
    await act(async () => {
      await result.current.deleteRecord(id);
    });

    const row = (await db.records.get(id))!;
    expect(row.version).toBe(3);
    const stored = decryptRecord(row);
    expect(stored.deletedAt).toEqual(expect.any(Number));
    expect(stored.data).toEqual({});
    expect(stored.tags).toEqual([]);
    expect(JSON.stringify(stored)).not.toContain('to be deleted');
    await waitFor(() => expect(result.current.records).toHaveLength(0));
  });
});
