import { useEffect, useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { ProfileSetup } from "./ProfileSetup";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { hasCompletedSetup, isLoading, refresh } = useProfile();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasCompletedSetup) {
      setShowSetup(true);
    }
  }, [isLoading, hasCompletedSetup]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
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
