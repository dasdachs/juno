import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../lib/db';

/** Session-timeout and lock-when-hidden settings, loaded once and saved on change. */
export function useLockSettings() {
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [autoLockOnHidden, setAutoLockOnHidden] = useState(true);
  const [autoLockGracePeriod, setAutoLockGracePeriod] = useState(30000);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((s) => {
      setSessionTimeout(s.sessionTimeout);
      setAutoLockOnHidden(s.autoLockOnHidden);
      setAutoLockGracePeriod(s.autoLockGracePeriod);
    });
  }, []);

  const handleTimeoutChange = async (minutes: number) => {
    const timeout = minutes * 60 * 1000;
    setSessionTimeout(timeout);
    await updateSettings({ sessionTimeout: timeout });
  };

  const handleAutoLockToggle = async () => {
    const newValue = !autoLockOnHidden;
    setAutoLockOnHidden(newValue);
    await updateSettings({ autoLockOnHidden: newValue });
  };

  const handleGracePeriodChange = async (value: number) => {
    setAutoLockGracePeriod(value);
    await updateSettings({ autoLockGracePeriod: value });
  };

  return {
    sessionTimeout,
    autoLockOnHidden,
    autoLockGracePeriod,
    handleTimeoutChange,
    handleAutoLockToggle,
    handleGracePeriodChange,
  };
}

export type LockSettings = ReturnType<typeof useLockSettings>;
