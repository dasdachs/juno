import { useState } from 'react';
import { importData } from '../../lib/exportImport';
import { useBackupFile } from './useBackupFile';

/** State and submit logic for restoring a passphrase-sealed backup. */
export function useImportData(onClose: () => void, onSuccess: () => void) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strategy, setStrategy] = useState<'replace' | 'merge'>('merge');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const backup = useBackupFile(setError);
  const { fileContent, setFile, setFileContent, setManifest } = backup;

  const handleImport = async () => {
    if (!fileContent || !password) return;

    setError('');
    setIsImporting(true);

    try {
      const result = await importData(fileContent, password, strategy);

      // Success
      alert(
        `Import successful!\n\n` +
        `Records imported: ${result.recordsImported}\n` +
        `Cycles imported: ${result.cyclesImported}\n` +
        `Profile imported: ${result.profileImported ? 'Yes' : 'No'}`
      );

      // Reset and close
      setFile(null);
      setFileContent(null);
      setManifest(null);
      setPassword('');
      setShowConfirm(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleProceed = () => {
    if (strategy === 'replace') {
      setShowConfirm(true);
    } else {
      handleImport();
    }
  };

  return {
    fileName: backup.file?.name ?? '',
    manifest: backup.manifest,
    handleFileSelect: backup.handleFileSelect,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    strategy,
    setStrategy,
    error,
    isImporting,
    showConfirm,
    setShowConfirm,
    handleImport,
    handleProceed,
  };
}

export type ImportDataState = ReturnType<typeof useImportData>;
