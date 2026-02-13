import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import type { ReactNode } from 'react';

// Use a very long timeout to avoid the session timer firing during tests
const LONG_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Mock crypto module
vi.mock('../lib/crypto', () => ({
  initCrypto: vi.fn(() => Promise.resolve()),
  isUnlocked: vi.fn(() => false),
  lock: vi.fn(),
  unlock: vi.fn(() => Promise.resolve(true)),
  createVault: vi.fn(() => Promise.resolve()),
  changePassword: vi.fn(() => Promise.resolve(true)),
}));

// Mock db module
vi.mock('../lib/db', () => ({
  hasExistingVault: vi.fn(() => Promise.resolve(false)),
  getSettings: vi.fn(() =>
    Promise.resolve({
      id: 'primary',
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours to avoid timer issues
      periodReminderEnabled: false,
      periodReminderDays: 3,
    })
  ),
  updateSettings: vi.fn(() => Promise.resolve()),
}));

import * as crypto from '../lib/crypto';
import * as db from '../lib/db';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: false });
    (crypto.isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (db.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'primary',
      sessionTimeout: LONG_TIMEOUT,
      periodReminderEnabled: false,
      periodReminderDays: 3,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize crypto and check for existing vault', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(crypto.initCrypto).toHaveBeenCalled();
      expect(db.hasExistingVault).toHaveBeenCalled();
    });

    it('should set hasVault based on existing vault', async () => {
      (db.hasExistingVault as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasVault).toBe(true);
    });

    it('should set isAuthenticated if already unlocked', async () => {
      (crypto.isUnlocked as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('unlock', () => {
    it('should return true on successful unlock and call crypto.unlock', async () => {
      (crypto.unlock as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.unlock('password123');
      });

      expect(success!).toBe(true);
      expect(crypto.unlock).toHaveBeenCalledWith('password123');
    });

    it('should return false on failed unlock', async () => {
      (crypto.unlock as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.unlock('wrongpassword');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update settings with lastUnlockedAt on successful unlock', async () => {
      (crypto.unlock as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.unlock('password123');
      });

      expect(db.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ lastUnlockedAt: expect.any(Number) })
      );
    });
  });

  describe('lock', () => {
    it('should call crypto.lock', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.lock();
      });

      expect(crypto.lock).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('createNewVault', () => {
    it('should call crypto.createVault with password', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createNewVault('newpassword');
      });

      expect(crypto.createVault).toHaveBeenCalledWith('newpassword');
    });

    it('should update settings with lastUnlockedAt on vault creation', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createNewVault('newpassword');
      });

      expect(db.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ lastUnlockedAt: expect.any(Number) })
      );
    });
  });

  describe('changePassword', () => {
    it('should call crypto changePassword', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean;
      await act(async () => {
        success = await result.current.changePassword('current', 'newpassword');
      });

      expect(success!).toBe(true);
      expect(crypto.changePassword).toHaveBeenCalledWith('current', 'newpassword');
    });
  });

  describe('useAuth hook', () => {
    it('should throw when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useVault must be used within a VaultProvider');

      spy.mockRestore();
    });
  });
});
