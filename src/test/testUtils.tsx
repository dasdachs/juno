import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import type { CycleData, HealthRecord, UserProfile, RecordType } from '../lib/types';

// Re-export everything from testing-library
export * from '@testing-library/react';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: ReactNode[];
}

export function customRender(ui: ReactNode, options: CustomRenderOptions = {}) {
  const { providers = [], ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return providers.reduce<ReactNode>(
      (_acc, Provider) => Provider,
      children
    ) as JSX.Element;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock data factories
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createMockCycle(overrides: Partial<CycleData> = {}): CycleData {
  const now = Date.now();
  return {
    id: `test-cycle-${Math.random().toString(36).slice(2)}`,
    cycleNumber: 1,
    startDate: now - 7 * MS_PER_DAY,
    ...overrides,
  };
}

export function createMockRecord(
  type: RecordType = 'period',
  overrides: Partial<HealthRecord> = {}
): HealthRecord {
  const now = Date.now();
  const baseRecord = {
    id: `test-record-${Math.random().toString(36).slice(2)}`,
    type,
    createdAt: now,
    updatedAt: now,
    tags: [],
    ...overrides,
  };

  // Add appropriate data based on type
  if (!overrides.data) {
    switch (type) {
      case 'period':
        baseRecord.data = { date: now, flowIntensity: 'medium' as const };
        break;
      case 'mood':
        baseRecord.data = { date: now, moods: ['calm' as const] };
        break;
      case 'symptom':
        baseRecord.data = { date: now, symptoms: [{ type: 'cramps' as const, severity: 2 as const }] };
        break;
      case 'intimacy':
        baseRecord.data = { date: now, type: 'protected' as const };
        break;
      case 'note':
        baseRecord.data = { date: now, content: 'Test note' };
        break;
    }
  }

  return baseRecord as HealthRecord;
}

export function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const now = Date.now();
  return {
    id: 'primary',
    weekStartsOn: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Date helpers for tests
export function daysAgo(days: number): number {
  return Date.now() - days * MS_PER_DAY;
}

export function daysFromNow(days: number): number {
  return Date.now() + days * MS_PER_DAY;
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Create multiple cycles for testing predictions
export function createCycleHistory(
  count: number,
  options: {
    cycleLength?: number;
    periodLength?: number;
    variation?: number;
  } = {}
): CycleData[] {
  const { cycleLength = 28, periodLength = 5, variation = 0 } = options;
  const cycles: CycleData[] = [];
  let currentDate = daysAgo(count * cycleLength);

  for (let i = 0; i < count; i++) {
    const actualCycleLength = cycleLength + (variation ? Math.floor(Math.random() * variation * 2) - variation : 0);
    const actualPeriodLength = periodLength;

    cycles.push({
      id: `cycle-${i + 1}`,
      cycleNumber: i + 1,
      startDate: currentDate,
      cycleLength: i < count - 1 ? actualCycleLength : undefined, // Last cycle is ongoing
      periodLength: actualPeriodLength,
      periodEndDate: currentDate + actualPeriodLength * MS_PER_DAY,
      endDate: i < count - 1 ? currentDate + actualCycleLength * MS_PER_DAY : undefined,
    });

    currentDate += actualCycleLength * MS_PER_DAY;
  }

  return cycles;
}
