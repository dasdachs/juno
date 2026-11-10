import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarDay } from './CalendarDay';
import type { DayData } from '../../lib/types';
import { formatLongDate, formatShortDate } from '../../lib/dateFormat';

vi.mock('../../contexts/DateFormatContext', () => ({
  useDateFormat: () => ({
    dateFormat: 'us',
    setDateFormat: vi.fn(),
    formatLong: (date: Date | number, withWeekday?: boolean) =>
      formatLongDate(date, 'us', withWeekday),
    formatShort: (date: Date | number) => formatShortDate(date, 'us'),
  }),
}));

function makeDay(overrides: Partial<DayData> = {}): DayData {
  const date = new Date('2024-03-15T00:00:00');
  return {
    date,
    timestamp: date.getTime(),
    isToday: false,
    isCurrentMonth: true,
    isPeriod: false,
    isPredictedPeriod: false,
    hasIntimacy: false,
    hasSymptoms: false,
    hasMood: false,
    hasNote: false,
    ...overrides,
  };
}

describe('CalendarDay', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the day number', () => {
    render(<CalendarDay day={makeDay()} onClick={onClick} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should be a button so it is reachable by keyboard', () => {
    render(<CalendarDay day={makeDay()} onClick={onClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when activated', () => {
    const day = makeDay();
    render(<CalendarDay day={day} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledWith(day);
  });

  describe('accessible name', () => {
    it('should describe the date', () => {
      render(<CalendarDay day={makeDay()} onClick={onClick} />);
      expect(screen.getByRole('button')).toHaveAccessibleName(/March 15, 2024/);
    });

    it('should announce logged period and flow', () => {
      render(
        <CalendarDay
          day={makeDay({ isPeriod: true, flowIntensity: 'heavy' })}
          onClick={onClick}
        />
      );
      expect(screen.getByRole('button')).toHaveAccessibleName(/heavy flow/i);
    });

    it('should announce a predicted period', () => {
      render(<CalendarDay day={makeDay({ isPredictedPeriod: true })} onClick={onClick} />);
      expect(screen.getByRole('button')).toHaveAccessibleName(/predicted/i);
    });

    it('should announce which categories are logged', () => {
      render(
        <CalendarDay
          day={makeDay({ hasSymptoms: true, hasMood: true })}
          onClick={onClick}
        />
      );
      const name = screen.getByRole('button').getAttribute('aria-label') ?? '';
      expect(name).toMatch(/symptoms/i);
      expect(name).toMatch(/mood/i);
    });

    it('should mark today', () => {
      render(<CalendarDay day={makeDay({ isToday: true })} onClick={onClick} />);
      expect(screen.getByRole('button')).toHaveAccessibleName(/today/i);
    });
  });
});
