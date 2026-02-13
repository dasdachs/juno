import { useState, useEffect } from 'react';
import { Cloud, Upload, Download } from 'lucide-react';
import { getSettings } from '../../lib/db';
import { SyncEngine } from '../../lib/sync/SyncEngine';
import { FileSyncAdapter } from '../../lib/sync/adapters/FileSyncAdapter';

export function SyncSettings() {
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

  const handlePush = async () => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      const adapter = new FileSyncAdapter();
      const engine = new SyncEngine(adapter);
      await engine.push();
      setSyncMessage('Sync file downloaded successfully');

      // Reload settings to get updated lastSyncAt
      const settings = await getSettings();
      setLastSyncAt(settings.lastSyncAt);
    } catch (err) {
      setSyncMessage(`Error: ${err instanceof Error ? err.message : 'Push failed'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.junosync';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsSyncing(true);
      setSyncMessage('');

      try {
        const content = await file.text();
        const adapter = new FileSyncAdapter();
        await adapter.importSyncFile(content);

        // For now, we'll just show a message
        // Full pull/merge functionality would be implemented here
        setSyncMessage('Sync file loaded. Pull functionality coming soon.');
      } catch (err) {
        setSyncMessage(`Error: ${err instanceof Error ? err.message : 'Pull failed'}`);
      } finally {
        setIsSyncing(false);
      }
    };

    input.click();
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-3 mb-3">
        <Cloud className="w-5 h-5 text-gray-500" />
        <div className="flex-1">
          <p className="font-medium text-gray-900">File-based Sync</p>
          <p className="text-sm text-gray-500">
            Manual sync via file transfer
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Device ID */}
        <div className="text-xs text-gray-500">
          <span className="font-medium">Device ID:</span>{' '}
          <span className="font-mono">{deviceId.slice(0, 8)}...</span>
        </div>

        {/* Last Sync */}
        {lastSyncAt && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Last synced:</span>{' '}
            {new Date(lastSyncAt).toLocaleString()}
          </div>
        )}

        {/* Sync Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePush}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 disabled:opacity-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            Push (Export)
          </button>
          <button
            onClick={handlePull}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 disabled:opacity-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Pull (Import)
          </button>
        </div>

        {syncMessage && (
          <p className="text-xs text-gray-600 text-center">{syncMessage}</p>
        )}

        <p className="text-xs text-gray-400">
          Push exports your data to a sync file. Pull imports data from a sync file
          and merges it with your local data.
        </p>
      </div>
    </div>
  );
}
