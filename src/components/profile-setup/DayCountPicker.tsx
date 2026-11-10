import { useState } from 'react';
import { Chip, TextField } from '../ui';

interface DayCountPickerProps {
  value?: number;
  onChange: (value?: number) => void;
  presets: number[];
  presetLabel: (days: number) => string;
  fallback: string;
  min: string;
  max: string;
}

/** Preset chips plus a free number field for a length measured in days. */
export function DayCountPicker({ value, onChange, presets, presetLabel, fallback, min, max }: DayCountPickerProps) {
  const [customValue, setCustomValue] = useState<string>(value?.toString() || fallback);

  return (
    <>
      <div className="chip-set">
        {presets.map((days) => (
          <Chip
            key={days}
            selected={value === days}
            onClick={() => {
              setCustomValue(days.toString());
              onChange(days);
            }}
          >
            {presetLabel(days)}
          </Chip>
        ))}
      </div>

      <div className="row">
        <div className="max">
          <TextField
            label="Or enter a custom value:"
            type="number"
            value={customValue}
            onChange={(next) => {
              setCustomValue(next);
              onChange(next ? parseInt(next) : undefined);
            }}
            min={min}
            max={max}
          />
        </div>
        <span className="muted">days</span>
      </div>
    </>
  );
}
