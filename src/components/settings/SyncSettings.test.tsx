import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncSettings } from './SyncSettings';

const mockPush = vi.fn();
const mockDownload = vi.fn();

vi.mock('../../lib/sync/SyncEngine', () => ({
  SyncEngine: class {
    push = mockPush;
    pull = vi.fn();
  },
}));

vi.mock('../../lib/sync/adapters/FileSyncAdapter', () => ({
  FileSyncAdapter: class {
    download = mockDownload;
  },
}));

vi.mock('../../lib/db', () => ({
  getSettings: vi.fn().mockResolvedValue({ deviceId: 'dev', lastSyncAt: undefined }),
}));

const STRONG = 'violet harbor tractor mellow quartz';

function fill(pass: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Sync passphrase'), { target: { value: pass } });
  fireEvent.change(screen.getByLabelText('Confirm sync passphrase'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: /Push/ }));
}

describe('SyncSettings push validation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockPush.mockResolvedValue(undefined);
    mockDownload.mockReset();
  });

  it('refuses a weak passphrase', async () => {
    render(<SyncSettings />);
    fill('passwordpassword', 'passwordpassword');
    expect(await screen.findByText(/too easy to guess/, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  }, 15000);

  it('refuses when the confirmation does not match', async () => {
    render(<SyncSettings />);
    fill(STRONG, STRONG + ' x');
    expect(await screen.findByText(/do not match/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('pushes with a strong, confirmed passphrase', async () => {
    render(<SyncSettings />);
    fill(STRONG, STRONG);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(STRONG));
  });
});
