import type { FlowIntensity } from '../../lib/types';
import { FLOW_INTENSITY_LABELS } from '../../lib/types';

const FLOW_SCALE: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy', 'very_heavy'];

const DOTS = [
  { kind: 'intimacy', label: 'Intimacy' },
  { kind: 'symptoms', label: 'Symptoms' },
  { kind: 'mood', label: 'Mood' },
  { kind: 'note', label: 'Note' },
];

export function CalendarLegend() {
  return (
    <div className="calendar-legend">
      {/* Flow intensity is encoded as the fill shade of period days */}
      <div className="legend-row">
        <span>Flow</span>
        <span className="flow-scale" role="img" aria-label="Flow intensity scale, lighter to heavier">
          {FLOW_SCALE.map((intensity) => (
            <span
              key={intensity}
              title={FLOW_INTENSITY_LABELS[intensity]}
              className={`flow-${intensity}`}
            />
          ))}
        </span>
        <span>light → heavy</span>
      </div>

      <div className="legend-row">
        <span className="legend-item">
          <span className="swatch-predicted" />
          Predicted
        </span>
        {DOTS.map(({ kind, label }) => (
          <span key={kind} className="legend-item">
            <span className={`dot dot-${kind}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
