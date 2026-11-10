import { Droplets, Heart, Frown, Smile, FileText, type LucideIcon } from 'lucide-react';
import type { RecordType, DayData } from './types';

interface RecordTypeMeta {
  /** Label used on buttons and headings. */
  label: string;
  icon: LucideIcon;
  /** Tint for a filled badge, e.g. the History list icons. */
  badgeClass: string;
  /** Tint for a tappable tile in its resting state. */
  tileClass: string;
  /** Tint for a tappable tile when the day already has this kind of entry. */
  tileActiveClass: string;
  /** Accent for the Save button of this type's log form. */
  saveClass: string;
  /** Whether the given calendar day already has an entry of this type. */
  isLogged: (day: DayData) => boolean;
}

export const RECORD_TYPE_META: Record<RecordType, RecordTypeMeta> = {
  period: {
    label: 'Period',
    icon: Droplets,
    badgeClass: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    tileClass:
      'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40',
    tileActiveClass: 'bg-rose-500 text-white',
    saveClass: 'bg-rose-500 hover:bg-rose-600',
    isLogged: (day) => day.isPeriod,
  },
  symptom: {
    label: 'Symptoms',
    icon: Frown,
    badgeClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    tileClass:
      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40',
    tileActiveClass: 'bg-amber-500 text-white',
    saveClass: 'bg-amber-500 hover:bg-amber-600',
    isLogged: (day) => day.hasSymptoms,
  },
  mood: {
    label: 'Mood',
    icon: Smile,
    badgeClass: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    tileClass:
      'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40',
    tileActiveClass: 'bg-sky-500 text-white',
    saveClass: 'bg-sky-500 hover:bg-sky-600',
    isLogged: (day) => day.hasMood,
  },
  intimacy: {
    label: 'Intimacy',
    icon: Heart,
    badgeClass: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    tileClass:
      'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40',
    tileActiveClass: 'bg-violet-500 text-white',
    saveClass: 'bg-violet-500 hover:bg-violet-600',
    isLogged: (day) => day.hasIntimacy,
  },
  note: {
    label: 'Note',
    icon: FileText,
    badgeClass: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    tileClass:
      'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600',
    tileActiveClass: 'bg-gray-500 text-white',
    saveClass: 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700',
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
