import { useState } from 'react';
import { BottomSheet } from '../common/BottomSheet';
import { LogFormActions } from './LogFormActions';
import { useRecords } from '../../hooks/useRecords';
import { useToast } from '../../contexts/ToastContext';
import { useDateFormat } from '../../contexts/DateFormatContext';
import { logger } from '../../lib/logger';
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

export function NoteLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: NoteLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { showToast } = useToast();
  const { formatLong } = useDateFormat();
  const [title, setTitle] = useState(existingRecord?.data.title ?? '');
  const [content, setContent] = useState(existingRecord?.data.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = formatLong(date);
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const data: NoteData = {
        date: normalizedDate,
        title: title.trim() || undefined,
        content: content.trim(),
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        await addRecord({
          type: 'note',
          data,
          tags: [],
        });
      }

      showToast(existingRecord ? 'Note updated' : 'Note saved');
      onClose();
    } catch (error) {
      logger.error('Failed to save note:', error);
      showToast("Couldn't save your note. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    setIsSubmitting(true);
    try {
      await deleteRecord(existingRecord.id);
      showToast('Note deleted');
      onClose();
    } catch (error) {
      logger.error('Failed to delete note:', error);
      showToast("Couldn't delete your note. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Note' : 'Add Note'}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
            placeholder="Note title..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors duration-200"
            rows={5}
            placeholder="Write your note..."
          />
        </div>

        <LogFormActions
          onSave={handleSave}
          onCancel={onClose}
          onDelete={existingRecord ? handleDelete : undefined}
          canSave={Boolean(content.trim())}
          isSubmitting={isSubmitting}
          saveClassName="bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700"
        />
      </div>
    </BottomSheet>
  );
}
