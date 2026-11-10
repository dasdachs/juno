import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogFormActions } from './LogFormActions';

describe('LogFormActions', () => {
  const defaultProps = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
    canSave: true,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not offer Delete when creating a new entry', () => {
    render(<LogFormActions {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should disable Save when it cannot be saved', () => {
    render(<LogFormActions {...defaultProps} canSave={false} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('should show a saving state while submitting', () => {
    render(<LogFormActions {...defaultProps} isSubmitting />);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  describe('two-step delete', () => {
    it('should not delete on the first tap', () => {
      const onDelete = vi.fn();
      render(<LogFormActions {...defaultProps} onDelete={onDelete} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(/can't be undone/i);
    });

    it('should delete on the second tap', () => {
      const onDelete = vi.fn();
      render(<LogFormActions {...defaultProps} onDelete={onDelete} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
