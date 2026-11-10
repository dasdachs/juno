export interface RadioProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** MD3 radio button with its label. */
export function Radio({ label, name, value, checked, onChange, disabled }: RadioProps) {
  return (
    <label className="radio">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}
