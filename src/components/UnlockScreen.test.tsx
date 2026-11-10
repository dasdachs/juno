import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnlockScreen } from './UnlockScreen';

const mockCreateNewVault = vi.fn();
const mockUnlock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ hasVault: false, unlock: mockUnlock, createNewVault: mockCreateNewVault }),
}));

function submit(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: /Create Vault/ }));
}

describe('UnlockScreen create-vault flow', () => {
  beforeEach(() => {
    mockCreateNewVault.mockReset();
    mockCreateNewVault.mockResolvedValue(undefined);
  });

  it('rejects a 12+ char guessable password without creating the vault', async () => {
    render(<UnlockScreen />);
    submit('passwordpassword', 'passwordpassword');
    expect((await screen.findAllByText(/too easy to guess/, {}, { timeout: 10000 })).length).toBeGreaterThan(0);
    expect(mockCreateNewVault).not.toHaveBeenCalled();
  }, 15000);

  it('rejects a short password without creating the vault', async () => {
    render(<UnlockScreen />);
    submit('short', 'short');
    expect(await screen.findByText(/at least 12 characters/, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(mockCreateNewVault).not.toHaveBeenCalled();
  });

  it('creates the vault for a strong passphrase', async () => {
    render(<UnlockScreen />);
    submit('violet harbor tractor mellow quartz', 'violet harbor tractor mellow quartz');
    await waitFor(() =>
      expect(mockCreateNewVault).toHaveBeenCalledWith('violet harbor tractor mellow quartz')
    );
  });
});
