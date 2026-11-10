import { BirthYearStep } from './BirthYearStep';
import { CycleLengthStep } from './CycleLengthStep';
import { LastPeriodStep } from './LastPeriodStep';
import { PeriodLengthStep } from './PeriodLengthStep';
import { WeekStartStep } from './WeekStartStep';
import { WelcomeStep } from './WelcomeStep';
import type { useProfileSetup } from './useProfileSetup';

/** Renders the component for the wizard's current step. */
export function SetupStepView({ wizard }: { wizard: ReturnType<typeof useProfileSetup> }) {
  const { currentStep, setupData, setSetupData, isSubmitting, goNext, goBack, handleComplete } = wizard;
  const nav = { onNext: goNext, onBack: goBack };

  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep onNext={goNext} />;
    case 'birth-year':
      return (
        <BirthYearStep
          value={setupData.birthYear}
          onChange={(value) => setSetupData({ ...setupData, birthYear: value })}
          {...nav}
        />
      );
    case 'cycle-length':
      return (
        <CycleLengthStep
          value={setupData.averageCycleLength}
          onChange={(value) => setSetupData({ ...setupData, averageCycleLength: value })}
          {...nav}
        />
      );
    case 'period-length':
      return (
        <PeriodLengthStep
          value={setupData.averagePeriodLength}
          onChange={(value) => setSetupData({ ...setupData, averagePeriodLength: value })}
          {...nav}
        />
      );
    case 'week-start':
      return (
        <WeekStartStep
          value={setupData.weekStartsOn}
          onChange={(value) => setSetupData({ ...setupData, weekStartsOn: value })}
          {...nav}
        />
      );
    case 'last-period':
      return (
        <LastPeriodStep
          value={setupData.lastPeriodStart}
          onChange={(value) => setSetupData({ ...setupData, lastPeriodStart: value })}
          onComplete={handleComplete}
          onBack={goBack}
          isSubmitting={isSubmitting}
        />
      );
  }
}
