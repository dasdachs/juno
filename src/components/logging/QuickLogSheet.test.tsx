import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickLogSheet } from './QuickLogSheet';

describe('QuickLogSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<QuickLogSheet {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should offer every record type', () => {
    render(<QuickLogSheet {...defaultProps} />);

    for (const label of ['Period', 'Symptoms', 'Mood', 'Intimacy', 'Note']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('should report the chosen type', () => {
    render(<QuickLogSheet {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mood' }));

    expect(defaultProps.onSelect).toHaveBeenCalledWith('mood');
  });

  it('should be dismissable with Escape', () => {
    render(<QuickLogSheet {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
