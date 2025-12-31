import type { CycleData, CyclePrediction, UserProfile } from './types';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate weighted average with exponential recency bias
 * More recent values get higher weights
 */
function calculateWeightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Exponential weights: most recent gets highest weight
  const weights = values.map((_, i) => Math.pow(1.5, values.length - 1 - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate standard deviation for confidence assessment
 */
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Determine confidence level based on data quality
 */
function determineConfidence(
  cycleCount: number,
  stdDev: number
): 'low' | 'medium' | 'high' {
  if (cycleCount >= 6 && stdDev < 2) {
    return 'high';
  }
  if (cycleCount >= 3 && stdDev < 4) {
    return 'medium';
  }
  return 'low';
}

// ============================================
// MAIN PREDICTION FUNCTIONS
// ============================================

export interface PredictionInput {
  cycles: CycleData[];
  profile: UserProfile;
}

/**
 * Predict the next menstrual cycle based on historical data
 *
 * Algorithm:
 * 1. Uses last 6-12 cycles for prediction (configurable)
 * 2. Applies weighted moving average with recency bias
 * 3. Calculates confidence based on cycle consistency
 */
export function predictNextCycle(input: PredictionInput): CyclePrediction | null {
  const { cycles, profile } = input;

  // Filter cycles with valid cycle lengths and get most recent
  const completedCycles = cycles
    .filter((c) => c.cycleLength && c.cycleLength > 0)
    .slice(-12);

  // Get cycle and period lengths
  const cycleLengths = completedCycles.map((c) => c.cycleLength!);
  const periodLengths = completedCycles
    .filter((c) => c.periodLength && c.periodLength > 0)
    .map((c) => c.periodLength!);

  // Calculate averages with fallbacks
  const avgCycleLength =
    cycleLengths.length > 0
      ? calculateWeightedAverage(cycleLengths)
      : profile.averageCycleLength || DEFAULT_CYCLE_LENGTH;

  const avgPeriodLength =
    periodLengths.length > 0
      ? calculateWeightedAverage(periodLengths)
      : profile.averagePeriodLength || DEFAULT_PERIOD_LENGTH;

  // Get current cycle start date
  const currentCycle = cycles[cycles.length - 1];
  if (!currentCycle) {
    return null;
  }

  const currentCycleStart = currentCycle.startDate;

  // Calculate predictions
  const nextPeriodStart = currentCycleStart + avgCycleLength * MS_PER_DAY;
  const nextPeriodEnd = nextPeriodStart + avgPeriodLength * MS_PER_DAY;

  // Determine confidence
  const stdDev = calculateStdDev(cycleLengths);
  const confidence = determineConfidence(completedCycles.length, stdDev);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    cycleLength: avgCycleLength,
    periodLength: avgPeriodLength,
    confidence,
    basedOnCycles: completedCycles.length,
  };
}

/**
 * Get the current day of the cycle (1-indexed)
 */
export function getCurrentCycleDay(cycleStartDate: number): number {
  const today = startOfDay(Date.now());
  const cycleStart = startOfDay(cycleStartDate);
  const daysDiff = Math.floor((today - cycleStart) / MS_PER_DAY);
  return daysDiff + 1;
}

/**
 * Get days until the next predicted period
 */
export function getDaysUntilNextPeriod(
  currentCycleStart: number,
  avgCycleLength: number
): number {
  const cycleDay = getCurrentCycleDay(currentCycleStart);
  return Math.max(0, avgCycleLength - cycleDay + 1);
}

/**
 * Check if a given date falls within the predicted period
 */
export function isDateInPredictedPeriod(
  date: number,
  prediction: CyclePrediction
): boolean {
  const dateStart = startOfDay(date);
  const periodStart = startOfDay(prediction.nextPeriodStart);
  const periodEnd = startOfDay(prediction.nextPeriodEnd);

  return dateStart >= periodStart && dateStart <= periodEnd;
}

/**
 * Get the cycle day for a specific date
 */
export function getCycleDayForDate(
  date: number,
  cycleStartDate: number
): number {
  const dateStart = startOfDay(date);
  const cycleStart = startOfDay(cycleStartDate);
  const daysDiff = Math.floor((dateStart - cycleStart) / MS_PER_DAY);
  return daysDiff + 1;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get the start of day (midnight) for a timestamp
 */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Check if two timestamps are on the same day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  return startOfDay(timestamp1) === startOfDay(timestamp2);
}

/**
 * Get date range for a month (first day to last day)
 */
export function getMonthDateRange(
  year: number,
  month: number
): { start: number; end: number } {
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

/**
 * Calculate statistics for cycle history
 */
export interface CycleStatistics {
  averageCycleLength: number;
  averagePeriodLength: number;
  shortestCycle: number;
  longestCycle: number;
  cycleLengthVariation: number;
  totalCyclesTracked: number;
}

export function calculateCycleStatistics(cycles: CycleData[]): CycleStatistics | null {
  const completedCycles = cycles.filter(
    (c) => c.cycleLength && c.cycleLength > 0
  );

  if (completedCycles.length === 0) {
    return null;
  }

  const cycleLengths = completedCycles.map((c) => c.cycleLength!);
  const periodLengths = completedCycles
    .filter((c) => c.periodLength && c.periodLength > 0)
    .map((c) => c.periodLength!);

  const avgCycleLength = calculateWeightedAverage(cycleLengths);
  const avgPeriodLength =
    periodLengths.length > 0
      ? calculateWeightedAverage(periodLengths)
      : DEFAULT_PERIOD_LENGTH;

  return {
    averageCycleLength: avgCycleLength,
    averagePeriodLength: avgPeriodLength,
    shortestCycle: Math.min(...cycleLengths),
    longestCycle: Math.max(...cycleLengths),
    cycleLengthVariation: calculateStdDev(cycleLengths),
    totalCyclesTracked: completedCycles.length,
  };
}
