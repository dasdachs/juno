import { Chip, Icon, Switch } from '../ui';
import type { LockSettings } from './useLockSettings';

const GRACE_PERIODS = [
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: '1 min', value: 60000 },
  { label: '5 min', value: 300000 },
];

export function AutoLockSetting({ settings }: { settings: LockSettings }) {
  return (
    <>
      <div className="row settings-block">
        <Icon name="visibility" />
        <div className="max">
          <Switch
            label="Lock When Hidden"
            supporting="Lock when tab is hidden or app is backgrounded"
            checked={settings.autoLockOnHidden}
            onChange={settings.handleAutoLockToggle}
          />
        </div>
      </div>
      {settings.autoLockOnHidden && (
        <div className="settings-options stack tight">
          <p className="supporting">Grace period before locking</p>
          <div className="chip-set">
            {GRACE_PERIODS.map(({ label, value }) => (
              <Chip
                key={value}
                selected={settings.autoLockGracePeriod === value}
                onClick={() => settings.handleGracePeriodChange(value)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
