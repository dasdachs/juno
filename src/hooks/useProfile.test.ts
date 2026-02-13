import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from './useProfile';

// Mock modules
vi.mock('../lib/crypto', () => ({
  isUnlocked: vi.fn(() => true),
  encryptUserProfile: vi.fn((profile) => ({
    id: profile.id,
    nonce: 'mock-nonce',
    ciphertext: 'mock-ciphertext',
    version: 1,
  })),
  decryptUserProfile: vi.fn((encrypted) => ({
    id: 'primary',
    weekStartsOn: 0 as const,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...encrypted._decrypted, // Allow overriding in tests
  })),
}));

vi.mock('../lib/db', () => ({
  db: {
    userProfile: {
      get: vi.fn(() => Promise.resolve(undefined)),
      put: vi.fn(() => Promise.resolve()),
    },
  },
}));

import { isUnlocked, encryptUserProfile, decryptUserProfile } from '../lib/crypto';
import { db } from '../lib/db';

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadProfile', () => {
    it('should return null profile when vault is locked', async () => {
      (isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.hasCompletedSetup).toBe(false);
    });

    it('should return null when no profile exists', async () => {
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.hasCompletedSetup).toBe(false);
      expect(db.userProfile.get).toHaveBeenCalledWith('primary');
    });

    it('should load and decrypt existing profile', async () => {
      const mockEncrypted = {
        id: 'primary',
        nonce: 'test-nonce',
        ciphertext: 'test-ciphertext',
        _decrypted: {
          birthYear: 1990,
          averageCycleLength: 30,
        },
      };
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockEncrypted);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).not.toBeNull();
      expect(result.current.hasCompletedSetup).toBe(true);
      expect(decryptUserProfile).toHaveBeenCalledWith(mockEncrypted);
    });

    it('should set error on load failure', async () => {
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('DB error');
    });
  });

  describe('createProfile', () => {
    it('should throw when vault is locked', async () => {
      (isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.createProfile({
          weekStartsOn: 0,
          averageCycleLength: 28,
          averagePeriodLength: 5,
        })
      ).rejects.toThrow('Vault is locked');
    });

    it('should create profile with defaults', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createProfile({
          weekStartsOn: 1,
          averageCycleLength: 30,
          averagePeriodLength: 6,
        });
      });

      expect(encryptUserProfile).toHaveBeenCalled();
      expect(db.userProfile.put).toHaveBeenCalled();
      expect(result.current.profile).not.toBeNull();
      expect(result.current.hasCompletedSetup).toBe(true);
    });

    it('should merge with default values', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createProfile({
          weekStartsOn: 1,
          averageCycleLength: 30,
          averagePeriodLength: 6,
          birthYear: 1990,
        });
      });

      const encryptCall = (encryptUserProfile as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(encryptCall.id).toBe('primary');
      expect(encryptCall.weekStartsOn).toBe(1);
      expect(encryptCall.averageCycleLength).toBe(30);
      expect(encryptCall.birthYear).toBe(1990);
    });
  });

  describe('updateProfile', () => {
    it('should throw when vault is locked', async () => {
      (isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.updateProfile({ birthYear: 1995 })).rejects.toThrow(
        'Vault is locked'
      );
    });

    it('should update existing profile', async () => {
      // First load an existing profile
      const mockEncrypted = {
        id: 'primary',
        nonce: 'test-nonce',
        ciphertext: 'test-ciphertext',
      };
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockEncrypted);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      (isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await act(async () => {
        await result.current.updateProfile({ birthYear: 1995 });
      });

      expect(encryptUserProfile).toHaveBeenCalled();
      expect(db.userProfile.put).toHaveBeenCalled();
    });

    it('should create profile if none exists', async () => {
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBeNull();

      await act(async () => {
        await result.current.updateProfile({ birthYear: 1995 });
      });

      expect(encryptUserProfile).toHaveBeenCalled();
      expect(db.userProfile.put).toHaveBeenCalled();
      expect(result.current.profile).not.toBeNull();
    });
  });

  describe('refresh', () => {
    it('should reload profile from database', async () => {
      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change what the database returns
      const mockEncrypted = {
        id: 'primary',
        nonce: 'test-nonce',
        ciphertext: 'test-ciphertext',
      };
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockEncrypted);

      await act(async () => {
        await result.current.refresh();
      });

      expect(db.userProfile.get).toHaveBeenCalledTimes(2); // Initial + refresh
      expect(result.current.profile).not.toBeNull();
    });
  });

  describe('hasCompletedSetup', () => {
    it('should be false when profile is null', async () => {
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedSetup).toBe(false);
    });

    it('should be true when profile exists', async () => {
      const mockEncrypted = {
        id: 'primary',
        nonce: 'test-nonce',
        ciphertext: 'test-ciphertext',
      };
      (db.userProfile.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockEncrypted);

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasCompletedSetup).toBe(true);
    });
  });
});
