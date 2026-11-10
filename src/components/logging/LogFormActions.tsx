import { useState } from 'react';

interface LogFormActionsProps {
  onSave: () => void;
  onCancel: () => void;
  /** Omit when creating a new entry — the Delete button only shows when editing. */
  onDelete?: () => void;
  canSave: boolean;
  isSubmitting: boolean;
  /** Accent classes for the Save button, so each record type keeps its colour. */
  saveClassName?: string;
}

/**
 * Shared footer for every log form: Delete (two-step, when editing), Cancel, Save.
 */
export function LogFormActions({
  onSave,
  onCancel,
  onDelete,
  canSave,
  isSubmitting,
  saveClassName = 'bg-rose-500 hover:bg-rose-600',
}: LogFormActionsProps) {
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
    <div className="space-y-2 pt-4">
      {confirmingDelete && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 text-center">
          This can't be undone. Tap Delete again to confirm.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg disabled:opacity-50 text-sm transition-colors duration-200 ${
              confirmingDelete
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            {confirmingDelete ? 'Confirm Delete' : 'Delete'}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || isSubmitting}
          className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 text-sm transition-colors duration-200 ${saveClassName}`}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
