import { useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useCycles } from '../../hooks/useCycles';
import { logger } from '../../lib/logger';

export type SetupStep = 'welcome' | 'birth-year' | 'cycle-length' | 'period-length' | 'week-start' | 'last-period';

export interface SetupData {
  birthYear?: number;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;
  lastPeriodStart?: number;
}

const steps: SetupStep[] = ['welcome', 'birth-year', 'cycle-length', 'period-length', 'week-start', 'last-period'];

/** Wizard state for first-run profile setup: current step, answers and submission. */
export function useProfileSetup(onComplete: () => void) {
  const { createProfile } = useProfile();
  const { startNewCycle } = useCycles();
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [setupData, setSetupData] = useState<SetupData>({
    weekStartsOn: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Create user profile
      await createProfile({
        birthYear: setupData.birthYear,
        averageCycleLength: setupData.averageCycleLength,
        averagePeriodLength: setupData.averagePeriodLength,
        weekStartsOn: setupData.weekStartsOn,
      });

      // If last period date was provided, create the first cycle
      if (setupData.lastPeriodStart) {
        await startNewCycle(setupData.lastPeriodStart);
      }

      onComplete();
    } catch (error) {
      logger.error('Failed to complete setup:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { currentStep, setupData, setSetupData, isSubmitting, progress, goNext, goBack, handleComplete };
}
