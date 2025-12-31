import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';
import { encryptRecord, decryptRecord, generateId, isUnlocked } from '../lib/crypto';
import type { HealthRecord, RecordType, EncryptedRecord } from '../lib/types';

interface UseRecordsResult {
  records: HealthRecord[];
  isLoading: boolean;
  error: string | null;
  addRecord: (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<HealthRecord>;
  updateRecord: (id: string, updates: Partial<HealthRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecord: (id: string) => Promise<HealthRecord | null>;
  getRecordsByDate: (date: number) => HealthRecord[];
  refresh: () => Promise<void>;
}

interface UseRecordsOptions {
  type?: RecordType;
  search?: string;
  dateRange?: {
    start: number;
    end: number;
  };
}

export function useRecords(options: UseRecordsOptions = {}): UseRecordsResult {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!isUnlocked()) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let encryptedRecords: EncryptedRecord[];

      if (options.type) {
        encryptedRecords = await db.records
          .where('category')
          .equals(options.type)
          .reverse()
          .sortBy('timestamp');
      } else {
        encryptedRecords = await db.records.orderBy('timestamp').reverse().toArray();
      }

      const decryptedRecords = encryptedRecords
        .map((er) => {
          try {
            return decryptRecord(er);
          } catch {
            // Skip records that can't be decrypted
            return null;
          }
        })
        .filter((r): r is HealthRecord => r !== null && !r.deletedAt);

      // Filter by search term if provided
      let filteredRecords = decryptedRecords;
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredRecords = filteredRecords.filter((record) => {
          const dataStr = JSON.stringify(record.data).toLowerCase();
          const tagsStr = record.tags.join(' ').toLowerCase();
          return dataStr.includes(searchLower) || tagsStr.includes(searchLower);
        });
      }

      // Filter by date range if provided
      if (options.dateRange) {
        const { start, end } = options.dateRange;
        filteredRecords = filteredRecords.filter((record) => {
          // Get the date from record data
          const recordData = record.data as { date?: number };
          if (recordData.date) {
            return recordData.date >= start && recordData.date <= end;
          }
          return false;
        });
      }

      setRecords(filteredRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  }, [options.type, options.search, options.dateRange]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = useCallback(
    async (
      recordData: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<HealthRecord> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const now = Date.now();
      const record: HealthRecord = {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        ...recordData,
      };

      const encrypted = encryptRecord(record);
      await db.records.put(encrypted);
      await loadRecords();

      return record;
    },
    [loadRecords]
  );

  const updateRecord = useCallback(
    async (id: string, updates: Partial<HealthRecord>): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const encrypted = await db.records.get(id);
      if (!encrypted) {
        throw new Error('Record not found');
      }

      const record = decryptRecord(encrypted);
      const updatedRecord: HealthRecord = {
        ...record,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now(),
      };

      const newEncrypted = encryptRecord(updatedRecord);
      await db.records.put(newEncrypted);
      await loadRecords();
    },
    [loadRecords]
  );

  const deleteRecord = useCallback(
    async (id: string): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const encrypted = await db.records.get(id);
      if (!encrypted) {
        throw new Error('Record not found');
      }

      const record = decryptRecord(encrypted);
      const deletedRecord: HealthRecord = {
        ...record,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newEncrypted = encryptRecord(deletedRecord);
      await db.records.put(newEncrypted);
      await loadRecords();
    },
    [loadRecords]
  );

  const getRecord = useCallback(async (id: string): Promise<HealthRecord | null> => {
    if (!isUnlocked()) {
      return null;
    }

    const encrypted = await db.records.get(id);
    if (!encrypted) {
      return null;
    }

    try {
      return decryptRecord(encrypted);
    } catch {
      return null;
    }
  }, []);

  const getRecordsByDate = useCallback(
    (date: number): HealthRecord[] => {
      // Normalize to start of day
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const targetTimestamp = targetDate.getTime();

      const endOfDay = targetTimestamp + 24 * 60 * 60 * 1000 - 1;

      return records.filter((record) => {
        const recordData = record.data as { date?: number };
        if (recordData.date) {
          return recordData.date >= targetTimestamp && recordData.date <= endOfDay;
        }
        return false;
      });
    },
    [records]
  );

  return {
    records,
    isLoading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    getRecordsByDate,
    refresh: loadRecords,
  };
}
