import { TextField } from '../ui';
import { openDatePicker } from '../../lib/dateFormat';

interface PeriodDateRangeProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Start/end date fields for logging several period days at once. */
export function PeriodDateRange({ startDate, endDate, onStartChange, onEndChange }: PeriodDateRangeProps) {
  const isValidRange = startDate && endDate && new Date(startDate) <= new Date(endDate);
  const dayCount = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / DAY_MS) + 1;

  return (
    <div className="stack">
      <TextField
        type="date"
        label="Start Date"
        value={startDate}
        onChange={onStartChange}
        onClick={openDatePicker}
        onFocus={openDatePicker}
      />
      <TextField
        type="date"
        label="End Date"
        value={endDate}
        onChange={onEndChange}
        onClick={openDatePicker}
        onFocus={openDatePicker}
      />
      {isValidRange && <p className="small-text primary-text">Will log period for {dayCount} day(s)</p>}
    </div>
  );
}
