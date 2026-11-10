import type { DayData } from '../../lib/types';
import { FLOW_INTENSITY_LABELS } from '../../lib/types';

type FormatLong = (date: Date, withWeekday?: boolean) => string;

/** Everything a screen reader needs to know about this day, as one sentence. */
export function buildDayLabel(day: DayData, formatLong: FormatLong): string {
  const parts: string[] = [formatLong(day.date, true)];

  if (day.isToday) parts.push('today');

  if (day.isPeriod) {
    parts.push(
      day.flowIntensity
        ? `period logged, ${FLOW_INTENSITY_LABELS[day.flowIntensity]} flow`
        : 'period logged'
    );
  } else if (day.isPredictedPeriod) {
    parts.push('predicted period');
  }

  if (day.cycleDay) parts.push(`cycle day ${day.cycleDay}`);

  const logged = [
    day.hasSymptoms && 'symptoms',
    day.hasMood && 'mood',
    day.hasIntimacy && 'intimacy',
    day.hasNote && 'note',
  ].filter(Boolean) as string[];

  if (logged.length > 0) parts.push(`${logged.join(', ')} logged`);

  return parts.join(', ');
}
