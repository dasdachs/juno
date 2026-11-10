import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

type Listener = (e: 'rotated' | 'wiped' | 'settings') => void;
const listeners = new Set<Listener>();

vi.mock('../lib/vaultEvents', () => ({
  onVaultEvent: vi.fn((l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }),
  emitLocal: vi.fn(),
  announce: vi.fn(),
}));

vi.mock('../lib/crypto', () => ({
  initCrypto: vi.fn(() => Promise.resolve()),
  isUnlocked: vi.fn(() => true),
  lock: vi.fn(),
  unlock: vi.fn(() => Promise.resolve(true)),
  createVault: vi.fn(() => Promise.resolve()),
  changePassword: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../lib/db', () => ({
  hasExistingVault: vi.fn(() => Promise.resolve(true)),
  getSettings: vi.fn(() =>
    Promise.resolve({
      id: 'primary',
      sessionTimeout: 24 * 60 * 60 * 1000,
      autoLockOnHidden: true,
      autoLockGracePeriod: 30000,
    })
  ),
}));

import { VaultProvider, useVault } from './VaultContext';
import * as crypto from '../lib/crypto';

const wrapper = ({ children }: { children: ReactNode }) => <VaultProvider>{children}</VaultProvider>;
const emit = (e: 'rotated' | 'wiped' | 'settings') =>
  act(() => {
    [...listeners].forEach((l) => l(e));
  });

describe('VaultProvider vault events', () => {
  const originalLocation = window.location;
  const reload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  async function unlockedHook() {
    const hook = renderHook(() => useVault(), { wrapper });
    await vi.waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false);
      expect(hook.result.current.isVaultUnlocked).toBe(true);
    });
    vi.mocked(crypto.lock).mockClear();
    return hook;
  }

  it("locks on 'rotated' without reloading", async () => {
    const { result, unmount } = await unlockedHook();
    emit('rotated');
    expect(crypto.lock).toHaveBeenCalled();
    expect(result.current.isVaultUnlocked).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    unmount();
  });

  it("locks and reloads on 'wiped'", async () => {
    const { result, unmount } = await unlockedHook();
    emit('wiped');
    expect(crypto.lock).toHaveBeenCalled();
    expect(result.current.isVaultUnlocked).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("ignores a 'settings' event", async () => {
    const { result, unmount } = await unlockedHook();
    emit('settings');
    expect(crypto.lock).not.toHaveBeenCalled();
    expect(result.current.isVaultUnlocked).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    unmount();
  });
});
