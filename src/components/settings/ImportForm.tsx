import { Icon } from '../ui';
import { BackupFilePicker } from './BackupFilePicker';
import { BackupInfo } from './BackupInfo';
import { ImportStrategyPicker } from './ImportStrategyPicker';
import { PasswordRevealField } from './PasswordRevealField';
import type { ImportDataState } from './useImportData';

export function ImportForm({ form }: { form: ImportDataState }) {
  const { manifest, error } = form;

  return (
    <div className="stack">
      <p className="supporting">Restore data from an encrypted backup file.</p>

      <BackupFilePicker fileName={form.fileName} onChange={form.handleFileSelect} />

      {manifest && <BackupInfo manifest={manifest} />}

      {manifest && (
        <PasswordRevealField
          label="Backup Password"
          placeholder="Enter backup password"
          value={form.password}
          onChange={form.setPassword}
          show={form.showPassword}
          onToggle={() => form.setShowPassword(!form.showPassword)}
        />
      )}

      {manifest && <ImportStrategyPicker strategy={form.strategy} onChange={form.setStrategy} />}

      {error && (
        <div className="row small-text error-text">
          <Icon name="error" size="small" />
          {error}
        </div>
      )}
    </div>
  );
}
