import { RECORD_TYPE_META, RECORD_TYPE_ORDER } from '../../lib/recordTypeMeta';
import type { RecordType } from '../../lib/types';
import { cx, Icon } from '../ui';

interface RecordTypeTilesProps {
  onSelect: (type: RecordType) => void;
  /** Types that already have an entry; their tiles are tinted. */
  isLogged?: (type: RecordType) => boolean;
  /** Prefix for each tile's accessible name, e.g. `Log` gives "Log Period". */
  labelPrefix?: string;
  columns?: 3 | 5;
}

/** One tile per record type, used wherever the user picks what to log. */
export function RecordTypeTiles({ onSelect, isLogged, labelPrefix, columns = 3 }: RecordTypeTilesProps) {
  return (
    <div className={cx('tile-grid', columns === 5 && 'cols-5')}>
      {RECORD_TYPE_ORDER.map((type) => {
        const meta = RECORD_TYPE_META[type];
        return (
          <button
            key={type}
            type="button"
            className={cx('tile', isLogged?.(type) && meta.tone)}
            onClick={() => onSelect(type)}
            aria-label={labelPrefix ? `${labelPrefix} ${meta.label}` : undefined}
          >
            <Icon name={meta.icon} />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
