import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onMonthChange,
  onYearChange,
}: CalendarHeaderProps) {
  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 10; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-rose-500 font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={index} value={index}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-rose-500 font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          {yearRange.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          onClick={onToday}
          className="px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-gray-800 rounded-md hover:bg-rose-100 dark:hover:bg-gray-700 transition-colors duration-200 ml-1"
        >
          Today
        </button>
      </div>

      <button
        onClick={onNextMonth}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}
