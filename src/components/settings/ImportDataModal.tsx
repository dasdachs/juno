import { useState } from 'react';
import { X, Upload, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { parseManifest, importData, type ExportManifest } from '../../lib/exportImport';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDataModal({ isOpen, onClose, onSuccess }: ImportDataModalProps) {
  const [, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [manifest, setManifest] = useState<ExportManifest | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strategy, setStrategy] = useState<'replace' | 'merge'>('merge');
  const [error, setError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showConfirm ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Restore data from an encrypted backup file.
            </p>

            <div className="space-y-3">
              {/* File picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup File
                </label>
                <input
                  type="file"
                  accept=".juno"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rose-50 dark:file:bg-rose-900/20 file:text-rose-600 dark:file:text-rose-400 hover:file:bg-rose-100 dark:hover:file:bg-rose-900/30 file:transition-colors file:duration-200"
                />
              </div>

              {/* Manifest info */}
              {manifest && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Backup Info</p>
                  <ul className="text-gray-500 dark:text-gray-400 space-y-1">
                    <li>
                      Exported:{' '}
                      {new Date(manifest.exportedAt).toLocaleDateString()}
                    </li>
                    <li>Records: {manifest.recordCount}</li>
                    <li>Cycles: {manifest.cycleCount}</li>
                    <li>Profile: {manifest.hasProfile ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              )}

              {/* Password */}
              {manifest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Backup Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter backup password"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-rose-500 pr-10 transition-colors duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Strategy */}
              {manifest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Import Strategy
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={strategy === 'merge'}
                        onChange={() => setStrategy('merge')}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Merge with existing
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Keep existing data, add new records from backup
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={strategy === 'replace'}
                        onChange={() => setStrategy('replace')}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Replace all data
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Delete existing data, restore from backup
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isImporting}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                disabled={isImporting || !manifest || !password}
                className="flex-1 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                {isImporting ? (
                  'Importing...'
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-semibold mb-1">Warning: Data will be deleted</p>
                <p>
                  This will permanently delete all your existing data and replace
                  it with the backup. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Go Back
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200"
              >
                {isImporting ? 'Replacing...' : 'Replace All Data'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
