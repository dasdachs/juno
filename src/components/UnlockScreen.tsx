import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useIdentity } from '../contexts/IdentityContext';
import { logger } from '../lib/logger';
import zxcvbn from 'zxcvbn';

// Rate limiting constants
const LOCKOUT_DELAYS = [5000, 30000, 120000, 600000, 3600000]; // 5s, 30s, 2m, 10m, 1h
const LOCKOUT_THRESHOLD = 3;

export function UnlockScreen() {
  const { hasVault, unlock, createNewVault } = useAuth();
  const { user, isOAuthEnabled } = useIdentity();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const passwordStrength = zxcvbn(password);

  // Update lockout countdown
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutRemaining(0);
      } else {
        setLockoutRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Clear password on unmount
  useEffect(() => {
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
  }, []);

  const getStrengthColor = (score: number) => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    return colors[score];
  };

  const getStrengthLabel = (score: number) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[score];
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(`Too many attempts. Try again in ${lockoutRemaining}s`);
      return;
    }

    setIsLoading(true);
    const passwordValue = password;
    setPassword(''); // Clear password immediately

    try {
      const success = await unlock(passwordValue);
      if (success) {
        setFailedAttempts(0);
        setLockoutUntil(null);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        // Apply exponential backoff after threshold
        if (newAttempts >= LOCKOUT_THRESHOLD) {
          const delayIndex = Math.min(newAttempts - LOCKOUT_THRESHOLD, LOCKOUT_DELAYS.length - 1);
          setLockoutUntil(Date.now() + LOCKOUT_DELAYS[delayIndex]);
        }

        setError('Incorrect password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Please choose a stronger password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const passwordValue = password;
    setPassword(''); // Clear passwords immediately
    setConfirmPassword('');

    try {
      logger.debug('Creating vault...');
      await createNewVault(passwordValue);
      logger.debug('Vault created successfully');
    } catch (err) {
      logger.error('Vault creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create vault');
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
            {hasVault
              ? 'Enter your password to unlock your vault'
              : 'Create a password to secure your health data'}
          </p>
        </div>

        {isOAuthEnabled && user && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 font-medium text-sm">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {user.displayName && (
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.displayName}</p>
              )}
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={hasVault ? handleUnlock : handleCreate} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors duration-200 pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={hasVault ? 'Enter password' : 'Create a strong password'}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!hasVault && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Password strength</span>
                  <span className={`text-sm font-medium ${passwordStrength.score < 2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {getStrengthLabel(passwordStrength.score)}
                    {passwordStrength.score < 2 ? ' - Too weak' : ''}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                  />
                </div>
                {passwordStrength.feedback.warning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{passwordStrength.feedback.warning}</p>
                )}
                {passwordStrength.score < 2 && password.length >= 12 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Password is too predictable. Try mixing uppercase, numbers, and symbols.</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {hasVault ? 'Unlocking...' : 'Creating vault...'}
              </>
            ) : hasVault ? (
              <>
                <Lock className="w-5 h-5" />
                Unlock Vault
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Vault
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Your data is encrypted locally on this device.</p>
          <p className="mt-1">We never see your password or data.</p>
          {!hasVault && (
            <p className="mt-3 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-3 rounded border border-blue-200 dark:border-blue-800">
              ⏱️ Creating your vault takes ~30-45 seconds. Your password is being securely encrypted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
