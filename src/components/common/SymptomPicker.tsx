import type { SymptomType, SymptomSeverity, SymptomEntry } from '../../lib/types';
import { SYMPTOM_TYPE_LABELS, SEVERITY_LABELS } from '../../lib/types';

interface SymptomPickerProps {
  value: SymptomEntry[];
  onChange: (symptoms: SymptomEntry[]) => void;
}

const SYMPTOM_OPTIONS: SymptomType[] = [
  'cramps',
  'headache',
  'backache',
  'breast_tenderness',
  'bloating',
  'nausea',
  'fatigue',
  'acne',
  'cravings',
  'insomnia',
  'dizziness',
  'joint_pain',
];

export function SymptomPicker({ value, onChange }: SymptomPickerProps) {
  const selectedSymptoms = new Map(value.map((s) => [s.type, s.severity]));

  const toggleSymptom = (type: SymptomType) => {
    if (selectedSymptoms.has(type)) {
      // Remove symptom
      onChange(value.filter((s) => s.type !== type));
    } else {
      // Add symptom with default severity
      onChange([...value, { type, severity: 2 }]);
    }
  };

  const updateSeverity = (type: SymptomType, severity: SymptomSeverity) => {
    onChange(
      value.map((s) => (s.type === type ? { ...s, severity } : s))
    );
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Symptoms</label>
      <div className="grid grid-cols-3 gap-2">
        {SYMPTOM_OPTIONS.map((symptom) => {
          const isSelected = selectedSymptoms.has(symptom);

          return (
            <button
              key={symptom}
              type="button"
              onClick={() => toggleSymptom(symptom)}
              className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {SYMPTOM_TYPE_LABELS[symptom]}
            </button>
          );
        })}
      </div>

      {/* Severity controls for selected symptoms */}
      {value.length > 0 && (
        <div className="mt-4 space-y-3">
          <label className="text-sm font-medium text-gray-700">Severity</label>
          {value.map((entry) => (
            <div
              key={entry.type}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <span className="text-sm text-gray-700">
                {SYMPTOM_TYPE_LABELS[entry.type]}
              </span>
              <div className="flex gap-1">
                {([1, 2, 3] as SymptomSeverity[]).map((severity) => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => updateSeverity(entry.type, severity)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      entry.severity === severity
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {SEVERITY_LABELS[severity]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
