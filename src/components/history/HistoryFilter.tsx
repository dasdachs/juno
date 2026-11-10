import type { RecordType } from '../../lib/types';
import { RECORD_TYPE_LABELS } from '../../lib/types';
import { Chip } from '../ui';

export type HistoryFilterValue = RecordType | 'all';

interface HistoryFilterProps {
  value: HistoryFilterValue;
  onChange: (value: HistoryFilterValue) => void;
}

/** Filter chips: all entries, or a single record type. */
export function HistoryFilter({ value, onChange }: HistoryFilterProps) {
  return (
    <div role="group" aria-label="Filter" className="chip-set">
      <Chip selected={value === 'all'} onClick={() => onChange('all')}>
        All
      </Chip>
      {Object.entries(RECORD_TYPE_LABELS).map(([type, label]) => (
        <Chip key={type} selected={value === type} onClick={() => onChange(type as RecordType)}>
          {label}
        </Chip>
      ))}
    </div>
  );
}
