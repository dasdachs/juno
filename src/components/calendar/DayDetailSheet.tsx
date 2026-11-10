import { RECORD_TYPE_META } from '../../lib/recordTypeMeta';
import { useRecords } from '../../hooks/useRecords';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { DayData, HealthRecord, RecordType } from '../../lib/types';
import { BottomSheet, Chip } from '../ui';
import { DayRecordList } from './DayRecordList';
import { RecordTypeTiles } from './RecordTypeTiles';

interface DayDetailSheetProps {
  day: DayData | null;
  onClose: () => void;
  onLog: (type: RecordType, date: number) => void;
  onEditRecord: (record: HealthRecord) => void;
}

export function DayDetailSheet({ day, onClose, onLog, onEditRecord }: DayDetailSheetProps) {
  const { getRecordsByDate } = useRecords();
  const { formatLong } = useDateFormat();

  if (!day) return null;

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={formatLong(day.date, true)}
      closeLabel="Close"
      scrimLabel="Close day details"
    >
      <div className="stack">
        <RecordTypeTiles
          columns={5}
          labelPrefix="Log"
          isLogged={(type) => RECORD_TYPE_META[type].isLogged(day)}
          onSelect={(type) => onLog(type, day.timestamp)}
        />

        <div className="chip-set">
          {day.cycleDay && <Chip icon="cycle">Cycle Day {day.cycleDay}</Chip>}
          {day.isPredictedPeriod && !day.isPeriod && (
            <Chip icon="water_drop">Period predicted for this day</Chip>
          )}
        </div>

        <DayRecordList records={getRecordsByDate(day.timestamp)} onEdit={onEditRecord} />
      </div>
    </BottomSheet>
  );
}
