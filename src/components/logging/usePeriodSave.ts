import { parse, eachDayOfInterval } from 'date-fns';
import { useRecords } from '../../hooks/useRecords';
import { useCycles } from '../../hooks/useCycles';
import { useToast } from '../../contexts/ToastContext';
import { startOfDay } from '../../lib/predictions';
import type { FlowIntensity, PeriodData } from '../../lib/types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface PeriodDraft {
  existingId?: string;
  date: number;
  flowIntensity: FlowIntensity | null;
  notes: string;
  mode: 'single' | 'multi';
  startDate: string;
  endDate: string;
}

/** Persists a period entry: an update, a single day, or one record per day of a range. */
export function usePeriodSave(draft: PeriodDraft) {
  const { addRecord, updateRecord, refresh } = useRecords();
  const { startNewCycle, currentCycle } = useCycles();
  const { showToast } = useToast();

  const startCycleIfNeeded = async (day: number) => {
    const isFirstPeriodLog =
      !currentCycle || (!currentCycle.periodEndDate && day > currentCycle.startDate + WEEK_MS);
    if (isFirstPeriodLog) await startNewCycle(day);
  };

  return async (): Promise<boolean | void> => {
    const { existingId, flowIntensity, notes, mode } = draft;
    if (!flowIntensity) return false;
    const dataFor = (date: number): PeriodData => ({ date, flowIntensity, notes: notes.trim() || undefined });
    const normalizedDate = startOfDay(draft.date);

    if (existingId) {
      await updateRecord(existingId, { data: dataFor(normalizedDate) });
    } else if (mode === 'single') {
      await startCycleIfNeeded(normalizedDate);
      await addRecord({ type: 'period', data: dataFor(normalizedDate), tags: [] });
    } else {
      // Parse with date-fns so the range is interpreted in local time.
      const start = parse(draft.startDate, 'yyyy-MM-dd', new Date());
      const end = parse(draft.endDate, 'yyyy-MM-dd', new Date());
      if (start > end) {
        showToast('The start date must be on or before the end date.', 'error');
        return false;
      }
      await startCycleIfNeeded(startOfDay(start.getTime()));
      for (const day of eachDayOfInterval({ start, end })) {
        await addRecord({ type: 'period', data: dataFor(startOfDay(day.getTime())), tags: [] });
      }
      // Ensure all records are loaded after multi-day addition
      await refresh();
    }
  };
}
