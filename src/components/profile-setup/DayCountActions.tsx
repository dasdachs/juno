import { Button } from '../ui';

interface DayCountActionsProps {
  onChange: (value?: number) => void;
  onNext: () => void;
}

/** "I don't know" (clears the answer and moves on) above the primary Continue button. */
export function DayCountActions({ onChange, onNext }: DayCountActionsProps) {
  return (
    <div className="stack tight">
      <Button
        variant="text"
        fullWidth
        onClick={() => {
          onChange(undefined);
          onNext();
        }}
      >
        I don't know
      </Button>
      <Button onClick={onNext} fullWidth>
        Continue
      </Button>
    </div>
  );
}
