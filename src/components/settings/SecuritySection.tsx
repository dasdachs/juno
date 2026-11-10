import { Card } from '../ui';
import { AutoLockSetting } from './AutoLockSetting';
import { ChangePasswordForm } from './ChangePasswordForm';
import { SessionTimeoutSetting } from './SessionTimeoutSetting';
import { useLockSettings } from './useLockSettings';

export function SecuritySection() {
  const settings = useLockSettings();

  return (
    <section>
      <h2 className="section-title">Security</h2>
      <Card variant="outlined" className="settings-card">
        <SessionTimeoutSetting settings={settings} />
        <hr />
        <AutoLockSetting settings={settings} />
        <hr />
        <ChangePasswordForm />
      </Card>
    </section>
  );
}
