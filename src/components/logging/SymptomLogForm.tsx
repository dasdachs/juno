import { useState } from 'react';
import { SymptomPicker } from '../common/SymptomPicker';
import { BottomSheet } from '../ui';
import { LogFormActions } from './LogFormActions';
import { NotesField } from './NotesField';
import { useLogSubmit } from './useLogSubmit';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { SymptomEntry, SymptomData } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface SymptomLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: SymptomData;
  };
}

export function SymptomLogForm({ isOpen, onClose, date, existingRecord }: SymptomLogFormProps) {
  const { formatLong } = useDateFormat();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(existingRecord?.data.symptoms ?? []);
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const canSave = symptoms.length > 0;

  const { isSubmitting, handleSave, handleDelete } = useLogSubmit({
    type: 'symptom',
    existingId: existingRecord?.id,
    canSave,
    getData: (): SymptomData => ({ date: startOfDay(date), symptoms, notes: notes.trim() || undefined }),
    savedToast: existingRecord ? 'Symptoms updated' : 'Symptoms saved',
    logName: 'symptom log',
    onClose,
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Symptoms' : 'Log Symptoms'}>
      <div className="stack">
        <p className="supporting">{formatLong(date)}</p>
        <SymptomPicker value={symptoms} onChange={setSymptoms} />
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
