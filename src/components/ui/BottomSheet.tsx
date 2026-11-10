import type { ReactNode } from 'react';
import { useDialog } from '../../hooks/useDialog';
import { Scrim } from './Scrim';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Accessible name of the close button. Defaults to `Close <title>`. */
  closeLabel?: string;
  /** Accessible name of the backdrop. Defaults to `Close`. */
  scrimLabel?: string;
}

/** MD3 modal bottom sheet: drag handle, title row, scrollable content. */
export function BottomSheet({ isOpen, onClose, title, children, closeLabel, scrimLabel }: BottomSheetProps) {
  const dialogRef = useDialog<HTMLDialogElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <>
      <Scrim onClose={onClose} label={scrimLabel} />
      <dialog ref={dialogRef} open className="bottom active sheet" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="sheet-handle" aria-hidden="true" />
        <nav className="sheet-header">
          <h6 className="max">{title}</h6>
          <IconButton icon="close" label={closeLabel ?? `Close ${title}`} onClick={onClose} />
        </nav>
        <div className="sheet-content">{children}</div>
      </dialog>
    </>
  );
}
