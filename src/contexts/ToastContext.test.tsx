import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

function Harness() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('Saved')}>success</button>
      <button onClick={() => showToast('Could not save', 'error')}>error</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <Harness />
    </ToastProvider>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render nothing until a toast is shown', () => {
    renderHarness();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should show a success message', () => {
    renderHarness();
    act(() => {
      screen.getByText('success').click();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('should announce errors assertively', () => {
    renderHarness();
    act(() => {
      screen.getByText('error').click();
    });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not save');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should auto-dismiss after the timeout', () => {
    renderHarness();
    act(() => {
      screen.getByText('success').click();
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should be dismissable by the user', () => {
    renderHarness();
    act(() => {
      screen.getByText('success').click();
    });

    act(() => {
      screen.getByRole('button', { name: /dismiss/i }).click();
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should throw a clear error when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
