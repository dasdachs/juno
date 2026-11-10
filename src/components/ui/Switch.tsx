import { useId } from 'react';

export interface SwitchProps {
  label: string;
  /** Secondary line under the label. */
  supporting?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** MD3 switch with its label, laid out as a settings row. */
export function Switch({ label, supporting, checked, onChange, disabled }: SwitchProps) {
  const labelId = useId();

  return (
    <div className="row">
      <div className="max">
        <div id={labelId}>{label}</div>
        {supporting && <div className="small-text supporting">{supporting}</div>}
      </div>
      <label className="switch">
        <input
          type="checkbox"
          role="switch"
          aria-labelledby={labelId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span />
      </label>
    </div>
  );
}
