import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';

const updateProfile = vi.fn<(updates: Record<string, unknown>) => Promise<void>>(() => Promise.resolve());
let currentProfile: Record<string, unknown> | null = null;

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({ profile: currentProfile, updateProfile, isLoading: false }),
}));

const fileToAvatarDataUrl = vi.fn();
vi.mock('../lib/avatarImage', () => ({
  fileToAvatarDataUrl: (f: File) => fileToAvatarDataUrl(f),
}));

const DATA_URL = 'data:image/jpeg;base64,QUJD';
const baseProfile = {
  id: 'primary',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  weekStartsOn: 1,
  createdAt: 1,
  updatedAt: 2,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
const fileInput = (c: HTMLElement) => c.querySelector('#avatar-file') as HTMLInputElement;
const pick = (c: HTMLElement) =>
  fireEvent.change(fileInput(c), {
    target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] },
  });
const save = () => fireEvent.click(screen.getByRole('button', { name: /Save Changes/ }));

describe('ProfilePage avatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentProfile = { ...baseProfile };
  });

  it('does not render or re-save a legacy remote avatarUrl', async () => {
    currentProfile = { ...baseProfile, name: 'Jani', avatarUrl: 'https://example.com/a.jpg' };
    renderPage();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();

    save();
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ avatarUrl: undefined });
  });

  it('picking a file shows a preview and Save passes the data URL through', async () => {
    fileToAvatarDataUrl.mockResolvedValue(DATA_URL);
    const { container } = renderPage();
    pick(container);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', DATA_URL);

    save();
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ avatarUrl: DATA_URL });
  });

  it('Remove clears the avatar and Save sends undefined', async () => {
    currentProfile = { ...baseProfile, avatarUrl: DATA_URL };
    renderPage();
    expect(screen.getByRole('img')).toHaveAttribute('src', DATA_URL);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('img')).toBeNull();

    save();
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile.mock.calls[0][0]).toMatchObject({ avatarUrl: undefined });
  });

  it('shows the error when the image is rejected', async () => {
    fileToAvatarDataUrl.mockRejectedValue(new Error('Image is too large'));
    const { container } = renderPage();
    pick(container);

    expect(await screen.findByText('Image is too large')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
