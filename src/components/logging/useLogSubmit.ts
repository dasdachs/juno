import { useState } from 'react';
import { useRecords } from '../../hooks/useRecords';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../lib/logger';
import type { RecordData, RecordType } from '../../lib/types';

interface LogSubmitOptions {
  type: RecordType;
  /** Id of the entry being edited; omit when creating. */
  existingId?: string;
  canSave: boolean;
  /** Builds the payload to store. Unused when `save` is given. */
  getData?: () => RecordData;
  /** Custom persistence (period ranges). Resolve `false` to abort silently. */
  save?: () => Promise<boolean | void>;
  savedToast: string;
  /** Name used in log lines, e.g. `mood log`. */
  logName: string;
  /** What the toasts call the record. */
  noun?: 'entry' | 'note';
  onClose: () => void;
}

/** Save/delete plumbing shared by every log form: busy flag, toasts, close. */
export function useLogSubmit(options: LogSubmitOptions) {
  const { type, existingId, canSave, getData, save, savedToast, logName, noun = 'entry', onClose } = options;
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = async (verb: 'save' | 'delete', action: () => Promise<unknown>, doneToast: string) => {
    setIsSubmitting(true);
    try {
      if ((await action()) === false) return;
      showToast(doneToast);
      onClose();
    } catch (error) {
      logger.error(`Failed to ${verb} ${logName}:`, error);
      showToast(`Couldn't ${verb} your ${noun}. Please try again.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveRecord = async () => {
    const data = getData!();
    if (existingId) await updateRecord(existingId, { data });
    else await addRecord({ type, data, tags: [] });
  };

  const handleSave = async () => {
    if (!canSave) return;
    await run('save', save ?? saveRecord, savedToast);
  };

  const handleDelete = async () => {
    if (!existingId) return;
    await run('delete', () => deleteRecord(existingId), noun === 'note' ? 'Note deleted' : 'Entry deleted');
  };

  return { isSubmitting, handleSave, handleDelete: existingId ? handleDelete : undefined };
}
