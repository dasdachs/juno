import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';
import {
  generateId,
  encryptCycleData,
  decryptCycleData,
  isUnlocked,
} from '../lib/crypto';
import type { CycleData } from '../lib/types';
import { startOfDay } from '../lib/predictions';

interface UseCyclesReturn {
  cycles: CycleData[];
  currentCycle: CycleData | null;
  isLoading: boolean;
  error: Error | null;
  startNewCycle: (date: number) => Promise<CycleData>;
  endPeriod: (date: number) => Promise<void>;
  updateCycle: (id: string, data: Partial<CycleData>) => Promise<void>;
  deleteCycle: (id: string) => Promise<void>;
  getCycle: (id: string) => Promise<CycleData | null>;
  refresh: () => Promise<void>;
}

export function useCycles(): UseCyclesReturn {
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCycles = useCallback(async () => {
    if (!isUnlocked()) {
      setCycles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const encryptedCycles = await db.cycles.orderBy('startDate').toArray();
      const decryptedCycles = encryptedCycles.map((encrypted) =>
        decryptCycleData(encrypted)
      );

      setCycles(decryptedCycles);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load cycles'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const currentCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;

  const startNewCycle = useCallback(
    async (date: number): Promise<CycleData> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const normalizedDate = startOfDay(date);

      // If there's a previous cycle, close it
      if (currentCycle && !currentCycle.endDate) {
        const previousCycleLength = Math.floor(
          (normalizedDate - currentCycle.startDate) / (24 * 60 * 60 * 1000)
        );

        const updatedPreviousCycle: CycleData = {
          ...currentCycle,
          endDate: normalizedDate,
          cycleLength: previousCycleLength,
        };

        const encryptedPrevious = encryptCycleData(updatedPreviousCycle);
        await db.cycles.put(encryptedPrevious);
      }

      // Create new cycle
      const newCycle: CycleData = {
        id: generateId(),
        cycleNumber: cycles.length + 1,
        startDate: normalizedDate,
      };

      const encrypted = encryptCycleData(newCycle);
      await db.cycles.put(encrypted);

      await loadCycles();
      return newCycle;
    },
    [currentCycle, cycles.length, loadCycles]
  );

  const endPeriod = useCallback(
    async (date: number): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      if (!currentCycle) {
        throw new Error('No active cycle');
      }

      const normalizedDate = startOfDay(date);
      const periodLength = Math.floor(
        (normalizedDate - currentCycle.startDate) / (24 * 60 * 60 * 1000)
      ) + 1;

      const updatedCycle: CycleData = {
        ...currentCycle,
        periodEndDate: normalizedDate,
        periodLength,
      };

      const encrypted = encryptCycleData(updatedCycle);
      await db.cycles.put(encrypted);

      await loadCycles();
    },
    [currentCycle, loadCycles]
  );

  const updateCycle = useCallback(
    async (id: string, data: Partial<CycleData>): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const existingEncrypted = await db.cycles.get(id);
      if (!existingEncrypted) {
        throw new Error('Cycle not found');
      }

      const existing = decryptCycleData(existingEncrypted);
      const updated: CycleData = { ...existing, ...data };

      const encrypted = encryptCycleData(updated);
      await db.cycles.put(encrypted);

      await loadCycles();
    },
    [loadCycles]
  );

  const deleteCycle = useCallback(
    async (id: string): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      await db.cycles.delete(id);
      await loadCycles();
    },
    [loadCycles]
  );

  const getCycle = useCallback(async (id: string): Promise<CycleData | null> => {
    if (!isUnlocked()) {
      return null;
    }

    const encrypted = await db.cycles.get(id);
    if (!encrypted) {
      return null;
    }

    return decryptCycleData(encrypted);
  }, []);

  return {
    cycles,
    currentCycle,
    isLoading,
    error,
    startNewCycle,
    endPeriod,
    updateCycle,
    deleteCycle,
    getCycle,
    refresh: loadCycles,
  };
}
