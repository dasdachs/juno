import { format } from 'date-fns';
import type { HealthRecord } from '../../lib/types';
import { RECORD_TYPE_LABELS } from '../../lib/types';
import { RECORD_TYPE_META } from '../../lib/recordTypeMeta';
import { Icon, ListItem } from '../ui';
import { RecordHeadline } from './RecordHeadline';

/** The secondary line: free-text notes, or a titled note's body. */
function supportingText(record: HealthRecord): string | undefined {
  if (record.type === 'note') {
    const data = record.data as { title?: string; content: string };
    return data.title ? data.content : undefined;
  }
  return (record.data as { notes?: string }).notes || undefined;
}

interface HistoryEntryProps {
  record: HealthRecord;
  onEdit: () => void;
}

/** One logged entry; tapping it opens the entry for editing. */
export function HistoryEntry({ record, onEdit }: HistoryEntryProps) {
  const meta = RECORD_TYPE_META[record.type];
  const label = RECORD_TYPE_LABELS[record.type];

  return (
    <ListItem
      icon={meta.icon}
      iconTone={meta.tone}
      headline={
        <>
          <div className="entry-kind">{label}</div>
          <RecordHeadline record={record} />
        </>
      }
      supporting={supportingText(record)}
      trailing={
        <span className="entry-trailing">
          <span className="small-text">{format(new Date(record.createdAt), 'h:mm a')}</span>
          <Icon name="edit" size="small" />
        </span>
      }
      onClick={onEdit}
      ariaLabel={`Edit ${label} entry`}
    />
  );
}
