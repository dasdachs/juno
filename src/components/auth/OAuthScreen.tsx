import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useIdentity } from '../../contexts/IdentityContext';
import { logger } from '../../lib/logger';

export function OAuthScreen() {
  const { signInWithGoogle } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      logger.debug('OAuth sign-in successful');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string }).code === 'auth/popup-closed-by-user'
            ? 'Sign-in was cancelled'
            : (err as { message?: string }).message || 'Failed to sign in with Google'
          : 'Failed to sign in with Google';
      setError(message);
      logger.error('OAuth sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-600 to-rose-800 dark:from-rose-700 dark:to-rose-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900 rounded-full mb-4">
            <Shield className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Juno</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Sign in to access your encrypted health vault
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Your health data remains encrypted on your device.</p>
          <p className="mt-1">Google sign-in is only used for account access.</p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
