import { Button, SegmentedButton } from '../ui';
import { StepLayout } from './StepLayout';

interface WeekStartStepProps {
  value: 0 | 1;
  onChange: (value: 0 | 1) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WeekStartStep({ value, onChange, onNext, onBack }: WeekStartStepProps) {
  return (
    <StepLayout
      title="Calendar preference"
      description="Which day should the week start on?"
      icon="calendar_month"
      onBack={onBack}
    >
      <SegmentedButton
        label="Which day should the week start on?"
        segments={[
          { value: '0', label: 'Sunday' },
          { value: '1', label: 'Monday' },
        ]}
        value={value === 0 ? '0' : '1'}
        onChange={(day) => onChange(day === '0' ? 0 : 1)}
      />

      <Button onClick={onNext} fullWidth>
        Continue
      </Button>
    </StepLayout>
  );
}
