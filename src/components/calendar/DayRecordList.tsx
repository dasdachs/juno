import { RECORD_TYPE_META } from '../../lib/recordTypeMeta';
import type { HealthRecord, NoteData } from '../../lib/types';
import { Icon, List, ListItem } from '../ui';
import { describeRecord } from './describeRecord';

interface DayRecordListProps {
  records: HealthRecord[];
  onEdit: (record: HealthRecord) => void;
}

function headlineFor(record: HealthRecord): string {
  if (record.type === 'note') return (record.data as NoteData).title || 'Note';
  return describeRecord(record);
}

function supportingFor(record: HealthRecord): string {
  if (record.type === 'note') return (record.data as NoteData).content;
  return RECORD_TYPE_META[record.type].label;
}

/** The entries logged on one day; tapping one opens it for editing. */
export function DayRecordList({ records, onEdit }: DayRecordListProps) {
  if (records.length === 0) return null;

  return (
    <section>
      <h4 className="section-title">Logged Data</h4>
      <p className="supporting">Tap an entry to edit or delete it.</p>
      <List>
        {records.map((record) => (
          <ListItem
            key={record.id}
            icon={RECORD_TYPE_META[record.type].icon}
            iconTone={RECORD_TYPE_META[record.type].tone}
            headline={headlineFor(record)}
            supporting={supportingFor(record)}
            trailing={<Icon name="edit" />}
            onClick={() => onEdit(record)}
            ariaLabel={`Edit ${describeRecord(record)}`}
          />
        ))}
      </List>
    </section>
  );
}
