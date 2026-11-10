import { DayCountActions } from './DayCountActions';
import { DayCountPicker } from './DayCountPicker';
import { StepLayout } from './StepLayout';

interface PeriodLengthStepProps {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PeriodLengthStep({ value, onChange, onNext, onBack }: PeriodLengthStepProps) {
  return (
    <StepLayout
      title="How long does your period usually last?"
      description="Most periods last between 3 and 7 days."
      onBack={onBack}
    >
      <DayCountPicker
        value={value}
        onChange={onChange}
        presets={[3, 4, 5, 6, 7]}
        presetLabel={(days) => `${days}`}
        fallback="5"
        min="1"
        max="14"
      />
      <DayCountActions onChange={onChange} onNext={onNext} />
    </StepLayout>
  );
}
