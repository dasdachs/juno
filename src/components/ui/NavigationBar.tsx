import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

export interface NavigationItem {
  to: string;
  label: string;
  icon: string;
}

export interface NavigationBarProps {
  items: NavigationItem[];
  /** `bar` sits at the bottom on phones; `drawer` is the labelled rail on wider screens. */
  variant: 'bar' | 'drawer';
  /** Extra content after the destinations (drawer only), e.g. a lock button. */
  children?: ReactNode;
}

/** MD3 navigation bar (phones) or expanded navigation rail (wider screens). */
export function NavigationBar({ items, variant, children }: NavigationBarProps) {
  return (
    <nav aria-label="Main" className={variant === 'bar' ? 'bottom s' : 'left max m l'}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      {children}
    </nav>
  );
}
