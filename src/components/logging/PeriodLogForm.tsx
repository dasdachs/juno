import { useState } from 'react';
import { format, parse, eachDayOfInterval } from 'date-fns';
import { FlowIntensityPicker } from '../common/FlowIntensityPicker';
import { BottomSheet } from '../common/BottomSheet';
import { useRecords } from '../../hooks/useRecords';
import { useCycles } from '../../hooks/useCycles';
import { logger } from '../../lib/logger';
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
  const { addRecord, updateRecord, deleteRecord, refresh } = useRecords();
  const { startNewCycle, currentCycle } = useCycles();
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(
    existingRecord?.data.flowIntensity ?? null
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [startDate, setStartDate] = useState(format(new Date(date), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(date), 'yyyy-MM-dd'));

  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (!flowIntensity) return;

    setIsSubmitting(true);
    try {
      if (existingRecord) {
        // Only allow update in single mode
        const data: PeriodData = {
          date: normalizedDate,
          flowIntensity,
          notes: notes.trim() || undefined,
        };
        await updateRecord(existingRecord.id, { data });
      } else if (mode === 'single') {
        // Single day period
        const data: PeriodData = {
          date: normalizedDate,
          flowIntensity,
          notes: notes.trim() || undefined,
        };

        // Check if we need to start a new cycle
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
      } else {
        // Multi-day period
        // Parse dates using date-fns to handle timezone properly
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());

        // Validate date range
        if (start > end) {
          logger.error('Start date must be before end date');
          return;
        }

        // Get all days in the range
        const daysInRange = eachDayOfInterval({ start, end });

        // Determine cycle start (first day of the range)
        const rangeStartNormalized = startOfDay(start.getTime());
        const isFirstPeriodLog = !currentCycle ||
          (currentCycle && !currentCycle.periodEndDate &&
           rangeStartNormalized > currentCycle.startDate + 7 * 24 * 60 * 60 * 1000);

        if (isFirstPeriodLog) {
          await startNewCycle(rangeStartNormalized);
        }

        // Create a record for each day in the range
        for (const day of daysInRange) {
          const dayNormalized = startOfDay(day.getTime());
          const data: PeriodData = {
            date: dayNormalized,
            flowIntensity,
            notes: notes.trim() || undefined,
          };

          await addRecord({
            type: 'period',
            data,
            tags: [],
          });
        }

        // Ensure all records are loaded after multi-day addition
        await refresh();
      }

      handleClose();
    } catch (error) {
      logger.error('Failed to save period log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    setIsSubmitting(true);
    try {
      await deleteRecord(existingRecord.id);
      handleClose();
    } catch (error) {
      logger.error('Failed to delete period log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setMode('single');
    setStartDate(format(new Date(date), 'yyyy-MM-dd'));
    setEndDate(format(new Date(date), 'yyyy-MM-dd'));
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Log Period">
      <div className="space-y-4">
        {!existingRecord && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">{dateLabel}</p>

            {/* Mode toggle */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg p-1 transition-colors duration-200">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  mode === 'single'
                    ? 'bg-white dark:bg-gray-800 text-rose-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setMode('multi')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                  mode === 'multi'
                    ? 'bg-white dark:bg-gray-800 text-rose-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Multiple Days
              </button>
            </div>

            {/* Date range inputs for multi-day mode */}
            {mode === 'multi' && (
              <div className="space-y-3 bg-rose-50 dark:bg-gray-800 rounded-lg p-3 transition-colors duration-200">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200"
                  />
                </div>
                {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                  <p className="text-xs text-rose-600">
                    Will log period for {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <FlowIntensityPicker value={flowIntensity} onChange={setFlowIntensity} />

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors duration-200"
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
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!flowIntensity || isSubmitting || (mode === 'multi' && (!startDate || !endDate))}
            className="flex-1 px-4 py-2 text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:opacity-50 text-sm transition-colors duration-200"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
