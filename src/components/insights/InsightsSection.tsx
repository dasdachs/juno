import type { ReactNode } from 'react';
import { Icon } from '../ui';

interface InsightsSectionProps {
  title: string;
  /** Material Symbol name shown before the title. */
  icon?: string;
  children: ReactNode;
}

/** A titled block on the Insights page. */
export function InsightsSection({ title, icon, children }: InsightsSectionProps) {
  return (
    <section className="stack tight">
      <h2 className="section-title with-icon">
        {icon && <Icon name={icon} size="small" />}
        {title}
      </h2>
      {children}
    </section>
  );
}
