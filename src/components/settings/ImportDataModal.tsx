import { Button, Dialog, Notice } from '../ui';
import { ImportForm } from './ImportForm';
import { useImportData } from './useImportData';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDataModal({ isOpen, onClose, onSuccess }: ImportDataModalProps) {
  const form = useImportData(onClose, onSuccess);
  const { isImporting, showConfirm } = form;

  if (!isOpen) return null;

  const formActions = (
    <>
      <Button variant="text" onClick={onClose} disabled={isImporting}>
        Cancel
      </Button>
      <Button
        icon={isImporting ? undefined : 'upload'}
        onClick={form.handleProceed}
        disabled={isImporting || !form.manifest || !form.password}
      >
        {isImporting ? 'Importing...' : 'Import'}
      </Button>
    </>
  );

  const confirmActions = (
    <>
      <Button variant="text" onClick={() => form.setShowConfirm(false)}>
        Go Back
      </Button>
      <Button variant="danger" onClick={form.handleImport} disabled={isImporting}>
        {isImporting ? 'Replacing...' : 'Replace All Data'}
      </Button>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import Data"
      actions={showConfirm ? confirmActions : formActions}
    >
      {!showConfirm ? (
        <ImportForm form={form} />
      ) : (
        <Notice tone="error" title="Warning: Data will be deleted">
          This will permanently delete all your existing data and replace
          it with the backup. This action cannot be undone.
        </Notice>
      )}
    </Dialog>
  );
}
