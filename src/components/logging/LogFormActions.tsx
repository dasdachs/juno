import { useState } from 'react';
import { Button } from '../ui';

interface LogFormActionsProps {
  onSave: () => void;
  onCancel: () => void;
  /** Omit when creating a new entry — the Delete button only shows when editing. */
  onDelete?: () => void;
  canSave: boolean;
  isSubmitting: boolean;
}

/**
 * Shared footer for every log form: Delete (two-step, when editing), Cancel, Save.
 */
export function LogFormActions({ onSave, onCancel, onDelete, canSave, isSubmitting }: LogFormActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeleteClick = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    onDelete?.();
  };

  return (
    <div className="stack tight log-actions">
      {confirmingDelete && (
        <p role="alert" className="small-text error-text center-align">
          This can't be undone. Tap Delete again to confirm.
        </p>
      )}

      <div className="log-actions-row">
        {onDelete && (
          <Button
            variant={confirmingDelete ? 'danger' : 'danger-text'}
            onClick={handleDeleteClick}
            disabled={isSubmitting}
          >
            {confirmingDelete ? 'Confirm Delete' : 'Delete'}
          </Button>
        )}
        <span className="log-actions-spacer" />
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={!canSave || isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
