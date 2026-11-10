import type { FormEvent } from 'react';
import type { Lockout } from './useLockout';
import type { PasswordFields } from './usePasswordFields';

export function createUnlockHandler(
  fields: PasswordFields,
  lockout: Lockout,
  unlock: (password: string) => Promise<boolean>
) {
  const { password, setPassword, setError, setIsLoading } = fields;

  return async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Check lockout
    if (lockout.isLockedOut()) {
      setError(`Too many attempts. Try again in ${lockout.lockoutRemaining}s`);
      return;
    }

    setIsLoading(true);
    const passwordValue = password;
    setPassword(''); // Clear password immediately

    try {
      const success = await unlock(passwordValue);
      if (success) {
        lockout.recordSuccess();
      } else {
        lockout.recordFailure();
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
    } finally {
      setIsLoading(false);
    }
  };
}
