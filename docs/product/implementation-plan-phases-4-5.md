# Forever Fireflies V1.0 — Implementation Plan (Phases 4-5)

## Context

Phases 1-3 are complete: the Expo app has all static screens with seed data, design tokens, Zustand stores, and a fully built Supabase backend (13 tables, 31 migrations, RLS, 9 service modules in `services/`). The app runs entirely on local data — no auth, no real database reads/writes.

This plan covers **Phase 4 (Auth & Profiles)** and **Phase 5 (Recording & Entries)** — the transition from "looks real" to "is real." After these two phases, the complete sign-in → record → transcribe → save → browse → edit → delete loop works end-to-end.

**Key decisions:**
- **Search moves to Home tab** — no dedicated search page. Tapping search icon reveals inline search bar + filter chips above the timeline. Simplifies navigation.
- Onboarding first entry stays local (Phase 5 handles real entry creation)
- All native modules batch-installed in Chunk 8 (one dev client rebuild)
- Phase 9 (Analytics & Delight) deferred to post-launch

---

## Architecture: Local Stores → Supabase

The biggest shift. Think of it like upgrading from a notebook (local) to a cloud document (Supabase) — the notebook becomes a fast local cache that syncs with the cloud.

1. **Expand `authStore`** — hold Supabase session, profile, familyId (not just `hasCompletedOnboarding`)
2. **Rewrite stores as thin caches** — write methods call service layer first, then update local state with the server response. Supabase UUIDs become the real IDs
3. **Remove seed data** — gate behind `__DEV__` flag
4. **Add mapper functions** — convert Supabase snake_case rows (`color_index`) to camelCase UI shapes (`colorIndex`)

---

## Phase 4: Auth & Profiles (Chunks 1-7)

**Goal:** Sign in works for real. Child profiles save to the database. User sees their own data.

### Chunk 1: Environment Variables & Auth Store Expansion

**What:** Set up the foundation — expand authStore to hold real auth state.

**Files to modify:**
- `stores/authStore.ts` — Add: `session`, `user`, `profile`, `familyId`, `isLoading`, `initialize()`, `signIn()`, `signOut()`
- `.env.local` — Verify Supabase keys are set

**Key detail:** Don't persist the session in Zustand — Supabase's client already handles that via AsyncStorage in `lib/supabase.ts`. Only `hasCompletedOnboarding` stays persisted as a fast local flag.

**Reuse:** `lib/supabase.ts` (client), `lib/database.types.ts` (types), `services/auth.service.ts`, `services/profiles.service.ts`, `services/families.service.ts`

**Verify:** Store instantiates without errors, `initialize()` sets `isLoading: false` with no session

---

### Chunk 2: Auth State Listener & Root Router Guard

**What:** App checks for an existing session on launch and routes accordingly.

**Files to modify:**
- `app/_layout.tsx` — Add auth initialization on mount, set up `authService.onAuthStateChange()` listener, show splash while loading
- `app/index.tsx` — New routing logic: no session → onboarding, session + incomplete → resume onboarding, session + complete → Home

**Risk:** The `handle_new_user` DB trigger auto-creates profile + family rows on signup. Test this trigger works in Supabase SQL editor first — if broken, everything downstream fails silently.

**Verify:** Cold launch with no session → onboarding. Sign out → routes back to onboarding.

---

### Chunk 3: Sign In Screen (Apple + Google + Email)

**What:** The onboarding sign-in screen actually authenticates users.

**Files to modify:**
- `app/(onboarding)/index.tsx` — Wire buttons to `authService.signInWithApple()`, `signInWithGoogle()`, navigate to email form
- `services/auth.service.ts` — Add `redirectTo: 'core-memories://auth/callback'` to OAuth methods
- **New:** `app/(onboarding)/email-auth.tsx` — Email/password form (sign up + sign in modes)

**Pre-req (manual, outside code):**
- Configure Apple Sign In in Apple Developer portal + Supabase dashboard
- Configure Google Sign In in Google Cloud Console + Supabase dashboard
- These are one-time setup tasks. The service code already exists.

**Verify:** Apple/Google → lands on Add Child. Email signup → Add Child. Wrong password → error. Check Supabase dashboard: user + profile + family rows created.

---

### Chunk 4: Onboarding — Add Child to Supabase

**What:** Add Child screen writes to the database instead of local store.

**Files to modify:**
- `app/(onboarding)/add-child.tsx` — Replace `useChildrenStore().addChild()` with `childrenService.createChild()`, then update local store
- `stores/childrenStore.ts` — Add `setChildren()` method + Supabase→UI shape mapper

**Reuse:** `services/children.service.ts` (already has `createChild()`)

**Verify:** Add child → row in Supabase `children` table + `family_children` junction populated by trigger. Second child → `colorIndex` increments correctly.

---

### Chunk 5: Onboarding — Wire Remaining Screens

**What:** Permission screens, notification time, and paywall mark onboarding complete.

**Files to modify:**
- `app/(onboarding)/mic-permission.tsx` — Request mic permission via `Audio.requestPermissionsAsync()`
- `app/(onboarding)/notifications.tsx` — Save time via `profilesService.updateNotificationPrefs()`, request notification permissions
- `app/(onboarding)/first-recording.tsx` + `first-memory-text.tsx` — Keep local for now (Phase 5 handles real entries)
- `app/(onboarding)/paywall.tsx` — Call `profilesService.completeOnboarding()`

**Verify:** Complete full onboarding → `onboarding_completed: true` in Supabase. Kill + relaunch → routes straight to Home.

---

### Chunk 6: Home Screen — Real Data from Supabase

**What:** Home fetches children and entries from Supabase instead of seed data.

**Files to modify:**
- `stores/childrenStore.ts` — Add `fetchChildren()` method with mapper
- `stores/entriesStore.ts` — Add `fetchTimeline(familyId, page)` with mapper (flatten `entry_children`/`entry_tags` joins)
- `app/(main)/home.tsx` — Remove seed data seeding, fetch real data on mount, add loading + error states

**Verify:** Home shows real children as tabs, entries from Supabase. Empty state when no entries. Child filter tabs work with real UUIDs.

---

### Chunk 7: Settings — Children CRUD from Supabase

**What:** Edit/add/delete children persist to the server. Sign out works.

**Files to modify:**
- `app/(main)/settings.tsx` — Wire child edit/add/delete to service layer, add Sign Out button

**Verify:** Edit child name → persists across restart. Add child → appears in Home. Delete child → gone. Sign out → onboarding. Sign in → children still there.

---

## Phase 5: Recording & Entries (Chunks 8-16)

**Goal:** Record → transcribe → save → view works end-to-end. The core product loop.

### Chunk 8: Custom Dev Client Setup (Batch Install)

**What:** Install all native modules at once and build the custom dev client.

**Commands:**
```bash
npx expo install expo-speech-recognition expo-av expo-notifications react-native-purchases posthog-react-native
npx expo prebuild
npx expo run:ios  # or: eas build --profile development
```

**Note:** After this, Expo Go no longer works. All development uses the custom client you just built. This is how most production Expo apps work — think of it as graduating from training wheels.

**Verify:** Custom client builds, installs on physical iPhone, `ExpoSpeechRecognitionModule` imports without error.

---

### Chunk 9: Voice Recording — Capture & Transcription

**What:** Recording screen captures real audio with live transcription.

**Files to create:**
- `hooks/useSpeechRecognition.ts` — Wraps `expo-speech-recognition`: `start()`, `stop()`, `transcript` (real-time updates), `isRecording`, `error`, `audioUri`
  - Config: `{ lang: 'en-US', interimResults: true, persist: true, requiresOnDeviceRecognition: true }`

**Files to modify:**
- `app/(main)/recording.tsx` — Replace fake recording with real speech recognition, display live transcript, 60s auto-stop, handle mic denied

**Verify:** Tap mic → speak → see live transcript. Stop → navigates to Entry Detail with transcript. 60s auto-stop works. Mic denied → error screen.

---

### Chunk 10: Entry Creation — Save to Supabase

**What:** Entries save to the database with audio uploaded to Storage. This is the biggest refactor.

**Files to modify:**
- `app/(main)/entry-detail.tsx` — Major refactor:
  - Accept `entryId` (existing) OR `transcript` + `audioUri` (new) as route params
  - New entry: `entriesService.create()` → `storageService.uploadAudio()` → `entriesService.setEntryChildren()` / `setEntryTags()`
  - Existing entry: `entriesService.getEntry(entryId)` to load
  - Replace local store mutations with debounced service layer calls
  - Delete → `entriesService.softDelete()`, favorite → `entriesService.toggleFavorite()`
- "Or write instead" → navigate to Entry Detail with no transcript/audioUri

**Reuse:** `services/entries.service.ts` (already has all CRUD methods), `services/storage.service.ts` (already has upload/playback/delete)

**Verify:** Record → entry in `entries` table + audio in storage bucket. Edit transcript → persists. Heart toggle → DB updates. Delete → soft-deleted. "Write instead" → text entry saves.

---

### Chunk 11: Auto-Detection — Child Names & Tags

**What:** After recording, automatically detect which children and topics are mentioned.

**Files to create:**
- `lib/autoDetect.ts` — Two pure functions:
  - `detectChildren(transcript, children)` — case-insensitive scan for names + nicknames → child IDs
  - `detectTags(transcript, tags)` — keyword matching against system tag slugs → tag IDs

**Files to modify:**
- Entry creation flow — After save, run detection → `entriesService.setEntryChildren()` / `setEntryTags()` with `autoDetected: true`

**Verify:** Record mentioning "Emma" → Emma's pill appears. "Liam said something funny" → Liam + "humor" tag. No name → no auto-detection, user adds manually.

---

### Chunk 12: Audio Playback on Entry Detail

**What:** The audio playback bar actually plays the recorded audio.

**Files to create:**
- `hooks/useAudioPlayer.ts` — Wraps `expo-av` Audio: `load(uri)`, `play()`, `pause()`, `seek()`, `isPlaying`, `position`, `duration`, `cleanup()`

**Files to modify:**
- `app/(main)/entry-detail.tsx` — Get signed URL via `storageService.getPlaybackUrl()`, wire play/pause/scrub bar

**Verify:** Tap play → hear recording. Pause/resume works. Scrub bar shows real position/duration.

---

### Chunk 13: Re-Record & Date Picker

**What:** Users can re-record audio and backdate entries.

**Files to modify:**
- `app/(main)/recording.tsx` — Wire `reRecordEntryId` param: record → upload (overwrites via upsert) → update transcript → return to Entry Detail
- `app/(main)/entry-detail.tsx` — Tap date → inline picker → `entriesService.update(entryId, { entry_date })`. Block future dates.

**Verify:** Re-record replaces audio + transcript, preserves metadata. Change date to yesterday → entry moves in timeline sort.

---

### Chunk 14: Prompts from Database

**What:** Recording screen shows prompts from Supabase instead of the hardcoded array.

**Files to modify:**
- `app/(main)/recording.tsx` — Replace hardcoded `PROMPTS` array with `promptsService.getNextPrompt(profileId, childAgeMonths)`, log shown prompts

**Reuse:** `services/prompts.service.ts` (already has `getNextPrompt()` and `recordPromptShown()`)

**Verify:** Different prompts each session, age-appropriate, no immediate repeats (check `prompt_history` table).

---

### Chunk 15: Soft Delete, Recently Deleted & Auto-Purge

**What:** Deleted entries go to Recently Deleted for 30 days, then auto-purge.

**Files to modify:**
- `app/(main)/settings.tsx` — Wire Recently Deleted: fetch via `entriesService.getDeleted()`, restore/permanent delete

**Files to create:**
- `supabase/functions/purge-deleted/index.ts` — Edge function: hard-delete entries where `deleted_at < now() - 30 days`, clean up storage audio. Runs daily via cron.

**Verify:** Delete → appears in Recently Deleted. Restore → back on Home. Permanent delete → gone. Auto-purge works.

---

### Chunk 16: Location Capture & Edge Cases

**What:** Location auto-captures when recording. All edge cases handled.

**Files to modify:**
- `app/(main)/recording.tsx` — Use `useLocation` hook to capture `locationText`, pass to entry creation
- `app/(main)/entry-detail.tsx` — Wire location edit to `entriesService.update()`

**Edge cases to handle:**
- Mic denied mid-recording → graceful error
- Empty audio (0 seconds) → "Recording too short" message, don't create entry
- Transcription failure → save audio anyway, show "edit text manually"
- Network failure during save → error with retry button

**Reuse:** `hooks/useLocation.ts` (already has permission check + reverse geocoding)

**Verify:** Entry shows auto-detected location. Edit location → saves. Edge cases show appropriate messages.

---

## Future Phases (High-Level Outline)

These will be planned in detail when we get there:

| Phase | What | Chunks |
|-------|------|--------|
| 6: Search & Favorites | Inline search on Home (search bar + filter chips above timeline), Firefly Jar screen, cross-screen navigation sync | ~3 chunks |
| 7: Notifications | Local scheduled notifications, personalized prompts, backoff logic | ~3 chunks |
| 8: Subscription | RevenueCat, paywall with 7-day grace period, post-trial locking | ~3 chunks |
| 9: Analytics & Delight | DEFERRED — PostHog, celebrations, age stamps (post-launch) | ~4 chunks |
| 10: Pre-Launch | Accessibility audit, performance, assets, COPPA, data export, TestFlight | ~5 chunks |

**Design change note:** The dedicated search screen (`app/(main)/search.tsx`) will be replaced with an inline search bar on the Home tab. Tapping the search icon reveals a search bar + filter chips above the timeline. Results replace the normal feed. Closing search returns to the full timeline. This simplifies navigation — one fewer screen to maintain.

---

## Critical Files

| File | Role | Touched In |
|------|------|-----------|
| `stores/authStore.ts` | Auth state, session, profile | Chunks 1-2 |
| `app/(main)/entry-detail.tsx` | Heaviest refactor — all entry CRUD | Chunks 10, 12, 13, 16 |
| `app/(main)/recording.tsx` | Voice recording + speech recognition | Chunks 9, 13, 14, 16 |
| `app/(main)/home.tsx` | Real data, remove seed, loading states | Chunk 6 |
| `stores/childrenStore.ts` | Supabase sync + mapper | Chunks 4, 6 |
| `stores/entriesStore.ts` | Supabase sync + mapper | Chunks 6, 10 |
| `app/(onboarding)/index.tsx` | Sign-in wiring | Chunk 3 |
| `app/(main)/settings.tsx` | Children CRUD, sign out, recently deleted | Chunks 7, 15 |

## Risks

1. **Apple Developer account** — Enroll early (24-48hr approval), needed for Apple Sign In + TestFlight
2. **OAuth provider config** — Manual setup in Apple/Google/Supabase portals before Chunk 3
3. **`handle_new_user` trigger** — Test in Supabase SQL editor before writing frontend code
4. **Custom dev client** — After Chunk 8, Expo Go no longer works. Normal, but changes workflow
5. **On-device speech quality** — Varies by device age; acceptable for MVP

## Verification: End-to-End After Phase 5

After completing all 16 chunks, this flow should work:
1. Fresh install → Sign in (Apple/Google/Email) → Add child → Complete onboarding → Land on Home
2. Tap mic → Record memory → See live transcript → Stop → Entry Detail with transcript + audio
3. Auto-detected children and tags appear on the entry
4. Play back the audio → Edit transcript → Change date → Toggle favorite
5. "Or write instead" → Type a memory → Saves as text entry
6. Delete entry → Appears in Recently Deleted → Restore or permanently delete
7. Sign out → Sign back in → All data still there
