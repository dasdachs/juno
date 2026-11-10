import { format, subDays } from 'date-fns';
import { useDateFormat } from '../../contexts/DateFormatContext';
import { openDatePicker } from '../../lib/dateFormat';
import { Button, Notice, TextField } from '../ui';
import { BusyLabel } from '../unlock/BusyLabel';
import { StepLayout } from './StepLayout';

interface LastPeriodStepProps {
  value?: number;
  onChange: (value?: number) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function LastPeriodStep({ value, onChange, onComplete, onBack, isSubmitting }: LastPeriodStepProps) {
  const { formatLong } = useDateFormat();
  const today = new Date();
  const maxDate = format(today, 'yyyy-MM-dd');
  const minDate = format(subDays(today, 90), 'yyyy-MM-dd');

  const handleDateChange = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      onChange(date.getTime());
    } else {
      onChange(undefined);
    }
  };

  return (
    <StepLayout
      title="When did your last period start?"
      description="This helps us make accurate predictions right away. You can skip this and log it later."
      onBack={onBack}
    >
      <TextField
        label="Start date"
        type="date"
        value={value ? format(new Date(value), 'yyyy-MM-dd') : ''}
        onChange={handleDateChange}
        onClick={openDatePicker}
        onFocus={openDatePicker}
        max={maxDate}
        min={minDate}
      />

      {value && (
        <Notice tone="success" icon="event">
          Selected: <strong>{formatLong(value)}</strong>
        </Notice>
      )}

      <div className="stack tight">
        <Button
          variant="text"
          fullWidth
          disabled={isSubmitting}
          onClick={() => {
            onChange(undefined);
            onComplete();
          }}
        >
          Skip for now
        </Button>
        <Button onClick={onComplete} disabled={isSubmitting} fullWidth>
          {isSubmitting ? <BusyLabel>Setting up...</BusyLabel> : 'Complete Setup'}
        </Button>
      </div>
    </StepLayout>
  );
}
