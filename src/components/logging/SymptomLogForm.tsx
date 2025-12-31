import { useState } from 'react';
import { format } from 'date-fns';
import { SymptomPicker } from '../common/SymptomPicker';
import { BottomSheet } from '../common/BottomSheet';
import { useRecords } from '../../hooks/useRecords';
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
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(
    existingRecord?.data.symptoms ?? []
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
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

      onClose();
    } catch (error) {
      console.error('Failed to save symptom log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    setIsSubmitting(true);
    try {
      await deleteRecord(existingRecord.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete symptom log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Log Symptoms">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{dateLabel}</p>

        <SymptomPicker value={symptoms} onChange={setSymptoms} />

        <div>
          <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          {existingRecord && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={symptoms.length === 0 || isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
