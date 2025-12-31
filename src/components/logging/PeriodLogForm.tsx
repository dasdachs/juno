import { useState } from 'react';
import { format } from 'date-fns';
import { FlowIntensityPicker } from '../common/FlowIntensityPicker';
import { BottomSheet } from '../common/BottomSheet';
import { useRecords } from '../../hooks/useRecords';
import { useCycles } from '../../hooks/useCycles';
import type { FlowIntensity, PeriodData } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface PeriodLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: PeriodData;
  };
}

export function PeriodLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: PeriodLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { startNewCycle, currentCycle } = useCycles();
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(
    existingRecord?.data.flowIntensity ?? null
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (!flowIntensity) return;

    setIsSubmitting(true);
    try {
      const data: PeriodData = {
        date: normalizedDate,
        flowIntensity,
        notes: notes.trim() || undefined,
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        // Check if we need to start a new cycle
        // Start new cycle if:
        // 1. No current cycle exists, OR
        // 2. This is the first period log after the cycle has been going for a while
        const isFirstPeriodLog = !currentCycle ||
          (currentCycle && !currentCycle.periodEndDate &&
           normalizedDate > currentCycle.startDate + 7 * 24 * 60 * 60 * 1000);

        if (isFirstPeriodLog) {
          await startNewCycle(normalizedDate);
        }

        await addRecord({
          type: 'period',
          data,
          tags: [],
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save period log:', error);
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
      console.error('Failed to delete period log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Log Period">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{dateLabel}</p>

        <FlowIntensityPicker value={flowIntensity} onChange={setFlowIntensity} />

        <div>
          <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
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
            disabled={!flowIntensity || isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
