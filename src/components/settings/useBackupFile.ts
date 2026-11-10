import { useState } from 'react';
import { parseManifest, type ExportManifest } from '../../lib/exportImport';

/** The chosen backup file, its raw content and its parsed manifest. */
export function useBackupFile(setError: (message: string) => void) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ExportManifest | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setManifest(null);

    try {
      const content = await selectedFile.text();
      setFileContent(content);
      const parsedManifest = parseManifest(content);
      setManifest(parsedManifest);
    } catch {
      setError('Invalid backup file');
      setFile(null);
      setFileContent(null);
    }
  };

  return { file, setFile, fileContent, setFileContent, manifest, setManifest, handleFileSelect };
}
