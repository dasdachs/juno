import type { DayData } from '../../lib/types';
import { useDateFormat } from '../../contexts/DateFormatContext';
import { cx } from '../ui';
import { buildDayLabel } from './dayLabel';

interface CalendarDayProps {
  day: DayData;
  onClick: (day: DayData) => void;
}

/** Which log-type dots to show under the day number. */
function dotsFor(day: DayData): string[] {
  return [
    day.hasIntimacy && 'intimacy',
    day.hasSymptoms && 'symptoms',
    day.hasMood && 'mood',
    day.hasNote && 'note',
  ].filter(Boolean) as string[];
}

/**
 * One cell of the month grid, styled after the MD3 date picker: the day number
 * sits in a circle that is filled by flow intensity on period days, dashed on
 * predicted days and outlined for today.
 */
export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const { formatLong } = useDateFormat();
  const predicted = day.isPredictedPeriod && !day.isPeriod;
  const flowClass = day.isPeriod && `flow-${day.flowIntensity ?? 'medium'}`;

  return (
    <button
      type="button"
      className={cx(
        'calendar-day',
        !day.isCurrentMonth && 'outside',
        day.isToday && 'today',
        predicted && 'predicted'
      )}
      onClick={() => onClick(day)}
      aria-label={buildDayLabel(day, formatLong)}
      aria-current={day.isToday ? 'date' : undefined}
    >
      <span aria-hidden="true" className={cx('day-number', flowClass)}>
        {day.date.getDate()}
      </span>

      {day.cycleDay && day.isCurrentMonth && (
        <span aria-hidden="true" className="day-cycle">
          D{day.cycleDay}
        </span>
      )}

      <span className="day-dots" aria-hidden="true">
        {dotsFor(day).map((kind) => (
          <span key={kind} className={`dot dot-${kind}`} />
        ))}
      </span>
    </button>
  );
}
