import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayDetailSheet } from './DayDetailSheet';
import type { DayData, HealthRecord } from '../../lib/types';
import { formatLongDate, formatShortDate } from '../../lib/dateFormat';

const mockRecords: HealthRecord[] = [];

vi.mock('../../hooks/useRecords', () => ({
  useRecords: () => ({
    getRecordsByDate: () => mockRecords,
  }),
}));

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

function makeRecord(overrides: Partial<HealthRecord> = {}): HealthRecord {
  const now = new Date('2024-03-15T00:00:00').getTime();
  return {
    id: 'rec-1',
    type: 'period',
    createdAt: now,
    updatedAt: now,
    tags: [],
    data: { date: now, flowIntensity: 'medium' },
    ...overrides,
  } as HealthRecord;
}

describe('DayDetailSheet', () => {
  const defaultProps = {
    day: makeDay(),
    onClose: vi.fn(),
    onLog: vi.fn(),
    onEditRecord: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecords.length = 0;
  });

  it('should render nothing when no day is selected', () => {
    const { container } = render(<DayDetailSheet {...defaultProps} day={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should show the formatted date', () => {
    render(<DayDetailSheet {...defaultProps} />);
    expect(screen.getByText('Friday, March 15, 2024')).toBeInTheDocument();
  });

  describe('quick log buttons', () => {
    it('should call onLog with the type and timestamp', () => {
      const day = makeDay();
      render(<DayDetailSheet {...defaultProps} day={day} />);

      fireEvent.click(screen.getByRole('button', { name: /log period/i }));

      expect(defaultProps.onLog).toHaveBeenCalledWith('period', day.timestamp);
    });

    it('should offer every record type', () => {
      render(<DayDetailSheet {...defaultProps} />);

      for (const label of [/log period/i, /log symptoms/i, /log mood/i, /log intimacy/i, /log note/i]) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      }
    });
  });

  describe('editing existing records', () => {
    it('should render each logged record as a button', () => {
      mockRecords.push(makeRecord());
      render(<DayDetailSheet {...defaultProps} />);

      expect(screen.getByRole('button', { name: /edit medium flow/i })).toBeInTheDocument();
    });

    it('should call onEditRecord with the full record when tapped', () => {
      const record = makeRecord();
      mockRecords.push(record);
      render(<DayDetailSheet {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /edit medium flow/i }));

      expect(defaultProps.onEditRecord).toHaveBeenCalledWith(record);
    });

    it('should make records of every type editable', () => {
      mockRecords.push(
        makeRecord({ id: 'p', type: 'period' }),
        makeRecord({ id: 'm', type: 'mood', data: { date: 0, moods: ['calm'] } }),
        makeRecord({ id: 'n', type: 'note', data: { date: 0, content: 'hello' } })
      );
      render(<DayDetailSheet {...defaultProps} />);

      const editButtons = screen
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-label')?.startsWith('Edit'));
      expect(editButtons).toHaveLength(3);
    });
  });
});
