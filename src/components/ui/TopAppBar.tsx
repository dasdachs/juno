import type { ReactNode } from 'react';

export interface TopAppBarProps {
  title: ReactNode;
  /** Leading slot: a back button or the app mark. */
  leading?: ReactNode;
  /** Trailing action icon buttons. */
  actions?: ReactNode;
}

/** MD3 small top app bar. */
export function TopAppBar({ title, leading, actions }: TopAppBarProps) {
  return (
    <header className="fixed top-app-bar">
      <nav>
        {leading}
        <h1 className="max app-bar-title">{title}</h1>
        {actions}
      </nav>
    </header>
  );
}
