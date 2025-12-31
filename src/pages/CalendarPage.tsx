import { useState, useCallback } from 'react';
import { Calendar, DayDetailSheet } from '../components/calendar';
import {
  PeriodLogForm,
  SymptomLogForm,
  MoodLogForm,
  IntimacyLogForm,
  NoteLogForm,
} from '../components/logging';
import type { DayData } from '../lib/types';

type LogType = 'period' | 'symptom' | 'mood' | 'intimacy' | 'note' | null;

export function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [activeLogForm, setActiveLogForm] = useState<LogType>(null);
  const [logDate, setLogDate] = useState<number>(0);

  const handleDaySelect = useCallback((day: DayData) => {
    setSelectedDay(day);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDay(null);
  }, []);

  const openLogForm = (type: LogType, date: number) => {
    setActiveLogForm(type);
    setLogDate(date);
    setSelectedDay(null);
  };

  const closeLogForm = () => {
    setActiveLogForm(null);
    setLogDate(0);
  };

  return (
    <div className="pb-20 sm:pb-0">
      <Calendar onDaySelect={handleDaySelect} />

      <DayDetailSheet
        day={selectedDay}
        onClose={handleCloseDetail}
        onLogPeriod={(date) => openLogForm('period', date)}
        onLogSymptom={(date) => openLogForm('symptom', date)}
        onLogMood={(date) => openLogForm('mood', date)}
        onLogIntimacy={(date) => openLogForm('intimacy', date)}
        onLogNote={(date) => openLogForm('note', date)}
      />

      <PeriodLogForm
        isOpen={activeLogForm === 'period'}
        onClose={closeLogForm}
        date={logDate}
      />

      <SymptomLogForm
        isOpen={activeLogForm === 'symptom'}
        onClose={closeLogForm}
        date={logDate}
      />

      <MoodLogForm
        isOpen={activeLogForm === 'mood'}
        onClose={closeLogForm}
        date={logDate}
      />

      <IntimacyLogForm
        isOpen={activeLogForm === 'intimacy'}
        onClose={closeLogForm}
        date={logDate}
      />

      <NoteLogForm
        isOpen={activeLogForm === 'note'}
        onClose={closeLogForm}
        date={logDate}
      />
    </div>
  );
}
