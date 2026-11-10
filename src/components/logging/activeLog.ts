import type { HealthRecord, RecordType } from '../../lib/types';

export interface ActiveLog {
  type: RecordType;
  date: number;
  /** Present when editing an existing entry rather than creating a new one. */
  record?: HealthRecord;
}

/** Narrows a record to the `{ id, data }` shape the log forms expect. */
export function asExisting<T>(record: HealthRecord | undefined) {
  return record ? { id: record.id, data: record.data as T } : undefined;
}

/** The day an entry belongs to, falling back to when it was created. */
export function recordDate(record: HealthRecord): number {
  return (record.data as { date?: number }).date ?? record.createdAt;
}
