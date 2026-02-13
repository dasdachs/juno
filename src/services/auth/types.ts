export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}

export interface IAuthService {
  initialize(): Promise<void>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getCurrentUser(): AuthUser | null;
}

export interface AuthServiceError {
  code: string;
  message: string;
}
