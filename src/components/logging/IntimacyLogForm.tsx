import { useState } from 'react';
import { format } from 'date-fns';
import { BottomSheet } from '../common/BottomSheet';
import { useRecords } from '../../hooks/useRecords';
import { logger } from '../../lib/logger';
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

export function IntimacyLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: IntimacyLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const [type, setType] = useState<IntimacyType | null>(
    existingRecord?.data.type ?? null
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (!type) return;

    setIsSubmitting(true);
    try {
      const data: IntimacyData = {
        date: normalizedDate,
        type,
        notes: notes.trim() || undefined,
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        await addRecord({
          type: 'intimacy',
          data,
          tags: [],
        });
      }

      onClose();
    } catch (error) {
      logger.error('Failed to save intimacy log:', error);
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
      logger.error('Failed to delete intimacy log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Log Intimacy">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {INTIMACY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm transition-colors duration-200 ${
                  type === option
                    ? 'bg-violet-500 text-white'
                    : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                }`}
              >
                {INTIMACY_TYPE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors duration-200"
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <div className={`flex gap-2 sm:gap-3 pt-4 ${existingRecord ? 'flex-col sm:flex-row' : 'flex-col sm:flex-row'}`}>
          {existingRecord && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:auto px-4 py-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 text-sm transition-colors duration-200"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!type || isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-violet-500 rounded-lg hover:bg-violet-600 disabled:opacity-50 text-sm transition-colors duration-200"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
