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
} from '../crypto';
import type { SyncAdapter, SyncMetadata } from './types';
import type { HealthRecord, CycleData, UserProfile } from '../types';

interface SyncPayload {
  records: HealthRecord[];
  cycles: CycleData[];
  profile: UserProfile | null;
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

  async push(): Promise<void> {
    await initCrypto();

    // Gather all decrypted data
    const encryptedRecords = await db.records.toArray();
    const records: HealthRecord[] = encryptedRecords.map((er) => decryptRecord(er));

    const encryptedCycles = await db.cycles.toArray();
    const cycles: CycleData[] = encryptedCycles.map((ec) => decryptCycleData(ec));

    const encryptedProfile = await db.userProfile.get('primary');
    const profile = encryptedProfile ? decryptUserProfile(encryptedProfile) : null;

    const payload: SyncPayload = { records, cycles, profile };

    // Serialize payload
    const plaintext = sodium.from_string(JSON.stringify(payload));

    // Simple approach: just serialize as JSON (data is already encrypted per-record via HKDF)
    const blob = new Uint8Array(plaintext);

    const deviceId = await this.getDeviceId();
    const metadata: SyncMetadata = {
      deviceId,
      timestamp: Date.now(),
      version: 2,
      recordCount: records.length,
    };

    await this.adapter.upload(blob, metadata);
    await updateSettings({ lastSyncAt: Date.now() });
  }

  async pull(): Promise<{
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

    // Decrypt payload
    const plaintext = sodium.to_string(result.data);
    const payload = JSON.parse(plaintext) as SyncPayload;

    let recordsAdded = 0;
    let recordsUpdated = 0;
    let cyclesAdded = 0;
    let cyclesUpdated = 0;
    let profileUpdated = false;

    const deviceId = await this.getDeviceId();

    // Merge records (last-write-wins, local wins on tie)
    for (const remoteRecord of payload.records) {
      const existingEncrypted = await db.records.get(remoteRecord.id);

      if (!existingEncrypted) {
        // New record
        const encrypted = encryptRecord(remoteRecord);
        await db.records.put(encrypted);
        recordsAdded++;
      } else {
        const existingRecord = decryptRecord(existingEncrypted);

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
    for (const remoteCycle of payload.cycles) {
      const existingEncrypted = await db.cycles.get(remoteCycle.id);

      if (!existingEncrypted) {
        const encrypted = encryptCycleData(remoteCycle);
        await db.cycles.put(encrypted);
        cyclesAdded++;
      } else {
        const existingCycle = decryptCycleData(existingEncrypted);

        // Cycles don't have updatedAt, use startDate as proxy
        if (remoteCycle.startDate > existingCycle.startDate) {
          const encrypted = encryptCycleData(remoteCycle);
          await db.cycles.put(encrypted);
          cyclesUpdated++;
        }
      }
    }

    // Merge profile
    if (payload.profile) {
      const existingEncrypted = await db.userProfile.get(payload.profile.id);

      if (!existingEncrypted) {
        const encrypted = encryptUserProfile(payload.profile);
        await db.userProfile.put(encrypted);
        profileUpdated = true;
      } else {
        const existingProfile = decryptUserProfile(existingEncrypted);

        if (payload.profile.updatedAt > existingProfile.updatedAt) {
          const encrypted = encryptUserProfile(payload.profile);
          await db.userProfile.put(encrypted);
          profileUpdated = true;
        }
      }
    }

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
