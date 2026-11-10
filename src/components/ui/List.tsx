import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export interface ListProps {
  children: ReactNode;
  /** Draw dividers between items. */
  divided?: boolean;
  className?: string;
}

/** MD3 list container. */
export function List({ children, divided = true, className }: ListProps) {
  return <ul className={cx('list', divided && 'border', className)}>{children}</ul>;
}

export interface ListItemProps {
  headline: ReactNode;
  supporting?: ReactNode;
  /** Leading Material Symbol name. */
  icon?: string;
  /** Tone class for the leading icon badge, e.g. `tone-mood`. */
  iconTone?: string;
  /** Trailing content: an icon, a value, a switch. */
  trailing?: ReactNode;
  /** Makes the whole row a button. */
  onClick?: () => void;
  ariaLabel?: string;
}

/** MD3 list item: leading icon, headline + supporting text, trailing slot. */
export function ListItem({ headline, supporting, icon, iconTone, trailing, onClick, ariaLabel }: ListItemProps) {
  const body = (
    <>
      {icon && (iconTone ? <span className={cx('icon-badge', iconTone)}><Icon name={icon} /></span> : <Icon name={icon} />)}
      <div className="max">
        <div className="headline">{headline}</div>
        {supporting && <div className="supporting">{supporting}</div>}
      </div>
      {trailing}
    </>
  );

  if (!onClick) return <li>{body}</li>;

  return (
    <li className="interactive">
      <button type="button" className="plain list-action" onClick={onClick} aria-label={ariaLabel}>
        {body}
      </button>
    </li>
  );
}
