import type { HealthRecord, CycleData, UserProfile, RecordType } from './types';

// Shape checks for data arriving from a backup or sync file. The file is
// authenticated by its password, but a correctly-passworded file can still be
// malformed or hostile; nothing from it is stored until it passes.

export interface VaultPayload {
  records: HealthRecord[];
  cycles: CycleData[];
  profile: UserProfile | null;
}

/** Upper bound on the size of a backup or sync file (characters). */
export const MAX_IMPORT_FILE_SIZE = 50 * 1024 * 1024;

const RECORD_TYPES: readonly RecordType[] = ['period', 'intimacy', 'symptom', 'mood', 'note'];

/** Only images embedded in the profile are allowed; never a remote URL. */
export const AVATAR_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128;
}

function isTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalTime(value: unknown): boolean {
  return value === undefined || isTime(value);
}

function isRecord(value: unknown): boolean {
  return (
    isObject(value) &&
    isId(value.id) &&
    RECORD_TYPES.includes(value.type as RecordType) &&
    isTime(value.createdAt) &&
    isTime(value.updatedAt) &&
    isOptionalTime(value.deletedAt) &&
    isObject(value.data) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string')
  );
}

function isCycle(value: unknown): boolean {
  return (
    isObject(value) &&
    isId(value.id) &&
    isTime(value.cycleNumber) &&
    isTime(value.startDate) &&
    isOptionalTime(value.endDate) &&
    isOptionalTime(value.periodEndDate) &&
    isOptionalTime(value.deletedAt)
  );
}

function isProfile(value: unknown): boolean {
  return (
    isObject(value) &&
    value.id === 'primary' &&
    (value.weekStartsOn === 0 || value.weekStartsOn === 1) &&
    isTime(value.createdAt) &&
    isTime(value.updatedAt) &&
    (value.name === undefined || typeof value.name === 'string') &&
    (value.avatarUrl === undefined || typeof value.avatarUrl === 'string')
  );
}

/** Throws unless `value` is a well-formed payload. */
export function assertValidPayload(value: unknown): asserts value is VaultPayload {
  if (
    !isObject(value) ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.cycles) ||
    !value.records.every(isRecord) ||
    !value.cycles.every(isCycle) ||
    !(value.profile === null || value.profile === undefined || isProfile(value.profile))
  ) {
    throw new Error('File contents are invalid');
  }
}
