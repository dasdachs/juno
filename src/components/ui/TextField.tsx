import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>;

export interface TextFieldProps extends NativeProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  /** Error message; puts the field in its invalid state. */
  error?: string;
  helper?: string;
  /** Render a textarea instead of an input. */
  multiline?: boolean;
  rows?: number;
  /** Trailing element, e.g. an icon button that reveals a password. */
  trailing?: ReactNode;
}

const ALWAYS_FLOATING = ['date', 'time', 'month', 'number'];

/** MD3 outlined text field with a floating label. */
export function TextField(props: TextFieldProps) {
  const { label, value, onChange, error, helper, multiline, rows = 3, trailing, id, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  // The label floats over an empty input; keep it up when the input shows its own hint.
  const floating = Boolean(rest.placeholder) || ALWAYS_FLOATING.includes(rest.type ?? '');
  const shared = {
    id: fieldId,
    value,
    className: floating ? 'active' : undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || helper ? `${fieldId}-help` : undefined,
  };

  return (
    <div className={cx('field label border', multiline && 'textarea', Boolean(trailing) && 'suffix', error && 'invalid')}>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          placeholder={rest.placeholder ?? ' '}
          disabled={rest.disabled}
          maxLength={rest.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input {...rest} {...shared} placeholder={rest.placeholder ?? ' '} onChange={(e) => onChange(e.target.value)} />
      )}
      <label htmlFor={fieldId} className={floating ? 'active' : undefined}>
        {label}
      </label>
      {trailing}
      {(error || helper) && (
        <output id={`${fieldId}-help`} className={error ? 'invalid' : undefined} role={error ? 'alert' : undefined}>
          {error || helper}
        </output>
      )}
    </div>
  );
}
