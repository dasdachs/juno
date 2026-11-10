import type { CycleStatistics } from '../../lib/predictions';
import { InsightsSection } from './InsightsSection';
import { StatCard } from './StatCard';

export function CycleStatisticsGrid({ statistics }: { statistics: CycleStatistics }) {
  return (
    <InsightsSection title="Cycle Statistics" icon="trending_up">
      <div className="stat-grid">
        <StatCard label="Average Cycle" value={`${statistics.averageCycleLength} days`} />
        <StatCard label="Average Period" value={`${statistics.averagePeriodLength} days`} />
        <StatCard label="Shortest Cycle" value={`${statistics.shortestCycle} days`} />
        <StatCard label="Longest Cycle" value={`${statistics.longestCycle} days`} />
        <StatCard
          label="Variation"
          value={`±${statistics.cycleLengthVariation.toFixed(1)} days`}
        />
        <StatCard label="Cycles Tracked" value={statistics.totalCyclesTracked.toString()} />
      </div>
    </InsightsSection>
  );
}
