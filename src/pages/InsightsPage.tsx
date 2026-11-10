import { usePredictions } from '../hooks/usePredictions';
import { useCycles } from '../hooks/useCycles';
import {
  CurrentStatus,
  CycleStatisticsGrid,
  PredictionCard,
  RecentCycles,
} from '../components/insights';
import { Card, Icon } from '../components/ui';

export function InsightsPage() {
  const { prediction, currentCycleDay, daysUntilPeriod, statistics } = usePredictions();
  const { cycles } = useCycles();

  const hasData = cycles.length > 0;

  return (
    <div className="page-container stack">
      <h1 className="page-title">Insights</h1>

      {!hasData ? (
        <Card className="empty-state">
          <Icon name="calendar_month" size="extra" />
          <p>Start logging your period to see insights and predictions.</p>
        </Card>
      ) : (
        <>
          <CurrentStatus currentCycleDay={currentCycleDay} daysUntilPeriod={daysUntilPeriod} />
          {prediction && <PredictionCard prediction={prediction} />}
          {statistics && <CycleStatisticsGrid statistics={statistics} />}
          <RecentCycles cycles={cycles} />
        </>
      )}
    </div>
  );
}
