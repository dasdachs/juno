# Juno - Technical Onboarding Document

## Executive Summary

**Juno** is a privacy-first, local-only Progressive Web Application (PWA) for period and cycle tracking. Built with React + TypeScript + Vite, it implements end-to-end encryption with zero-knowledge architecture - all user data stays encrypted on the device and never leaves the browser.

**Key Characteristics:**
- Zero server dependency (fully offline)
- Client-side encryption using libsodium (XChaCha20-Poly1305)
- Privacy-focused health data management
- PWA for cross-platform mobile/desktop support

---

## 1. Project Architecture

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.3.1 | UI framework |
| **Language** | TypeScript | 5.6.2 | Type safety |
| **Build Tool** | Vite | 6.0.5 | Fast bundler, HMR |
| **Styling** | Tailwind CSS | 4.1.18 | Utility-first CSS |
| **Database** | IndexedDB (Dexie.js) | 4.2.1 | Browser storage |
| **Encryption** | libsodium-wrappers-sumo | 0.7.16 | Cryptography |
| **Routing** | React Router | 7.11.0 | Client-side routing |
| **PWA** | vite-plugin-pwa | 1.2.0 | Service worker, manifest |
| **Icons** | Lucide React | 0.562.0 | Icon library |
| **Date Handling** | date-fns | 4.1.0 | Date utilities |
| **Password Strength** | zxcvbn | 4.4.2 | Password validation |
| **Testing** | Vitest | 4.0.16 | Unit testing framework |

### Build & Development Scripts

```json
{
  "dev": "vite",                          // Dev server with HMR
  "build": "tsc -b && vite build",        // Type check + production build
  "lint": "eslint .",                     // Code linting
  "preview": "vite preview",              // Preview production build
  "test": "vitest",                       // Run tests in watch mode
  "test:run": "vitest run",               // Run tests once
  "test:coverage": "vitest run --coverage" // Coverage report
}
```

---

## 2. Application Features

### Core Functionality

**Period Tracking:**
- Log period days with flow intensity (spotting, light, medium, heavy, very heavy)
- Automatic cycle detection and tracking
- Period end date tracking

**Health Logging:**
- **Symptoms:** 12 types (cramps, headache, backache, etc.) with severity levels
- **Mood:** 9 mood types (happy, calm, anxious, irritable, etc.)
- **Intimacy:** Track sexual activity (protected/unprotected/other)
- **Notes:** Free-form text notes for any day

**Predictions & Insights:**
- Weighted moving average algorithm for cycle prediction
- Confidence levels (low/medium/high) based on data consistency
- Cycle statistics (average length, variation, shortest/longest)
- Calendar view with predicted period days

**Privacy & Security:**
- Password-protected vault with Argon2id key derivation
- XChaCha20-Poly1305 authenticated encryption
- Session timeout with auto-lock
- Export data functionality (with security warnings)

---

## 3. Project Structure

```
/home/janis/projects/dev/juno/
├── dist/                        # Build output
├── node_modules/
├── public/                      # Static assets
├── src/
│   ├── assets/                  # Images, icons
│   ├── components/
│   │   ├── calendar/            # Calendar UI components
│   │   │   ├── Calendar.tsx              # Main calendar container
│   │   │   ├── CalendarHeader.tsx        # Month/year navigation
│   │   │   ├── CalendarGrid.tsx          # 7-column grid
│   │   │   ├── CalendarDay.tsx           # Individual day cell
│   │   │   ├── CalendarLegend.tsx        # Color legend
│   │   │   ├── DayDetailSheet.tsx        # Bottom sheet for day details
│   │   │   └── index.ts
│   │   ├── common/              # Reusable UI components
│   │   │   ├── BottomSheet.tsx           # Modal bottom sheet
│   │   │   ├── FlowIntensityPicker.tsx   # Period flow selector
│   │   │   ├── MoodPicker.tsx            # Mood selector
│   │   │   ├── SymptomPicker.tsx         # Symptom selector
│   │   │   └── index.ts
│   │   ├── insights/            # Analytics components (empty)
│   │   ├── logging/             # Data entry forms
│   │   │   ├── PeriodLogForm.tsx
│   │   │   ├── IntimacyLogForm.tsx
│   │   │   ├── SymptomLogForm.tsx
│   │   │   ├── MoodLogForm.tsx
│   │   │   ├── NoteLogForm.tsx
│   │   │   └── index.ts
│   │   ├── Layout.tsx           # App layout with navigation
│   │   ├── ProfileSetup.tsx     # Onboarding wizard
│   │   └── UnlockScreen.tsx     # Authentication screen
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── hooks/
│   │   ├── useCycles.ts         # Cycle data management
│   │   ├── usePredictions.ts    # Prediction calculations
│   │   ├── useProfile.ts        # User profile management
│   │   └── useRecords.ts        # Health record CRUD
│   ├── lib/
│   │   ├── crypto.ts            # Encryption/decryption logic
│   │   ├── crypto.test.ts       # Crypto unit tests
│   │   ├── db.ts                # IndexedDB schema and operations
│   │   ├── db.test.ts           # Database unit tests
│   │   ├── predictions.ts       # Cycle prediction algorithms
│   │   └── types.ts             # TypeScript type definitions
│   ├── pages/
│   │   ├── CalendarPage.tsx     # Main calendar view
│   │   ├── InsightsPage.tsx     # Cycle statistics and predictions
│   │   ├── HistoryPage.tsx      # Log history
│   │   ├── ProfilePage.tsx      # User profile editor
│   │   ├── SettingsPage.tsx     # App settings
│   │   └── index.ts
│   ├── test/
│   │   └── setup.ts             # Vitest configuration
│   ├── App.tsx                  # Root component with routing
│   ├── main.tsx                 # App entry point
│   ├── index.css                # Global styles
│   └── vite-env.d.ts            # Vite type definitions
├── .gitignore
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point
├── ML.md                        # Machine learning proposal
├── package.json
├── package-lock.json
├── PLAN.md                      # Technical specification
├── README.md
├── SECURITY_REVIEW.md           # Security audit report
├── tsconfig.json                # TypeScript config (references)
├── tsconfig.app.json            # App TypeScript config
├── tsconfig.node.json           # Node TypeScript config
└── vite.config.ts               # Vite build configuration
```

---

## 4. Data Model & Types

### Core Types (`/src/lib/types.ts`)

**Record Types:**
```typescript
type RecordType = 'period' | 'intimacy' | 'symptom' | 'mood' | 'note';
```

**Period Tracking:**
```typescript
type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

interface PeriodData {
  date: number;
  flowIntensity: FlowIntensity;
  notes?: string;
}
```

**Cycle Data:**
```typescript
interface CycleData {
  id: string;
  cycleNumber: number;
  startDate: number;           // First day of period
  endDate?: number;            // First day of next period
  periodEndDate?: number;      // Last day of bleeding
  periodLength?: number;       // Days of bleeding
  cycleLength?: number;        // Total cycle length
}
```

**User Profile:**
```typescript
interface UserProfile {
  id: string;
  birthYear?: number;
  height?: number;             // cm
  weight?: number;             // kg
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;         // 0=Sunday, 1=Monday
  createdAt: number;
  updatedAt: number;
}
```

**Encrypted Wrappers:**
```typescript
interface EncryptedRecord {
  id: string;
  nonce: string;               // Base64-encoded
  ciphertext: string;          // Base64-encoded
  category: string;            // RecordType for filtering
  cycleId?: string;
  version: number;
  timestamp: number;
}
```

### Database Schema (`/src/lib/db.ts`)

**IndexedDB Database:** `JunoVault`

**Tables:**
- `records` - Encrypted health records
  - Indexes: `id`, `category`, `timestamp`, `cycleId`
- `keyStore` - Encrypted vault key
  - Indexes: `id`
- `settings` - App settings (unencrypted)
  - Indexes: `id`
- `userProfile` - Encrypted user profile
  - Indexes: `id`
- `cycles` - Encrypted cycle data
  - Indexes: `id`, `startDate`

---

## 5. Encryption Architecture

### Key Hierarchy

```
User Password
    ↓ (Argon2id with unique salt)
Master Key (ephemeral, cleared after use)
    ↓ (XChaCha20-Poly1305)
Vault Key (encrypted, stored in IndexedDB)
    ↓ (XChaCha20-Poly1305)
Individual Records/Cycles/Profile
```

### Cryptographic Primitives

**Key Derivation:** Argon2id
- Operations: 4 (OWASP minimum)
- Memory: 128 MB
- Salt: 16 bytes random
- Output: 32 bytes

**Encryption:** XChaCha20-Poly1305 (via `crypto_secretbox_easy`)
- Authenticated encryption (AEAD)
- Key: 32 bytes
- Nonce: 24 bytes (random per record)
- Prevents tampering

**Random Number Generation:**
- `sodium.randombytes_buf()` - CSPRNG from OS entropy

**Memory Safety:**
- `sodium.memzero()` - Clear sensitive keys from memory

### Encryption Flow

**Creating Vault:**
1. User enters password
2. Generate random salt (16 bytes)
3. Derive master key from password using Argon2id (~30-45 seconds)
4. Generate random vault key (32 bytes)
5. Encrypt vault key with master key
6. Store encrypted vault key + salt in IndexedDB
7. Zero master key from memory
8. Keep vault key in memory for session

**Unlocking Vault:**
1. Retrieve encrypted vault key + salt from IndexedDB
2. Derive master key from entered password
3. Attempt to decrypt vault key
4. If successful, store vault key in memory
5. Zero master key from memory
6. Set session timeout

**Encrypting Data:**
1. Generate random nonce (24 bytes)
2. Convert data to JSON string
3. Encrypt with vault key + nonce
4. Store nonce + ciphertext in IndexedDB

---

## 6. Component Architecture

### Authentication Flow

**Entry Point:** `/src/App.tsx`

```
App (BrowserRouter)
  └─ AuthProvider (manages auth state)
       └─ AppRoutes
            └─ ProtectedRoute (checks authentication)
                 ├─ UnlockScreen (if not authenticated)
                 └─ OnboardingCheck (if authenticated)
                      ├─ ProfileSetup (if setup incomplete)
                      └─ Layout (if setup complete)
                           └─ Outlet (page content)
```

### Route Structure

```typescript
/ (index)           → CalendarPage
/insights           → InsightsPage
/history            → HistoryPage
/settings           → SettingsPage
/profile            → ProfilePage
* (catch-all)       → Navigate to /
```

### Navigation

**Desktop:** Left sidebar (256px width)
- Calendar, Insights, History, Settings
- Lock app button at bottom

**Mobile:** Bottom tab bar
- Calendar, Insights, History, Settings icons
- Lock button in header

### Custom Hooks

**`useAuth()`** - Authentication state
- `isLoading`, `hasVault`, `isAuthenticated`
- `unlock()`, `lock()`, `createNewVault()`, `changePassword()`
- Session timeout management

**`useCycles()`** - Cycle management
- `cycles[]`, `currentCycle`, `isLoading`, `error`
- `startNewCycle()`, `endPeriod()`, `updateCycle()`, `deleteCycle()`

**`useProfile()`** - User profile
- `profile`, `isLoading`, `hasCompletedSetup`
- `updateProfile()`, `createProfile()`

**`useRecords()`** - Health records CRUD
- `records[]`, `isLoading`, `error`
- `addRecord()`, `updateRecord()`, `deleteRecord()`, `getRecordsByDate()`
- Supports filtering by type, search, date range

**`usePredictions()`** - Cycle predictions
- `prediction`, `currentCycleDay`, `daysUntilPeriod`, `statistics`
- `getMonthData()` - Generate calendar data for display

---

## 7. State Management

**Approach:** React Context + Custom Hooks (no Redux/Zustand)

**Global State:**
- `AuthContext` - Authentication, session management

**Local State:**
- Component state with `useState`
- Derived state with `useMemo`
- Effects with `useEffect`

**Data Flow:**
```
IndexedDB (encrypted)
    ↓
Custom Hook (decrypt)
    ↓
React State (plaintext in memory)
    ↓
Components (render)
```

**Note:** Decrypted data exists in memory only during active session. On lock/timeout, state is cleared and vault key is zeroed.

---

## 8. Prediction Algorithm

**Location:** `/src/lib/predictions.ts`

**Algorithm:** Weighted Moving Average with Recency Bias

**Inputs:**
- Last 6-12 completed cycles
- User profile averages (fallback)

**Process:**
1. Extract cycle lengths and period lengths
2. Apply exponential weights (more recent cycles weighted higher)
3. Calculate weighted average for cycle length and period length
4. Calculate standard deviation for confidence
5. Predict next period start/end based on current cycle start + average

**Confidence Levels:**
- **High:** ≥6 cycles, stdDev < 2 days
- **Medium:** ≥3 cycles, stdDev < 4 days
- **Low:** All other cases

**Example:**
```typescript
const prediction = predictNextCycle({ cycles, profile });
// {
//   nextPeriodStart: 1704067200000,
//   nextPeriodEnd: 1704499200000,
//   cycleLength: 28,
//   periodLength: 5,
//   confidence: 'high',
//   basedOnCycles: 8
// }
```

---

## 9. Testing Strategy

### Test Framework

- **Unit Tests:** Vitest
- **React Testing:** @testing-library/react
- **DOM Assertions:** @testing-library/jest-dom
- **Fake IndexedDB:** fake-indexeddb

### Test Files

**`/src/lib/crypto.test.ts`** (226 lines)
- `initCrypto()` - Initialization tests
- `createVault()`, `unlock()`, `lock()` - Vault lifecycle
- `encryptRecord()`, `decryptRecord()` - Record encryption
- `changePassword()` - Password changes with data preservation
- `generateId()` - ID generation uniqueness

**`/src/lib/db.test.ts`** (194 lines)
- Database structure tests
- CRUD operations on all tables
- Query by category/filters
- Settings management
- `clearAllData()`, `hasExistingVault()`

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
```

### Coverage Targets

Per PLAN.md: > 80% coverage for crypto and predictions modules.

---

## 10. Build Configuration

### Vite Configuration (`/vite.config.ts`)

**PWA Manifest:**
```typescript
{
  name: 'Juno',
  short_name: 'Juno',
  description: 'Private period tracker - your data stays on your device',
  theme_color: '#e11d48',
  background_color: '#fff1f2',
  display: 'standalone'
}
```

**Service Worker (Workbox):**
- Auto-update on new version
- Cache static assets (JS, CSS, HTML, icons, WASM)
- `CacheFirst` for WASM files (30 days)
- `StaleWhileRevalidate` for JS/CSS (1 week)
- 3MB max file size (accommodates libsodium WASM)

**Path Alias:**
```typescript
resolve: {
  alias: {
    'libsodium-wrappers-sumo': path.resolve(__dirname,
      'node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js'
    )
  }
}
```

### TypeScript Configuration

**`tsconfig.json`:** Project references
**`tsconfig.app.json`:** App-specific config
- Target: ES2020
- Strict mode enabled
- No unused locals/parameters
- No fallthrough cases

**`tsconfig.node.json`:** Build scripts config

### ESLint Configuration

- React Hooks rules
- React Refresh plugin
- TypeScript ESLint

---

## 11. Security Considerations

**See `/SECURITY_REVIEW.md` for comprehensive security audit.**

### Key Security Features

**Implemented:**
- ✅ Content Security Policy (CSP) meta tag
- ✅ HTTPS enforcement in production
- ✅ Rate limiting on authentication (exponential backoff)
- ✅ Strong Argon2id parameters (ops=4, mem=128MB)
- ✅ Constant-time unlock to prevent timing attacks
- ✅ Password cleared from memory immediately after use
- ✅ Session timeout with auto-lock
- ✅ Export warning dialog for unencrypted data

**Remaining Considerations:**
- MEDIUM: No HMAC integrity verification on IndexedDB records
- MEDIUM: Settings stored unencrypted (low-sensitivity metadata)
- MEDIUM: Decrypted records persist in React state (unavoidable in client-side app)

### Security Principles

1. **Zero-knowledge:** No server has access to plaintext data
2. **Local-first:** All data encrypted at rest in IndexedDB
3. **Defense in depth:** Multiple layers (CSP, rate limiting, encryption)
4. **Memory safety:** Keys zeroed from memory after use
5. **Authenticated encryption:** Prevents tampering with encrypted data

---

## 12. Documentation Files

**`/README.md`** - Generic React + Vite template (not updated)

**`/PLAN.md`** (641 lines) - **COMPREHENSIVE TECHNICAL SPECIFICATION**
- Development plan and MVP scope
- Architecture overview
- Complete data model definitions
- Component architecture breakdown
- Cycle prediction algorithm details
- Hooks specifications
- Implementation order
- Deferred features (i18n, RTL, fertility tracking, etc.)

**`/ML.md`** (336 lines) - Machine learning proposal
- Optional TensorFlow.js integration for predictions
- LSTM-based model for cycle prediction
- Lazy loading strategy (~500KB bundle)
- Training on-device for privacy
- Feature extraction from cycle data

**`/SECURITY_REVIEW.md`** (1620 lines) - **COMPREHENSIVE SECURITY AUDIT**
- Critical vulnerabilities (all fixed)
- High/medium severity items
- Cryptographic analysis
- Compliance considerations (HIPAA, GDPR)
- Detailed remediation recommendations
- Updated with fix status (2025-12-29)

---

## 13. Color Scheme & Design System

### Primary Colors

```css
:root {
  --color-primary: #e11d48;        /* rose-600 */
  --color-primary-light: #fb7185;  /* rose-400 */
  --color-primary-dark: #be123c;   /* rose-700 */
}
```

### Calendar Day Indicators

| State | Visual Representation |
|-------|----------------------|
| Period day | Filled circle, darkness varies by flow intensity |
| Predicted period | Dashed circle outline (rose-300) |
| Intimacy logged | Small dot indicator |
| Symptoms logged | Small icon |
| Today | Border highlight |

### Tailwind Configuration

- Utility-first CSS via Tailwind 4.1
- Custom scrollbar styling
- `animate-fadeIn` custom animation

---

## 14. Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

**Linting:** ESLint with React Hooks + TypeScript rules
**Type Checking:** TypeScript strict mode
**Testing:** Vitest with React Testing Library
**Formatting:** (None configured - consider adding Prettier)

### Git Workflow

**Current branch:** `develop`
**Recent commit:** `8187801 Initial commit`

**Modified files (uncommitted):**
- SECURITY_REVIEW.md
- Multiple component files (UnlockScreen, Calendar components, logging forms, etc.)
- ML.md (untracked)

---

## 15. Future Features (Deferred to Phase 2)

From `/PLAN.md`:

**Internationalization:**
- react-i18next framework
- RTL language support (Arabic, Hebrew, Persian, Urdu)
- Additional calendar systems (Hijri, Persian, Hebrew, Buddhist)

**Privacy Enhancements:**
- Stealth mode (disguised app icon/name)
- Decoy vault (secondary password shows fake data)
- Emergency delete (shake-to-delete)

**Fertility Features:**
- Temperature/BBT tracking
- Cervical mucus tracking
- Ovulation test logging
- Pregnancy test logging
- Fertile window calculation
- TTC-specific insights

**Additional Features:**
- Data backup/restore
- Push notifications/reminders
- Import from other period apps
- ML-powered predictions (see ML.md)

---

## 16. Known Issues & Limitations

**Current Limitations:**
- Single user per browser (no multi-user support)
- No cloud sync (fully local)
- Password loss = permanent data loss (by design)
- Export is plaintext JSON (with security warnings)
- No backup/restore functionality yet

**Browser Compatibility:**
- Requires modern browser with IndexedDB support
- WASM support required for libsodium
- Service worker for PWA functionality
- Tested on Chrome/Firefox/Safari

---

## 17. Key Dependencies Deep Dive

### libsodium-wrappers-sumo (0.7.16)

**Purpose:** Cryptography library (JavaScript bindings for libsodium)

**Key Functions Used:**
- `crypto_pwhash()` - Argon2id password hashing
- `crypto_secretbox_easy()` - XChaCha20-Poly1305 encryption
- `crypto_secretbox_open_easy()` - Decryption
- `randombytes_buf()` - CSPRNG
- `memzero()` - Secure memory clearing

**Bundle Size:** ~1.2MB WASM (lazy loaded, cached for 30 days)

### Dexie.js (4.2.1)

**Purpose:** IndexedDB wrapper with TypeScript support

**Features Used:**
- Type-safe table definitions
- Entity tables with typed queries
- Compound indexes
- Transaction support

**Schema Version:** 1 (current)

### date-fns (4.1.0)

**Purpose:** Date manipulation utilities

**Functions Used:**
- `addMonths()`, `subMonths()` - Calendar navigation
- Date formatting and comparison

**Why not Moment.js?** date-fns is tree-shakeable, smaller bundle

### zxcvbn (4.4.2)

**Purpose:** Password strength estimation (Dropbox's library)

**Features:**
- Pattern matching (common passwords, sequences, dates)
- Entropy calculation
- Crack time estimates
- User feedback on password weakness

### react-swipeable (7.0.2)

**Purpose:** Touch gesture detection

**Usage:** Calendar swipe navigation (left/right to change months)

---

## 18. Performance Considerations

### Bundle Size Optimization

**Main Bundle:** ~150KB (React + app code)
**WASM Module:** ~1.2MB (libsodium, lazy cached)
**Total Initial Load:** ~150KB (WASM loads on first unlock)

### Code Splitting

- WASM loaded on demand
- Service worker caches assets aggressively
- React lazy loading not currently used (could optimize pages)

### Encryption Performance

**Initial Vault Creation:** ~30-45 seconds (Argon2id with 128MB memory)
**Unlock:** ~30-45 seconds (same KDF)
**Record Encryption:** < 1ms per record
**Record Decryption:** < 1ms per record

**Trade-off:** Slow unlock provides strong protection against brute-force attacks.

### IndexedDB Query Performance

- Indexed queries on `category`, `timestamp`, `startDate`
- No full-text search (records are encrypted)
- Typical query time: < 10ms for hundreds of records

---

## 19. Deployment Checklist

Before production deployment:

**Security:**
- [ ] Verify CSP headers configured on server
- [ ] Enable HSTS (Strict-Transport-Security)
- [ ] HTTPS enforcement confirmed
- [ ] Remove all console.log statements
- [ ] Verify service worker cache policy
- [ ] Test rate limiting on failed logins

**Functionality:**
- [ ] Test on iOS Safari, Chrome Android
- [ ] Verify PWA install prompt works
- [ ] Test offline functionality
- [ ] Confirm export/delete data flows
- [ ] Validate cycle predictions with test data

**Performance:**
- [ ] Lighthouse PWA score > 90
- [ ] Test with slow network (3G throttling)
- [ ] Verify WASM loads and caches correctly

**Documentation:**
- [ ] Update README.md with actual project info
- [ ] Create privacy policy
- [ ] Document password recovery = impossible
- [ ] User guide for data export/backup

---

## 20. Quick Reference Commands

```bash
# Development
npm run dev                      # Start dev server
npm test                         # Run tests in watch mode
npm run lint                     # Lint code

# Production
npm run build                    # Build for production
npm run preview                  # Preview production build

# Testing
npm run test:run                 # Run tests once
npm run test:coverage            # Generate coverage report

# Dependencies
npm install                      # Install all dependencies
npm audit                        # Check for vulnerabilities
npm outdated                     # Check for updates
```

---

## 21. Contact & Resources

**Project Location:** `/home/janis/projects/dev/juno`

**Key Documentation:**
- Technical Spec: `/PLAN.md`
- Security Audit: `/SECURITY_REVIEW.md`
- ML Proposal: `/ML.md`

**External Resources:**
- libsodium docs: https://doc.libsodium.org/
- Dexie.js docs: https://dexie.org/
- Vite docs: https://vitejs.dev/
- React Router v7: https://reactrouter.com/

---

**End of Technical Onboarding Document**

This document provides a comprehensive overview of the Juno codebase. For specific implementation details, refer to the source code and the detailed specifications in PLAN.md and SECURITY_REVIEW.md.
