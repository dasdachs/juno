import { Avatar } from '../common';
import { Card, TextField } from '../ui';
import { AvatarField } from './AvatarField';
import type { ProfileFormValues, SetProfileField } from './useProfileForm';

interface ProfileCardProps {
  values: ProfileFormValues;
  setField: SetProfileField;
}

export function PersonalInfoCard({ values, setField }: ProfileCardProps) {
  return (
    <Card variant="outlined" className="stack">
      <h2 className="card-title">Personal Information</h2>

      <div className="profile-identity">
        <Avatar avatarUrl={values.avatarUrl || undefined} name={values.name || undefined} size="lg" />
        <TextField
          label="Display Name"
          type="text"
          value={values.name}
          onChange={(v) => setField('name', v)}
          placeholder="e.g., Jani"
        />
      </div>

      <AvatarField avatarUrl={values.avatarUrl} onChange={(v) => setField('avatarUrl', v)} />

      <TextField
        label="Birth Year"
        type="number"
        value={values.birthYear}
        onChange={(v) => setField('birthYear', v)}
        placeholder="e.g., 1990"
        min="1900"
        max={new Date().getFullYear()}
        helper="Used for age-related insights (optional)"
      />

      <div className="field-grid">
        <TextField
          label="Height (cm)"
          type="number"
          value={values.height}
          onChange={(v) => setField('height', v)}
          placeholder="e.g., 165"
        />
        <TextField
          label="Weight (kg)"
          type="number"
          value={values.weight}
          onChange={(v) => setField('weight', v)}
          placeholder="e.g., 60"
        />
      </div>
    </Card>
  );
}
