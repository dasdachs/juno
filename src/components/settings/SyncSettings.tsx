import { Button, Icon, TextField } from '../ui';
import { useSyncPull } from './useSyncPull';
import { useSyncPush } from './useSyncPush';
import { useSyncStatus } from './useSyncStatus';

export function SyncSettings() {
  const status = useSyncStatus();
  const { deviceId, lastSyncAt, isSyncing, syncMessage } = status;
  const push = useSyncPush(status);
  const { handlePull } = useSyncPull(status);

  return (
    <div className="settings-block stack">
      <div className="row">
        <Icon name="cloud" />
        <div className="max">
          <div className="headline">File-based Sync</div>
          <div className="supporting">Manual sync via file transfer</div>
        </div>
      </div>

      {/* Device ID */}
      <div className="supporting">
        <span className="bold">Device ID:</span>{' '}
        <code>{deviceId.slice(0, 8)}...</code>
      </div>

      {/* Last Sync */}
      {lastSyncAt && (
        <div className="supporting">
          <span className="bold">Last synced:</span>{' '}
          {new Date(lastSyncAt).toLocaleString()}
        </div>
      )}

      {/* Sync passphrase */}
      <TextField
        id="sync-passphrase"
        type="password"
        autoComplete="off"
        label="Sync passphrase"
        value={push.passphrase}
        onChange={push.setPassphrase}
        placeholder="At least 12 characters"
      />
      <TextField
        id="sync-passphrase-confirm"
        type="password"
        autoComplete="off"
        label="Confirm passphrase"
        aria-label="Confirm sync passphrase"
        value={push.confirmPassphrase}
        onChange={push.setConfirmPassphrase}
      />

      {/* Sync Buttons */}
      <div className="button-row stretch">
        <Button variant="tonal" icon="upload" onClick={push.handlePush} disabled={isSyncing}>
          Push (Export)
        </Button>
        <Button variant="tonal" icon="download" onClick={handlePull} disabled={isSyncing}>
          Pull (Import)
        </Button>
      </div>

      {syncMessage && <p className="supporting center-align">{syncMessage}</p>}

      <p className="supporting">
        Push exports your data to a sync file encrypted with the passphrase above.
        You will need the same passphrase to pull it on another device.
      </p>
    </div>
  );
}
