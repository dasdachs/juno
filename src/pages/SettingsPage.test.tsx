import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { db } from '../lib/db';

const resetDb = () => Promise.all(db.tables.map((t) => t.clear()));

const mockLock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ lock: mockLock }),
}));

const mockSetDateFormat = vi.fn();

vi.mock('../contexts/DateFormatContext', () => ({
  useDateFormat: () => ({
    dateFormat: 'us',
    setDateFormat: mockSetDateFormat,
  }),
}));

describe('SettingsPage preferences', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    await resetDb();
    mockSetDateFormat.mockClear();
  });

  it('shows the three date format options with a live preview', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Date Format')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /US.*January 15, 2024/s })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /International.*15 January 2024/s })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ISO.*2024-01-15/s })).toBeInTheDocument();
  });

  it('marks the currently selected style as active', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Date Format')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /^US/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls setDateFormat when a different style is chosen', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Date Format')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^International/ }));

    expect(mockSetDateFormat).toHaveBeenCalledWith('international');
  });
});

describe('SettingsPage delete all data', () => {
  const originalLocation = window.location;
  const reload = vi.fn();

  beforeEach(async () => {
    await resetDb();
    mockLock.mockClear();
    reload.mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('only deletes once DELETE is typed; then locks, wipes storage and reloads', async () => {
    const mockStorageClear = vi.fn();
    vi.stubGlobal('localStorage', { clear: mockStorageClear });
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Date Format')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Delete All Data/ }));
    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(confirmBtn);
    expect(mockLock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Type DELETE'), { target: { value: 'DELETE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(mockLock).toHaveBeenCalledTimes(1);
    expect(mockStorageClear).toHaveBeenCalled();
  });
});
