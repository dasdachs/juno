import { useState, useCallback } from 'react';
import { PeriodLogForm } from './PeriodLogForm';
import { SymptomLogForm } from './SymptomLogForm';
import { MoodLogForm } from './MoodLogForm';
import { IntimacyLogForm } from './IntimacyLogForm';
import { NoteLogForm } from './NoteLogForm';
import { asExisting, recordDate, type ActiveLog } from './activeLog';
import type { HealthRecord, RecordType } from '../../lib/types';
import type { PeriodData, SymptomData, MoodData, IntimacyData, NoteData } from '../../lib/types';

interface LogFormHostProps {
  activeLog: ActiveLog | null;
  onClose: () => void;
}

/**
 * Renders whichever log form is currently active. Only the active form is
 * mounted, so each one seeds its state from props on open and unmounts on close.
 */
export function LogFormHost({ activeLog, onClose }: LogFormHostProps) {
  if (!activeLog) return null;

  // Forms seed their state from props on mount, so each target needs its own
  // instance — keying on the record (or the date, when creating) remounts them.
  const shared = {
    key: `${activeLog.type}:${activeLog.record?.id ?? activeLog.date}`,
    isOpen: true,
    onClose,
    date: activeLog.date,
  };

  switch (activeLog.type) {
    case 'period':
      return <PeriodLogForm {...shared} existingRecord={asExisting<PeriodData>(activeLog.record)} />;
    case 'symptom':
      return <SymptomLogForm {...shared} existingRecord={asExisting<SymptomData>(activeLog.record)} />;
    case 'mood':
      return <MoodLogForm {...shared} existingRecord={asExisting<MoodData>(activeLog.record)} />;
    case 'intimacy':
      return <IntimacyLogForm {...shared} existingRecord={asExisting<IntimacyData>(activeLog.record)} />;
    case 'note':
      return <NoteLogForm {...shared} existingRecord={asExisting<NoteData>(activeLog.record)} />;
    default:
      return null;
  }
}

/**
 * Owns "which log form is open" for a page, and renders it.
 *
 * Usage:
 *   const { openLog, openEdit, logForm } = useLogForm();
 *   return <>{...page}{logForm}</>;
 */
export function useLogForm() {
  const [activeLog, setActiveLog] = useState<ActiveLog | null>(null);

  const openLog = useCallback((type: RecordType, date: number) => {
    setActiveLog({ type, date });
  }, []);

  const openEdit = useCallback((record: HealthRecord) => {
    setActiveLog({ type: record.type, date: recordDate(record), record });
  }, []);

  const closeLog = useCallback(() => {
    setActiveLog(null);
  }, []);

  return {
    activeLog,
    openLog,
    openEdit,
    closeLog,
    logForm: <LogFormHost activeLog={activeLog} onClose={closeLog} />,
  };
}
