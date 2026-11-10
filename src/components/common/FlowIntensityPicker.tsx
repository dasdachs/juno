import type { FlowIntensity } from '../../lib/types';
import { FLOW_INTENSITY_LABELS } from '../../lib/types';
import { cx } from '../ui';

interface FlowIntensityPickerProps {
  value: FlowIntensity | null;
  onChange: (intensity: FlowIntensity) => void;
}

const FLOW_OPTIONS: FlowIntensity[] = [
  'spotting',
  'light',
  'medium',
  'heavy',
  'very_heavy',
];

export function FlowIntensityPicker({ value, onChange }: FlowIntensityPickerProps) {
  return (
    <div className="stack tight">
      <p className="picker-label">Flow Intensity</p>
      <div className="tile-grid cols-5">
        {FLOW_OPTIONS.map((intensity) => (
          <button
            key={intensity}
            type="button"
            className="tile"
            aria-pressed={value === intensity}
            onClick={() => onChange(intensity)}
          >
            <span className={cx('flow-swatch', `flow-${intensity}`)} />
            <span>{FLOW_INTENSITY_LABELS[intensity]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
