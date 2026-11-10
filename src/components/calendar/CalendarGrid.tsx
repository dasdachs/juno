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
    <div className="calendar-grid">
      {weekdayLabels.map((day) => (
        <div key={day} className="calendar-weekday">
          {day}
        </div>
      ))}

      {days.map((day, index) => (
        <CalendarDay key={index} day={day} onClick={onDayClick} />
      ))}
    </div>
  );
}
