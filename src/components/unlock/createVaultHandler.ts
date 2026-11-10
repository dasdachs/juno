import type { FormEvent } from 'react';
import { logger } from '../../lib/logger';
import { checkPasswordStrength } from '../../lib/passwordPolicy';
import type { PasswordFields } from './usePasswordFields';

export function createVaultHandler(
  fields: PasswordFields,
  createNewVault: (password: string) => Promise<unknown>
) {
  const { password, confirmPassword, setPassword, setConfirmPassword, setError, setIsLoading } = fields;

  return async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const strengthError = checkPasswordStrength(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const passwordValue = password;
    setPassword(''); // Clear passwords immediately
    setConfirmPassword('');

    try {
      logger.debug('Creating vault...');
      await createNewVault(passwordValue);
      logger.debug('Vault created successfully');
    } catch (err) {
      logger.error('Vault creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create vault');
    } finally {
      setIsLoading(false);
    }
  };
}
