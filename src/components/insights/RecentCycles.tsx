import { useDateFormat } from '../../contexts/DateFormatContext';
import type { CycleData } from '../../lib/types';
import { Card, List, ListItem } from '../ui';
import { InsightsSection } from './InsightsSection';

function CycleLengths({ cycle }: { cycle: CycleData }) {
  return (
    <div className="right-align">
      {cycle.cycleLength ? (
        <div>{cycle.cycleLength} days</div>
      ) : (
        <div className="primary-text">Current</div>
      )}
      {cycle.periodLength && <div className="supporting">{cycle.periodLength} day period</div>}
    </div>
  );
}

/** The six most recent cycles, newest first. */
export function RecentCycles({ cycles }: { cycles: CycleData[] }) {
  const { formatShort } = useDateFormat();

  return (
    <InsightsSection title="Recent Cycles" icon="monitoring">
      <Card variant="outlined" className="list-card">
        <List>
          {cycles
            .slice(-6)
            .reverse()
            .map((cycle) => (
              <ListItem
                key={cycle.id}
                headline={`Cycle ${cycle.cycleNumber}`}
                supporting={`Started ${formatShort(cycle.startDate)}`}
                trailing={<CycleLengths cycle={cycle} />}
              />
            ))}
        </List>
      </Card>
    </InsightsSection>
  );
}
