import { cx } from './cx';

export interface IconProps {
  /** Material Symbols ligature name, e.g. `calendar_month`. */
  name: string;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'extra';
  filled?: boolean;
  className?: string;
}

/** Decorative Material Symbol. Always hidden from assistive tech: label the parent. */
export function Icon({ name, size, filled, className }: IconProps) {
  return (
    <i aria-hidden="true" className={cx(size, filled && 'fill', className) || undefined}>
      {name}
    </i>
  );
}
