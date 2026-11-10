import type { ReactNode } from 'react';
import type { CyclePrediction } from '../../lib/types';
import { Card, Chip, cx } from '../ui';
import { InsightsSection } from './InsightsSection';

const CONFIDENCE_CLASS: Record<CyclePrediction['confidence'], string> = {
  high: 'primary-container',
  medium: 'tertiary-container',
  low: '',
};

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function PredictionCard({ prediction }: { prediction: CyclePrediction }) {
  return (
    <InsightsSection title="Prediction" icon="target">
      <Card variant="outlined">
        <DetailRow label="Confidence">
          <Chip className={cx('capitalize', CONFIDENCE_CLASS[prediction.confidence])}>
            {prediction.confidence}
          </Chip>
        </DetailRow>
        <DetailRow label="Based on">{prediction.basedOnCycles} cycles</DetailRow>
        <DetailRow label="Predicted cycle length">{prediction.cycleLength} days</DetailRow>
        <DetailRow label="Predicted period length">{prediction.periodLength} days</DetailRow>
      </Card>
    </InsightsSection>
  );
}
