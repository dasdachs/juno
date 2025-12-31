// ============================================
// RECORD TYPES
// ============================================

export type RecordType =
  | 'period'
  | 'intimacy'
  | 'symptom'
  | 'mood'
  | 'note';

// ============================================
// PERIOD TRACKING
// ============================================

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

export interface PeriodData {
  date: number;
  flowIntensity: FlowIntensity;
  notes?: string;
}

// ============================================
// INTIMACY TRACKING
// ============================================

export type IntimacyType = 'protected' | 'unprotected' | 'other';

export interface IntimacyData {
  date: number;
  type: IntimacyType;
  notes?: string;
}

// ============================================
// SYMPTOM TRACKING
// ============================================

export type SymptomType =
  | 'cramps'
  | 'headache'
  | 'backache'
  | 'breast_tenderness'
  | 'bloating'
  | 'nausea'
  | 'fatigue'
  | 'acne'
  | 'cravings'
  | 'insomnia'
  | 'dizziness'
  | 'joint_pain';

export type SymptomSeverity = 1 | 2 | 3;

export interface SymptomEntry {
  type: SymptomType;
  severity: SymptomSeverity;
}

export interface SymptomData {
  date: number;
  symptoms: SymptomEntry[];
  notes?: string;
}

// ============================================
// MOOD TRACKING
// ============================================

export type MoodType =
  | 'happy'
  | 'calm'
  | 'energetic'
  | 'focused'
  | 'sensitive'
  | 'anxious'
  | 'sad'
  | 'irritable'
  | 'mood_swings';

export interface MoodData {
  date: number;
  moods: MoodType[];
  notes?: string;
}

// ============================================
// NOTE
// ============================================

export interface NoteData {
  date: number;
  title?: string;
  content: string;
}

// ============================================
// UNION TYPE FOR RECORD DATA
// ============================================

export type RecordData =
  | PeriodData
  | IntimacyData
  | SymptomData
  | MoodData
  | NoteData;

// ============================================
// HEALTH RECORD (Base)
// ============================================

export interface HealthRecord {
  id: string;
  type: RecordType;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  data: RecordData;
  cycleId?: string;
  tags: string[];
}

// ============================================
// CYCLE DATA
// ============================================

export interface CycleData {
  id: string;
  cycleNumber: number;
  startDate: number;
  endDate?: number;
  periodEndDate?: number;
  periodLength?: number;
  cycleLength?: number;
}

// ============================================
// CYCLE PREDICTION
// ============================================

export interface CyclePrediction {
  nextPeriodStart: number;
  nextPeriodEnd: number;
  cycleLength: number;
  periodLength: number;
  confidence: 'low' | 'medium' | 'high';
  basedOnCycles: number;
}

// ============================================
// USER PROFILE
// ============================================

export interface UserProfile {
  id: string;
  birthYear?: number;
  height?: number;
  weight?: number;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// ENCRYPTED WRAPPERS
// ============================================

export interface EncryptedRecord {
  id: string;
  nonce: string;
  ciphertext: string;
  category: string;
  cycleId?: string;
  version: number;
  timestamp: number;
}

export interface EncryptedUserProfile {
  id: string;
  nonce: string;
  ciphertext: string;
  version: number;
}

export interface EncryptedCycleData {
  id: string;
  nonce: string;
  ciphertext: string;
  startDate: number;
  version: number;
}

// ============================================
// KEY STORE
// ============================================

export interface KeyStore {
  id: string;
  salt: string;
  encryptedVaultKey: string;
  vaultKeyNonce: string;
}

// ============================================
// APP SETTINGS
// ============================================

export interface AppSettings {
  id: string;
  sessionTimeout: number;
  lastUnlockedAt?: number;
  periodReminderEnabled: boolean;
  periodReminderDays: number;
}

// ============================================
// LABELS & CONSTANTS
// ============================================

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  period: 'Period',
  intimacy: 'Intimacy',
  symptom: 'Symptoms',
  mood: 'Mood',
  note: 'Note',
};

export const FLOW_INTENSITY_LABELS: Record<FlowIntensity, string> = {
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  very_heavy: 'Very Heavy',
};

export const INTIMACY_TYPE_LABELS: Record<IntimacyType, string> = {
  protected: 'Protected',
  unprotected: 'Unprotected',
  other: 'Other',
};

export const SYMPTOM_TYPE_LABELS: Record<SymptomType, string> = {
  cramps: 'Cramps',
  headache: 'Headache',
  backache: 'Backache',
  breast_tenderness: 'Breast Tenderness',
  bloating: 'Bloating',
  nausea: 'Nausea',
  fatigue: 'Fatigue',
  acne: 'Acne',
  cravings: 'Cravings',
  insomnia: 'Insomnia',
  dizziness: 'Dizziness',
  joint_pain: 'Joint Pain',
};

export const MOOD_TYPE_LABELS: Record<MoodType, string> = {
  happy: 'Happy',
  calm: 'Calm',
  energetic: 'Energetic',
  focused: 'Focused',
  sensitive: 'Sensitive',
  anxious: 'Anxious',
  sad: 'Sad',
  irritable: 'Irritable',
  mood_swings: 'Mood Swings',
};

export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

// ============================================
// CALENDAR DATA TYPES
// ============================================

export interface DayData {
  date: Date;
  timestamp: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isPeriod: boolean;
  isPredictedPeriod: boolean;
  flowIntensity?: FlowIntensity;
  hasIntimacy: boolean;
  hasSymptoms: boolean;
  hasMood: boolean;
  hasNote: boolean;
  cycleDay?: number;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  days: DayData[];
  currentCycleDay?: number;
  daysUntilPeriod?: number;
  prediction?: CyclePrediction;
}
