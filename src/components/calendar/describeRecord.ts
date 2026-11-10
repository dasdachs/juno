import type {
  HealthRecord,
  PeriodData,
  SymptomData,
  MoodData,
  IntimacyData,
  NoteData,
} from '../../lib/types';
import {
  FLOW_INTENSITY_LABELS,
  SYMPTOM_TYPE_LABELS,
  MOOD_TYPE_LABELS,
  INTIMACY_TYPE_LABELS,
} from '../../lib/types';

/** Short human-readable summary of a record, used for labels and screen readers. */
export function describeRecord(record: HealthRecord): string {
  switch (record.type) {
    case 'period': {
      const data = record.data as PeriodData;
      return `${FLOW_INTENSITY_LABELS[data.flowIntensity]} flow`;
    }
    case 'symptom': {
      const data = record.data as SymptomData;
      return data.symptoms
        .map((s) => SYMPTOM_TYPE_LABELS[s.type] ?? s.type)
        .join(', ');
    }
    case 'mood': {
      const data = record.data as MoodData;
      return data.moods.map((m) => MOOD_TYPE_LABELS[m] ?? m).join(', ');
    }
    case 'intimacy': {
      const data = record.data as IntimacyData;
      return INTIMACY_TYPE_LABELS[data.type] ?? data.type;
    }
    case 'note': {
      const data = record.data as NoteData;
      return data.title || data.content;
    }
    default:
      return 'record';
  }
}
