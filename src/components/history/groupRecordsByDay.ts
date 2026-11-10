import { format } from 'date-fns';
import type { HealthRecord } from '../../lib/types';

export interface DayGroup {
  /** `yyyy-MM-dd` */
  dateKey: string;
  records: HealthRecord[];
}

function recordDate(record: HealthRecord): number {
  return (record.data as { date?: number }).date || record.createdAt;
}

/** Sort records newest first and bucket them by calendar day. */
export function groupRecordsByDay(records: HealthRecord[]): DayGroup[] {
  const sorted = [...records].sort((a, b) => recordDate(b) - recordDate(a));
  const groups: Record<string, HealthRecord[]> = {};

  for (const record of sorted) {
    const dateKey = format(new Date(recordDate(record)), 'yyyy-MM-dd');
    (groups[dateKey] ??= []).push(record);
  }

  return Object.entries(groups).map(([dateKey, dayRecords]) => ({ dateKey, records: dayRecords }));
}
