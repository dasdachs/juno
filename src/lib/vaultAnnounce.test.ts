import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('./vaultEvents', () => ({
  announce: vi.fn(),
  emitLocal: vi.fn(),
  onVaultEvent: vi.fn(() => () => {}),
}));

import { announce, emitLocal } from './vaultEvents';
import { initCrypto, createVault, changePassword, lock } from './crypto';
import { clearAllData, updateSettings } from './db';

const PW1 = 'announce password one 1';
const PW2 = 'announce password two 2';

describe('vault event emission (real crypto + db)', () => {
  beforeAll(async () => {
    await initCrypto();
    await clearAllData();
    await createVault(PW1);
    vi.mocked(announce).mockClear();
  });

  afterAll(async () => {
    lock();
    await clearAllData();
  });

  it('does not announce on a wrong password', async () => {
    expect(await changePassword('wrong password here', PW2)).toBe(false);
    expect(announce).not.toHaveBeenCalled();
  });

  it("announces 'rotated' exactly once on success", async () => {
    expect(await changePassword(PW1, PW2)).toBe(true);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('rotated');
  });

  it("updateSettings emits a local 'settings' event", async () => {
    vi.mocked(emitLocal).mockClear();
    await updateSettings({ periodReminderDays: 4 });
    expect(emitLocal).toHaveBeenCalledWith('settings');
  });

  it("clearAllData announces 'wiped'", async () => {
    vi.mocked(announce).mockClear();
    await clearAllData();
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('wiped');
  });
});
