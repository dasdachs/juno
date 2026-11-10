import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DateFormatProvider, useDateFormat } from './DateFormatContext';
import { db, clearAllData } from '../lib/db';

vi.mock('../lib/dateFormat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/dateFormat')>();
  return { ...actual, inferDateFormatStyle: () => 'iso' };
});

function Harness() {
  const { dateFormat, setDateFormat, formatLong, formatShort } = useDateFormat();
  const timestamp = new Date(2026, 7, 6).getTime();
  return (
    <div>
      <span data-testid="style">{dateFormat}</span>
      <span data-testid="long">{formatLong(timestamp)}</span>
      <span data-testid="short">{formatShort(timestamp)}</span>
      <button onClick={() => setDateFormat('us')}>use us</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <DateFormatProvider>
      <Harness />
    </DateFormatProvider>
  );
}

describe('DateFormatContext', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('loads the style from existing settings', async () => {
    await db.settings.put({
      id: 'primary',
      sessionTimeout: 15 * 60 * 1000,
      periodReminderEnabled: false,
      periodReminderDays: 3,
      autoLockOnHidden: true,
      autoLockGracePeriod: 30000,
      dateFormat: 'international',
    });

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('style')).toHaveTextContent('international'));
    expect(screen.getByTestId('long')).toHaveTextContent('6 August 2026');
  });

  it('infers and persists a style when settings predate the field', async () => {
    await db.settings.put({
      id: 'primary',
      sessionTimeout: 15 * 60 * 1000,
      periodReminderEnabled: false,
      periodReminderDays: 3,
      autoLockOnHidden: true,
      autoLockGracePeriod: 30000,
    });

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('style')).toHaveTextContent('iso'));
    await waitFor(async () => {
      const settings = await db.settings.get('primary');
      expect(settings?.dateFormat).toBe('iso');
    });
  });

  it('lets the user change and persist the style', async () => {
    await db.settings.put({
      id: 'primary',
      sessionTimeout: 15 * 60 * 1000,
      periodReminderEnabled: false,
      periodReminderDays: 3,
      autoLockOnHidden: true,
      autoLockGracePeriod: 30000,
      dateFormat: 'iso',
    });

    renderHarness();
    await waitFor(() => expect(screen.getByTestId('style')).toHaveTextContent('iso'));

    act(() => {
      screen.getByText('use us').click();
    });

    expect(screen.getByTestId('style')).toHaveTextContent('us');
    expect(screen.getByTestId('short')).toHaveTextContent('08/06/2026');

    await waitFor(async () => {
      const settings = await db.settings.get('primary');
      expect(settings?.dateFormat).toBe('us');
    });
  });

  it('throws a clear error when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/DateFormatProvider/);
    spy.mockRestore();
  });
});
