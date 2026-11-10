import { FlowIntensityPicker } from '../common/FlowIntensityPicker';
import { BottomSheet, SegmentedButton } from '../ui';
import { LogFormActions } from './LogFormActions';
import { NotesField } from './NotesField';
import { PeriodDateRange } from './PeriodDateRange';
import { usePeriodLogForm, type PeriodLogMode } from './usePeriodLogForm';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type { PeriodData } from '../../lib/types';

interface PeriodLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: PeriodData;
  };
}

const MODES: Array<{ value: PeriodLogMode; label: string }> = [
  { value: 'single', label: 'Single Day' },
  { value: 'multi', label: 'Multiple Days' },
];

export function PeriodLogForm({ isOpen, onClose, date, existingRecord }: PeriodLogFormProps) {
  const { formatLong } = useDateFormat();
  const form = usePeriodLogForm({ date, existingRecord, onClose });

  return (
    <BottomSheet isOpen={isOpen} onClose={form.handleClose} title={existingRecord ? 'Edit Period' : 'Log Period'}>
      <div className="stack">
        {!existingRecord && (
          <>
            <p className="supporting">{formatLong(date)}</p>
            <SegmentedButton label="Days to log" segments={MODES} value={form.mode} onChange={form.setMode} />
            {form.mode === 'multi' && (
              <PeriodDateRange
                startDate={form.startDate}
                endDate={form.endDate}
                onStartChange={form.setStartDate}
                onEndChange={form.setEndDate}
              />
            )}
          </>
        )}
        <FlowIntensityPicker value={form.flowIntensity} onChange={form.setFlowIntensity} />
        <NotesField value={form.notes} onChange={form.setNotes} />
        <LogFormActions
          onSave={form.handleSave}
          onCancel={form.handleClose}
          onDelete={form.handleDelete}
          canSave={form.canSave}
          isSubmitting={form.isSubmitting}
        />
      </div>
    </BottomSheet>
  );
}
