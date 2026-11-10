import { DayCountActions } from './DayCountActions';
import { DayCountPicker } from './DayCountPicker';
import { StepLayout } from './StepLayout';

interface CycleLengthStepProps {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CycleLengthStep({ value, onChange, onNext, onBack }: CycleLengthStepProps) {
  return (
    <StepLayout
      title="What's your average cycle length?"
      description="A cycle is counted from the first day of one period to the first day of the next. The average is 28 days."
      onBack={onBack}
    >
      <DayCountPicker
        value={value}
        onChange={onChange}
        presets={[24, 26, 28, 30]}
        presetLabel={(days) => `${days} days`}
        fallback="28"
        min="20"
        max="45"
      />
      <DayCountActions onChange={onChange} onNext={onNext} />
    </StepLayout>
  );
}
