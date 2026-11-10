import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Visible text for an extended FAB. Omit for an icon-only FAB (then pass aria-label). */
  label?: string;
}

/** MD3 floating action button, fixed above the navigation bar. */
export function Fab({ icon, label, className, type = 'button', ...rest }: FabProps) {
  return (
    <button
      type={type}
      className={cx('fab primary-container', label ? 'extended' : 'square', className)}
      {...rest}
    >
      <Icon name={icon} />
      {label && <span>{label}</span>}
    </button>
  );
}
