import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

const VARIANT_CLASS: Record<CardVariant, string> = {
  elevated: '',
  filled: 'no-elevate surface-container-highest',
  outlined: 'no-elevate border',
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
}

/** MD3 card. */
export function Card({ variant = 'filled', className, children, ...rest }: CardProps) {
  return (
    <article className={cx(VARIANT_CLASS[variant], className)} {...rest}>
      {children}
    </article>
  );
}
