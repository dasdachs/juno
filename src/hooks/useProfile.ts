import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';
import {
  encryptUserProfile,
  decryptUserProfile,
  isUnlocked,
} from '../lib/crypto';
import type { UserProfile } from '../lib/types';

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  hasCompletedSetup: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  createProfile: (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  weekStartsOn: 0,
  averageCycleLength: 28,
  averagePeriodLength: 5,
};

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    if (!isUnlocked()) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const encrypted = await db.userProfile.get('primary');
      if (encrypted) {
        const decrypted = decryptUserProfile(encrypted);
        setProfile(decrypted);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const hasCompletedSetup = profile !== null;

  const createProfile = useCallback(
    async (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const now = Date.now();
      const newProfile: UserProfile = {
        id: 'primary',
        ...DEFAULT_PROFILE,
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const encrypted = encryptUserProfile(newProfile);
      await db.userProfile.put(encrypted);

      setProfile(newProfile);
    },
    []
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<void> => {
      if (!isUnlocked()) {
        throw new Error('Vault is locked');
      }

      const now = Date.now();

      if (profile) {
        // Update existing profile
        const updated: UserProfile = {
          ...profile,
          ...data,
          updatedAt: now,
        };

        const encrypted = encryptUserProfile(updated);
        await db.userProfile.put(encrypted);

        setProfile(updated);
      } else {
        // Create new profile with defaults
        const newProfile: UserProfile = {
          id: 'primary',
          ...DEFAULT_PROFILE,
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        const encrypted = encryptUserProfile(newProfile);
        await db.userProfile.put(encrypted);

        setProfile(newProfile);
      }
    },
    [profile]
  );

  return {
    profile,
    isLoading,
    error,
    hasCompletedSetup,
    updateProfile,
    createProfile,
    refresh: loadProfile,
  };
}
