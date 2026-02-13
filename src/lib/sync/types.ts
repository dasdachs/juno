export interface SyncMetadata {
  deviceId: string;
  timestamp: number;
  version: number;
  recordCount: number;
}

export interface SyncResult {
  data: Uint8Array;
  metadata: SyncMetadata;
}

export interface SyncAdapter {
  readonly name: string;
  initialize(config?: Record<string, string>): Promise<void>;
  isConfigured(): Promise<boolean>;
  upload(encryptedBlob: Uint8Array, metadata: SyncMetadata): Promise<void>;
  download(since?: number): Promise<SyncResult | null>;
  dispose(): Promise<void>;
}
