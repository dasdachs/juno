import { useMemo } from 'react';
import { useCycles } from './useCycles';
import { useProfile } from './useProfile';
import {
  predictNextCycle,
  getCurrentCycleDay,
  getDaysUntilNextPeriod,
  calculateCycleStatistics,
  startOfDay,
  isDateInPredictedPeriod,
  getCycleDayForDate,
} from '../lib/predictions';
import type { CycleStatistics } from '../lib/predictions';
import type {
  CyclePrediction,
  DayData,
  CalendarMonthData,
  FlowIntensity,
  HealthRecord,
} from '../lib/types';

interface UsePredictionsReturn {
  prediction: CyclePrediction | null;
  currentCycleDay: number | null;
  daysUntilPeriod: number | null;
  statistics: CycleStatistics | null;
  isLoading: boolean;
  getMonthData: (
    year: number,
    month: number,
    records: HealthRecord[]
  ) => CalendarMonthData;
}

export function usePredictions(): UsePredictionsReturn {
  const { cycles, currentCycle, isLoading: cyclesLoading } = useCycles();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = cyclesLoading || profileLoading;

  const prediction = useMemo(() => {
    if (!profile || cycles.length === 0) {
      return null;
    }

    return predictNextCycle({ cycles, profile });
  }, [cycles, profile]);

  const currentCycleDay = useMemo(() => {
    if (!currentCycle) {
      return null;
    }

    return getCurrentCycleDay(currentCycle.startDate);
  }, [currentCycle]);

  const daysUntilPeriod = useMemo(() => {
    if (!currentCycle || !prediction) {
      return null;
    }

    return getDaysUntilNextPeriod(currentCycle.startDate, prediction.cycleLength);
  }, [currentCycle, prediction]);

  const statistics = useMemo(() => {
    return calculateCycleStatistics(cycles);
  }, [cycles]);

  const getMonthData = useMemo(() => {
    return (
      year: number,
      month: number,
      records: HealthRecord[]
    ): CalendarMonthData => {
      const days: DayData[] = [];

      // Get the first day of the month
      const firstDayOfMonth = new Date(year, month, 1);

      // Get the day of week for the first day (0 = Sunday)
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const weekStartsOn = profile?.weekStartsOn ?? 0;

      // Calculate days from previous month to show
      let daysFromPrevMonth = firstDayOfWeek - weekStartsOn;
      if (daysFromPrevMonth < 0) daysFromPrevMonth += 7;

      // Start date (may be in previous month)
      const startDate = new Date(year, month, 1 - daysFromPrevMonth);

      // Calculate total days to show (6 weeks = 42 days)
      const totalDays = 42;

      const today = startOfDay(Date.now());

      for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const timestamp = startOfDay(date.getTime());

        const isToday = timestamp === today;
        const isCurrentMonth = date.getMonth() === month;

        // Check if this date is in a period
        let isPeriod = false;
        let flowIntensity: FlowIntensity | undefined;
        let hasIntimacy = false;
        let hasSymptoms = false;
        let hasMood = false;
        let hasNote = false;

        // Check records for this date
        for (const record of records) {
          const recordDate = startOfDay(
            'date' in record.data ? (record.data as { date: number }).date : 0
          );

          if (recordDate === timestamp) {
            switch (record.type) {
              case 'period':
                isPeriod = true;
                flowIntensity = (record.data as { flowIntensity: FlowIntensity })
                  .flowIntensity;
                break;
              case 'intimacy':
                hasIntimacy = true;
                break;
              case 'symptom':
                hasSymptoms = true;
                break;
              case 'mood':
                hasMood = true;
                break;
              case 'note':
                hasNote = true;
                break;
            }
          }
        }

        // Check if this date is in predicted period
        let isPredictedPeriod = false;
        if (prediction && !isPeriod) {
          isPredictedPeriod = isDateInPredictedPeriod(timestamp, prediction);
        }

        // Calculate cycle day for this date
        let cycleDay: number | undefined;
        if (currentCycle) {
          const day = getCycleDayForDate(timestamp, currentCycle.startDate);
          if (day > 0) {
            cycleDay = day;
          }
        }

        days.push({
          date,
          timestamp,
          isToday,
          isCurrentMonth,
          isPeriod,
          isPredictedPeriod,
          flowIntensity,
          hasIntimacy,
          hasSymptoms,
          hasMood,
          hasNote,
          cycleDay,
        });
      }

      return {
        year,
        month,
        days,
        currentCycleDay: currentCycleDay ?? undefined,
        daysUntilPeriod: daysUntilPeriod ?? undefined,
        prediction: prediction ?? undefined,
      };
    };
  }, [profile, currentCycle, prediction, currentCycleDay, daysUntilPeriod]);

  return {
    prediction,
    currentCycleDay,
    daysUntilPeriod,
    statistics,
    isLoading,
    getMonthData,
  };
}
