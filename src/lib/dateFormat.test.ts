import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  inferDateFormatStyle,
  formatLongDate,
  formatShortDate,
  openDatePicker,
} from './dateFormat';

function mockPartsOrder(order: Array<'year' | 'month' | 'day'>) {
  const values: Record<'year' | 'month' | 'day', string> = {
    year: '2026',
    month: '08',
    day: '06',
  };
  const parts = order.flatMap((type, i) => {
    const part = { type, value: values[type] };
    return i === order.length - 1 ? [part] : [part, { type: 'literal', value: '/' }];
  });
  vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue(
    parts as Intl.DateTimeFormatPart[]
  );
}

describe('inferDateFormatStyle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('infers us for month-day-year locale order', () => {
    mockPartsOrder(['month', 'day', 'year']);
    expect(inferDateFormatStyle()).toBe('us');
  });

  it('infers iso for year-month-day locale order', () => {
    mockPartsOrder(['year', 'month', 'day']);
    expect(inferDateFormatStyle()).toBe('iso');
  });

  it('infers international for day-month-year locale order', () => {
    mockPartsOrder(['day', 'month', 'year']);
    expect(inferDateFormatStyle()).toBe('international');
  });
});

describe('formatLongDate', () => {
  const timestamp = new Date(2026, 7, 6).getTime();

  it('formats the us style as "Month d, yyyy"', () => {
    expect(formatLongDate(timestamp, 'us')).toBe('August 6, 2026');
  });

  it('formats the international style as "d Month yyyy"', () => {
    expect(formatLongDate(timestamp, 'international')).toBe('6 August 2026');
  });

  it('formats the iso style as "yyyy-MM-dd"', () => {
    expect(formatLongDate(timestamp, 'iso')).toBe('2026-08-06');
  });

  it('prefixes the weekday when requested', () => {
    expect(formatLongDate(timestamp, 'us', true)).toBe('Thursday, August 6, 2026');
  });
});

describe('formatShortDate', () => {
  const timestamp = new Date(2026, 7, 6).getTime();

  it('formats the us style as "MM/dd/yyyy"', () => {
    expect(formatShortDate(timestamp, 'us')).toBe('08/06/2026');
  });

  it('formats the international style as "dd/MM/yyyy"', () => {
    expect(formatShortDate(timestamp, 'international')).toBe('06/08/2026');
  });

  it('formats the iso style as "yyyy-MM-dd"', () => {
    expect(formatShortDate(timestamp, 'iso')).toBe('2026-08-06');
  });
});

describe('openDatePicker', () => {
  it('calls showPicker on the target input when supported', () => {
    const showPicker = vi.fn();
    const input = { showPicker } as unknown as HTMLInputElement;

    openDatePicker({ currentTarget: input } as React.SyntheticEvent<HTMLInputElement>);

    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the browser has no showPicker support', () => {
    const input = {} as HTMLInputElement;

    expect(() =>
      openDatePicker({ currentTarget: input } as React.SyntheticEvent<HTMLInputElement>)
    ).not.toThrow();
  });

  it('swallows errors thrown by showPicker', () => {
    const showPicker = vi.fn(() => {
      throw new Error('not allowed');
    });
    const input = { showPicker } as unknown as HTMLInputElement;

    expect(() =>
      openDatePicker({ currentTarget: input } as React.SyntheticEvent<HTMLInputElement>)
    ).not.toThrow();
  });
});
