import { useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Heart } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useCycles } from '../hooks/useCycles';
import { logger } from '../lib/logger';
import { format, subDays } from 'date-fns';

type SetupStep = 'welcome' | 'birth-year' | 'cycle-length' | 'period-length' | 'week-start' | 'last-period';

interface SetupData {
  birthYear?: number;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;
  lastPeriodStart?: number;
}

export function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const { createProfile } = useProfile();
  const { startNewCycle } = useCycles();
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [setupData, setSetupData] = useState<SetupData>({
    weekStartsOn: 0,
    averageCycleLength: 28,
    averagePeriodLength: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: SetupStep[] = [
    'welcome',
    'birth-year',
    'cycle-length',
    'period-length',
    'week-start',
    'last-period',
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white dark:from-rose-950 dark:to-gray-900 flex flex-col">
      {/* Progress bar */}
      {currentStep !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-10">
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {currentStep === 'welcome' && (
          <WelcomeStep onNext={goNext} />
        )}

        {currentStep === 'birth-year' && (
          <BirthYearStep
            value={setupData.birthYear}
            onChange={(value) => setSetupData({ ...setupData, birthYear: value })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'cycle-length' && (
          <CycleLengthStep
            value={setupData.averageCycleLength}
            onChange={(value) => setSetupData({ ...setupData, averageCycleLength: value })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'period-length' && (
          <PeriodLengthStep
            value={setupData.averagePeriodLength}
            onChange={(value) => setSetupData({ ...setupData, averagePeriodLength: value })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'week-start' && (
          <WeekStartStep
            value={setupData.weekStartsOn}
            onChange={(value) => setSetupData({ ...setupData, weekStartsOn: value })}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'last-period' && (
          <LastPeriodStep
            value={setupData.lastPeriodStart}
            onChange={(value) => setSetupData({ ...setupData, lastPeriodStart: value })}
            onComplete={handleComplete}
            onBack={goBack}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center max-w-md animate-fadeIn">
      <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Heart className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Welcome to Juno</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Your private period tracker. All your data stays on your device, encrypted and secure.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Let's set up a few things to give you the best experience.
      </p>
      <button
        onClick={onNext}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
      >
        Get Started
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function BirthYearStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 10 - i);

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">What year were you born?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        This helps us provide age-appropriate insights. You can skip this if you prefer.
      </p>

      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-lg focus:ring-2 focus:ring-rose-500 mb-4 transition-colors duration-200"
      >
        <option value="">Prefer not to say</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <button
        onClick={onNext}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function CycleLengthStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [customValue, setCustomValue] = useState<string>(value?.toString() || '28');

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">What's your average cycle length?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        A cycle is counted from the first day of one period to the first day of the next.
        The average is 28 days.
      </p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[24, 26, 28, 30].map((days) => (
          <button
            key={days}
            onClick={() => {
              setCustomValue(days.toString());
              onChange(days);
            }}
            className={`py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
              value === days
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {days} days
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Or enter a custom value:</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value ? parseInt(e.target.value) : undefined);
            }}
            min="20"
            max="45"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
          />
          <span className="text-gray-500 dark:text-gray-400">days</span>
        </div>
      </div>

      <button
        onClick={() => {
          onChange(undefined);
          onNext();
        }}
        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 mb-2"
      >
        I don't know
      </button>

      <button
        onClick={onNext}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function PeriodLengthStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value?: number;
  onChange: (value?: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [customValue, setCustomValue] = useState<string>(value?.toString() || '5');

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">How long does your period usually last?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Most periods last between 3 and 7 days.
      </p>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {[3, 4, 5, 6, 7].map((days) => (
          <button
            key={days}
            onClick={() => {
              setCustomValue(days.toString());
              onChange(days);
            }}
            className={`py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
              value === days
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {days}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Or enter a custom value:</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value ? parseInt(e.target.value) : undefined);
            }}
            min="1"
            max="14"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
          />
          <span className="text-gray-500 dark:text-gray-400">days</span>
        </div>
      </div>

      <button
        onClick={() => {
          onChange(undefined);
          onNext();
        }}
        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 mb-2"
      >
        I don't know
      </button>

      <button
        onClick={onNext}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function WeekStartStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: 0 | 1;
  onChange: (value: 0 | 1) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="w-full max-w-md animate-fadeIn">
      <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Calendar className="w-6 h-6 text-rose-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar preference</h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Which day should the week start on?
      </p>

      <div className="space-y-3 mb-6">
        <button
          onClick={() => onChange(0)}
          className={`w-full py-4 px-4 rounded-xl text-left transition-colors duration-200 flex items-center justify-between ${
            value === 0
              ? 'bg-rose-50 dark:bg-rose-950 border-2 border-rose-500'
              : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className={`font-medium ${value === 0 ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
            Sunday
          </span>
          {value === 0 && (
            <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        <button
          onClick={() => onChange(1)}
          className={`w-full py-4 px-4 rounded-xl text-left transition-colors duration-200 flex items-center justify-between ${
            value === 1
              ? 'bg-rose-50 dark:bg-rose-950 border-2 border-rose-500'
              : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span className={`font-medium ${value === 1 ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
            Monday
          </span>
          {value === 1 && (
            <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
      >
        Continue
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function LastPeriodStep({
  value,
  onChange,
  onComplete,
  onBack,
  isSubmitting,
}: {
  value?: number;
  onChange: (value?: number) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const today = new Date();
  const maxDate = format(today, 'yyyy-MM-dd');
  const minDate = format(subDays(today, 90), 'yyyy-MM-dd');

  const handleDateChange = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString);
      date.setHours(0, 0, 0, 0);
      onChange(date.getTime());
    } else {
      onChange(undefined);
    }
  };

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">When did your last period start?</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        This helps us make accurate predictions right away. You can skip this and log it later.
      </p>

      <div className="mb-6">
        <input
          type="date"
          value={value ? format(new Date(value), 'yyyy-MM-dd') : ''}
          onChange={(e) => handleDateChange(e.target.value)}
          max={maxDate}
          min={minDate}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl text-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
        />
      </div>

      {value && (
        <div className="bg-rose-50 dark:bg-rose-950 rounded-xl p-4 mb-6">
          <p className="text-sm text-rose-700 dark:text-rose-400">
            Selected: <strong>{format(new Date(value), 'MMMM d, yyyy')}</strong>
          </p>
        </div>
      )}

      <button
        onClick={() => {
          onChange(undefined);
          onComplete();
        }}
        className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 mb-2"
        disabled={isSubmitting}
      >
        Skip for now
      </button>

      <button
        onClick={onComplete}
        disabled={isSubmitting}
        className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            Complete Setup
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
