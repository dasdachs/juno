import { Card, cx } from '../ui';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Headline figure on a primary container, for the current-status numbers. */
  emphasis?: boolean;
}

/** One figure with its caption: large number, small label. */
export function StatCard({ label, value, emphasis }: StatCardProps) {
  return (
    <Card className={emphasis ? 'primary-container' : undefined}>
      <div className={cx('stat-value', emphasis && 'large')}>{value}</div>
      <div className="stat-label">{label}</div>
    </Card>
  );
}
