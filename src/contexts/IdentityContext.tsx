import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { IAuthService, AuthUser } from '../services/auth/types';
import { getAuthService, isFirebaseConfigured } from '../services/auth/firebase';
import { getSettings, updateSettings } from '../lib/db';
import { logger } from '../lib/logger';

interface IdentityContextType {
  isLoading: boolean;
  user: AuthUser | null;
  isOAuthEnabled: boolean;
  isFirebaseAvailable: boolean;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
  enableOAuth: () => Promise<AuthUser>;
  disableOAuth: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | null>(null);

interface IdentityProviderProps {
  children: ReactNode;
  authService?: IAuthService;
}

export function IdentityProvider({ children, authService }: IdentityProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOAuthEnabled, setIsOAuthEnabled] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const serviceRef = useRef<IAuthService | null>(null);
  const isFirebaseAvailable = isFirebaseConfigured();

  // Load OAuth enabled state from settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        setIsOAuthEnabled(settings.oauthEnabled ?? false);
      } catch (error) {
        logger.error('Failed to load OAuth settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  // Set up or tear down Firebase auth listener based on OAuth state
  useEffect(() => {
    if (!settingsLoaded) return;

    // No Firebase needed — finish loading immediately
    const shouldInitFirebase = authService || (isFirebaseAvailable && isOAuthEnabled);
    if (!shouldInitFirebase) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function setupListener() {
      try {
        const svc = authService ?? getAuthService();
        await svc.initialize();

        if (cancelled) return;
        serviceRef.current = svc;

        unsubscribe = svc.onAuthStateChanged((authUser) => {
          if (!cancelled) {
            setUser(authUser);
            setIsLoading(false);
          }
        });
      } catch (error) {
        logger.error('Firebase auth listener setup failed:', error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setupListener();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [settingsLoaded, isOAuthEnabled, authService, isFirebaseAvailable]);

  const ensureService = useCallback(async (): Promise<IAuthService> => {
    if (serviceRef.current) return serviceRef.current;

    const svc = authService ?? getAuthService();
    await svc.initialize();
    serviceRef.current = svc;
    return svc;
  }, [authService]);

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    const svc = await ensureService();
    const authUser = await svc.signInWithGoogle();
    setUser(authUser);
    return authUser;
  }, [ensureService]);

  const signOut = useCallback(async () => {
    if (!serviceRef.current) return;
    await serviceRef.current.signOut();
    setUser(null);
  }, []);

  const enableOAuth = useCallback(async (): Promise<AuthUser> => {
    const authUser = await signInWithGoogle();

    await updateSettings({
      oauthEnabled: true,
      oauthProvider: 'google',
      oauthUserId: authUser.uid,
    });
    setIsOAuthEnabled(true);
    logger.info('OAuth enabled');

    return authUser;
  }, [signInWithGoogle]);

  const disableOAuth = useCallback(async () => {
    if (user && serviceRef.current) {
      await serviceRef.current.signOut();
    }
    await updateSettings({
      oauthEnabled: false,
      oauthProvider: null,
      oauthUserId: null,
    });
    setIsOAuthEnabled(false);
    setUser(null);
    logger.info('OAuth disabled');
  }, [user]);

  return (
    <IdentityContext.Provider
      value={{
        isLoading,
        user,
        isOAuthEnabled,
        isFirebaseAvailable,
        signInWithGoogle,
        signOut,
        enableOAuth,
        disableOAuth,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextType {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}
