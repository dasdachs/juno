import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const TONE: Record<NoticeTone, { className: string; icon: string }> = {
  info: { className: 'secondary-container', icon: 'info' },
  success: { className: 'primary-container', icon: 'check_circle' },
  warning: { className: 'tertiary-container', icon: 'warning' },
  error: { className: 'error-container', icon: 'error' },
};

export interface NoticeProps {
  tone?: NoticeTone;
  /** Optional bold first line. */
  title?: string;
  children: ReactNode;
  /** Override the tone's default icon. */
  icon?: string;
}

/** Inline message block (MD3 has no banner; this is a tonal container card). */
export function Notice({ tone = 'info', title, children, icon }: NoticeProps) {
  return (
    <article
      role={tone === 'error' ? 'alert' : undefined}
      className={cx('no-elevate notice', TONE[tone].className)}
    >
      <Icon name={icon ?? TONE[tone].icon} />
      <div className="max">
        {title && <div className="headline">{title}</div>}
        <div>{children}</div>
      </div>
    </article>
  );
}
