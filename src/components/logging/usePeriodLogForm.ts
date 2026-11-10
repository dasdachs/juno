import { useState } from 'react';
import { format } from 'date-fns';
import { useLogSubmit } from './useLogSubmit';
import { usePeriodSave } from './usePeriodSave';
import type { FlowIntensity, PeriodData } from '../../lib/types';

export type PeriodLogMode = 'single' | 'multi';

interface PeriodLogFormOptions {
  date: number;
  existingRecord?: { id: string; data: PeriodData };
  onClose: () => void;
}

/** State and save/delete handlers behind `PeriodLogForm`. */
export function usePeriodLogForm({ date, existingRecord, onClose }: PeriodLogFormOptions) {
  const isoDate = format(new Date(date), 'yyyy-MM-dd');
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(
    existingRecord?.data.flowIntensity ?? null
  );
  const [notes, setNotes] = useState(existingRecord?.data.notes ?? '');
  const [mode, setMode] = useState<PeriodLogMode>('single');
  const [startDate, setStartDate] = useState(isoDate);
  const [endDate, setEndDate] = useState(isoDate);

  const handleClose = () => {
    // Reset form state when closing
    setMode('single');
    setStartDate(isoDate);
    setEndDate(isoDate);
    onClose();
  };

  const existingId = existingRecord?.id;
  const save = usePeriodSave({ existingId, date, flowIntensity, notes, mode, startDate, endDate });
  const submit = useLogSubmit({
    type: 'period',
    existingId,
    canSave: Boolean(flowIntensity),
    save,
    savedToast: existingRecord ? 'Period updated' : 'Period logged',
    logName: 'period log',
    onClose: handleClose,
  });

  return {
    flowIntensity, setFlowIntensity, notes, setNotes, mode, setMode,
    startDate, setStartDate, endDate, setEndDate, handleClose, ...submit,
    canSave: Boolean(flowIntensity) && !(mode === 'multi' && (!startDate || !endDate)),
  };
}
