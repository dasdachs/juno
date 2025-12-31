import type { FlowIntensity } from '../../lib/types';
import { FLOW_INTENSITY_LABELS } from '../../lib/types';

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

const FLOW_COLORS: Record<FlowIntensity, { bg: string; active: string }> = {
  spotting: { bg: 'bg-rose-100', active: 'bg-rose-200 ring-2 ring-rose-500' },
  light: { bg: 'bg-rose-200', active: 'bg-rose-300 ring-2 ring-rose-500' },
  medium: { bg: 'bg-rose-300', active: 'bg-rose-400 ring-2 ring-rose-500' },
  heavy: { bg: 'bg-rose-400', active: 'bg-rose-500 ring-2 ring-rose-600' },
  very_heavy: { bg: 'bg-rose-500', active: 'bg-rose-600 ring-2 ring-rose-700' },
};

export function FlowIntensityPicker({ value, onChange }: FlowIntensityPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Flow Intensity</label>
      <div className="flex gap-2">
        {FLOW_OPTIONS.map((intensity) => {
          const isSelected = value === intensity;
          const colors = FLOW_COLORS[intensity];

          return (
            <button
              key={intensity}
              type="button"
              onClick={() => onChange(intensity)}
              className={`flex-1 py-3 px-2 rounded-lg transition-all ${
                isSelected ? colors.active : `${colors.bg} hover:opacity-80`
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full ${
                    intensity === 'spotting'
                      ? 'bg-rose-300'
                      : intensity === 'light'
                      ? 'bg-rose-400'
                      : intensity === 'medium'
                      ? 'bg-rose-500'
                      : intensity === 'heavy'
                      ? 'bg-rose-600'
                      : 'bg-rose-700'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isSelected ? 'font-medium text-rose-900' : 'text-rose-700'
                  }`}
                >
                  {FLOW_INTENSITY_LABELS[intensity]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
