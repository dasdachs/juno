import { useEffect, useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { ProfileSetup } from "./ProfileSetup";
import { Button, Card, Progress } from "./ui";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { hasCompletedSetup, isLoading, error, refresh } = useProfile();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && !hasCompletedSetup) {
      setShowSetup(true);
    }
  }, [isLoading, error, hasCompletedSetup]);

  if (isLoading) {
    return <Progress fullScreen />;
  }

  // A profile that exists but could not be read must never be mistaken for
  // "no profile yet": running setup again would overwrite it.
  if (error) {
    return (
      <main className="centered-screen">
        <Card variant="elevated" className="onboarding-card center-align stack">
          <p className="headline bold">Your profile could not be read</p>
          <p className="supporting">
            Nothing has been changed. Close other Juno tabs, then reload and unlock again.
          </p>
          <div>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </Card>
      </main>
    );
  }

  if (showSetup) {
    return (
      <ProfileSetup
        onComplete={() => {
          refresh();
          setShowSetup(false);
        }}
      />
    );
  }

  return <>{children}</>;
}
