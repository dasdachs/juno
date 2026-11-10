import type { SymptomType, SymptomSeverity, SymptomEntry } from '../../lib/types';
import { SYMPTOM_TYPE_LABELS } from '../../lib/types';
import { Chip } from '../ui';
import { SymptomSeverityList } from './SymptomSeverityList';

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
    onChange(value.map((s) => (s.type === type ? { ...s, severity } : s)));
  };

  return (
    <div className="stack tight">
      <p className="picker-label">Symptoms</p>
      <div className="chip-set">
        {SYMPTOM_OPTIONS.map((symptom) => (
          <Chip key={symptom} selected={selectedSymptoms.has(symptom)} onClick={() => toggleSymptom(symptom)}>
            {SYMPTOM_TYPE_LABELS[symptom]}
          </Chip>
        ))}
      </div>
      {value.length > 0 && <SymptomSeverityList symptoms={value} onChange={updateSeverity} />}
    </div>
  );
}
