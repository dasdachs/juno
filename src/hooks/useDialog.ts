import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Modal dialog behaviour shared by every sheet: Escape to close, focus moved
 * into the dialog and trapped there, body scroll locked, and focus returned to
 * whatever was focused before it opened.
 *
 * Attach the returned ref to the dialog element.
 */
export function useDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusableItems = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []
      );

    // Move focus into the dialog so keyboard and screen reader users land here.
    (focusableItems()[0] ?? dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const items = focusableItems();
      if (items.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const insideDialog = dialogRef.current?.contains(active) ?? false;

      if (event.shiftKey && (active === first || !insideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !insideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  return dialogRef;
}
