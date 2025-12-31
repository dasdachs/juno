import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Clock,
  Download,
  Trash2,
  ChevronRight,
  Lock,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSettings, updateSettings, clearAllData } from '../lib/db';
import { changePassword } from '../lib/crypto';

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

  // Load settings on mount
  useState(() => {
    getSettings().then((s) => setSessionTimeout(s.sessionTimeout));
  });

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
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>

      {/* Profile Link */}
      <Link
        to="/profile"
        className="flex items-center justify-between p-4 bg-white rounded-xl border hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg">
            <User className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Profile</p>
            <p className="text-sm text-gray-500">Manage your profile settings</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Security Section */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-medium text-gray-900 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </h2>
        </div>

        {/* Session Timeout */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Session Timeout</p>
              <p className="text-sm text-gray-500">
                Auto-lock after inactivity
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[5, 15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleTimeoutChange(minutes)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  sessionTimeout === minutes * 60 * 1000
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="p-4">
          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 12 characters)"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
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
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-medium text-gray-900">Data</h2>
        </div>

        {/* Export - placeholder */}
        <button className="w-full flex items-center gap-3 p-4 border-b hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5 text-gray-500" />
          <div className="text-left">
            <p className="font-medium text-gray-900">Export Data</p>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </button>

        {/* Delete All Data */}
        <div className="p-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-500" />
          <div>
            <p className="font-medium text-gray-900">Juno</p>
            <p className="text-sm text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">
              Your data is encrypted and stored locally on this device.
            </p>
          </div>
        </div>
      </div>

      {/* Lock Button */}
      <button
        onClick={lock}
        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
      >
        Lock App
      </button>
    </div>
  );
}
