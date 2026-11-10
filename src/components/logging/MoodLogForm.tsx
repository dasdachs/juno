import { useState } from 'react';
import { MoodPicker } from '../common/MoodPicker';
import { BottomSheet } from '../ui';
import { LogFormActions } from './LogFormActions';
import { NotesField } from './NotesField';
import { useLogSubmit } from './useLogSubmit';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { MoodType, MoodData } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface MoodLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: MoodData;
  };
}

export function MoodLogForm({ isOpen, onClose, date, existingRecord }: MoodLogFormProps) {
  const { formatLong } = useDateFormat();
  const [moods, setMoods] = useState<MoodType[]>(existingRecord?.data.moods ?? []);
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const canSave = moods.length > 0;

  const { isSubmitting, handleSave, handleDelete } = useLogSubmit({
    type: 'mood',
    existingId: existingRecord?.id,
    canSave,
    getData: (): MoodData => ({ date: startOfDay(date), moods, notes: notes.trim() || undefined }),
    savedToast: existingRecord ? 'Mood updated' : 'Mood saved',
    logName: 'mood log',
    onClose,
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Mood' : 'Log Mood'}>
      <div className="stack">
        <p className="supporting">{formatLong(date)}</p>
        <MoodPicker value={moods} onChange={setMoods} />
        <NotesField value={notes} onChange={setNotes} />
        <LogFormActions
          onSave={handleSave}
          onCancel={onClose}
          onDelete={handleDelete}
          canSave={canSave}
          isSubmitting={isSubmitting}
        />
      </div>
    </BottomSheet>
  );
}
