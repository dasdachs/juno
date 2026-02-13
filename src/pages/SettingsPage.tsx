import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Clock,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Lock,
  Eye,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettings, updateSettings, clearAllData } from '../lib/db';
import { changePassword } from '../lib/crypto';
import { OAuthSettings } from '../components/settings/OAuthSettings';
import { SyncSettings } from '../components/settings/SyncSettings';
import { ExportDataModal } from '../components/settings/ExportDataModal';
import { ImportDataModal } from '../components/settings/ImportDataModal';

export function SettingsPage() {
  const { lock } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [autoLockOnHidden, setAutoLockOnHidden] = useState(true);
  const [autoLockGracePeriod, setAutoLockGracePeriod] = useState(30000);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((s) => {
      setSessionTimeout(s.sessionTimeout);
      setAutoLockOnHidden(s.autoLockOnHidden);
      setAutoLockGracePeriod(s.autoLockGracePeriod);
    });
  }, []);

  const handleTimeoutChange = async (minutes: number) => {
    const timeout = minutes * 60 * 1000;
    setSessionTimeout(timeout);
    await updateSettings({ sessionTimeout: timeout });
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      setPasswordError('Password must be at least 12 characters');
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } else {
      setPasswordError('Current password is incorrect');
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="p-4 pb-20 sm:pb-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Profile Link */}
      <Link
        to="/profile"
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg">
            <User className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Profile</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile settings</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </Link>

      {/* Security Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </h2>
        </div>

        {/* Session Timeout */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Session Timeout</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Auto-lock after inactivity
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[5, 15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleTimeoutChange(minutes)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                  sessionTimeout === minutes * 60 * 1000
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Lock on Tab Hidden */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Lock When Hidden</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Lock when tab is hidden or app is backgrounded
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const newValue = !autoLockOnHidden;
                setAutoLockOnHidden(newValue);
                await updateSettings({ autoLockOnHidden: newValue });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                autoLockOnHidden ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoLockOnHidden ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {autoLockOnHidden && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Grace period before locking</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: '10s', value: 10000 },
                  { label: '30s', value: 30000 },
                  { label: '1 min', value: 60000 },
                  { label: '5 min', value: 300000 },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={async () => {
                      setAutoLockGracePeriod(value);
                      await updateSettings({ autoLockGracePeriod: value });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                      autoLockGracePeriod === value
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="p-4">
          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="w-full py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors duration-200"
            >
              Change Password
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 12 characters)"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-green-600">
                  Password changed successfully
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Google Sign-In */}
        <OAuthSettings />
      </div>

      {/* Sync Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Sync</h2>
        </div>
        <SyncSettings />
      </div>

      {/* Data Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Data</h2>
        </div>

        {/* Export Data */}
        <button
          onClick={() => setShowExportModal(true)}
          className="w-full flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">Export Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create encrypted backup</p>
          </div>
        </button>

        {/* Import Data */}
        <button
          onClick={() => setShowImportModal(true)}
          className="w-full flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-gray-100">Import Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Restore from backup</p>
          </div>
        </button>

        {/* Delete All Data */}
        <div className="p-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Data
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                This will permanently delete all your data. Type DELETE to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-red-300 dark:border-red-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Juno</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Your data is encrypted and stored locally on this device.
            </p>
          </div>
        </div>
      </div>

      {/* Lock Button */}
      <button
        onClick={lock}
        className="w-full py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
      >
        Lock App
      </button>

      {/* Modals */}
      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
