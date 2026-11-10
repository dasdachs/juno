import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Log Period',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('should render nothing when closed', () => {
    render(
      <BottomSheet {...defaultProps} isOpen={false}>
        <p>content</p>
      </BottomSheet>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should expose itself as a labelled modal dialog', () => {
    render(
      <BottomSheet {...defaultProps}>
        <p>content</p>
      </BottomSheet>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Log Period');
  });

  it('should close on Escape', () => {
    render(
      <BottomSheet {...defaultProps}>
        <p>content</p>
      </BottomSheet>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close on other keys', () => {
    render(
      <BottomSheet {...defaultProps}>
        <p>content</p>
      </BottomSheet>
    );

    fireEvent.keyDown(document, { key: 'a' });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should close when the backdrop is activated', () => {
    render(
      <BottomSheet {...defaultProps}>
        <p>content</p>
      </BottomSheet>
    );

    fireEvent.click(screen.getByLabelText('Close'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should lock body scroll while open and restore it on close', () => {
    const { rerender } = render(
      <BottomSheet {...defaultProps}>
        <p>content</p>
      </BottomSheet>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <BottomSheet {...defaultProps} isOpen={false}>
        <p>content</p>
      </BottomSheet>
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('should move focus into the sheet when it opens', () => {
    render(
      <BottomSheet {...defaultProps}>
        <button>inside</button>
      </BottomSheet>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('should keep Tab focus inside the sheet', () => {
    render(
      <BottomSheet {...defaultProps}>
        <button>first</button>
        <button>last</button>
      </BottomSheet>
    );

    const last = screen.getByRole('button', { name: 'last' });
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
