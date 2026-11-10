import type { ReactNode } from 'react';
import { Button, Icon } from '../ui';

interface StepLayoutProps {
  title: string;
  description: ReactNode;
  /** Material Symbol shown next to the title. */
  icon?: string;
  onBack: () => void;
  children: ReactNode;
}

/** Shared frame for a wizard step: back button, question, explanation, then the controls. */
export function StepLayout({ title, description, icon, onBack, children }: StepLayoutProps) {
  return (
    <div className="stack">
      <div>
        <Button variant="text" icon="chevron_left" onClick={onBack}>
          Back
        </Button>
      </div>
      <div className="row">
        {icon && <Icon name={icon} className="primary-text" />}
        <h2 className="h5 max">{title}</h2>
      </div>
      <p className="muted">{description}</p>
      {children}
    </div>
  );
}
