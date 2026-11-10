import { cx } from './cx';
import { Icon } from './Icon';

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: string;
  /** Accessible name when it should differ from the visible label. */
  ariaLabel?: string;
}

export interface SegmentedButtonProps<T extends string> {
  /** Accessible name for the group. */
  label: string;
  segments: Array<Segment<T>>;
  value: T;
  onChange: (value: T) => void;
}

/** MD3 single-select segmented button. */
export function SegmentedButton<T extends string>({
  label,
  segments,
  value,
  onChange,
}: SegmentedButtonProps<T>) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            className={cx('border', selected && 'fill')}
            aria-pressed={selected}
            aria-label={segment.ariaLabel}
            onClick={() => onChange(segment.value)}
          >
            {(selected || segment.icon) && <Icon name={selected ? 'check' : segment.icon!} />}
            <span>{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
