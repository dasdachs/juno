import { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { logger } from '../../lib/logger';
import { AVATAR_DATA_URL_PATTERN } from '../../lib/payloadValidation';

export interface ProfileFormValues {
  name: string;
  avatarUrl: string;
  birthYear: string;
  height: string;
  weight: string;
  avgCycleLength: string;
  avgPeriodLength: string;
  weekStartsOn: 0 | 1;
}

export type SetProfileField = <K extends keyof ProfileFormValues>(
  field: K,
  value: ProfileFormValues[K]
) => void;

const EMPTY: ProfileFormValues = {
  name: '',
  avatarUrl: '',
  birthYear: '',
  height: '',
  weight: '',
  avgCycleLength: '',
  avgPeriodLength: '',
  weekStartsOn: 0,
};

/** Editable copy of the profile, plus saving it back. */
export function useProfileForm() {
  const { profile, updateProfile, isLoading } = useProfile();
  const [values, setValues] = useState<ProfileFormValues>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const { avatarUrl } = profile;
    setValues({
      name: profile.name ?? '',
      // A remote URL saved by an earlier version is dropped, never loaded
      avatarUrl: avatarUrl && AVATAR_DATA_URL_PATTERN.test(avatarUrl) ? avatarUrl : '',
      birthYear: profile.birthYear?.toString() ?? '',
      height: profile.height?.toString() ?? '',
      weight: profile.weight?.toString() ?? '',
      avgCycleLength: profile.averageCycleLength?.toString() ?? '',
      avgPeriodLength: profile.averagePeriodLength?.toString() ?? '',
      weekStartsOn: profile.weekStartsOn,
    });
  }, [profile]);
  const setField: SetProfileField = (field, value) =>
    setValues((current) => ({ ...current, [field]: value }));
  const save = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: values.name.trim() ? values.name.trim() : undefined,
        avatarUrl: values.avatarUrl || undefined,
        birthYear: values.birthYear ? parseInt(values.birthYear) : undefined,
        height: values.height ? parseFloat(values.height) : undefined,
        weight: values.weight ? parseFloat(values.weight) : undefined,
        averageCycleLength: values.avgCycleLength ? parseInt(values.avgCycleLength) : undefined,
        averagePeriodLength: values.avgPeriodLength ? parseInt(values.avgPeriodLength) : undefined,
        weekStartsOn: values.weekStartsOn,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      logger.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return { values, setField, save, isLoading, isSaving, showSuccess };
}
