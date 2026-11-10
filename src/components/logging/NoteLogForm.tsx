import { useState } from 'react';
import { BottomSheet, TextField } from '../ui';
import { LogFormActions } from './LogFormActions';
import { useLogSubmit } from './useLogSubmit';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { NoteData } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface NoteLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: NoteData;
  };
}

export function NoteLogForm({ isOpen, onClose, date, existingRecord }: NoteLogFormProps) {
  const { formatLong } = useDateFormat();
  const [title, setTitle] = useState(existingRecord?.data.title ?? '');
  const [content, setContent] = useState(existingRecord?.data.content ?? '');
  const canSave = Boolean(content.trim());

  const { isSubmitting, handleSave, handleDelete } = useLogSubmit({
    type: 'note',
    existingId: existingRecord?.id,
    canSave,
    getData: (): NoteData => ({
      date: startOfDay(date),
      title: title.trim() || undefined,
      content: content.trim(),
    }),
    savedToast: existingRecord ? 'Note updated' : 'Note saved',
    logName: 'note',
    noun: 'note',
    onClose,
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Note' : 'Add Note'}>
      <div className="stack">
        <p className="supporting">{formatLong(date)}</p>
        <TextField type="text" label="Title (optional)" placeholder="Note title..." value={title} onChange={setTitle} />
        <TextField
          multiline
          rows={5}
          label="Content"
          placeholder="Write your note..."
          value={content}
          onChange={setContent}
        />
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
