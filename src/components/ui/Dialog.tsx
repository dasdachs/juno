import type { ReactNode } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { Scrim } from './Scrim';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons for the bottom-right action row. */
  actions?: ReactNode;
}

/** MD3 basic dialog: modal, focus-trapped, closes on Escape or scrim click. */
export function Dialog({ isOpen, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useDialog<HTMLDialogElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <Scrim onClose={onClose} />
      <dialog ref={dialogRef} open className="active modal" aria-modal="true" aria-label={title} tabIndex={-1}>
        <h5>{title}</h5>
        <div className="dialog-body">{children}</div>
        {actions && <nav className="right-align dialog-actions">{actions}</nav>}
      </dialog>
    </>
  );
}
