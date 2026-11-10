import { useState, useEffect } from 'react';

// Rate limiting constants
const LOCKOUT_DELAYS = [5000, 30000, 120000, 600000, 3600000]; // 5s, 30s, 2m, 10m, 1h
const LOCKOUT_THRESHOLD = 3;

/** Failed-attempt counter with exponential lockout for the unlock form. */
export function useLockout() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Update lockout countdown
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
      } else {
        setLockoutRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = () => Boolean(lockoutUntil && Date.now() < lockoutUntil);

  const recordSuccess = () => {
    setFailedAttempts(0);
    setLockoutUntil(null);
  };

  const recordFailure = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    // Apply exponential backoff after threshold
    if (newAttempts >= LOCKOUT_THRESHOLD) {
      const delayIndex = Math.min(newAttempts - LOCKOUT_THRESHOLD, LOCKOUT_DELAYS.length - 1);
      setLockoutUntil(Date.now() + LOCKOUT_DELAYS[delayIndex]);
    }
  };

  return { lockoutRemaining, isLockedOut, recordSuccess, recordFailure };
}

export type Lockout = ReturnType<typeof useLockout>;
