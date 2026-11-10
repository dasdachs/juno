import type { FlowIntensity } from '../../lib/types';
import { FLOW_INTENSITY_LABELS } from '../../lib/types';

const FLOW_SCALE: Array<{ intensity: FlowIntensity; className: string }> = [
  { intensity: 'spotting', className: 'bg-rose-200' },
  { intensity: 'light', className: 'bg-rose-300' },
  { intensity: 'medium', className: 'bg-rose-400' },
  { intensity: 'heavy', className: 'bg-rose-500' },
  { intensity: 'very_heavy', className: 'bg-rose-600' },
];

export function CalendarLegend() {
  return (
    <div className="px-4 py-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
      {/* Flow intensity is encoded as background shade on period days */}
      <div className="flex items-center gap-2">
        <span className="shrink-0">Flow</span>
        <div className="flex items-center gap-0.5" role="img" aria-label="Flow intensity scale, lighter to heavier">
          {FLOW_SCALE.map(({ intensity, className }) => (
            <span
              key={intensity}
              title={FLOW_INTENSITY_LABELS[intensity]}
              className={`w-4 h-3 first:rounded-l-sm last:rounded-r-sm ${className}`}
            />
          ))}
        </div>
        <span className="text-gray-500 dark:text-gray-500">light → heavy</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-2 border-dashed border-rose-300 dark:border-rose-400" />
          <span>Predicted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span>Intimacy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Symptoms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Mood</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span>Note</span>
        </div>
      </div>
    </div>
  );
}
