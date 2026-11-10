import { useState, useEffect } from 'react';
import { getSettings } from '../../lib/db';

/** Device/sync status shared by the push and pull actions. */
export function useSyncStatus() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [lastSyncAt, setLastSyncAt] = useState<number | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    getSettings().then((s) => {
      setDeviceId(s.deviceId || 'Not set');
      setLastSyncAt(s.lastSyncAt);
    });
  }, []);

  return {
    deviceId,
    lastSyncAt,
    setLastSyncAt,
    isSyncing,
    setIsSyncing,
    syncMessage,
    setSyncMessage,
  };
}

export type SyncStatus = ReturnType<typeof useSyncStatus>;
