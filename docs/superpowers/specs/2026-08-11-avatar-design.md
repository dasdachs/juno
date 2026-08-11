# Avatar (pasted URL) — Design

Date: 2026-08-11

## Summary

Add an optional profile avatar. For now, the only avatar source is a
user-pasted image URL — no file upload, no third-party services (e.g.
Gravatar). When no avatar URL is set, or the URL fails to load, the app
falls back to a generated initials circle (from a new optional display
name field), and falls back further to the existing generic profile icon
if there's no name either.

This keeps the feature consistent with Juno's local-only, no-server
architecture: the only network request an avatar can ever cause is one
the user explicitly opted into by pasting a URL.

## Data model

`src/lib/types.ts` — `UserProfile` gains two new optional fields:

```ts
export interface UserProfile {
  id: string;
  name?: string;       // display name, used to derive initials
  avatarUrl?: string;  // user-pasted image URL
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

Both fields are optional. No Dexie schema migration is needed —
`UserProfile` is serialized as a whole into `EncryptedUserProfile.ciphertext`
(via `encryptUserProfile`/`decryptUserProfile`), so existing encrypted
profiles simply decrypt to objects without `name`/`avatarUrl` until the
user saves the profile page again, which matches how every other optional
field on `UserProfile` (e.g. `birthYear`) already behaves.

## `Avatar` component

New file: `src/components/common/Avatar.tsx`.

Pure, presentational, no data fetching or side effects:

```ts
interface AvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg'; // maps to fixed pixel sizes, default 'md'
}
```

Render priority:

1. **`avatarUrl` set** — render an `<img>` with that `src`. On `error`
   (broken link, CORS-blocked, wrong content type, etc.), fall through to
   the next tier for that render (tracked via local `useState` error flag
   reset when `avatarUrl` changes).
2. **`name` set** (and no working `avatarUrl`) — render a colored circle
   with initials derived from `name`: first letter of the first word, plus
   first letter of the last word if there is more than one word (e.g.
   "Jani Sumak" → "JS", "Jani" → "J"). Background color fixed to the
   existing rose theme, consistent with current icon treatment elsewhere
   in the app (`ProfileSetup.tsx` welcome step, Settings profile row).
3. **Neither set** — render the existing generic rose-circle `User` icon
   (lucide-react), matching current visual language.

No validation of the URL's reachability happens outside the `<img>`
element's natural load/error behavior — no extra fetch, no allowlist.

## Editing UI

`src/pages/ProfilePage.tsx`, "Personal Information" card:

- New `Avatar` preview (size `lg`) shown at the top of the card, reflecting
  the current in-progress form state (not just the saved profile), so the
  user sees the result of a pasted URL or typed name immediately.
- New "Display Name" text input, above the existing Birth Year field.
- New "Avatar URL" text input (type `url` for basic browser-level format
  hinting only — no custom validation), below Display Name.
- Both new fields follow the existing local `useState` + `useEffect`
  (hydrate from `profile`) + `handleSave` pattern already used for
  `birthYear`, `height`, etc. — `name` and `avatarUrl` are passed straight
  through to `updateProfile` alongside the existing fields.

No other page or component (Settings list row, nav, etc.) is touched —
scope is Profile page only, per the earlier design discussion.

## Error handling

- Broken/unreachable pasted URL: handled entirely by the `Avatar`
  component's `onError` fallback described above. No error message is
  shown to the user on the Profile page itself — the preview will simply
  show the initials/generic fallback if the URL doesn't resolve to an
  image, which is enough signal.
- No network calls are made to validate the URL beyond the browser's
  normal image load.

## Testing

- New `src/components/common/Avatar.test.tsx`:
  - Renders an `<img>` with the given `avatarUrl` when set and loads
    successfully.
  - Falls back to initials when `avatarUrl` is absent and `name` is set.
  - Falls back to initials when the `<img>` fires `onError` (simulate load
    failure) even though `name` is set.
  - Falls back to the generic icon when neither `avatarUrl` nor `name` is
    set.
  - Initials computed correctly for a one-word name vs. a multi-word name.
- `ProfilePage` currently has no dedicated test file; this feature doesn't
  introduce one, consistent with existing coverage for that page.

## Out of scope (for now)

- Local file upload / client-side image resizing.
- Gravatar or any other third-party avatar service.
- Showing the avatar anywhere outside the Profile page (Settings row,
  nav bar, etc.).
- URL content-type/safety validation beyond the browser's native image
  load/error behavior.
