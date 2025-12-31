import { useState } from 'react';
import { format } from 'date-fns';
import { BottomSheet } from '../common/BottomSheet';
import { useRecords } from '../../hooks/useRecords';
import type { NoteData } from '../../lib/types';
import { startOfDay } from '../../lib/predictions';

interface NoteLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  date: number;
  existingRecord?: {
    id: string;
    data: NoteData;
  };
}

export function NoteLogForm({
  isOpen,
  onClose,
  date,
  existingRecord,
}: NoteLogFormProps) {
  const { addRecord, updateRecord, deleteRecord } = useRecords();
  const [title, setTitle] = useState(existingRecord?.data.title ?? '');
  const [content, setContent] = useState(existingRecord?.data.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateLabel = format(new Date(date), 'MMMM d, yyyy');
  const normalizedDate = startOfDay(date);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const data: NoteData = {
        date: normalizedDate,
        title: title.trim() || undefined,
        content: content.trim(),
      };

      if (existingRecord) {
        await updateRecord(existingRecord.id, { data });
      } else {
        await addRecord({
          type: 'note',
          data,
          tags: [],
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    setIsSubmitting(true);
    try {
      await deleteRecord(existingRecord.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Note">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{dateLabel}</p>

        <div>
          <label className="text-sm font-medium text-gray-700">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            placeholder="Note title..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            rows={5}
            placeholder="Write your note..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          {existingRecord && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
