import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Content rendered successfully</div>;
}

// Wrapper to control error state
function TestWrapper({
  shouldThrow = false,
  fallback,
}: {
  shouldThrow?: boolean;
  fallback?: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      <ThrowingComponent shouldThrow={shouldThrow} />
    </ErrorBoundary>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error occurs', () => {
    render(<TestWrapper shouldThrow={false} />);

    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
  });

  it('should render fallback UI when error occurs', () => {
    render(<TestWrapper shouldThrow={true} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload App' })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    render(
      <TestWrapper shouldThrow={true} fallback={<div>Custom error message</div>} />
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should reset error state when Try Again is clicked', () => {
    // Use a stateful component to control throwing behavior
    let shouldThrow = true;
    const ControlledThrower = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Content rendered successfully</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the behavior before clicking reset
    shouldThrow = false;

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // Force a rerender to pick up the state change
    rerender(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
  });

  it('should call window.location.reload when Reload App is clicked', () => {
    const reloadMock = vi.fn();
    const originalLocation = window.location;

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: reloadMock },
      writable: true,
    });

    render(<TestWrapper shouldThrow={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Reload App' }));

    expect(reloadMock).toHaveBeenCalled();

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('should display error icon', () => {
    render(<TestWrapper shouldThrow={true} />);

    // The SVG warning icon should be present
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct button styles', () => {
    render(<TestWrapper shouldThrow={true} />);

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
    const reloadButton = screen.getByRole('button', { name: 'Reload App' });

    expect(tryAgainButton).toHaveClass('bg-gray-100');
    expect(reloadButton).toHaveClass('bg-rose-500');
  });
});
