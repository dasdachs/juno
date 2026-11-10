import { useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { CalendarLegend } from './CalendarLegend';
import { CycleStatus } from './CycleStatus';
import { useCalendarMonth } from './useCalendarMonth';
import { usePredictions } from '../../hooks/usePredictions';
import { useProfile } from '../../hooks/useProfile';
import { useRecords } from '../../hooks/useRecords';
import type { DayData } from '../../lib/types';

interface CalendarProps {
  onDaySelect: (day: DayData) => void;
}

export function Calendar({ onDaySelect }: CalendarProps) {
  const view = useCalendarMonth();
  const { profile } = useProfile();
  const { records } = useRecords();
  const { getMonthData, currentCycleDay, daysUntilPeriod, prediction } = usePredictions();

  const monthData = useMemo(() => {
    return getMonthData(view.year, view.month, records);
  }, [view.year, view.month, records, getMonthData]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: view.nextMonth,
    onSwipedRight: view.prevMonth,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  return (
    <div className="stack" {...swipeHandlers}>
      <CycleStatus
        currentCycleDay={currentCycleDay}
        daysUntilPeriod={daysUntilPeriod}
        confidence={prediction?.confidence}
      />

      <CalendarHeader
        year={view.year}
        month={view.month}
        onPrevMonth={view.prevMonth}
        onNextMonth={view.nextMonth}
        onToday={view.today}
        onMonthChange={view.setMonth}
        onYearChange={view.setYear}
      />

      <CalendarGrid
        days={monthData.days}
        weekStartsOn={profile?.weekStartsOn ?? 0}
        onDayClick={onDaySelect}
      />

      <CalendarLegend />
    </div>
  );
}
