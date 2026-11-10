import type { SymptomType, SymptomSeverity, SymptomEntry } from '../../lib/types';
import { SYMPTOM_TYPE_LABELS, SEVERITY_LABELS } from '../../lib/types';
import { Chip } from '../ui';

interface SymptomSeverityListProps {
  symptoms: SymptomEntry[];
  onChange: (type: SymptomType, severity: SymptomSeverity) => void;
}

const SEVERITIES: SymptomSeverity[] = [1, 2, 3];

/** Severity controls for the selected symptoms. */
export function SymptomSeverityList({ symptoms, onChange }: SymptomSeverityListProps) {
  return (
    <div className="stack tight">
      <p className="picker-label">Severity</p>
      {symptoms.map((entry) => (
        <div key={entry.type} className="severity-row">
          <span>{SYMPTOM_TYPE_LABELS[entry.type]}</span>
          <div className="chip-set">
            {SEVERITIES.map((severity) => (
              <Chip
                key={severity}
                selected={entry.severity === severity}
                onClick={() => onChange(entry.type, severity)}
              >
                {SEVERITY_LABELS[severity]}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
