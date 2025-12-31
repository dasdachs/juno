import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile, isLoading } = useProfile();
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
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading...</div>
    );
  }

  return (
    <div className="p-4 pb-20 sm:pb-4 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="space-y-4">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-medium text-gray-900">Personal Information</h2>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Birth Year
            </label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="e.g., 1990"
              min="1900"
              max={new Date().getFullYear()}
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for age-related insights (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 165"
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 60"
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Cycle Defaults */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-medium text-gray-900">Cycle Defaults</h2>
          <p className="text-sm text-gray-500">
            These are used for predictions when you don't have enough cycle history.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border p-4 space-y-4">
          <h2 className="font-medium text-gray-900">Preferences</h2>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Week Starts On
            </label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setWeekStartsOn(0)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  weekStartsOn === 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sunday
              </button>
              <button
                onClick={() => setWeekStartsOn(1)}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  weekStartsOn === 1
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          className="w-full py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
