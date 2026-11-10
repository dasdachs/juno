import { useMemo } from 'react';
import { IconButton, Select } from '../ui';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onMonthChange,
  onYearChange,
}: CalendarHeaderProps) {
  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 10; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className="calendar-header">
      <IconButton icon="chevron_left" label="Previous month" onClick={onPrevMonth} />

      <Select hideLabel label="Month" value={month} onChange={(v) => onMonthChange(parseInt(v))}>
        {MONTH_NAMES.map((name, index) => (
          <option key={index} value={index}>
            {name}
          </option>
        ))}
      </Select>

      <Select hideLabel label="Year" value={year} onChange={(v) => onYearChange(parseInt(v))}>
        {yearRange.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>

      <IconButton icon="today" label="Today" onClick={onToday} />

      <IconButton icon="chevron_right" label="Next month" onClick={onNextMonth} />
    </div>
  );
}
