import { IconButton, TextField } from '../ui';

interface PasswordRevealFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}

/** Password field with a trailing button that shows or hides what was typed. */
export function PasswordRevealField({ label, placeholder, value, onChange, show, onToggle }: PasswordRevealFieldProps) {
  return (
    <TextField
      type={show ? 'text' : 'password'}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      trailing={
        <IconButton
          className="field-action"
          icon={show ? 'visibility_off' : 'visibility'}
          label={show ? 'Hide password' : 'Show password'}
          onClick={onToggle}
        />
      }
    />
  );
}
