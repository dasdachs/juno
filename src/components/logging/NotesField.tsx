import { TextField } from '../ui';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** Optional free-text notes shared by the log forms. */
export function NotesField({ value, onChange }: NotesFieldProps) {
  return (
    <TextField
      multiline
      rows={3}
      label="Notes (optional)"
      placeholder="Any additional notes..."
      value={value}
      onChange={onChange}
    />
  );
}
