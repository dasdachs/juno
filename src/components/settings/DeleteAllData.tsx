import { Button, Dialog } from '../ui';
import { useDeleteAllData } from './useDeleteAllData';

export function DeleteAllData() {
  const del = useDeleteAllData();

  return (
    <div className="settings-block">
      <Button variant="danger-text" icon="delete" fullWidth onClick={() => del.setShowDeleteConfirm(true)}>
        Delete All Data
      </Button>

      <Dialog
        isOpen={del.showDeleteConfirm}
        onClose={del.handleCancel}
        title="Delete All Data"
        actions={
          <>
            <Button variant="text" onClick={del.handleCancel}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={del.handleDeleteAllData}
              disabled={del.deleteConfirmText !== 'DELETE'}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="stack">
          <p className="error-text">
            This will permanently delete all your data. Type DELETE to confirm.
          </p>
          <div className="field border">
            <input
              type="text"
              value={del.deleteConfirmText}
              onChange={(e) => del.setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>
          {del.deleteError && <p className="small-text error-text">{del.deleteError}</p>}
        </div>
      </Dialog>
    </div>
  );
}
