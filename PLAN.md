# Juno: Period Tracking App
## Development Plan & Technical Specification

A local-first, end-to-end encrypted period and cycle tracking application.

| Version | 2.0 |
|---------|-----|
| Date | 2025-12-31 |
| Status | Planning (Pivot from HealthVault) |

---

## Executive Summary

This document outlines the pivot of the existing HealthVault application to **Juno**, a privacy-first period and cycle tracking application. The existing encryption infrastructure, vault-based authentication, and offline-first architecture provide an excellent foundation for handling sensitive reproductive health data.

### MVP Scope
- **Focus**: Period tracking only (fertility/TTC features deferred)
- **Calendar System**: Gregorian only (architecture ready for i18n expansion)
- **Language**: English only (RTL support deferred to Phase 2)
- **Privacy**: Core encryption maintained; stealth mode/decoy vault deferred

### Core Features
- Period logging with flow intensity
- Intimacy tracking
- Symptom and mood logging
- Cycle prediction algorithm
- Calendar-based primary interface
- User profile with health metrics (age, height, weight)

### Security Principles (Preserved from HealthVault)
- **Zero-knowledge**: All data encrypted locally, never leaves device
- **Local-first**: App works fully offline
- **Session security**: Configurable timeout with auto-lock
- **Strong encryption**: XChaCha20-Poly1305 with Argon2id KDF

---

## Architecture Overview

### Technology Stack (Existing)

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript 5.6 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4.1 |
| Local Storage | IndexedDB via Dexie.js |
| Encryption | libsodium.js (XChaCha20-Poly1305) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Lucide React |
| Routing | React Router 7 |

### New Dependencies to Add

```json
{
  "date-fns": "^4.0.0",
  "recharts": "^2.13.0",
  "react-swipeable": "^7.0.0"
}
```

---

## Data Model

### New Type Definitions

**File**: `/src/lib/types.ts` (complete rewrite)

```typescript
// Record Types
export type RecordType =
  | 'period'      // Period day log
  | 'intimacy'    // Sexual activity
  | 'symptom'     // Symptoms
  | 'mood'        // Mood tracking
  | 'note';       // General notes

// Period Tracking
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

export interface PeriodData {
  date: number;              // Timestamp for the day
  flowIntensity: FlowIntensity;
  notes?: string;
}

// Intimacy Tracking
export type IntimacyType = 'protected' | 'unprotected' | 'other';

export interface IntimacyData {
  date: number;
  type: IntimacyType;
  notes?: string;
}

// Symptom Tracking
export type SymptomType =
  | 'cramps' | 'headache' | 'backache' | 'breast_tenderness'
  | 'bloating' | 'nausea' | 'fatigue' | 'acne' | 'cravings'
  | 'insomnia' | 'dizziness' | 'joint_pain';

export type SymptomSeverity = 1 | 2 | 3; // mild, moderate, severe

export interface SymptomData {
  date: number;
  symptoms: Array<{ type: SymptomType; severity: SymptomSeverity }>;
  notes?: string;
}

// Mood Tracking
export type MoodType =
  | 'happy' | 'calm' | 'energetic' | 'focused'
  | 'sensitive' | 'anxious' | 'sad' | 'irritable' | 'mood_swings';

export interface MoodData {
  date: number;
  moods: MoodType[];
  notes?: string;
}

// Cycle Data
export interface CycleData {
  id: string;
  cycleNumber: number;
  startDate: number;         // First day of period
  endDate?: number;          // First day of next period (when known)
  periodEndDate?: number;    // Last day of bleeding
  periodLength?: number;     // Days of bleeding
  cycleLength?: number;      // Total cycle length
}

// Cycle Prediction
export interface CyclePrediction {
  nextPeriodStart: number;
  nextPeriodEnd: number;
  cycleLength: number;
  periodLength: number;
  confidence: 'low' | 'medium' | 'high';
  basedOnCycles: number;
}

// User Profile
export interface UserProfile {
  id: string;
  birthYear?: number;
  height?: number;           // cm
  weight?: number;           // kg
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;       // 0=Sunday, 1=Monday
  createdAt: number;
  updatedAt: number;
}

// Extended Settings
export interface AppSettings {
  id: string;
  sessionTimeout: number;
  lastUnlockedAt?: number;
  periodReminderEnabled: boolean;
  periodReminderDays: number;
}

// Encrypted Wrappers (same pattern as HealthVault)
export interface EncryptedRecord {
  id: string;
  nonce: string;
  ciphertext: string;
  category: string;          // RecordType for filtering
  cycleId?: string;          // Link to cycle
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
  startDate: number;         // Unencrypted for indexing
  version: number;
}
```

### Database Schema

**File**: `/src/lib/db.ts` (update)

```typescript
class JunoVaultDB extends Dexie {
  records!: EntityTable<EncryptedRecord, 'id'>;
  keyStore!: EntityTable<KeyStore, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;
  userProfile!: EntityTable<EncryptedUserProfile, 'id'>;  // NEW
  cycles!: EntityTable<EncryptedCycleData, 'id'>;         // NEW

  constructor() {
    super('JunoVault');  // Renamed from HealthVault

    this.version(1).stores({
      records: 'id, category, timestamp, cycleId',
      keyStore: 'id',
      settings: 'id',
      userProfile: 'id',
      cycles: 'id, startDate',
    });
  }
}
```

Migration from `HealthVault` to `JunoVault`:
- Preserve `keyStore` for encryption continuity
- Migrate `settings` with new defaults
- Old health records are NOT migrated (incompatible data model)

---

## Cycle Prediction Algorithm

**New File**: `/src/lib/predictions.ts`

```typescript
/**
 * Cycle Prediction using Weighted Moving Average
 *
 * - Uses last 6-12 cycles for prediction
 * - More recent cycles get higher weights (recency bias)
 * - Confidence based on cycle count and consistency
 */

interface PredictionInput {
  cycles: CycleData[];
  profile: UserProfile;
}

// Weighted average with exponential recency bias
function calculateWeightedAverage(values: number[]): number {
  if (values.length === 0) return 28; // Default
  if (values.length === 1) return values[0];

  const weights = values.map((_, i) => Math.pow(1.5, i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);

  return Math.round(weightedSum / totalWeight);
}

// Standard deviation for confidence
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / values.length);
}

export function predictNextCycle(input: PredictionInput): CyclePrediction {
  const { cycles, profile } = input;

  const recentCycles = cycles
    .filter(c => c.cycleLength && c.cycleLength > 0)
    .slice(-12)
    .reverse();

  const cycleLengths = recentCycles.map(c => c.cycleLength!);
  const periodLengths = recentCycles
    .filter(c => c.periodLength)
    .map(c => c.periodLength!);

  const avgCycleLength = calculateWeightedAverage(cycleLengths) ||
                          profile.averageCycleLength || 28;
  const avgPeriodLength = calculateWeightedAverage(periodLengths) ||
                          profile.averagePeriodLength || 5;

  // Confidence based on data consistency
  const stdDev = calculateStdDev(cycleLengths);
  let confidence: 'low' | 'medium' | 'high' = 'low';

  if (recentCycles.length >= 6 && stdDev < 2) {
    confidence = 'high';
  } else if (recentCycles.length >= 3 && stdDev < 4) {
    confidence = 'medium';
  }

  const currentCycleStart = cycles[cycles.length - 1]?.startDate || Date.now();
  const nextPeriodStart = currentCycleStart + (avgCycleLength * 24 * 60 * 60 * 1000);
  const nextPeriodEnd = nextPeriodStart + (avgPeriodLength * 24 * 60 * 60 * 1000);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    cycleLength: avgCycleLength,
    periodLength: avgPeriodLength,
    confidence,
    basedOnCycles: recentCycles.length,
  };
}

export function getCurrentCycleDay(cycleStart: number): number {
  const today = Date.now();
  return Math.floor((today - cycleStart) / (24 * 60 * 60 * 1000)) + 1;
}

export function getDaysUntilNextPeriod(
  currentCycleStart: number,
  avgCycleLength: number
): number {
  const cycleDay = getCurrentCycleDay(currentCycleStart);
  return Math.max(0, avgCycleLength - cycleDay);
}
```

---

## Component Architecture

### Directory Structure

```
src/
├── components/
│   ├── calendar/                    # Calendar UI
│   │   ├── Calendar.tsx             # Main container
│   │   ├── CalendarHeader.tsx       # Month/year navigation
│   │   ├── CalendarGrid.tsx         # 7-column grid
│   │   ├── CalendarDay.tsx          # Individual day cell
│   │   ├── CalendarLegend.tsx       # Color legend
│   │   └── DayDetailSheet.tsx       # Bottom sheet for day
│   │
│   ├── logging/                     # Data entry
│   │   ├── PeriodLogForm.tsx
│   │   ├── IntimacyLogForm.tsx
│   │   ├── SymptomLogForm.tsx
│   │   ├── MoodLogForm.tsx
│   │   └── QuickLogSheet.tsx        # Unified entry sheet
│   │
│   ├── insights/                    # Analytics
│   │   ├── CycleInsights.tsx
│   │   ├── CycleChart.tsx
│   │   └── SymptomPatterns.tsx
│   │
│   ├── common/                      # Shared
│   │   ├── BottomSheet.tsx
│   │   ├── FlowIntensityPicker.tsx
│   │   ├── SymptomPicker.tsx
│   │   └── MoodPicker.tsx
│   │
│   ├── Layout.tsx                   # Updated navigation
│   ├── Settings.tsx                 # Updated settings
│   ├── UnlockScreen.tsx             # Keep existing
│   └── ProfileSetup.tsx             # NEW: Onboarding
│
├── pages/                           # NEW: Page components
│   ├── CalendarPage.tsx             # Primary screen
│   ├── InsightsPage.tsx
│   ├── HistoryPage.tsx
│   └── SettingsPage.tsx
│
├── contexts/
│   └── AuthContext.tsx              # Keep existing
│
├── hooks/
│   ├── useRecords.ts                # Update for new types
│   ├── useCycles.ts                 # NEW
│   ├── useProfile.ts                # NEW
│   └── usePredictions.ts            # NEW
│
└── lib/
    ├── crypto.ts                    # Keep existing
    ├── db.ts                        # Update schema
    ├── types.ts                     # Complete rewrite
    └── predictions.ts               # NEW
```

### Calendar Day Indicators

| State | Visual |
|-------|--------|
| Period day | Filled circle, darkness = intensity |
| Predicted period | Dashed circle outline |
| Intimacy logged | Small dot below |
| Symptoms logged | Small icon |
| Today | Border highlight |

### Color Scheme

| Element | Color |
|---------|-------|
| Period/Menstrual | `#e11d48` (rose-600) |
| Predicted period | `#fda4af` (rose-300) |
| Intimacy | `#8b5cf6` (violet-500) |
| Symptoms | `#f59e0b` (amber-500) |
| Primary actions | `#e11d48` (rose-600) |

---

## Hooks

### useCycles

**New File**: `/src/hooks/useCycles.ts`

```typescript
export function useCycles() {
  return {
    cycles: CycleData[],
    currentCycle: CycleData | null,
    isLoading: boolean,
    error: Error | null,

    // Actions
    startNewCycle: (date: number) => Promise<void>,
    endPeriod: (date: number) => Promise<void>,
    updateCycle: (id: string, data: Partial<CycleData>) => Promise<void>,
    getCycle: (id: string) => Promise<CycleData | null>,
  };
}
```

### useProfile

**New File**: `/src/hooks/useProfile.ts`

```typescript
export function useProfile() {
  return {
    profile: UserProfile | null,
    isLoading: boolean,
    hasCompletedSetup: boolean,

    // Actions
    updateProfile: (data: Partial<UserProfile>) => Promise<void>,
    completeSetup: (data: UserProfile) => Promise<void>,
  };
}
```

### usePredictions

**New File**: `/src/hooks/usePredictions.ts`

```typescript
export function usePredictions() {
  return {
    prediction: CyclePrediction | null,
    currentCycleDay: number,
    daysUntilPeriod: number,

    // Calendar data
    getMonthData: (year: number, month: number) => CalendarMonthData,
  };
}
```

---

## Routes

**File**: `/src/App.tsx` (update)

```typescript
<Routes>
  <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
    <Route index element={<CalendarPage />} />
    <Route path="insights" element={<InsightsPage />} />
    <Route path="history" element={<HistoryPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

### Navigation Structure

**Mobile**: Bottom nav bar with 4 icons
- Calendar (home)
- Insights
- History
- Settings

**Desktop**: Left sidebar (256px)

---

## Onboarding Flow

**New File**: `/src/components/ProfileSetup.tsx`

Wizard steps:
1. **Welcome**: App introduction
2. **Birth Year**: Optional, for age-based insights
3. **Cycle Length**: Average or "I don't know" (defaults to 28)
4. **Period Length**: Average or "I don't know" (defaults to 5)
5. **Preferences**: Week starts on (Sunday/Monday)
6. **Last Period**: When did your last period start?

---

## Files to Modify

| File | Changes |
|------|---------|
| `/src/lib/types.ts` | Complete rewrite with new types |
| `/src/lib/db.ts` | New schema, migration logic |
| `/src/hooks/useRecords.ts` | Update for new record types |
| `/src/components/Layout.tsx` | New navigation structure |
| `/src/components/Settings.tsx` | New settings sections |
| `/src/App.tsx` | New routes |
| `/src/index.css` | New color scheme |
| `/vite.config.ts` | Update PWA manifest |
| `/index.html` | Update title, theme color |

## Files to Delete

| File | Reason |
|------|--------|
| `/src/components/Dashboard.tsx` | Replaced by CalendarPage |
| `/src/components/RecordForm.tsx` | Replaced by specific log forms |
| `/src/components/RecordDetail.tsx` | Replaced by DayDetailSheet |
| `/src/components/RecordsList.tsx` | Replaced by HistoryPage |

## Files to Create

| File | Purpose |
|------|---------|
| `/src/lib/predictions.ts` | Cycle prediction algorithm |
| `/src/hooks/useCycles.ts` | Cycle management |
| `/src/hooks/useProfile.ts` | User profile |
| `/src/hooks/usePredictions.ts` | Predictions & calendar data |
| `/src/pages/CalendarPage.tsx` | Primary screen |
| `/src/pages/InsightsPage.tsx` | Cycle analytics |
| `/src/pages/HistoryPage.tsx` | Log history |
| `/src/pages/SettingsPage.tsx` | Settings wrapper |
| `/src/components/calendar/*` | All calendar components |
| `/src/components/logging/*` | All logging forms |
| `/src/components/insights/*` | All insight components |
| `/src/components/common/*` | Shared components |
| `/src/components/ProfileSetup.tsx` | Onboarding wizard |

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Rewrite type definitions | `src/lib/types.ts` |
| 2 | Update database schema + migration | `src/lib/db.ts` |
| 3 | Create prediction algorithm | `src/lib/predictions.ts` |
| 4 | Create useCycles hook | `src/hooks/useCycles.ts` |
| 5 | Create useProfile hook | `src/hooks/useProfile.ts` |
| 6 | Create usePredictions hook | `src/hooks/usePredictions.ts` |
| 7 | Update useRecords hook | `src/hooks/useRecords.ts` |
| 8 | Build Calendar components | `src/components/calendar/*` |
| 9 | Build logging forms | `src/components/logging/*` |
| 10 | Build common pickers | `src/components/common/*` |
| 11 | Create page components | `src/pages/*` |
| 12 | Update Layout & navigation | `src/components/Layout.tsx` |
| 13 | Create onboarding wizard | `src/components/ProfileSetup.tsx` |
| 14 | Update routes | `src/App.tsx` |
| 15 | Build insights components | `src/components/insights/*` |
| 16 | Update settings | `src/components/Settings.tsx` |
| 17 | Update branding | `vite.config.ts`, `index.html`, `index.css` |
| 18 | Delete old components | Dashboard, RecordForm, etc. |
| 19 | Testing & polish | All files |

---

## Deferred to Phase 2

### i18n & RTL
- Full i18n framework (react-i18next)
- RTL language support (Arabic, Hebrew, Persian, Urdu)
- Additional calendar systems (Hijri, Persian, Hebrew, Buddhist)

### Privacy Enhancements
- Stealth mode (disguised app icon/name)
- Decoy vault (secondary password shows fake data)
- Emergency delete (shake-to-delete)

### Fertility Features
- Temperature/BBT tracking
- Cervical mucus tracking
- Ovulation test logging
- Pregnancy test logging
- Fertile window calculation
- TTC-specific insights

### Additional Features
- Data backup/restore
- Push notifications/reminders
- Import from other period apps

---

## Security Notes

All existing HealthVault security measures are preserved:

- **Encryption**: XChaCha20-Poly1305 with Argon2id KDF
- **Key Hierarchy**: Master password → Master key → Vault key → Data keys
- **Session Management**: Configurable timeout, auto-lock
- **Rate Limiting**: Exponential backoff on failed unlock attempts
- **Password Strength**: zxcvbn validation, 12-character minimum
- **Local-Only**: No cloud sync, no data leaves device
- **PWA**: HTTPS enforcement, CSP headers

---

## Success Criteria

### Functional
- Calendar displays current cycle with predictions
- Users can log periods with flow intensity
- Users can log symptoms, moods, intimacy
- Cycle predictions shown on calendar
- Insights page shows cycle statistics
- All data encrypted at rest
- Full offline functionality

### Performance
- Initial load under 3 seconds
- Smooth calendar navigation
- Encrypt/decrypt operations imperceptible

### Quality
- Lighthouse PWA score > 90
- Test coverage > 80% for crypto and predictions
- Zero critical bugs for 14 days

---

*End of Document*
