import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Accessible name; also shown as the native tooltip. */
  label: string;
  variant?: 'standard' | 'tonal' | 'filled';
}

const VARIANT_CLASS = { standard: 'transparent', tonal: 'fill', filled: '' };

/** MD3 icon button: a round, icon-only button with an accessible name. */
export function IconButton({
  icon,
  label,
  variant = 'standard',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('circle', VARIANT_CLASS[variant], className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
