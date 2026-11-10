import { Card } from './ui';
import { SetupStepView } from './profile-setup/SetupStepView';
import { useProfileSetup } from './profile-setup/useProfileSetup';

export function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const wizard = useProfileSetup(onComplete);

  return (
    <main className="centered-screen">
      {/* Progress bar */}
      {wizard.currentStep !== 'welcome' && (
        <progress className="setup-progress" aria-label="Setup progress" value={wizard.progress} max={100} />
      )}

      <Card variant="elevated" className="onboarding-card">
        <SetupStepView wizard={wizard} />
      </Card>
    </main>
  );
}
