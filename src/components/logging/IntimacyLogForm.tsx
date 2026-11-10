import { useState } from 'react';
import { BottomSheet } from '../ui';
import { LogFormActions } from './LogFormActions';
import { NotesField } from './NotesField';
import { useLogSubmit } from './useLogSubmit';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { IntimacyType, IntimacyData } from '../../lib/types';
import { INTIMACY_TYPE_LABELS } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface IntimacyLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: IntimacyData;
  };
}

const INTIMACY_OPTIONS: IntimacyType[] = ['protected', 'unprotected', 'other'];

export function IntimacyLogForm({ isOpen, onClose, date, existingRecord }: IntimacyLogFormProps) {
  const { formatLong } = useDateFormat();
  const [type, setType] = useState<IntimacyType | null>(existingRecord?.data.type ?? null);
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');

  const { isSubmitting, handleSave, handleDelete } = useLogSubmit({
    type: 'intimacy',
    existingId: existingRecord?.id,
    canSave: Boolean(type),
    getData: (): IntimacyData => ({ date: startOfDay(date), type: type!, notes: notes.trim() || undefined }),
    savedToast: existingRecord ? 'Intimacy updated' : 'Intimacy saved',
    logName: 'intimacy log',
    onClose,
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Intimacy' : 'Log Intimacy'}>
      <div className="stack">
        <p className="supporting">{formatLong(date)}</p>
        <div className="stack tight">
          <p className="picker-label">Type</p>
          <div className="tile-grid">
            {INTIMACY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="tile"
                aria-pressed={type === option}
                onClick={() => setType(option)}
              >
                {INTIMACY_TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>
        <NotesField value={notes} onChange={setNotes} />
        <LogFormActions
          onSave={handleSave}
          onCancel={onClose}
          onDelete={handleDelete}
          canSave={Boolean(type)}
          isSubmitting={isSubmitting}
        />
      </div>
    </BottomSheet>
  );
}
