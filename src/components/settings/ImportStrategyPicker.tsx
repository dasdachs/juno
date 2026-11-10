import { Radio } from '../ui';

interface ImportStrategyPickerProps {
  strategy: 'replace' | 'merge';
  onChange: (strategy: 'replace' | 'merge') => void;
}

export function ImportStrategyPicker({ strategy, onChange }: ImportStrategyPickerProps) {
  return (
    <div className="stack tight">
      <p className="supporting bold">Import Strategy</p>
      <div>
        <Radio
          name="import-strategy"
          value="merge"
          label="Merge with existing"
          checked={strategy === 'merge'}
          onChange={() => onChange('merge')}
        />
        <p className="supporting radio-supporting">Keep existing data, add new records from backup</p>
      </div>
      <div>
        <Radio
          name="import-strategy"
          value="replace"
          label="Replace all data"
          checked={strategy === 'replace'}
          onChange={() => onChange('replace')}
        />
        <p className="supporting radio-supporting">Delete existing data, restore from backup</p>
      </div>
    </div>
  );
}
