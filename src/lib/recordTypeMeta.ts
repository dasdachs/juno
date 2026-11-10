import type { RecordType, DayData } from './types';

interface RecordTypeMeta {
  /** Label used on buttons and headings. */
  label: string;
  /** Material Symbols name. */
  icon: string;
  /** Accent class (see theme.css) for badges and tiles of this type. */
  tone: string;
  /** Whether the given calendar day already has an entry of this type. */
  isLogged: (day: DayData) => boolean;
}

export const RECORD_TYPE_META: Record<RecordType, RecordTypeMeta> = {
  period: {
    label: 'Period',
    icon: 'water_drop',
    tone: 'tone-period',
    isLogged: (day) => day.isPeriod,
  },
  symptom: {
    label: 'Symptoms',
    icon: 'sick',
    tone: 'tone-symptom',
    isLogged: (day) => day.hasSymptoms,
  },
  mood: {
    label: 'Mood',
    icon: 'mood',
    tone: 'tone-mood',
    isLogged: (day) => day.hasMood,
  },
  intimacy: {
    label: 'Intimacy',
    icon: 'favorite',
    tone: 'tone-intimacy',
    isLogged: (day) => day.hasIntimacy,
  },
  note: {
    label: 'Note',
    icon: 'description',
    tone: 'tone-note',
    isLogged: (day) => day.hasNote,
  },
};

/** Record types in the order they are offered to the user. */
export const RECORD_TYPE_ORDER: RecordType[] = [
  'period',
  'symptom',
  'mood',
  'intimacy',
  'note',
];
