import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  const date = new Date(year, month, 1);
  const monthYear = format(date, 'MMMM yyyy');

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{monthYear}</h2>
        <button
          onClick={onToday}
          className="px-2 py-1 text-xs font-medium text-rose-600 bg-rose-50 rounded-md hover:bg-rose-100 transition-colors"
        >
          Today
        </button>
      </div>

      <button
        onClick={onNextMonth}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
