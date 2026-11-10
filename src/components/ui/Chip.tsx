import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface ChipProps {
  children: ReactNode;
  /** Leading Material Symbol name. A selected chip without one shows a check. */
  icon?: string;
  /** Filter-chip state. Leave undefined for assist chips. */
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/** MD3 chip. Interactive (assist / filter) with `onClick`, a static label without. */
export function Chip({ children, icon, selected, onClick, disabled, className }: ChipProps) {
  const leading = icon ?? (selected ? 'check' : undefined);
  const content = (
    <>
      {leading && <Icon name={leading} />}
      <span>{children}</span>
    </>
  );

  if (!onClick) return <span className={cx('chip', className)}>{content}</span>;

  return (
    <button
      type="button"
      className={cx('chip', className)}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
