import { FileSyncAdapter } from '../../lib/sync/adapters/FileSyncAdapter';
import type { SyncStatus } from './useSyncStatus';

/** The pull (load a sync file) action. */
export function useSyncPull({ setIsSyncing, setSyncMessage }: SyncStatus) {
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

  return { handlePull };
}
