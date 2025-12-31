import { useState, useCallback, useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { addMonths, subMonths } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarLegend } from './CalendarLegend';
import { usePredictions } from '../../hooks/usePredictions';
import { useProfile } from '../../hooks/useProfile';
import { useRecords } from '../../hooks/useRecords';
import type { DayData } from '../../lib/types';

interface CalendarProps {
  onDaySelect: (day: DayData) => void;
}

export function Calendar({ onDaySelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const { profile } = useProfile();
  const { records } = useRecords();
  const { getMonthData, currentCycleDay, daysUntilPeriod, prediction } = usePredictions();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthData = useMemo(() => {
    return getMonthData(year, month, records);
  }, [year, month, records, getMonthData]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((date) => subMonths(date, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((date) => addMonths(date, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMonth,
    onSwipedRight: handlePrevMonth,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  const weekStartsOn = profile?.weekStartsOn ?? 0;

  return (
    <div className="bg-white" {...swipeHandlers}>
      {/* Cycle status bar */}
      {(currentCycleDay || daysUntilPeriod !== null) && (
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center justify-between text-sm">
            {currentCycleDay && (
              <div className="text-rose-700">
                <span className="font-semibold">Day {currentCycleDay}</span>
                <span className="text-rose-600 ml-1">of your cycle</span>
              </div>
            )}
            {daysUntilPeriod !== null && daysUntilPeriod > 0 && (
              <div className="text-rose-600">
                {daysUntilPeriod === 1
                  ? 'Period expected tomorrow'
                  : `Period in ${daysUntilPeriod} days`}
                {prediction && (
                  <span className="text-xs text-rose-400 ml-1">
                    ({prediction.confidence} confidence)
                  </span>
                )}
              </div>
            )}
            {daysUntilPeriod === 0 && (
              <div className="text-rose-600 font-medium">
                Period expected today
              </div>
            )}
          </div>
        </div>
      )}

      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <CalendarGrid
        days={monthData.days}
        weekStartsOn={weekStartsOn}
        onDayClick={onDaySelect}
      />

      <CalendarLegend />
    </div>
  );
}
