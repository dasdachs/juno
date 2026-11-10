import { BottomSheet } from '../common/BottomSheet';
import { RECORD_TYPE_META, RECORD_TYPE_ORDER } from '../../lib/recordTypeMeta';
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {RECORD_TYPE_ORDER.map((type) => {
          const meta = RECORD_TYPE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl transition-colors duration-200 ${meta.tileClass}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{meta.label}</span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
