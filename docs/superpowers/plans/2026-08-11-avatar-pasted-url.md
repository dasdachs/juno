# Avatar (Pasted URL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user set a profile avatar by pasting an image URL, with a generated-initials fallback (from a new display name field) and a generic-icon fallback when neither is set.

**Architecture:** Two new optional fields (`name`, `avatarUrl`) on the existing `UserProfile` type, a new pure presentational `Avatar` component with a three-tier render fallback (image → initials → icon), and new fields wired into the existing `ProfilePage.tsx` save flow. No new tables, no new crypto paths, no new dependencies.

**Tech Stack:** React + TypeScript, Vitest + @testing-library/react, Tailwind CSS, lucide-react icons.

## Global Constraints

- No third-party avatar services (Gravatar, etc.) — only a user-pasted URL. (spec: "Out of scope")
- No local file upload / image resizing in this feature. (spec: "Out of scope")
- Avatar UI appears on the Profile page only — not Settings row, not nav bar. (spec: "Out of scope")
- No custom URL validation beyond the browser's native `<img>` load/error behavior — no allowlist, no extra fetch. (spec: "Error handling")
- `UserProfile` fields stay optional; no Dexie schema migration — the object is serialized whole via `encryptUserProfile`/`decryptUserProfile`. (spec: "Data model")
- Match existing visual language: rose theme (`rose-500`/`rose-100`/`rose-950`), same card/input Tailwind classes already used in `ProfilePage.tsx`.

---

### Task 1: Add `name` and `avatarUrl` fields to `UserProfile`

**Files:**
- Modify: `src/lib/types.ts:155-165` (the `UserProfile` interface)

**Interfaces:**
- Produces: `UserProfile.name?: string`, `UserProfile.avatarUrl?: string` — both optional, consumed by Task 2 (`Avatar` component props) and Task 3 (`ProfilePage.tsx`).

This is a type-only change. `useProfile.ts`'s `createProfile`/`updateProfile` already take `Partial<UserProfile>`/spread the full object through to `encryptUserProfile`, so no logic there needs to change, and no new test is needed for this task — the existing type system and build are the verification.

- [ ] **Step 1: Add the fields**

Edit `src/lib/types.ts`, inside the `UserProfile` interface (currently starts at line 155):

```ts
export interface UserProfile {
  id: string;
  name?: string;
  avatarUrl?: string;
  birthYear?: number;
  height?: number;
  weight?: number;
  averageCycleLength?: number;
  averagePeriodLength?: number;
  weekStartsOn: 0 | 1;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (the fields are optional, so no existing call site breaks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "Add name and avatarUrl fields to UserProfile"
```

---

### Task 2: `Avatar` component

**Files:**
- Create: `src/components/common/Avatar.tsx`
- Test: `src/components/common/Avatar.test.tsx`
- Modify: `src/components/common/index.ts`

**Interfaces:**
- Consumes: `UserProfile.name?: string`, `UserProfile.avatarUrl?: string` (Task 1) — but takes them as plain props, not a `UserProfile` object, so it stays independently testable.
- Produces: `Avatar({ avatarUrl?, name?, size? }: AvatarProps)` React component, and `AvatarSize = 'sm' | 'md' | 'lg'` type, both exported from `src/components/common/Avatar.tsx` and re-exported from `src/components/common/index.ts`. Consumed by Task 3.

- [ ] **Step 1: Write the failing tests**

Create `src/components/common/Avatar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('should render the pasted image when avatarUrl is set', () => {
    render(<Avatar avatarUrl="https://example.com/photo.jpg" name="Jani Sumak" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('should fall back to initials when avatarUrl is absent', () => {
    render(<Avatar name="Jani Sumak" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to initials when the image fails to load', () => {
    render(<Avatar avatarUrl="https://example.com/broken.jpg" name="Jani Sumak" />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to a generic icon when neither avatarUrl nor name is set', () => {
    const { container } = render(<Avatar />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should compute a single initial for a one-word name', () => {
    render(<Avatar name="Jani" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should compute two initials for a multi-word name', () => {
    render(<Avatar name="Jani Marie Sumak" />);

    expect(screen.getByText('JS')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/common/Avatar.test.tsx`
Expected: FAIL — `Avatar.tsx` does not exist yet (import error).

- [ ] **Step 3: Implement the component**

Create `src/components/common/Avatar.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: AvatarSize;
}

const CONTAINER_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
};

const TEXT_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
};

const ICON_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({ avatarUrl, name, size = 'md' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const containerClasses = `${CONTAINER_SIZE_CLASSES[size]} rounded-full flex items-center justify-center overflow-hidden shrink-0`;

  if (avatarUrl && !imageFailed) {
    return (
      <div className={`${containerClasses} bg-gray-100 dark:bg-gray-800`}>
        <img
          src={avatarUrl}
          alt={name ? `${name}'s avatar` : 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  const initials = name ? getInitials(name) : '';

  if (initials) {
    return (
      <div className={`${containerClasses} bg-rose-500 text-white font-medium ${TEXT_SIZE_CLASSES[size]}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} bg-rose-100 dark:bg-rose-950`}>
      <User className={`${ICON_SIZE_CLASSES[size]} text-rose-600 dark:text-rose-400`} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/common/Avatar.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Export from the common barrel**

Edit `src/components/common/index.ts`, add:

```ts
export { Avatar } from './Avatar';
export type { AvatarSize } from './Avatar';
```

- [ ] **Step 6: Commit**

```bash
git add src/components/common/Avatar.tsx src/components/common/Avatar.test.tsx src/components/common/index.ts
git commit -m "Add Avatar component with image/initials/icon fallback"
```

---

### Task 3: Wire Display Name and Avatar URL into ProfilePage

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

**Interfaces:**
- Consumes: `Avatar` component from `../components/common` (Task 2); `UserProfile.name`/`UserProfile.avatarUrl` (Task 1); existing `useProfile()` hook's `profile`/`updateProfile` (unchanged signatures).

- [ ] **Step 1: Add local state and hydration**

In `src/pages/ProfilePage.tsx`, add the import and two new pieces of state alongside the existing ones:

```tsx
import { Avatar } from '../components/common';
```

```tsx
const [name, setName] = useState<string>('');
const [avatarUrl, setAvatarUrl] = useState<string>('');
```

In the existing hydration `useEffect` (currently lines 19-28), add:

```tsx
useEffect(() => {
  if (profile) {
    setName(profile.name ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
    setBirthYear(profile.birthYear?.toString() ?? '');
    setHeight(profile.height?.toString() ?? '');
    setWeight(profile.weight?.toString() ?? '');
    setAvgCycleLength(profile.averageCycleLength?.toString() ?? '');
    setAvgPeriodLength(profile.averagePeriodLength?.toString() ?? '');
    setWeekStartsOn(profile.weekStartsOn);
  }
}, [profile]);
```

- [ ] **Step 2: Include the new fields in `handleSave`**

In the existing `handleSave` (currently lines 30-48), add `name` and `avatarUrl` to the `updateProfile` call:

```tsx
await updateProfile({
  name: name.trim() ? name.trim() : undefined,
  avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : undefined,
  birthYear: birthYear ? parseInt(birthYear) : undefined,
  height: height ? parseFloat(height) : undefined,
  weight: weight ? parseFloat(weight) : undefined,
  averageCycleLength: avgCycleLength ? parseInt(avgCycleLength) : undefined,
  averagePeriodLength: avgPeriodLength ? parseInt(avgPeriodLength) : undefined,
  weekStartsOn,
});
```

- [ ] **Step 3: Add the UI**

In the "Personal Information" card (currently starts at line 70 with `<h2 className="font-medium ...">Personal Information</h2>`), insert this block right after the `<h2>` and before the existing Birth Year `<div>`:

```tsx
<div className="flex items-center gap-4">
  <Avatar avatarUrl={avatarUrl || undefined} name={name || undefined} size="lg" />
  <div className="flex-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Display Name
    </label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="e.g., Jani"
      className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
    />
  </div>
</div>

<div>
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Avatar URL
  </label>
  <input
    type="url"
    value={avatarUrl}
    onChange={(e) => setAvatarUrl(e.target.value)}
    placeholder="https://example.com/photo.jpg"
    className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Paste a link to an image. If it doesn't load, we'll show your initials instead.
  </p>
</div>
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

Run: `npm run dev`

In the browser: unlock the vault (or create one in dev), navigate to Settings → Profile.
- Confirm the avatar preview shows the generic icon initially (no name/avatarUrl yet).
- Type a display name (e.g. "Jani Sumak") — confirm the preview switches to initials "JS" immediately, before saving.
- Paste a valid image URL — confirm the preview switches to that image.
- Paste a broken/unreachable URL — confirm the preview falls back to initials.
- Click "Save Changes", reload the page, navigate back to Profile — confirm name and avatar URL persisted.

- [ ] **Step 6: Run full test suite**

Run: `npm run test:run`
Expected: all tests pass, including the new `Avatar.test.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ProfilePage.tsx
git commit -m "Add display name and avatar URL fields to Profile page"
```
