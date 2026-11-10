import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { clearAllData } from '../../lib/db';

/** State and logic for the type-DELETE-to-confirm wipe of the whole vault. */
export function useDeleteAllData() {
  const { lock } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    lock();
    try {
      await clearAllData();
    } catch {
      setDeleteError('Your data could not be deleted. Close other Juno tabs and try again.');
      return;
    }
    try {
      localStorage.clear();
    } catch {
      // Storage unavailable: nothing to clear
    }
    window.location.reload();
  };

  // Stable identity: the dialog re-runs its focus handling when onClose changes
  const handleCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  }, []);

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    deleteError,
    handleDeleteAllData,
    handleCancel,
  };
}
