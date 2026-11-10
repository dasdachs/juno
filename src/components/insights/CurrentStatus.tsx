import { InsightsSection } from './InsightsSection';
import { StatCard } from './StatCard';

interface CurrentStatusProps {
  currentCycleDay: number | null;
  daysUntilPeriod: number | null;
}

export function CurrentStatus({ currentCycleDay, daysUntilPeriod }: CurrentStatusProps) {
  return (
    <InsightsSection title="Current Status">
      <div className="stat-grid">
        <StatCard emphasis label="Cycle Day" value={currentCycleDay ?? '-'} />
        <StatCard
          emphasis
          label="Days Until Period"
          value={daysUntilPeriod !== null ? daysUntilPeriod : '-'}
        />
      </div>
    </InsightsSection>
  );
}
