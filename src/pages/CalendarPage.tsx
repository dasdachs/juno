import { useState, useCallback } from 'react';
import { Calendar, DayDetailSheet } from '../components/calendar';
import { useLogForm, QuickLogSheet } from '../components/logging';
import { Fab } from '../components/ui';
import type { DayData, HealthRecord, RecordType } from '../lib/types';

export function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const { openLog, openEdit, logForm } = useLogForm();

  const handleDaySelect = useCallback((day: DayData) => {
    setSelectedDay(day);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const handleLog = useCallback(
    (type: RecordType, date: number) => {
      openLog(type, date);
      setSelectedDay(null);
    },
    [openLog]
  );

  const handleEdit = useCallback(
    (record: HealthRecord) => {
      openEdit(record);
      setSelectedDay(null);
    },
    [openEdit]
  );

  const handleQuickLog = useCallback(
    (type: RecordType) => {
      setIsQuickLogOpen(false);
      openLog(type, Date.now());
    },
    [openLog]
  );

  return (
    <div className="page-container">
      <Calendar onDaySelect={handleDaySelect} />

      {/* Shortcut for the most common action: logging something for today */}
      <Fab
        icon="add"
        label="Log today"
        aria-label="Log something for today"
        onClick={() => setIsQuickLogOpen(true)}
      />

      <QuickLogSheet
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSelect={handleQuickLog}
      />

      <DayDetailSheet
        day={selectedDay}
        onClose={handleCloseDetail}
        onLog={handleLog}
        onEditRecord={handleEdit}
      />

      {logForm}
    </div>
  );
}
