import { Card, TextField } from '../ui';
import type { ProfileFormValues, SetProfileField } from './useProfileForm';

interface CycleDefaultsCardProps {
  values: ProfileFormValues;
  setField: SetProfileField;
}

export function CycleDefaultsCard({ values, setField }: CycleDefaultsCardProps) {
  return (
    <Card variant="outlined" className="stack">
      <h2 className="card-title">Cycle Defaults</h2>
      <p className="supporting">
        These are used for predictions when you don't have enough cycle history.
      </p>

      <div className="field-grid">
        <div className="unit-field">
          <TextField
            label="Average Cycle Length"
            type="number"
            value={values.avgCycleLength}
            onChange={(v) => setField('avgCycleLength', v)}
            placeholder="28"
            min="20"
            max="45"
          />
          <span className="supporting">days</span>
        </div>
        <div className="unit-field">
          <TextField
            label="Average Period Length"
            type="number"
            value={values.avgPeriodLength}
            onChange={(v) => setField('avgPeriodLength', v)}
            placeholder="5"
            min="2"
            max="10"
          />
          <span className="supporting">days</span>
        </div>
      </div>
    </Card>
  );
}
