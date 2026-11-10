import { useState, useCallback } from 'react';
import { addMonths, subMonths } from 'date-fns';

/** The month currently shown by the calendar, plus the ways to move it. */
export function useCalendarMonth() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const prevMonth = useCallback(() => setCurrentDate((date) => subMonths(date, 1)), []);
  const nextMonth = useCallback(() => setCurrentDate((date) => addMonths(date, 1)), []);
  const today = useCallback(() => setCurrentDate(new Date()), []);
  const setMonth = useCallback((month: number) => {
    setCurrentDate((date) => new Date(date.getFullYear(), month, 1));
  }, []);
  const setYear = useCallback((year: number) => {
    setCurrentDate((date) => new Date(year, date.getMonth(), 1));
  }, []);

  return {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
    prevMonth,
    nextMonth,
    today,
    setMonth,
    setYear,
  };
}
