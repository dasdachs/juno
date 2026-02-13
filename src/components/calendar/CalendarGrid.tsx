import { CalendarDay } from './CalendarDay';
import type { DayData } from '../../lib/types';

interface CalendarGridProps {
  days: DayData[];
  weekStartsOn: 0 | 1;
  onDayClick: (day: DayData) => void;
}

const WEEKDAY_LABELS_SUNDAY_START = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_MONDAY_START = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarGrid({ days, weekStartsOn, onDayClick }: CalendarGridProps) {
  const weekdayLabels =
    weekStartsOn === 0 ? WEEKDAY_LABELS_SUNDAY_START : WEEKDAY_LABELS_MONDAY_START;

  return (
    <div className="px-2 sm:px-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekdayLabels.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {days.map((day, index) => (
          <div key={index} className="bg-white dark:bg-gray-800">
            <CalendarDay day={day} onClick={onDayClick} />
          </div>
        ))}
      </div>
    </div>
  );
}
