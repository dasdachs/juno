import { usePWAUpdate } from '../hooks/usePWAUpdate';
import { Button, Icon } from './ui';

export function UpdateNotification() {
  const { isUpdateAvailable, isUpdating, reloadApp } = usePWAUpdate();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="snackbar active update-notification" role="status">
      <Icon name="system_update" />
      <div className="max">
        <div className="headline">App Update Available</div>
        <div className="small-text">
          A new version of Juno is available. Reload to get the latest features and security
          improvements.
        </div>
      </div>
      <Button variant="text" className="inverse-primary-text" onClick={reloadApp} disabled={isUpdating}>
        {isUpdating ? 'Reloading...' : 'Reload Now'}
      </Button>
    </div>
  );
}
