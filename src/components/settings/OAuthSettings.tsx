import { useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { useIdentity } from '../../contexts/IdentityContext';
import { logger } from '../../lib/logger';

export function OAuthSettings() {
  const { isOAuthEnabled, user, isFirebaseAvailable, enableOAuth, disableOAuth } = useIdentity();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);

  if (!isFirebaseAvailable) {
    return null;
  }

  const handleEnableOAuth = async () => {
    setError('');
    setIsEnabling(true);
    try {
      await enableOAuth();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'code' in err
          ? (err as { code: string }).code === 'auth/popup-closed-by-user'
            ? '' // Silent fail on cancel
            : (err as { message?: string }).message || 'Failed to enable Google Sign-In'
          : 'Failed to enable Google Sign-In';
      if (message) setError(message);
      logger.error('Enable OAuth failed:', err);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableOAuth = async () => {
    setError('');
    setIsDisabling(true);
    try {
      await disableOAuth();
      setShowConfirmDisable(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable Google Sign-In');
      logger.error('Disable OAuth failed:', err);
    } finally {
      setIsDisabling(false);
    }
  };

  if (isOAuthEnabled) {
    return (
      <div className="p-4 border-t">
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Google Sign-In Enabled</p>
            {user?.email && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">
            {error}
          </div>
        )}

        {!showConfirmDisable ? (
          <button
            onClick={() => setShowConfirmDisable(true)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Disable Google Sign-In
          </button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 mb-3">
              Are you sure? You'll only need your master password to sign in.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDisableOAuth}
                disabled={isDisabling}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDisabling ? 'Disabling...' : 'Yes, Disable'}
              </button>
              <button
                onClick={() => setShowConfirmDisable(false)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border-t">
      <div className="flex items-start gap-3 mb-3">
        <Shield className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">Google Sign-In</p>
          <p className="text-sm text-gray-500">
            Add Google Sign-In as an extra layer before your master password.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">
          {error}
        </div>
      )}

      <button
        onClick={handleEnableOAuth}
        disabled={isEnabling}
        className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isEnabling ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Enabling...
          </>
        ) : (
          'Enable Google Sign-In'
        )}
      </button>
    </div>
  );
}
