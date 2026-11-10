import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Calendar, DayDetailSheet } from '../components/calendar';
import { useLogForm, QuickLogSheet } from '../components/logging';
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
    <div className="pb-20 sm:pb-0 transition-colors duration-200">
      <Calendar onDaySelect={handleDaySelect} />

      {/* Shortcut for the most common action: logging something for today */}
      <button
        type="button"
        onClick={() => setIsQuickLogOpen(true)}
        aria-label="Log something for today"
        className="fixed right-4 bottom-20 sm:bottom-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-colors duration-200"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">Log today</span>
      </button>

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
