import sodium from 'libsodium-wrappers-sumo';
import { db, getSettings, updateSettings } from '../db';
import {
  initCrypto,
  decryptRecord,
  decryptCycleData,
  decryptUserProfile,
  encryptRecord,
  encryptCycleData,
  encryptUserProfile,
  generateId,
  isUnlocked,
  isVaultKeyCurrent,
  scrubIfDeleted,
  scrubCycleIfDeleted,
  sealWithPassword,
  openWithPassword,
  type PasswordSealed,
} from '../crypto';
import { readVault } from '../exportImport';
import { assertValidPayload } from '../payloadValidation';
import type { SyncAdapter, SyncMetadata } from './types';
import type { HealthRecord, CycleData, UserProfile } from '../types';

// v3: payload is passphrase-encrypted. v2 files were plaintext and are refused.
const SYNC_FORMAT_VERSION = 3;

interface SyncPayload {
  records: HealthRecord[];
  cycles: CycleData[];
  profile: UserProfile | null;
}

/**
 * Decrypt a local row for comparison. A local row that cannot be read is
 * treated as absent (the remote copy replaces it) instead of blocking every
 * future pull.
 */
function readLocal<E, T>(decrypt: (row: E) => T, row: E): T | null {
  try {
    return decrypt(row);
  } catch (error) {
    if (!isUnlocked()) throw error;
    return null;
  }
}

export class SyncEngine {
  private adapter: SyncAdapter;

  constructor(adapter: SyncAdapter) {
    this.adapter = adapter;
  }

  private async getDeviceId(): Promise<string> {
    const settings = await getSettings();
    if (settings.deviceId) {
      return settings.deviceId;
    }

    // Generate new device ID
    const deviceId = generateId();
    await updateSettings({ deviceId });
    return deviceId;
  }

  /**
   * Write all data to the adapter, encrypted under `passphrase`.
   * The sync file leaves the device, so it must never contain plaintext.
   */
  async push(passphrase: string): Promise<{ unreadable: number }> {
    if (!passphrase) {
      throw new Error('A sync passphrase is required');
    }

    await initCrypto();

    // Gather all decrypted data (unreadable rows are skipped and counted)
    const { records, cycles, profile, unreadable } = await readVault();
    const payload: SyncPayload = { records, cycles, profile };

    // Encrypt the whole payload under the passphrase (Argon2id + secretbox)
    const sealed = await sealWithPassword(JSON.stringify(payload), passphrase);
    const blob = new Uint8Array(sodium.from_string(JSON.stringify(sealed)));

    const deviceId = await this.getDeviceId();
    const metadata: SyncMetadata = {
      deviceId,
      timestamp: Date.now(),
      version: SYNC_FORMAT_VERSION,
    };

    await this.adapter.upload(blob, metadata);
    await updateSettings({ lastSyncAt: Date.now() });
    return { unreadable };
  }

  async pull(passphrase: string): Promise<{
    recordsAdded: number;
    recordsUpdated: number;
    cyclesAdded: number;
    cyclesUpdated: number;
    profileUpdated: boolean;
  }> {
    await initCrypto();

    const settings = await getSettings();
    const result = await this.adapter.download(settings.lastSyncAt);

    if (!result) {
      return {
        recordsAdded: 0,
        recordsUpdated: 0,
        cyclesAdded: 0,
        cyclesUpdated: 0,
        profileUpdated: false,
      };
    }

    if (result.metadata.version !== SYNC_FORMAT_VERSION) {
      throw new Error('Unsupported sync file format');
    }

    // Decrypt payload
    let payload: SyncPayload;
    try {
      const sealed = JSON.parse(sodium.to_string(result.data)) as PasswordSealed;
      payload = JSON.parse(await openWithPassword(sealed, passphrase)) as SyncPayload;
    } catch {
      throw new Error('Incorrect sync passphrase or corrupted sync file');
    }
    if (!(await isVaultKeyCurrent())) {
      throw new Error('Vault is locked');
    }
    try {
      assertValidPayload(payload);
    } catch {
      throw new Error('Sync file contents are invalid');
    }

    let recordsAdded = 0;
    let recordsUpdated = 0;
    let cyclesAdded = 0;
    let cyclesUpdated = 0;
    let profileUpdated = false;

    const deviceId = await this.getDeviceId();

    // One transaction: the merge applies completely or not at all.
    await db.transaction('rw', db.records, db.cycles, db.userProfile, async () => {
      // Merge records (last-write-wins, local wins on tie)
      for (const incoming of payload.records) {
        // A deleted record must never bring its content back with it
        const remoteRecord = scrubIfDeleted(incoming);
        const existingEncrypted = await db.records.get(remoteRecord.id);
        const existingRecord = existingEncrypted && readLocal(decryptRecord, existingEncrypted);

        if (!existingRecord) {
          // New record (or the local copy is unreadable)
          const encrypted = encryptRecord(remoteRecord);
          await db.records.put(encrypted);
          recordsAdded++;
        } else {
          if (remoteRecord.updatedAt > existingRecord.updatedAt) {
            // Remote is newer
            const encrypted = encryptRecord(remoteRecord);
            await db.records.put(encrypted);
            recordsUpdated++;
          } else if (
            remoteRecord.updatedAt === existingRecord.updatedAt &&
            result.metadata.deviceId !== deviceId
          ) {
            // Tie: keep local (conservative)
            continue;
          }
        }
      }

      // Merge cycles
      for (const incomingCycle of payload.cycles) {
        const remoteCycle = scrubCycleIfDeleted(incomingCycle);
        const existingEncrypted = await db.cycles.get(remoteCycle.id);
        const existingCycle = existingEncrypted && readLocal(decryptCycleData, existingEncrypted);

        if (!existingCycle) {
          const encrypted = encryptCycleData(remoteCycle);
          await db.cycles.put(encrypted);
          cyclesAdded++;
        } else {
          if (existingCycle.deletedAt) {
            // Deleted here: stays deleted
            continue;
          }

          // A deletion always wins. Otherwise cycles have no updatedAt, so
          // startDate is used as a proxy.
          if (remoteCycle.deletedAt || remoteCycle.startDate > existingCycle.startDate) {
            const encrypted = encryptCycleData(remoteCycle);
            await db.cycles.put(encrypted);
            cyclesUpdated++;
          }
        }
      }

      // Merge profile
      if (payload.profile) {
        const existingEncrypted = await db.userProfile.get(payload.profile.id);
        const existingProfile =
          existingEncrypted && readLocal(decryptUserProfile, existingEncrypted);

        if (!existingProfile) {
          const encrypted = encryptUserProfile(payload.profile);
          await db.userProfile.put(encrypted);
          profileUpdated = true;
        } else {
          if (payload.profile.updatedAt > existingProfile.updatedAt) {
            const encrypted = encryptUserProfile(payload.profile);
            await db.userProfile.put(encrypted);
            profileUpdated = true;
          }
        }
      }
    });

    await updateSettings({ lastSyncAt: Date.now() });

    return {
      recordsAdded,
      recordsUpdated,
      cyclesAdded,
      cyclesUpdated,
      profileUpdated,
    };
  }

  async getAdapter(): Promise<SyncAdapter> {
    return this.adapter;
  }
}
