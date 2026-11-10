import { useAuth } from '../../contexts/AuthContext';
import { useLockout } from './useLockout';
import { usePasswordFields } from './usePasswordFields';
import { createUnlockHandler } from './unlockHandler';
import { createVaultHandler } from './createVaultHandler';

/** State and submit handler for the unlock / create-vault screen. */
export function useUnlockForm() {
  const { hasVault, unlock, createNewVault } = useAuth();
  const fields = usePasswordFields();
  const lockout = useLockout();

  const handleUnlock = createUnlockHandler(fields, lockout, unlock);
  const handleCreate = createVaultHandler(fields, createNewVault);

  return { hasVault, fields, onSubmit: hasVault ? handleUnlock : handleCreate };
}
