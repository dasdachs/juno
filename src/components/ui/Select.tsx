import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';

type NativeProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'>;

export interface SelectProps extends NativeProps {
  label: string;
  onChange: (value: string) => void;
  helper?: string;
  /** Compact variant: no floating label, the label becomes the accessible name. */
  hideLabel?: boolean;
  /** `<option>` elements. */
  children: ReactNode;
}

/** MD3 outlined select (native `<select>` underneath). */
export function Select({ label, onChange, helper, hideLabel, children, id, ...rest }: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={hideLabel ? 'field border suffix small' : 'field label border suffix'}>
      <select id={fieldId} aria-label={hideLabel ? label : undefined} onChange={(e) => onChange(e.target.value)} {...rest}>
        {children}
      </select>
      {!hideLabel && <label htmlFor={fieldId}>{label}</label>}
      <Icon name="arrow_drop_down" />
      {helper && <output>{helper}</output>}
    </div>
  );
}
