import { Button, Dialog, TextField } from '../ui';
import { PasswordRevealField } from './PasswordRevealField';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useExportData } from './useExportData';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const form = useExportData(onClose);
  const { password, confirmPassword, showPassword, error, isExporting } = form;

  if (!isOpen) return null;

  const actions = (
    <>
      <Button variant="text" onClick={onClose} disabled={isExporting}>
        Cancel
      </Button>
      <Button
        icon={isExporting ? undefined : 'download'}
        onClick={form.handleExport}
        disabled={isExporting || !password || !confirmPassword}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
    </>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Export Data" actions={actions}>
      <div className="stack">
        <p className="supporting">
          Create an encrypted backup of your data. Choose a strong password to protect your backup file.
        </p>
        <PasswordRevealField
          label="Backup Password"
          placeholder="Enter strong backup password"
          value={password}
          onChange={form.setPassword}
          show={showPassword}
          onToggle={() => form.setShowPassword(!showPassword)}
        />
        <PasswordStrengthMeter password={password} />
        <TextField
          type={showPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={confirmPassword}
          onChange={form.setConfirmPassword}
          placeholder="Re-enter backup password"
        />
        {error && <p className="small-text error-text">{error}</p>}
      </div>
    </Dialog>
  );
}
