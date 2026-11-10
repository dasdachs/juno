import { useState } from 'react';
import { MoodPicker } from '../common/MoodPicker';
import { BottomSheet } from '../common/BottomSheet';
import { LogFormActions } from './LogFormActions';
import { useRecords } from '../../hooks/useRecords';
import { useToast } from '../../contexts/ToastContext';
import { useDateFormat } from '../../contexts/DateFormatContext';
import { logger } from '../../lib/logger';
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

export function MoodLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: MoodLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { showToast } = useToast();
  const { formatLong } = useDateFormat();
  const [moods, setMoods] = useState<MoodType[]>(
    existingRecord?.data.moods ?? []
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = formatLong(date);
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (moods.length === 0) return;

    setIsSubmitting(true);
    try {
      const data: MoodData = {
        date: normalizedDate,
        moods,
        notes: notes.trim() || undefined,
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        await addRecord({
          type: 'mood',
          data,
          tags: [],
        });
      }

      showToast(existingRecord ? 'Mood updated' : 'Mood saved');
      onClose();
    } catch (error) {
      logger.error('Failed to save mood log:', error);
      showToast("Couldn't save your entry. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    setIsSubmitting(true);
    try {
      await deleteRecord(existingRecord.id);
      showToast('Entry deleted');
      onClose();
    } catch (error) {
      logger.error('Failed to delete mood log:', error);
      showToast("Couldn't delete your entry. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Mood' : 'Log Mood'}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

        <MoodPicker value={moods} onChange={setMoods} />

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors duration-200"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <LogFormActions
          onSave={handleSave}
          onCancel={onClose}
          onDelete={existingRecord ? handleDelete : undefined}
          canSave={moods.length > 0}
          isSubmitting={isSubmitting}
          saveClassName="bg-sky-500 hover:bg-sky-600"
        />
      </div>
    </BottomSheet>
  );
}
