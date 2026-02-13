import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  predictNextCycle,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
  isDateInPredictedPeriod,
  getCycleDayForDate,
  startOfDay,
  isSameDay,
  getMonthDateRange,
  calculateCycleStatistics,
} from './predictions';
import type { CycleData, CyclePrediction, UserProfile } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Helper to create cycle data
function createCycle(
  cycleNumber: number,
  startDate: number,
  cycleLength?: number,
  periodLength?: number
): CycleData {
  return {
    id: `cycle-${cycleNumber}`,
    cycleNumber,
    startDate,
    cycleLength,
    periodLength,
    endDate: cycleLength ? startDate + cycleLength * MS_PER_DAY : undefined,
    periodEndDate: periodLength ? startDate + periodLength * MS_PER_DAY : undefined,
  };
}

// Helper to create profile
function createProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'primary',
    weekStartsOn: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('predictions', () => {
  describe('startOfDay', () => {
    it('should normalize timestamp to midnight', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45, 123);
      const normalized = startOfDay(date.getTime());
      const result = new Date(normalized);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should preserve the date', () => {
      const date = new Date(2024, 5, 20, 18, 45);
      const normalized = startOfDay(date.getTime());
      const result = new Date(normalized);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle midnight correctly', () => {
      const midnight = new Date(2024, 0, 15, 0, 0, 0, 0);
      const normalized = startOfDay(midnight.getTime());
      expect(normalized).toBe(midnight.getTime());
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day different times', () => {
      const date1 = new Date(2024, 0, 15, 9, 0).getTime();
      const date2 = new Date(2024, 0, 15, 18, 30).getTime();
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15).getTime();
      const date2 = new Date(2024, 0, 16).getTime();
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for same day in different months', () => {
      const date1 = new Date(2024, 0, 15).getTime();
      const date2 = new Date(2024, 1, 15).getTime();
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return true for exact same timestamp', () => {
      const timestamp = Date.now();
      expect(isSameDay(timestamp, timestamp)).toBe(true);
    });
  });

  describe('getMonthDateRange', () => {
    it('should return correct range for January', () => {
      const { start, end } = getMonthDateRange(2024, 0);
      const startDate = new Date(start);
      const endDate = new Date(end);

      expect(startDate.getMonth()).toBe(0);
      expect(startDate.getDate()).toBe(1);
      expect(endDate.getMonth()).toBe(0);
      expect(endDate.getDate()).toBe(31);
    });

    it('should handle February in leap year', () => {
      const { end } = getMonthDateRange(2024, 1);
      const endDate = new Date(end);

      expect(endDate.getMonth()).toBe(1);
      expect(endDate.getDate()).toBe(29);
    });

    it('should handle February in non-leap year', () => {
      const { end } = getMonthDateRange(2023, 1);
      const endDate = new Date(end);

      expect(endDate.getMonth()).toBe(1);
      expect(endDate.getDate()).toBe(28);
    });

    it('should handle December', () => {
      const { start, end } = getMonthDateRange(2024, 11);
      const startDate = new Date(start);
      const endDate = new Date(end);

      expect(startDate.getMonth()).toBe(11);
      expect(startDate.getDate()).toBe(1);
      expect(endDate.getMonth()).toBe(11);
      expect(endDate.getDate()).toBe(31);
    });

    it('should include end of day in end timestamp', () => {
      const { end } = getMonthDateRange(2024, 0);
      const endDate = new Date(end);

      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });
  });

  describe('getCurrentCycleDay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 1 on cycle start day', () => {
      const today = new Date(2024, 0, 15, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 15, 8, 0).getTime();
      expect(getCurrentCycleDay(cycleStart)).toBe(1);
    });

    it('should return correct day for past start date', () => {
      const today = new Date(2024, 0, 20, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 15).getTime();
      expect(getCurrentCycleDay(cycleStart)).toBe(6); // Days 15, 16, 17, 18, 19, 20
    });

    it('should handle month boundaries', () => {
      const today = new Date(2024, 1, 5, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 28).getTime();
      expect(getCurrentCycleDay(cycleStart)).toBe(9); // Jan 28-31 (4) + Feb 1-5 (5) = 9
    });
  });

  describe('getDaysUntilNextPeriod', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 1 when period is due tomorrow', () => {
      const today = new Date(2024, 0, 28, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 1).getTime();
      // Day 28 of 28-day cycle = 28 - 28 + 1 = 1 day until next period
      expect(getDaysUntilNextPeriod(cycleStart, 28)).toBe(1);
    });

    it('should return correct days remaining mid-cycle', () => {
      const today = new Date(2024, 0, 15, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 1).getTime();
      // Day 15 of 28-day cycle = 28 - 15 + 1 = 14 days remaining
      expect(getDaysUntilNextPeriod(cycleStart, 28)).toBe(14);
    });

    it('should return 0 when past due', () => {
      const today = new Date(2024, 1, 5, 12, 0);
      vi.setSystemTime(today);

      const cycleStart = new Date(2024, 0, 1).getTime();
      // Day 36 of 28-day cycle = max(0, 28 - 36 + 1) = 0
      expect(getDaysUntilNextPeriod(cycleStart, 28)).toBe(0);
    });
  });

  describe('getCycleDayForDate', () => {
    it('should return 1 for cycle start date', () => {
      const cycleStart = new Date(2024, 0, 1).getTime();
      expect(getCycleDayForDate(cycleStart, cycleStart)).toBe(1);
    });

    it('should return correct day for future date', () => {
      const cycleStart = new Date(2024, 0, 1).getTime();
      const day10 = new Date(2024, 0, 10).getTime();
      expect(getCycleDayForDate(day10, cycleStart)).toBe(10);
    });

    it('should handle different times on same day', () => {
      const cycleStart = new Date(2024, 0, 1, 0, 0).getTime();
      const laterThatDay = new Date(2024, 0, 1, 23, 59).getTime();
      expect(getCycleDayForDate(laterThatDay, cycleStart)).toBe(1);
    });

    it('should handle month boundaries', () => {
      const cycleStart = new Date(2024, 0, 28).getTime();
      const feb5 = new Date(2024, 1, 5).getTime();
      expect(getCycleDayForDate(feb5, cycleStart)).toBe(9);
    });
  });

  describe('isDateInPredictedPeriod', () => {
    const prediction: CyclePrediction = {
      nextPeriodStart: new Date(2024, 1, 1).getTime(),
      nextPeriodEnd: new Date(2024, 1, 5).getTime(),
      cycleLength: 28,
      periodLength: 5,
      confidence: 'medium',
      basedOnCycles: 3,
    };

    it('should return true for date within period', () => {
      const midPeriod = new Date(2024, 1, 3).getTime();
      expect(isDateInPredictedPeriod(midPeriod, prediction)).toBe(true);
    });

    it('should return true for first day of period', () => {
      const firstDay = new Date(2024, 1, 1).getTime();
      expect(isDateInPredictedPeriod(firstDay, prediction)).toBe(true);
    });

    it('should return true for last day of period', () => {
      const lastDay = new Date(2024, 1, 5).getTime();
      expect(isDateInPredictedPeriod(lastDay, prediction)).toBe(true);
    });

    it('should return false for date before period', () => {
      const before = new Date(2024, 0, 30).getTime();
      expect(isDateInPredictedPeriod(before, prediction)).toBe(false);
    });

    it('should return false for date after period', () => {
      const after = new Date(2024, 1, 10).getTime();
      expect(isDateInPredictedPeriod(after, prediction)).toBe(false);
    });

    it('should handle different times on boundary days', () => {
      const endOfLastDay = new Date(2024, 1, 5, 23, 59).getTime();
      expect(isDateInPredictedPeriod(endOfLastDay, prediction)).toBe(true);
    });
  });

  describe('predictNextCycle', () => {
    it('should return null with no cycles', () => {
      const result = predictNextCycle({
        cycles: [],
        profile: createProfile(),
      });
      expect(result).toBeNull();
    });

    it('should use profile defaults with no completed cycles', () => {
      const startDate = new Date(2024, 0, 1).getTime();
      const result = predictNextCycle({
        cycles: [createCycle(1, startDate)], // No cycleLength = incomplete
        profile: createProfile({ averageCycleLength: 30, averagePeriodLength: 6 }),
      });

      expect(result).not.toBeNull();
      expect(result?.cycleLength).toBe(30);
      expect(result?.periodLength).toBe(6);
    });

    it('should calculate prediction from single completed cycle', () => {
      const startDate = new Date(2024, 0, 1).getTime();
      const cycles = [
        createCycle(1, startDate, 28, 5),
        createCycle(2, startDate + 28 * MS_PER_DAY), // Current cycle
      ];

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result).not.toBeNull();
      expect(result?.cycleLength).toBe(28);
      expect(result?.periodLength).toBe(5);
      expect(result?.basedOnCycles).toBe(1);
    });

    it('should calculate weighted average from multiple cycles', () => {
      const baseDate = new Date(2024, 0, 1).getTime();
      const cycles = [
        createCycle(1, baseDate, 26, 4),
        createCycle(2, baseDate + 26 * MS_PER_DAY, 28, 5),
        createCycle(3, baseDate + 54 * MS_PER_DAY, 30, 6),
        createCycle(4, baseDate + 84 * MS_PER_DAY), // Current cycle
      ];

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result).not.toBeNull();
      expect(result?.basedOnCycles).toBe(3);
      // Weighted average calculation: oldest values get highest weight in this implementation
      // [26, 28, 30] with weights [2.25, 1.5, 1] = (26*2.25 + 28*1.5 + 30*1) / 4.75 = 27
      expect(result?.cycleLength).toBe(27);
    });

    it('should determine high confidence with 6+ consistent cycles', () => {
      const baseDate = new Date(2024, 0, 1).getTime();
      const cycles: CycleData[] = [];
      let currentDate = baseDate;

      // Create 7 cycles with consistent 28-day length
      for (let i = 0; i < 6; i++) {
        cycles.push(createCycle(i + 1, currentDate, 28, 5));
        currentDate += 28 * MS_PER_DAY;
      }
      cycles.push(createCycle(7, currentDate)); // Current cycle

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result?.confidence).toBe('high');
    });

    it('should determine medium confidence with 3-5 cycles', () => {
      const baseDate = new Date(2024, 0, 1).getTime();
      const cycles = [
        createCycle(1, baseDate, 28, 5),
        createCycle(2, baseDate + 28 * MS_PER_DAY, 28, 5),
        createCycle(3, baseDate + 56 * MS_PER_DAY, 29, 5),
        createCycle(4, baseDate + 85 * MS_PER_DAY), // Current cycle
      ];

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result?.confidence).toBe('medium');
    });

    it('should determine low confidence with variable cycles', () => {
      const baseDate = new Date(2024, 0, 1).getTime();
      const cycles = [
        createCycle(1, baseDate, 21, 4), // Short
        createCycle(2, baseDate + 21 * MS_PER_DAY, 35, 7), // Long
        createCycle(3, baseDate + 56 * MS_PER_DAY), // Current
      ];

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result?.confidence).toBe('low');
    });

    it('should calculate correct next period start date', () => {
      const startDate = new Date(2024, 0, 1).getTime();
      const cycles = [
        createCycle(1, startDate, 28, 5),
        createCycle(2, startDate + 28 * MS_PER_DAY), // Current cycle starts Jan 29
      ];

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      // Next period should be 28 days after Jan 29 = Feb 26
      const expectedNextStart = startDate + 28 * MS_PER_DAY + 28 * MS_PER_DAY;
      expect(result?.nextPeriodStart).toBe(expectedNextStart);
    });

    it('should use last 12 cycles maximum', () => {
      const baseDate = new Date(2024, 0, 1).getTime();
      const cycles: CycleData[] = [];
      let currentDate = baseDate;

      // Create 15 cycles
      for (let i = 0; i < 14; i++) {
        cycles.push(createCycle(i + 1, currentDate, 28, 5));
        currentDate += 28 * MS_PER_DAY;
      }
      cycles.push(createCycle(15, currentDate)); // Current cycle

      const result = predictNextCycle({
        cycles,
        profile: createProfile(),
      });

      expect(result?.basedOnCycles).toBe(12);
    });
  });

  describe('calculateCycleStatistics', () => {
    it('should return null with no completed cycles', () => {
      expect(calculateCycleStatistics([])).toBeNull();
    });

    it('should return null with only incomplete cycles', () => {
      const cycles = [createCycle(1, Date.now())]; // No cycleLength
      expect(calculateCycleStatistics(cycles)).toBeNull();
    });

    it('should calculate correct statistics for single cycle', () => {
      const cycles = [createCycle(1, Date.now(), 28, 5)];
      const stats = calculateCycleStatistics(cycles);

      expect(stats).not.toBeNull();
      expect(stats?.averageCycleLength).toBe(28);
      expect(stats?.averagePeriodLength).toBe(5);
      expect(stats?.shortestCycle).toBe(28);
      expect(stats?.longestCycle).toBe(28);
      expect(stats?.totalCyclesTracked).toBe(1);
    });

    it('should calculate correct statistics for multiple cycles', () => {
      const baseDate = Date.now();
      const cycles = [
        createCycle(1, baseDate, 26, 4),
        createCycle(2, baseDate + 26 * MS_PER_DAY, 28, 5),
        createCycle(3, baseDate + 54 * MS_PER_DAY, 30, 6),
      ];

      const stats = calculateCycleStatistics(cycles);

      expect(stats).not.toBeNull();
      expect(stats?.totalCyclesTracked).toBe(3);
      expect(stats?.shortestCycle).toBe(26);
      expect(stats?.longestCycle).toBe(30);
      expect(stats?.cycleLengthVariation).toBeGreaterThan(0);
    });

    it('should use default period length if not tracked', () => {
      const cycles = [
        createCycle(1, Date.now(), 28), // No periodLength
      ];

      const stats = calculateCycleStatistics(cycles);

      expect(stats?.averagePeriodLength).toBe(5); // Default
    });

    it('should calculate variation correctly', () => {
      const baseDate = Date.now();
      // Identical cycles should have 0 variation
      const cycles = [
        createCycle(1, baseDate, 28, 5),
        createCycle(2, baseDate + 28 * MS_PER_DAY, 28, 5),
        createCycle(3, baseDate + 56 * MS_PER_DAY, 28, 5),
      ];

      const stats = calculateCycleStatistics(cycles);

      expect(stats?.cycleLengthVariation).toBe(0);
    });

    it('should exclude incomplete cycles from statistics', () => {
      const baseDate = Date.now();
      const cycles = [
        createCycle(1, baseDate, 28, 5),
        createCycle(2, baseDate + 28 * MS_PER_DAY, 30, 5),
        createCycle(3, baseDate + 58 * MS_PER_DAY), // Incomplete - should be excluded
      ];

      const stats = calculateCycleStatistics(cycles);

      expect(stats?.totalCyclesTracked).toBe(2);
    });
  });
});
