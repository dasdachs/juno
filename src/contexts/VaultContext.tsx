import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  initCrypto,
  isUnlocked,
  lock as lockVault,
  unlock as unlockVault,
  createVault,
  changePassword as changePwd,
} from '../lib/crypto';
import { hasExistingVault, getSettings, updateSettings } from '../lib/db';

export interface VaultContextType {
  isLoading: boolean;
  hasVault: boolean;
  isVaultUnlocked: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  createNewVault: (password: string) => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<boolean>;
}

const VaultContext = createContext<VaultContextType | null>(null);

interface VaultProviderProps {
  children: ReactNode;
}

export function VaultProvider({ children }: VaultProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasVault, setHasVault] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gracePeriodRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await initCrypto();
        const exists = await hasExistingVault();
        setHasVault(exists);
        setIsVaultUnlocked(isUnlocked());
      } catch {
        // Crypto initialization failed
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  const resetSessionTimer = useCallback(async () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    const settings = await getSettings();
    sessionTimeoutRef.current = setTimeout(() => {
      lockVault();
      setIsVaultUnlocked(false);
    }, settings.sessionTimeout);
  }, []);

  useEffect(() => {
    if (!isVaultUnlocked) return;

    const handleActivity = () => {
      resetSessionTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetSessionTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [isVaultUnlocked, resetSessionTimer]);

  // Visibility change auto-lock with grace period
  useEffect(() => {
    if (!isVaultUnlocked) return;

    const handleVisibilityChange = async () => {
      const settings = await getSettings();
      if (!settings.autoLockOnHidden) return;

      if (document.hidden) {
        // Tab became hidden — start grace period timer
        gracePeriodRef.current = setTimeout(() => {
          lockVault();
          setIsVaultUnlocked(false);
        }, settings.autoLockGracePeriod);
      } else {
        // Tab became visible — cancel grace period if still pending
        if (gracePeriodRef.current) {
          clearTimeout(gracePeriodRef.current);
          gracePeriodRef.current = null;
        }
      }
    };

    const handlePageHide = () => {
      // Immediate lock on pagehide (mobile browser backgrounding)
      getSettings().then((settings) => {
        if (!settings.autoLockOnHidden) return;
        lockVault();
        setIsVaultUnlocked(false);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (gracePeriodRef.current) {
        clearTimeout(gracePeriodRef.current);
      }
    };
  }, [isVaultUnlocked]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    const success = await unlockVault(password);
    if (success) {
      setIsVaultUnlocked(true);
      await updateSettings({ lastUnlockedAt: Date.now() });
    }
    return success;
  }, []);

  const lock = useCallback(() => {
    lockVault();
    setIsVaultUnlocked(false);
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (gracePeriodRef.current) {
      clearTimeout(gracePeriodRef.current);
      gracePeriodRef.current = null;
    }
  }, []);

  const createNewVault = useCallback(async (password: string): Promise<void> => {
    await createVault(password);
    setHasVault(true);
    setIsVaultUnlocked(true);
    await updateSettings({ lastUnlockedAt: Date.now() });
  }, []);

  const changePassword = useCallback(
    async (current: string, newPassword: string): Promise<boolean> => {
      return changePwd(current, newPassword);
    },
    []
  );

  return (
    <VaultContext.Provider
      value={{
        isLoading,
        hasVault,
        isVaultUnlocked,
        unlock,
        lock,
        createNewVault,
        changePassword,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextType {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
