import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { clearAllData } from '../lib/db';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ lock: vi.fn() }),
}));

const mockSetDateFormat = vi.fn();

vi.mock('../contexts/DateFormatContext', () => ({
  useDateFormat: () => ({
    dateFormat: 'us',
    setDateFormat: mockSetDateFormat,
  }),
}));

describe('SettingsPage preferences', () => {
  beforeEach(async () => {
    await clearAllData();
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

    expect(screen.getByRole('button', { name: /^US/ })).toHaveClass('bg-rose-500');
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
