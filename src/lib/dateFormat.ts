import { format } from 'date-fns';
import type { SyntheticEvent } from 'react';

export type DateFormatStyle = 'us' | 'international' | 'iso';

interface DateFormatPatterns {
  long: string;
  longWithWeekday: string;
  short: string;
}

export const DATE_FORMAT_STYLES: Record<DateFormatStyle, DateFormatPatterns> = {
  us: {
    long: 'MMMM d, yyyy',
    longWithWeekday: 'EEEE, MMMM d, yyyy',
    short: 'MM/dd/yyyy',
  },
  international: {
    long: 'd MMMM yyyy',
    longWithWeekday: 'EEEE, d MMMM yyyy',
    short: 'dd/MM/yyyy',
  },
  iso: {
    long: 'yyyy-MM-dd',
    longWithWeekday: 'EEEE, yyyy-MM-dd',
    short: 'yyyy-MM-dd',
  },
};

export const DATE_FORMAT_LABELS: Record<DateFormatStyle, string> = {
  us: 'US',
  international: 'International',
  iso: 'ISO',
};

/** Infers a date format style from the runtime's locale, using the order Intl puts date parts in. */
export function inferDateFormatStyle(): DateFormatStyle {
  const parts = new Intl.DateTimeFormat().formatToParts(new Date());
  const order = parts
    .filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
    .map((part) => part.type);

  if (order[0] === 'year') return 'iso';
  if (order[0] === 'month') return 'us';
  return 'international';
}

function toDate(date: Date | number): Date {
  return typeof date === 'number' ? new Date(date) : date;
}

export function formatLongDate(
  date: Date | number,
  style: DateFormatStyle,
  withWeekday = false
): string {
  const patterns = DATE_FORMAT_STYLES[style];
  return format(toDate(date), withWeekday ? patterns.longWithWeekday : patterns.long);
}

export function formatShortDate(date: Date | number, style: DateFormatStyle): string {
  return format(toDate(date), DATE_FORMAT_STYLES[style].short);
}

interface ShowPickerInput {
  showPicker?: () => void;
}

/** Opens the native date picker regardless of where in the field the user clicked/focused. */
export function openDatePicker(e: SyntheticEvent<HTMLInputElement>) {
  const input = e.currentTarget as HTMLInputElement & ShowPickerInput;
  if (typeof input.showPicker !== 'function') return;

  try {
    input.showPicker();
  } catch {
    // Unsupported context (e.g. not triggered by a user gesture) or partial
    // browser support — the native calendar-icon affordance still works.
  }
}
