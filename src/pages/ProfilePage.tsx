import { useNavigate } from 'react-router-dom';
import {
  CycleDefaultsCard,
  PersonalInfoCard,
  PreferencesCard,
  useProfileForm,
} from '../components/profile';
import { Button, IconButton, Progress } from '../components/ui';

export function ProfilePage() {
  const navigate = useNavigate();
  const { values, setField, save, isLoading, isSaving, showSuccess } = useProfileForm();

  if (isLoading) {
    return (
      <div className="page-container">
        <Progress />
      </div>
    );
  }

  const idle = !isSaving && !showSuccess;

  return (
    <div className="page-container stack">
      <div className="page-header">
        <IconButton icon="arrow_back" label="Back" onClick={() => navigate(-1)} />
        <h1 className="page-title">Profile</h1>
      </div>

      <PersonalInfoCard values={values} setField={setField} />
      <CycleDefaultsCard values={values} setField={setField} />
      <PreferencesCard
        weekStartsOn={values.weekStartsOn}
        onWeekStartsOnChange={(v) => setField('weekStartsOn', v)}
      />

      <Button fullWidth icon={idle ? 'save' : undefined} onClick={save} disabled={isSaving}>
        {isSaving ? 'Saving...' : showSuccess ? 'Saved!' : 'Save Changes'}
      </Button>
    </div>
  );
}
