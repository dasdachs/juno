import { useState } from 'react';
import { X, Download, Eye, EyeOff } from 'lucide-react';
import { exportData } from '../../lib/exportImport';
import zxcvbn from 'zxcvbn';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const passwordStrength = password ? zxcvbn(password) : null;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-600',
  ];

  const handleExport = async () => {
    setError('');

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength && passwordStrength.score < 2) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await exportData(password);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `juno-backup-${dateStr}.juno`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Reset and close
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create an encrypted backup of your data. Choose a strong password to protect your backup file.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Backup Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter strong backup password"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 pr-10 transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        strengthColors[passwordStrength.score]
                      }`}
                      style={{
                        width: `${((passwordStrength.score + 1) / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {strengthLabels[passwordStrength.score]}
                  </span>
                </div>
                {passwordStrength.feedback.warning && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {passwordStrength.feedback.warning}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter backup password"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !password || !confirmPassword}
            className="flex-1 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200"
          >
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
