import { useDateFormat } from '../../contexts/DateFormatContext';
import type { HealthRecord } from '../../lib/types';
import { Card, List } from '../ui';
import type { DayGroup } from './groupRecordsByDay';
import { HistoryEntry } from './HistoryEntry';

interface HistoryDayGroupProps {
  group: DayGroup;
  onEdit: (record: HealthRecord) => void;
}

/** All entries logged on one day, under that day's date. */
export function HistoryDayGroup({ group, onEdit }: HistoryDayGroupProps) {
  const { formatLong } = useDateFormat();

  return (
    <section className="stack tight">
      <h3 className="section-title">{formatLong(new Date(group.dateKey), true)}</h3>
      <Card variant="outlined" className="list-card">
        <List className="wrapping">
          {group.records.map((record) => (
            <HistoryEntry key={record.id} record={record} onEdit={() => onEdit(record)} />
          ))}
        </List>
      </Card>
    </section>
  );
}
