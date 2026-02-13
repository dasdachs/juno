import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useIdentity } from './IdentityContext';
import { useVault } from './VaultContext';

export type AuthFlowState =
  | 'initializing'
  | 'oauth_required'
  | 'vault_locked'
  | 'fully_authenticated';

interface CompositeAuthContextType {
  flowState: AuthFlowState;
  isFullyAuthenticated: boolean;
}

const CompositeAuthContext = createContext<CompositeAuthContextType | null>(null);

export function CompositeAuthProvider({ children }: { children: ReactNode }) {
  const identity = useIdentity();
  const vault = useVault();

  const flowState = useMemo((): AuthFlowState => {
    if (identity.isLoading || vault.isLoading) {
      return 'initializing';
    }

    // OAuth enabled but user not signed in
    if (identity.isOAuthEnabled && !identity.user) {
      return 'oauth_required';
    }

    // Vault not unlocked (either no OAuth, or OAuth passed)
    if (!vault.isVaultUnlocked) {
      return 'vault_locked';
    }

    return 'fully_authenticated';
  }, [identity.isLoading, identity.isOAuthEnabled, identity.user, vault.isLoading, vault.isVaultUnlocked]);

  const value = useMemo((): CompositeAuthContextType => ({
    flowState,
    isFullyAuthenticated: flowState === 'fully_authenticated',
  }), [flowState]);

  return (
    <CompositeAuthContext.Provider value={value}>
      {children}
    </CompositeAuthContext.Provider>
  );
}

export function useCompositeAuth(): CompositeAuthContextType {
  const context = useContext(CompositeAuthContext);
  if (!context) {
    throw new Error('useCompositeAuth must be used within a CompositeAuthProvider');
  }
  return context;
}
