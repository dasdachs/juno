import { Card } from '../ui';

interface CycleStatusProps {
  currentCycleDay: number | null | undefined;
  daysUntilPeriod: number | null;
  confidence?: string;
}

function periodText(daysUntilPeriod: number): string {
  if (daysUntilPeriod === 0) return 'Period expected today';
  if (daysUntilPeriod === 1) return 'Period expected tomorrow';
  return `Period in ${daysUntilPeriod} days`;
}

/** Where the user is in their cycle and when the next period is expected. */
export function CycleStatus({ currentCycleDay, daysUntilPeriod, confidence }: CycleStatusProps) {
  const hasCountdown = daysUntilPeriod !== null && daysUntilPeriod >= 0;
  if (!currentCycleDay && !hasCountdown) return null;

  return (
    <Card className="primary-container cycle-status">
      {currentCycleDay && (
        <div>
          <b>Day {currentCycleDay}</b> of your cycle
        </div>
      )}
      {hasCountdown && (
        <div>
          {periodText(daysUntilPeriod)}
          {confidence && daysUntilPeriod > 0 && (
            <span className="small-text"> ({confidence} confidence)</span>
          )}
        </div>
      )}
    </Card>
  );
}
