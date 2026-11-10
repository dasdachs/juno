import { useState, useCallback } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DayDetailSheet } from '../components/calendar/DayDetailSheet';
import { useLogForm } from '../components/logging/LogFormHost';
import { formatLongDate, formatShortDate } from '../lib/dateFormat';
import type { DayData, HealthRecord } from '../lib/types';

// Deleting an entry is reached by tapping it in the day sheet, which opens the
// matching edit form; the form owns the actual Delete button. Per-form unit
// tests already cover each record type's Delete button in isolation — this
// test exercises the handoff between DayDetailSheet and the opened form for
// one record type, so a tap in the calendar actually deletes the right record.

const mockDeleteRecord = vi.fn(() => Promise.resolve());
const mockUpdateRecord = vi.fn(() => Promise.resolve());
const mockAddRecord = vi.fn(() => Promise.resolve());
const mockRefresh = vi.fn(() => Promise.resolve());
const mockRecords: HealthRecord[] = [];

vi.mock('../hooks/useRecords', () => ({
  useRecords: () => ({
    addRecord: mockAddRecord,
    updateRecord: mockUpdateRecord,
    deleteRecord: mockDeleteRecord,
    refresh: mockRefresh,
    getRecordsByDate: () => mockRecords,
  }),
}));

vi.mock('../hooks/useCycles', () => ({
  useCycles: () => ({
    startNewCycle: vi.fn(() => Promise.resolve()),
    currentCycle: null,
  }),
}));

vi.mock('../lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../contexts/DateFormatContext', () => ({
  useDateFormat: () => ({
    dateFormat: 'us',
    setDateFormat: vi.fn(),
    formatLong: (date: Date | number, withWeekday?: boolean) =>
      formatLongDate(date, 'us', withWeekday),
    formatShort: (date: Date | number) => formatShortDate(date, 'us'),
  }),
}));

const recordDate = new Date('2024-03-15T00:00:00').getTime();

function makeDay(): DayData {
  return {
    date: new Date(recordDate),
    timestamp: recordDate,
    isToday: false,
    isCurrentMonth: true,
    isPeriod: false,
    isPredictedPeriod: false,
    hasIntimacy: false,
    hasSymptoms: false,
    hasMood: false,
    hasNote: false,
  };
}

function makeRecord(): HealthRecord {
  return {
    id: 'rec-1',
    type: 'period',
    createdAt: recordDate,
    updatedAt: recordDate,
    tags: [],
    data: { date: recordDate, flowIntensity: 'medium' },
  } as HealthRecord;
}

/** Mirrors how CalendarPage composes DayDetailSheet with useLogForm. */
function Harness() {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(makeDay());
  const { openEdit, logForm } = useLogForm();

  const handleEdit = useCallback(
    (record: HealthRecord) => {
      openEdit(record);
      setSelectedDay(null);
    },
    [openEdit]
  );

  return (
    <>
      <DayDetailSheet
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        onLog={() => {}}
        onEditRecord={handleEdit}
      />
      {logForm}
    </>
  );
}

describe('calendar entry delete (DayDetailSheet -> LogFormHost integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecords.length = 0;
    mockRecords.push(makeRecord());
  });

  it('opens the matching edit form pre-filled when an entry is tapped', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /edit medium flow/i }));

    expect(screen.getByText('Edit Period')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('deletes the tapped record after two-step confirmation and closes the form', async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: /edit medium flow/i }));
    expect(screen.getByText('Edit Period')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);
    expect(screen.getByText(/tap delete again to confirm/i)).toBeInTheDocument();
    expect(mockDeleteRecord).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

    await waitFor(() => expect(mockDeleteRecord).toHaveBeenCalledWith('rec-1'));
    await waitFor(() => expect(screen.queryByText('Edit Period')).not.toBeInTheDocument());
  });
});
