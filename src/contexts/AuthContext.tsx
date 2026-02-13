// Backward-compatible re-exports from VaultContext.
// Existing consumers can keep importing from here.
import { VaultProvider, useVault, type VaultContextType } from './VaultContext';

export type AuthContextType = VaultContextType & {
  /** @deprecated Use isVaultUnlocked instead */
  isAuthenticated: boolean;
};

/** @deprecated Use VaultProvider instead */
export const AuthProvider = VaultProvider;

/** @deprecated Use useVault instead */
export function useAuth(): AuthContextType {
  const vault = useVault();
  return {
    ...vault,
    isAuthenticated: vault.isVaultUnlocked,
  };
}
