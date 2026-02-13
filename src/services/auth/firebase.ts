import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import type { IAuthService, AuthUser, AuthServiceError } from './types';
import { logger } from '../../lib/logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerId: user.providerData[0]?.providerId || 'unknown',
  };
}

function handleError(error: unknown): AuthServiceError {
  if (error && typeof error === 'object' && 'code' in error) {
    return {
      code: (error as { code: string }).code,
      message: (error as { message?: string }).message || 'Unknown error',
    };
  }
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
}

export class FirebaseAuthService implements IAuthService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Check environment variables.');
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.initialized = true;
      logger.info('Firebase Auth initialized');
    } catch (error) {
      logger.error('Firebase initialization failed:', error);
      throw handleError(error);
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    if (!this.auth) throw new Error('Auth not initialized');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(this.auth, provider);
      const user = mapFirebaseUser(result.user);

      if (!user) {
        throw new Error('Sign-in succeeded but no user data returned');
      }

      logger.info('Google sign-in successful');
      return user;
    } catch (error) {
      logger.error('Google sign-in failed:', error);
      throw handleError(error);
    }
  }

  async signOut(): Promise<void> {
    if (!this.auth) throw new Error('Auth not initialized');

    try {
      await firebaseSignOut(this.auth);
      logger.info('User signed out');
    } catch (error) {
      logger.error('Sign-out failed:', error);
      throw handleError(error);
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!this.auth) throw new Error('Auth not initialized');

    return firebaseOnAuthStateChanged(this.auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  }

  getCurrentUser(): AuthUser | null {
    if (!this.auth) return null;
    return mapFirebaseUser(this.auth.currentUser);
  }
}

let authServiceInstance: IAuthService | null = null;

export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new FirebaseAuthService();
  }
  return authServiceInstance;
}

export function setAuthService(service: IAuthService): void {
  authServiceInstance = service;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
}
