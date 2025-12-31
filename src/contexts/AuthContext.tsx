import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

interface AuthContextType {
  isLoading: boolean;
  hasVault: boolean;
  isAuthenticated: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  createNewVault: (password: string) => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasVault, setHasVault] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        await initCrypto();
        const exists = await hasExistingVault();
        setHasVault(exists);
        setIsAuthenticated(isUnlocked());
      } catch {
        // Crypto initialization failed
      } finally {
        setIsLoading(false);
      }
    }
    initialize();
  }, []);

  const resetSessionTimer = useCallback(async () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    const settings = await getSettings();
    const timeout = setTimeout(() => {
      lockVault();
      setIsAuthenticated(false);
    }, settings.sessionTimeout);

    setSessionTimeout(timeout);
  }, [sessionTimeout]);

  useEffect(() => {
    if (!isAuthenticated) return;

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

      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, [isAuthenticated, resetSessionTimer, sessionTimeout]);

  const unlock = useCallback(async (password: string): Promise<boolean> => {
    const success = await unlockVault(password);
    if (success) {
      setIsAuthenticated(true);
      await updateSettings({ lastUnlockedAt: Date.now() });
    }
    return success;
  }, []);

  const lock = useCallback(() => {
    lockVault();
    setIsAuthenticated(false);
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  }, [sessionTimeout]);

  const createNewVault = useCallback(async (password: string): Promise<void> => {
    await createVault(password);
    setHasVault(true);
    setIsAuthenticated(true);
    await updateSettings({ lastUnlockedAt: Date.now() });
  }, []);

  const changePassword = useCallback(
    async (current: string, newPassword: string): Promise<boolean> => {
      return changePwd(current, newPassword);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        hasVault,
        isAuthenticated,
        unlock,
        lock,
        createNewVault,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
