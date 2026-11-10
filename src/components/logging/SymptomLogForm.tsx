import { useState } from 'react';
import { SymptomPicker } from '../common/SymptomPicker';
import { BottomSheet } from '../common/BottomSheet';
import { LogFormActions } from './LogFormActions';
import { useRecords } from '../../hooks/useRecords';
import { useToast } from '../../contexts/ToastContext';
import { useDateFormat } from '../../contexts/DateFormatContext';
import { logger } from '../../lib/logger';
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

export function SymptomLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: SymptomLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { showToast } = useToast();
  const { formatLong } = useDateFormat();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(
    existingRecord?.data.symptoms ?? []
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = formatLong(date);
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (symptoms.length === 0) return;

    setIsSubmitting(true);
    try {
      const data: SymptomData = {
        date: normalizedDate,
        symptoms,
        notes: notes.trim() || undefined,
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        await addRecord({
          type: 'symptom',
          data,
          tags: [],
        });
      }

      showToast(existingRecord ? 'Symptoms updated' : 'Symptoms saved');
      onClose();
    } catch (error) {
      logger.error('Failed to save symptom log:', error);
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
      logger.error('Failed to delete symptom log:', error);
      showToast("Couldn't delete your entry. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={existingRecord ? 'Edit Symptoms' : 'Log Symptoms'}>
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

        <SymptomPicker value={symptoms} onChange={setSymptoms} />

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <LogFormActions
          onSave={handleSave}
          onCancel={onClose}
          onDelete={existingRecord ? handleDelete : undefined}
          canSave={symptoms.length > 0}
          isSubmitting={isSubmitting}
          saveClassName="bg-amber-500 hover:bg-amber-600"
        />
      </div>
    </BottomSheet>
  );
}
