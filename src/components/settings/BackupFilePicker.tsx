import { useId } from 'react';
import { Icon } from '../ui';

interface BackupFilePickerProps {
  fileName: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** BeerCSS file field: the real file input sits invisibly over a read-only text box. */
export function BackupFilePicker({ fileName, onChange }: BackupFilePickerProps) {
  const id = useId();

  return (
    <div className="field label border suffix">
      <input type="text" className="active" value={fileName} placeholder=" " readOnly tabIndex={-1} aria-hidden="true" />
      <input id={id} type="file" accept=".juno" onChange={onChange} />
      <label htmlFor={id} className="active">
        Backup File
      </label>
      <Icon name="attach_file" />
    </div>
  );
}
