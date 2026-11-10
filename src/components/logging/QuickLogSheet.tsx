import { BottomSheet } from '../ui';
import { RecordTypeTiles } from '../calendar/RecordTypeTiles';
import type { RecordType } from '../../lib/types';

interface QuickLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: RecordType) => void;
  title?: string;
}

/** Type picker shown by the "log today" shortcut. */
export function QuickLogSheet({
  isOpen,
  onClose,
  onSelect,
  title = 'Log for today',
}: QuickLogSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <RecordTypeTiles onSelect={onSelect} />
    </BottomSheet>
  );
}
