import type { SyncAdapter, SyncMetadata, SyncResult } from '../types';

export class FileSyncAdapter implements SyncAdapter {
  readonly name = 'File-based Sync';

  async initialize(): Promise<void> {
    // No initialization needed for file-based sync
  }

  async isConfigured(): Promise<boolean> {
    // Always ready
    return true;
  }

  async upload(encryptedBlob: Uint8Array, metadata: SyncMetadata): Promise<void> {
    // Create download file
    const syncFile = {
      metadata,
      data: Array.from(encryptedBlob),
    };

    const blob = new Blob([JSON.stringify(syncFile)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `juno-sync-${dateStr}.junosync`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async download(): Promise<SyncResult | null> {
    // In file-based sync, download is triggered by user uploading a file
    // This would be called after user selects a .junosync file
    // For now, return null (no remote data available)
    return null;
  }

  async dispose(): Promise<void> {
    // No cleanup needed for file-based sync
  }

  // Helper method for importing a sync file (called from UI)
  async importSyncFile(fileContent: string): Promise<SyncResult> {
    const syncFile = JSON.parse(fileContent) as {
      metadata: SyncMetadata;
      data: number[];
    };

    return {
      metadata: syncFile.metadata,
      data: new Uint8Array(syncFile.data),
    };
  }
}
