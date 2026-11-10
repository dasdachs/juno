import { Chip, List, ListItem } from '../ui';
import type { LockSettings } from './useLockSettings';

export function SessionTimeoutSetting({ settings }: { settings: LockSettings }) {
  return (
    <>
      <List>
        <ListItem icon="schedule" headline="Session Timeout" supporting="Auto-lock after inactivity" />
      </List>
      <div className="chip-set settings-options">
        {[5, 15, 30, 60].map((minutes) => (
          <Chip
            key={minutes}
            selected={settings.sessionTimeout === minutes * 60 * 1000}
            onClick={() => settings.handleTimeoutChange(minutes)}
          >
            {minutes} min
          </Chip>
        ))}
      </div>
    </>
  );
}
