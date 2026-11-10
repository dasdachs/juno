import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger' | 'danger-text';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  filled: '',
  tonal: 'fill',
  outlined: 'border',
  text: 'border no-border',
  danger: 'error',
  'danger-text': 'border no-border error-text',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Leading Material Symbol name. */
  icon?: string;
  size?: 'small' | 'large';
  /** Stretch to the width of the container. */
  fullWidth?: boolean;
}

/** MD3 common button. */
export function Button({
  variant = 'filled',
  icon,
  size,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(VARIANT_CLASS[variant], size, fullWidth && 'responsive', className) || undefined}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}
