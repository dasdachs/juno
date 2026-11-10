import { useState } from 'react';
import { exportData } from '../../lib/exportImport';
import { checkPasswordStrength } from '../../lib/passwordPolicy';

/** State and submit logic for creating a passphrase-sealed backup. */
export function useExportData(onClose: () => void) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setError('');

    const strengthError = checkPasswordStrength(password);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsExporting(true);
    try {
      let unreadable = 0;
      const blob = await exportData(password, (count) => {
        unreadable = count;
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `juno-backup-${dateStr}.juno`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (unreadable > 0) {
        alert(
          `Backup created, but ${unreadable} damaged entries could not be read and were left out.`
        );
      }

      // Reset and close
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    error,
    isExporting,
    handleExport,
  };
}
