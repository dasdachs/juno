import { Button, Select } from '../ui';
import { StepLayout } from './StepLayout';

interface BirthYearStepProps {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BirthYearStep({ value, onChange, onNext, onBack }: BirthYearStepProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 10 - i);

  return (
    <StepLayout
      title="What year were you born?"
      description="This helps us provide age-appropriate insights. You can skip this if you prefer."
      onBack={onBack}
    >
      <Select
        label="What year were you born?"
        hideLabel
        value={value || ''}
        onChange={(year) => onChange(year ? parseInt(year) : undefined)}
      >
        <option value="">Prefer not to say</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Select>

      <Button onClick={onNext} fullWidth>
        Continue
      </Button>
    </StepLayout>
  );
}
