# Core Memories — MVP Project Plan (v2)

High-level execution roadmap from wireframes to shipped app. For detailed specs, see [Product Spec](product-spec.md), [App Workflow](../design/app-workflow.md), and [Design Style Guide](../design/design-style.md).

---

## Before You Start

- [ ] Enroll in **Apple Developer Program** ($99/yr) — approval takes 24-48 hours
- [ ] Install **Xcode** (required even with Expo)
- [ ] Install **EAS CLI** (`npm install -g eas-cli`)
- [ ] Have a **physical iPhone** available — Simulator can't do voice recording, social auth, or notifications
- [ ] Expo Go won't work for this app — speech recognition requires a custom dev client (`npx expo prebuild`). This is standard.

---

## Phase 1: Scaffolding

App launches, builds on device, navigation between all screens.

- [ ] Init Expo project with TypeScript
- [ ] Configure NativeWind + design tokens from `docs/design/design-style.md` (colors, typography, shadows, radii)
- [ ] Set up React Navigation with screen structure matching wireframe (8 onboarding + 7 main + 1 edge case)
- [ ] Set up Zustand stores (auth, children, entries, ui)
- [ ] Environment variables for all service keys — never hardcode
- [ ] Verify build on Simulator + physical device

---

## Phase 2: Static Screens

Every wireframed screen is a real component with hardcoded data. Tappable prototype on device.

Build in this order (core loop first):
- [ ] Home screen (timeline feed, child tabs, single-child variant, first-entry celebration state, record button + "or write instead")
- [ ] Recording screen (prompt cards with shuffle, breathing circle visualization, 60s timer, auto-stop)
- [ ] Entry Detail view (always-stacked metadata, ×/+ child pills with inline toggle picker, swap mode on last pill, tag row + tag editor, transcript area with paper texture, audio playback bar, heart toggle, delete with confirmation dialog, post-recording banner)
- [ ] Core Memories screen (warm gradient background, serif title, memory count, larger serif cards, inline audio play with stopPropagation, empty state with "Browse your entries" CTA)
- [ ] Search screen (auto-focus input, child/tag/date filter chips, date range presets, highlighted results, no-results empty state)
- [ ] Settings screen (children list, reminder time, subscription, Recently Deleted with accent border, data export, account deletion, about/legal)
- [ ] Push notification mockup (personalized child name + age prompt, Record + Remind Me Later buttons, warm gradient)
- [ ] Empty state (warm radial gradient, prompt card, pulsing mic, "or write instead")
- [ ] Onboarding flow — all 8 screens:
  1. Sign In (Apple + Google + Email, legal links)
  2. Add Child (name required, inline scroll wheel birthday picker, nickname optional, multi-child pill loop)
  3. Mic Permission (pre-permission primer)
  4. Notifications (time picker with 8:30 PM default, "gentle nudge" framing)
  5. First Recording (personalized prompt with child name, pulsing mic)
  6. First Memory — Text (serif text area, child pre-populated)
  7. Memory Saved (heart animation, child name, "kept forever")
  8. Paywall (annual/monthly with annual pre-selected, 7-day trial, dismiss button, restore purchase)

Every screen handles empty, loading, and error states from the start.

---

## Phase 3: Supabase Backend

Database, auth, and storage are live.

- [ ] Create `core-memories-dev` and `core-memories-prod` Supabase projects
- [ ] Design schema via Supabase CLI migrations (users, children, entries, entry_children, tags, entry_tags)
- [ ] RLS on every table before inserting any data
- [ ] Database indexes on `user_id`, `child_id`, `created_at`, full-text search, compound `(user_id, created_at)`
- [ ] Configure auth (Apple Sign-In + Google + email)
- [ ] Set up Storage bucket for audio files
- [ ] Abstract storage behind a service layer

> Apple Sign-In is mandatory if you offer any social login — App Store requirement.

---

## Phase 4: Core Loop

Record → transcribe → save → browse → search → playback works end-to-end.

### 4a. Auth
- [ ] Sign in / sign up connected to Supabase
- [ ] Protected routes (unauth → onboarding, auth → home)

### 4b. Child Profiles
- [ ] CRUD child profiles with name (required), birthday (required), nickname (optional)
- [ ] Auto-assign child colors from palette (Blue, Amber, Green, Plum, Teal, Rose)
- [ ] Display as tabs on Home (or warm pill for single-child)

### 4c. Voice Recording + Transcription
- [ ] `expo-speech-recognition` with `persist: true` + `requiresOnDeviceRecognition: true`
- [ ] Real-time partial transcript, breathing circle visualization, timer
- [ ] 60-second auto-stop (hard stop for MVP — "Keep Going" extension deferred to V2 based on user data)
- [ ] Recording → directly to Entry Detail (no child-select step)
- [ ] Edge cases: mic denied, empty audio, transcription failure

### 4d. Saving Entries
- [ ] Save transcript + upload audio to Supabase Storage
- [ ] Auto-detect child names/nicknames from transcript → pre-fill child pills on Detail
- [ ] Auto-apply topic tags (keyword matching for MVP)
- [ ] Date picker for backdating (in-app path only; notification path defaults to today)
- [ ] Soft delete with 30-day recovery (Recently Deleted in Settings)

### 4e. Text Entry
- [ ] "Or write instead" opens blank Entry Detail (no audio, just text editor + child picker)
- [ ] Same save flow minus audio

### 4f. Entry Detail
- [ ] Always-stacked metadata: date/time (line 1), child pills with ×/+ (line 2), ages (line 3)
- [ ] Inline child picker: toggle pills, multi-select, tap-outside-to-close, zero-child protection
- [ ] Swap mode: × on last pill opens picker in swap mode instead of removing
- [ ] Auto-detect hint for low-confidence multi-child entries
- [ ] Tag row with add/remove + tag editor panel (text input + frequent tags)
- [ ] Editable transcript (Georgia serif, paper texture, auto-save)
- [ ] Audio playback bar (play/pause + scrub, hidden for text-only entries)
- [ ] Heart toggle (Core Memory favorite)
- [ ] Post-recording "Memory saved" banner (auto-dismiss with fade + collapse)

### 4g. Core Memories Screen
- [ ] Warm gradient background, serif title, memory count
- [ ] Child tab filters
- [ ] Larger cards with serif preview (3 lines), amber glow border
- [ ] Inline audio play on cards (stopPropagation — plays without navigating to Detail)
- [ ] Empty state with "Browse your entries" CTA → Home

### 4h. Search
- [ ] Full-text keyword search with child/tag/date filters
- [ ] Date range presets (Last 7 days, Last month, Last 3 months, Custom)
- [ ] Result cards with highlighted matches
- [ ] Warm empty state for no results

---

## Phase 5: Notifications & Prompts

Daily habit loop.

- [ ] Local scheduled notifications (Expo Notifications)
- [ ] Personalized prompt with child name + age (e.g., "What made Emma smile today?" / "She's 2 years, 4 months old — these days go fast.")
- [ ] "Record" action → Recording screen; "Remind Me Later" → 30-minute snooze
- [ ] Tapping notification body → Home screen
- [ ] Prompt cards on Recording screen from static pool, shuffled by child age range
- [ ] Notification time configurable in Settings

---

## Phase 6: Subscription & Paywall

Trial → paid conversion.

- [ ] RevenueCat integration
- [ ] Paywall after first recording in onboarding (annual pre-selected, 7-day trial, dismiss button)
- [ ] Post-trial paywall (entries visible but locked) *(see Product Spec §5)*
- [ ] Subscription status in Settings
- [ ] Apply for Apple Small Business Program (15% commission vs. 30%) before first sale

---

## Phase 7: Analytics & Delight

Measure what matters. Add warmth.

- [ ] PostHog events as you build each feature — don't defer
- [ ] Key funnel: install → account → first child → first entry → day 7 → converted
- [ ] First Entry Celebration — Home first-entry state (banner + glowing card) *(see Product Spec §4b)*
- [ ] Memory Saved screen in onboarding (heart animation, "kept forever")
- [ ] First Memory Marker badge per child
- [ ] Age stamps on entries (auto-calculated from child birthday)
- [ ] Track: 60-second cap hit rate, voice vs. text ratio, Core Memories usage, notification tap-through rate

---

## Phase 8: Pre-Launch

App Store ready.

- [ ] Accessibility audit (labels, touch targets ≥44pt, contrast ≥4.5:1, Dynamic Type)
- [ ] Performance targets (cold start <2s, transcription <5s, first entry <90s from install)
- [ ] App icon, splash screen, App Store screenshots
- [ ] Privacy policy + terms of service (Termly or iubenda)
- [ ] COPPA compliance review *(see Product Spec §8)*
- [ ] App Store listing (name, subtitle, keywords, category: Lifestyle — NOT Kids)
- [ ] TestFlight beta with 15-25 real parents → feedback → fixes → App Store submission

---

## Milestones

| # | Milestone | What you can show |
|---|-----------|-------------------|
| M1 | Skeleton | App launches, tap between all 16 screens (8 onboarding + 7 main + empty state) |
| M2 | Looks real | Screens match wireframes — design tokens, paper texture, Georgia serif, warm palette |
| M3 | Auth works | Sign in, create child with birthday picker, see empty Home |
| M4 | Can record | Voice recording, breathing circle, 60s auto-stop, transcript on Detail |
| M5 | Core loop | Record → auto-detect child → save → browse → search → playback |
| M6 | Favorites | Core Memories screen with elevated cards, inline audio play |
| M7 | Habit loop | Personalized notifications with child name + age drive daily recording |
| M8 | Money works | Trial → paywall → subscribe via RevenueCat |
| M9 | Beta | TestFlight in real parents' hands |
| M10 | Ship | App Store submission |

---

## Cost at Launch

| Service | Free Tier | Upgrade Trigger | Paid |
|---|---|---|---|
| Apple Developer | — | Day 1 | $99/yr |
| Supabase | 500MB DB, 1GB storage | ~500 users | $25/mo |
| RevenueCat | Up to $2,500/mo revenue | $2,500+ | % of MTR |
| PostHog | 1M events/mo | 1M+ | Usage-based |
| EAS Build | 30 builds/mo | Need more | $15/mo |

Total at launch: **~$99/year** (just Apple Developer).