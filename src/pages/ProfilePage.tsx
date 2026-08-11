import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { logger } from '../lib/logger';
import { Avatar } from '../components/common';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isLoading } = useProfile();
  const [name, setName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [avgCycleLength, setAvgCycleLength] = useState<string>('');
  const [avgPeriodLength, setAvgPeriodLength] = useState<string>('');
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
      setBirthYear(profile.birthYear?.toString() ?? '');
      setHeight(profile.height?.toString() ?? '');
      setWeight(profile.weight?.toString() ?? '');
      setAvgCycleLength(profile.averageCycleLength?.toString() ?? '');
      setAvgPeriodLength(profile.averagePeriodLength?.toString() ?? '');
      setWeekStartsOn(profile.weekStartsOn);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim() ? name.trim() : undefined,
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : undefined,
        birthYear: birthYear ? parseInt(birthYear) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        averageCycleLength: avgCycleLength ? parseInt(avgCycleLength) : undefined,
        averagePeriodLength: avgPeriodLength ? parseInt(avgPeriodLength) : undefined,
        weekStartsOn,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      logger.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</div>
    );
  }

  return (
    <div className="p-6 pb-20 sm:pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
      </div>

      <div className="space-y-4">
        {/* Personal Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm transition-colors duration-200">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Personal Information</h2>

          <div className="flex items-center gap-4">
            <Avatar avatarUrl={avatarUrl || undefined} name={name || undefined} size="lg" />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jani"
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Paste a link to an image. If it doesn't load, we'll show your initials instead.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Birth Year
            </label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="e.g., 1990"
              min="1900"
              max={new Date().getFullYear()}
              className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Used for age-related insights (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 165"
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 60"
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Cycle Defaults */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm transition-colors duration-200">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Cycle Defaults</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These are used for predictions when you don't have enough cycle history.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Average Cycle Length
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  value={avgCycleLength}
                  onChange={(e) => setAvgCycleLength(e.target.value)}
                  placeholder="28"
                  min="20"
                  max="45"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Average Period Length
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  value={avgPeriodLength}
                  onChange={(e) => setAvgPeriodLength(e.target.value)}
                  placeholder="5"
                  min="2"
                  max="10"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm transition-colors duration-200">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">Preferences</h2>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Week Starts On
            </label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setWeekStartsOn(0)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  weekStartsOn === 0
                    ? 'bg-rose-500 dark:bg-rose-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Sunday
              </button>
              <button
                onClick={() => setWeekStartsOn(1)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  weekStartsOn === 1
                    ? 'bg-rose-500 dark:bg-rose-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Monday
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-rose-500 dark:bg-rose-600 text-white rounded-xl hover:bg-rose-600 dark:hover:bg-rose-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {isSaving ? (
            'Saving...'
          ) : showSuccess ? (
            'Saved!'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
