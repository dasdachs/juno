import { Card, SegmentedButton } from '../ui';

const WEEK_START_SEGMENTS = [
  { value: '0' as const, label: 'Sunday' },
  { value: '1' as const, label: 'Monday' },
];

interface PreferencesCardProps {
  weekStartsOn: 0 | 1;
  onWeekStartsOnChange: (weekStartsOn: 0 | 1) => void;
}

export function PreferencesCard({ weekStartsOn, onWeekStartsOnChange }: PreferencesCardProps) {
  return (
    <Card variant="outlined" className="stack">
      <h2 className="card-title">Preferences</h2>

      <div className="stack tight">
        <span className="supporting">Week Starts On</span>
        <SegmentedButton
          label="Week Starts On"
          segments={WEEK_START_SEGMENTS}
          value={weekStartsOn === 1 ? '1' : '0'}
          onChange={(value) => onWeekStartsOnChange(value === '1' ? 1 : 0)}
        />
      </div>
    </Card>
  );
}
