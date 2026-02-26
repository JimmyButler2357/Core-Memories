# Core Memories — Front-End Build Plan

For AI implementation. Each chunk is a discrete unit of work. Complete them in order — each chunk depends on the ones before it. Reference docs are in `/docs/design/` and `/docs/product/` — read them before starting each chunk.

---

## Chunk 0: Project Scaffolding

**Goal:** Expo project boots on device/simulator with TypeScript. No UI yet.

**Steps:**
1. Run `npx create-expo-app@latest Core-Memories --template blank-typescript` (or init in the existing repo root)
2. Install dependencies:
   ```
   npx expo install expo-router expo-linking expo-constants expo-status-bar
   npx expo install react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context
   npx expo install @react-native-async-storage/async-storage
   npm install zustand
   ```
3. Configure `app.json`: name "Core Memories", slug "core-memories", scheme "core-memories", iOS bundleIdentifier `com.corememories.app`, platforms `["ios"]`
4. Set up Expo Router file-based routing in `app/` directory
5. Create `tsconfig.json` with strict mode
6. Verify the app launches with a placeholder "Hello" screen

**Output:** Running app with a single placeholder screen. File-based routing working.

**Key files created:**
- `app.json`
- `tsconfig.json`
- `app/_layout.tsx` (root layout)
- `app/index.tsx` (placeholder)
- `package.json` (with all deps)

---

## Chunk 1: Theme & Design Tokens

**Goal:** Every color, font size, shadow, radius, and spacing value from the design system is available as importable constants. No components yet — just the token layer.

**Reference:** Read `/docs/design/design-style.md` in full before starting this chunk. Every value below comes from that document.

**Steps:**
1. Create `constants/theme.ts` exporting a `colors` object:
   ```ts
   export const colors = {
     bg: '#FAF8F5',
     card: '#FFFFFF',
     text: '#2C2420',
     textSoft: '#8C7E74',
     textMuted: '#B5AAA0',
     accent: '#E8724A',
     accentSoft: '#FFF0EB',
     accentGlow: 'rgba(232,114,74,0.12)',
     border: '#EDE8E3',
     tag: '#F3EDE8',
     danger: '#D94F4F',
     overlay: 'rgba(44,36,32,0.45)',
     general: '#B5AAA0',
   } as const;
   ```

2. Export `childColors` array (assigned in order as children are added):
   ```ts
   export const childColors = [
     { name: 'Blue', hex: '#7BAFD4' },
     { name: 'Amber', hex: '#D4A07B' },
     { name: 'Green', hex: '#9BC49B' },
     { name: 'Plum', hex: '#B88BB4' },
     { name: 'Teal', hex: '#6BB5A8' },
     { name: 'Rose', hex: '#D48B8B' },
   ] as const;
   ```
   Include a helper: `childColorWithOpacity(hex: string, opacity: number): string` that returns `rgba(...)`.

3. Export `typography` object. Two font families only:
   - `serif: 'Georgia'` (app title, transcript body, prompt cards, onboarding headings, Core Memories title)
   - `sans: undefined` (system default — used for everything else: UI chrome, labels, buttons, tags, metadata)

   Type scale as named presets:
   ```ts
   export const typography = {
     appTitleLarge: { fontFamily: 'Georgia', fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
     appTitle: { fontFamily: 'Georgia', fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5 },
     onboardingHeading: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '700' as const },
     sectionHeading: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '700' as const },
     promptCard: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '500' as const, lineHeight: 27 },
     coreMemoriesTitle: { fontFamily: 'Georgia', fontSize: 17, fontWeight: '700' as const, letterSpacing: 0.3 },
     screenTitle: { fontSize: 16, fontWeight: '700' as const },
     transcript: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '400' as const, lineHeight: 24.75 },
     coreMemoriesPreview: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
     entryPreview: { fontSize: 14.5, fontWeight: '450' as const, lineHeight: 22.5 },
     formLabel: { fontSize: 14, fontWeight: '500' as const },
     pillLabel: { fontSize: 13, fontWeight: '700' as const },
     tabLabel: { fontSize: 13, fontWeight: '600' as const },
     buttonLabel: { fontSize: 15, fontWeight: '700' as const },
     timestamp: { fontSize: 12, fontWeight: '500' as const },
     tag: { fontSize: 11, fontWeight: '500' as const },
     caption: { fontSize: 11, fontWeight: '500' as const },
     cardMeta: { fontSize: 10, fontWeight: '600' as const },
   } as const;
   ```

4. Export `shadows` (all use warm brown base `rgba(44,36,32,...)`, never black):
   ```ts
   export const shadows = {
     cardSubtle: { shadowColor: '#2C2420', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
     tabInactive: { shadowColor: '#2C2420', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
     promptCard: { shadowColor: '#2C2420', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
     micButtonHome: { shadowColor: '#E8724A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 4 },
     modal: { shadowColor: '#2C2420', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 8 },
   } as const;
   ```

5. Export `radii`:
   ```ts
   export const radii = {
     pill: 20,
     cardLg: 16,
     card: 14,
     button: 12,
     input: 10,
     tag: 8,
   } as const;
   ```

6. Export `spacing` — a function or object for the 4px grid:
   ```ts
   export const spacing = (n: number) => n * 4; // spacing(1)=4, spacing(2)=8, etc.
   ```

**Output:** A single `constants/theme.ts` file that every future component imports from. No hardcoded hex values anywhere else in the app — ever.

---

## Chunk 2: Shared Components

**Goal:** Reusable primitives that appear on multiple screens. Built with hardcoded/mock data. Each component is a standalone file that imports only from `constants/theme.ts`.

**Reference:** `/docs/design/design-style.md` → "Component Patterns" section for exact specs.

Build these components in `components/`:

### 2a. `PaperTexture.tsx`
An SVG noise overlay component. Renders a subtle fractal noise pattern at 2.5% opacity. Used as a background layer inside cards and text areas. On React Native, implement as a semi-transparent SVG using `react-native-svg` or as a static image asset. If SVG noise generation isn't practical on RN, use a pre-rendered PNG noise tile at 2.5% opacity, tiled.

### 2b. `PrimaryButton.tsx`
Props: `label: string`, `onPress: () => void`, `disabled?: boolean`, `variant?: 'accent' | 'danger'`
- Full-width, `accent` background (or `border` when disabled)
- White text (or `textMuted` when disabled)
- 15px vertical padding, `radii.button` (12px) border radius
- `typography.buttonLabel` text style
- No border

### 2c. `ChildPill.tsx`
Props: `name: string`, `color: string`, `onRemove?: () => void`, `showRemove?: boolean`
- 8px colored circle + name in `pillLabel` style at child's full color
- Background: child color at 12% opacity
- `radii.pill` (20px) border radius
- If `showRemove`, render × icon (11px, 60% opacity) on the right
- Padding: 5px 12px

### 2d. `ChildTab.tsx`
Props: `label: string`, `color: string`, `active: boolean`, `onPress: () => void`
- Padding: 7px 14px, border radius `radii.pill` (20px)
- Active: 2px solid `color`, background `color` at 12% opacity, text in `color`, shadow `0 2px 8px color@18%`
- Inactive: 2px solid transparent, white background, text `textMuted`, `shadows.tabInactive`
- "All" tab uses `colors.general` (#B5AAA0)

### 2e. `TagPill.tsx`
Props: `label: string`, `onRemove?: () => void`
- Background: `colors.tag`, text `colors.textSoft`, `typography.tag`, `radii.tag` (8px)
- Padding: 2px 8px
- Optional × for removal

### 2f. `EntryCard.tsx`
Props: `entry: { childNames: string[], childColors: string[], date: string, time: string, preview: string, tags: string[], isFavorited: boolean, hasAudio: boolean }`, `onPress: () => void`, `variant?: 'home' | 'coreMemory'`

**Home variant (default):**
- White background with paper texture overlay
- 1px `border` border, `radii.card` (14px), `shadows.cardSubtle`
- Content: colored dot (8px) + child name for each child, date + time in `cardMeta`, then 2-line transcript preview in `entryPreview` (system sans, 14.5px, line-clamp 2)
- Favorited: border changes to `accent` at 25% opacity, add accent glow shadow, show filled heart icon
- `fadeInUp` entrance animation with stagger (index × 60ms delay)

**Core Memory variant:**
- `radii.cardLg` (16px), warmer shadow, `accent` border at 20% opacity
- Preview: Georgia serif, 15px, 3 lines (not 2)
- Includes inline audio play button at bottom (26px accent-tinted circle)
- Play button area uses `stopPropagation` — tap plays audio without navigating

### 2g. `ConfirmationDialog.tsx`
Props: `visible: boolean`, `title: string`, `body: string`, `confirmLabel: string`, `onConfirm: () => void`, `onCancel: () => void`, `variant?: 'danger' | 'default'`
- Full-screen overlay with `colors.overlay` backdrop
- Centered card: white, 18px radius, `shadows.modal`
- Title: 16px, weight 700. Body: 14px, `textSoft`, line-height 1.5
- Two buttons: Cancel (tag background, textSoft text) and confirm (accent or danger, white text)

### 2h. `TopBar.tsx`
Props: `title?: string`, `showBack?: boolean`, `onBack?: () => void`, `rightIcons?: Array<{ icon: string, onPress: () => void }>`, `titleStyle?: 'serif' | 'sans'`
- Left: optional back arrow (minimum 44×44 touch target)
- Center or left: title text
- Right: icon buttons (search, heart, gear — passed in as props)
- `serif` title uses Georgia; `sans` uses system default

### 2i. `MicButton.tsx`
Props: `size: 'large' | 'home'`, `onPress: () => void`, `pulsing?: boolean`
- Large: 96×96px, accent background, white mic icon
- Home: 68×68px, accent background, white mic icon, `shadows.micButtonHome`
- When `pulsing`: animate shadow between 20px and 40px spread at accent color (use `react-native-reanimated`)

**Output:** 9 component files in `components/`, each self-contained. Import from `constants/theme.ts` only. All render with hardcoded/mock props in isolation.

---

## Chunk 3: Navigation Shell

**Goal:** All 16 screens exist as files with placeholder content. You can tap between every screen. No real UI yet — just the routing skeleton.

**Steps:**
1. Set up Expo Router file-based navigation in `app/`:
   ```
   app/
     _layout.tsx          ← Root layout (decides onboarding vs main)
     (onboarding)/
       _layout.tsx        ← Stack navigator, no header
       sign-in.tsx
       add-child.tsx
       mic-permission.tsx
       notifications.tsx
       first-recording.tsx
       first-memory-text.tsx
       memory-saved.tsx
       paywall.tsx
     (main)/
       _layout.tsx        ← Stack navigator, no header (NOT tabs — Home is the hub, everything else is pushed onto the stack)
       home.tsx
       recording.tsx
       entry-detail.tsx
       search.tsx
       core-memories.tsx
       settings.tsx
       empty-state.tsx
   ```

2. Root `_layout.tsx`: For now, use a simple flag (`hasCompletedOnboarding`) to decide which group to show. Default to onboarding. Store flag in AsyncStorage via Zustand.

3. Each screen file: Render a centered `<Text>` with the screen name and navigation buttons to adjacent screens. Use the navigation map from `app-workflow.md` → "Navigation Map" section.

4. Create Zustand stores in `stores/`:
   - `stores/authStore.ts` — `{ hasCompletedOnboarding: boolean, setOnboarded: () => void }`
   - `stores/childrenStore.ts` — `{ children: Child[], addChild, removeChild }` with `Child = { id, name, birthday, nickname?, colorIndex }`
   - `stores/entriesStore.ts` — `{ entries: Entry[], addEntry, deleteEntry, toggleFavorite }` with `Entry = { id, text, date, childIds, tags, isFavorited, hasAudio, audioUri? }`
   - `stores/uiStore.ts` — `{ activeChildFilter: string | null }`

   All stores use Zustand with AsyncStorage persistence via `zustand/middleware`.

**Output:** Tap through all 16 screens in order. Onboarding flows linearly (Sign In → Add Child → ... → Paywall → Home). Main app navigates hub-and-spoke from Home. Zustand stores exist with typed interfaces.

---

## Chunk 4: Onboarding — Sign In + Add Child

**Goal:** First two onboarding screens fully styled to spec with all interactions working (against local Zustand, not real auth).

**Reference:** `/docs/design/app-workflow.md` → "1. Sign In" and "2. Add Child" sections.

### Screen: Sign In (`app/(onboarding)/sign-in.tsx`)

**Layout (top to bottom):**
- Screen background: `colors.bg`
- Upper half: "Core Memories" in `typography.appTitleLarge` (Georgia, 28px, 800 weight, -0.5 letter-spacing). Below it: "You'll never forget the little things." in 15px, 400 weight
- Lower area: Three stacked auth buttons with 12px gap:
  1. "Continue with Apple" — black background, white text, Apple logo
  2. "Continue with Google" — white background with border, dark text, Google logo
  3. "Continue with Email" — `colors.tag` background, `colors.text`
- Below buttons: "Terms of Service" and "Privacy Policy" links in 12px `textMuted`

**Behavior:** All three buttons navigate to `add-child` for now. No real auth in this chunk.

### Screen: Add Child (`app/(onboarding)/add-child.tsx`)

This is the most complex onboarding screen. Read the spec carefully.

**Layout:**
- Dynamic heading:
  - Before any name entered: "Who are we remembering?" (Georgia, `sectionHeading`)
  - Once name typed: "Let's start [name]'s memory book."
  - After 1+ child added: "Anyone else?"
- Previously added children shown as `ChildPill` components above the form
- Form card (white background, paper texture, `radii.card`, `shadows.cardSubtle`):
  - Name input (Georgia serif, 16px) — required
  - Birthday row — tapping expands the inline birthday picker (see below) — required
  - Nickname input (system sans, 14px) — optional, placeholder "Used for voice auto-detection"
- Primary button below card:
  - Disabled until name AND birthday provided
  - Label changes: "Enter a name to continue" → "Add a birthday to continue" → "Add [name]"
  - After 1+ child exists: "Add [name] & continue" (if form filled) or "Continue" (if form empty)
- After 1+ child: "Add another child" link below button (loops to empty form)

**Birthday Picker (inline, expands within the card):**
- Three scroll-wheel columns: Month (35%), Day (25%), Year (30%)
- Column height: 120px, overflow hidden
- Each row: 40px height, centered
- Selected row: Georgia serif, 16px, 700 weight, `accentSoft` highlight band behind it (40px tall, 10px radius)
- Unselected: 14px, 400 weight, `textMuted`
- Fade edges at top/bottom of each column (linear gradient from white → transparent, 36px)
- "Set birthday" confirm button below wheels
- After confirming: row shows formatted date with accent checkmark + "change" link to reopen

**Child color assignment:** Auto-assign from `childColors` array in order. First child = Blue, second = Amber, etc.

**Data flow:** `addChild()` in `childrenStore`. Navigate to `mic-permission` on continue.

**Output:** Two fully styled, interactive screens. Children get added to Zustand store with auto-assigned colors. Birthday picker works with scroll wheels.

---

## Chunk 5: Onboarding — Permissions Through Paywall

**Goal:** Remaining 6 onboarding screens fully styled. The complete onboarding flow works end-to-end.

**Reference:** `/docs/design/app-workflow.md` → Screens 3–8.

### Screen: Mic Permission (`mic-permission.tsx`)
- Centered: large mic icon, heading "One tap to capture a memory" (Georgia, `sectionHeading`), body text about privacy, "Allow microphone" button
- Button navigates to `notifications` (no real permission request in this chunk — that comes with backend integration)

### Screen: Notifications (`notifications.tsx`)
- Centered: bell icon, heading "A gentle nudge at bedtime." (Georgia, `sectionHeading`)
- Scrollable time list: 30-minute increments from 7:00 PM to 10:00 PM, default 8:30 PM selected
- "Set reminder" `PrimaryButton` and "Not now" link below
- Both navigate to `first-recording`

### Screen: First Recording (`first-recording.tsx`)
- Warm radial gradient backdrop: `radial-gradient(ellipse at 50% 40%, rgba(244,226,214,0.45) 0%, transparent 70%)`
- Personalized prompt card (paper texture): "What's something [child name] did recently that you don't want to forget?" — use first child's name from store
- `MicButton` size="large" with pulsing glow
- "or write instead" link below → navigates to `first-memory-text`
- Tapping mic: for this chunk, just navigate to `memory-saved` (no real recording yet)

### Screen: First Memory Text (`first-memory-text.tsx`)
- Back arrow → return to `first-recording`
- Child pill pre-populated from first child in store
- Georgia serif text area, placeholder "Start typing your memory..."
- Save button (disabled until text entered) → navigates to `memory-saved`
- On save: create a mock entry in `entriesStore`

### Screen: Memory Saved (`memory-saved.tsx`)
- **Intentionally minimal.** Centered content only:
  - Heart icon with scale-in animation (`scaleIn` keyframes via Reanimated)
  - "[Child name]'s first memory, saved." in Georgia serif
  - "Your voice and your words — kept forever." below
  - "Keep going" `PrimaryButton` → navigates to `paywall`
- Do NOT add anything else to this screen. The restraint is the design.

### Screen: Paywall (`paywall.tsx`)
- X/dismiss button top-right (navigates to Home — no dark patterns)
- Heading "Keep every memory safe." (Georgia, `onboardingHeading`)
- Three value props with icons (use simple RN vector icons or unicode):
  1. Unlimited voice & text memories
  2. Recordings preserved forever
  3. Search, organize, relive anytime
- Two pricing cards side by side:
  - Monthly: "$5.99/mo"
  - Annual: "$49.99/yr" with "$4.17/mo" subtitle and "Save 30%" badge — **pre-selected** (accent border)
- "Start your free trial" `PrimaryButton`
- "7-day free trial" messaging with calculated end date (today + 7 days)
- "Already subscribed? Restore purchase" link at bottom in `textMuted`
- All buttons navigate to Home and set `hasCompletedOnboarding: true` in authStore

**Output:** Complete onboarding flow. User can tap from Sign In through Paywall to Home. A mock entry exists in the store after first recording/text step.

---

## Chunk 6: Home Screen

**Goal:** The main hub screen, fully styled with all three states, using mock data from Zustand stores.

**Reference:** `/docs/design/app-workflow.md` → "1. Home Screen" and `/docs/design/design-style.md` → "Entry Cards (Home)" and "Child Tabs".

### Layout (top to bottom):

**Top bar** (using `TopBar` component):
- Left: "Core Memories" in Georgia serif (`typography.appTitle`)
- Right: Search pill (bordered capsule with magnifying glass + "Search" text), heart icon (→ Core Memories), gear icon (→ Settings)
- In first-entry state: hide search and heart icons

**Child area** — adapts based on child count:
- **Multi-child (2+ children):** Horizontal `ScrollView` of `ChildTab` components. "All" tab first (default active), then one per child. Filtering changes which entries show.
- **Single-child:** No tabs. Instead, a warm pill showing child name, age, and memory count.

**Entry list:**
- `FlatList` of `EntryCard` components, variant="home", reverse-chronological
- `fadeInUp` staggered entrance (each card delayed by `index * 60ms`)
- Filter by active child tab

**Bottom area:**
- Gradient fade overlay at bottom of entry list (linear gradient from `bg` at 0% opacity → `bg` at 100%)
- `MicButton` size="home" (68px) centered → navigates to Recording
- "or write instead" link with pencil icon below → navigates to Entry Detail (new blank entry)

### States:

**First-entry state** (show when exactly 1 entry exists and `hasCompletedOnboarding` was just set):
- Gradient banner: sparkle + "Your first memory is saved" with body text
- Single child info row
- One entry card with warm glow border
- Search and Core Memories icons hidden in top bar

**Multi-child state:** Default after first-entry is dismissed. Tabs + full entry list.

**Single-child state:** Warm pill instead of tabs.

**Seed data:** Pre-populate `entriesStore` with 5 mock entries matching the data in `wireframe-review.jsx` (lines 18–24) for development/testing. Pre-populate `childrenStore` with Emma (Blue), Liam (Amber), Nora (Green).

**Output:** Fully interactive Home screen. Tapping child tabs filters entries. Tapping cards, mic, search, heart, gear all navigate correctly.

---

## Chunk 7: Recording Screen

**Goal:** The voice capture screen with prompt cards, mic button animation, and recording state — all visual, no real audio yet.

**Reference:** `/docs/design/app-workflow.md` → "3. Recording Screen".

### Layout:

**Top bar:** Cancel/X button on left only → navigates back to Home. Nothing else.

**Prompt cards** (pre-recording state):
- Vertically stacked cards, each showing one prompt from a static bank
- Georgia serif, 18px, 500 weight, 1.5 line-height
- Paper texture background, `radii.card`, `shadows.promptCard`
- Prompts drawn from bank of 20–30 curated by child age range (for now, use the prompts from `wireframe-review.jsx` line 27 plus extras — hardcode a list of ~15 prompts)
- Cards are read-only inspiration — tapping does NOT start recording

**Mic button:** `MicButton` size="large" (96px) centered below prompts, pulsing glow animation, warm radial gradient backdrop behind it

**Recording state** (after mic tap):
- Prompt cards fade out (animated opacity → 0)
- Mic button transforms to a stop button (square icon)
- Breathing circle visualization appears: gentle scale animation 1 → 1.15 → 1 (`breathe` keyframes), with expanding ring pulse behind it (`ringPulse`)
- Timer counts up from 0:00 toward 1:00
- At 60 seconds: auto-stop → navigate to Entry Detail

**After stop (manual or auto):**
- Navigate to Entry Detail screen with a mock transcript pre-filled
- Pass a flag indicating this is a new-from-recording entry (triggers "Memory saved" banner and auto-detect hint on Detail)

**Two states to track:** `'prompts'` (pre-recording) and `'recording'` (active). Use local component state.

**Output:** Tappable prompt cards visible. Mic button starts "recording" with breathing animation and timer. Stop or 60-second auto-stop navigates to Entry Detail.

---

## Chunk 8: Entry Detail Screen

**Goal:** The most complex screen in the app. View, edit, and enrich a single journal entry. All panels and interactions working against local Zustand state.

**Reference:** `/docs/design/app-workflow.md` → "4. Entry Detail / Editor Screen". Read the full section — every paragraph matters.

This chunk has sub-parts. Implement them in order within the same screen file.

### 8a. Base Layout

**Top bar:**
- Back arrow (left) → returns to previous screen (use `router.back()`)
- Heart toggle (right) → calls `toggleFavorite` in store. Filled = favorited (accent color), empty = outline
- Delete/trash icon (right) → opens confirmation dialog

**Post-recording banner** (only when arriving from Recording):
- "Memory saved" with heart icon, warm accent background
- Auto-dismiss: visible 3 seconds → fade out (opacity 0.4s) → collapse (height 0.3s) → gone
- Use Reanimated for the multi-phase animation

### 8b. Metadata Block (always stacked — 3 lines)

**Line 1:** Date in bold (e.g., "Tuesday, Feb 18") and time in `textMuted` (e.g., "8:47 PM")

**Line 2:** Child pills — one `ChildPill` per child with `showRemove`. Plus a `+` button (24×24, minimum 44×44 touch target) to open the child picker. Hide `+` when all children are already tagged.

**Line 3:** Age line in `textMuted` — each child's name and age at time of entry (e.g., "Emma 2y 4m · Liam 4y 1m"). Calculate from child birthday and entry date.

### 8c. Child Picker (inline panel)

Opens below the child pills when `+` is tapped.

**Add mode (default):** Shows all children as toggle pills. Selected = colored border + tinted background + checkmark. Unselected = border color, white background, `textMuted`. Multi-select — stays open. Tap outside to close (if at least 1 child selected). If 0 selected, show "Select at least one child" warning and don't close.

**Swap mode:** Triggered when × is tapped on the LAST remaining pill. Instead of removing (which would leave 0 children), open picker showing "Switch from [name]:" with toggle pills for other children. Selecting a replacement swaps the child.

Animation: `fadeInUp 0.2s ease`

### 8d. Tags Row + Tag Editor

**Tags row:** Below metadata. Small `TagPill` components with × to remove. A "+ add" link at the end.

**Tag editor panel** (opens when "+ add" tapped):
- Card with text input for custom tags
- "Your Frequent Tags" section showing commonly used tags as tappable pills
- Hardcode frequent tags: "funny", "milestone", "first", "sweet", "bedtime", "outing", "words", "siblings"
- Tapping a frequent tag adds it. Tapping an already-added tag removes it.
- Same card style as child picker (white, border, 14px radius, `fadeInUp`)

### 8e. Transcript Area

- Editable `TextInput` with `multiline`
- Georgia serif (`typography.transcript`), paper texture background, warm border
- Placeholder: "Start typing your memory..."
- Auto-save indicator: "All changes saved" in `caption` style below the text area, appears after each edit with a brief delay

### 8f. Audio Playback Bar

- Persistent at screen bottom for voice entries
- Play/pause button (36px circle, `accentSoft` background, accent play icon) + scrub bar
- For this chunk, the scrub bar is visual only (no real audio playback)
- **Hidden** for text-only entries (check `entry.hasAudio`)

### 8g. Delete Flow

- Trash icon → `ConfirmationDialog` with title "Delete this memory?", body "Deleted entries can be recovered for 30 days.", buttons Cancel / Delete (danger variant)
- Confirm → soft-delete in `entriesStore` → navigate back

**Output:** Fully interactive Entry Detail. Child picker opens/closes, tags can be added/removed, transcript is editable, heart toggles, delete works. Metadata displays correctly for any number of children.

---

## Chunk 9: Search Screen

**Goal:** Full-text search with filters. Results use the same `EntryCard` component.

**Reference:** `/docs/design/app-workflow.md` → "5. Search Screen".

### Layout:

**Top bar:** Back arrow + "Search" title centered (`typography.screenTitle`, system sans)

**Search bar:** Full-width `TextInput`, auto-focuses keyboard on mount. Placeholder: "Search your memories..."

**Filter chips** (horizontal `ScrollView` below search bar):
- Child name chips: one per child (colored, multi-select). Toggling filters results.
- Tag chips: common tags (milestone, funny, bedtime, etc.). Toggling filters results.
- Date range chip: tapping expands a preset picker below with options: "Last 7 days", "Last 30 days", "Last 3 months", "All time"

**Results:** `FlatList` of `EntryCard` variant="home". Search text highlighted in yellow (`colors.accent` at 20% opacity background) in the preview snippet. Filter by active chips AND search text.

**States:**
- Default (no query): show all entries
- Results: filtered entry cards
- No results: warm empty state — "No memories found. Try different keywords or filters." with subtle search icon

**Search logic:** Simple case-insensitive substring match against `entry.text` for MVP. Filter chips narrow by child and/or tag. Date range filters by `entry.date`.

**Output:** Working search with filters. Highlighted matches. Empty state for no results.

---

## Chunk 10: Core Memories Screen

**Goal:** The favorites screen with elevated visual treatment. Feels like a treasure box, not a filtered list.

**Reference:** `/docs/design/app-workflow.md` → "6. Core Memories Screen" and `/docs/design/design-style.md` → "Entry Cards (Core Memories)".

### Visual Distinction from Home:
- Background: warm gradient `linear-gradient(180deg, #F9F2EB 0%, #FAF8F5 35%)` — NOT flat cream
- Title: "Core Memories" in Georgia serif (`typography.coreMemoriesTitle`)
- Different card style (larger, warmer — see EntryCard Core Memory variant)

### Layout:

**Top bar:** Back arrow + "Core Memories" in Georgia serif centered. No settings or search icons.

**Memory count:** Below header, small line: filled heart icon + "X memories saved" in `caption` style

**Child tabs:** Same horizontal scrollable `ChildTab` row as Home. "All" + each child. Filters favorites.

**Entry cards:** `EntryCard` variant="coreMemory" — Georgia serif 3-line preview, amber glow border, inline audio play button. Tap play area → plays audio (visual only for now). Tap card → Entry Detail.

**States:**
- **Filled:** Showing favorited entries
- **Empty:** Georgia serif text: "Tap the heart on any entry to save it as a Core Memory." with "Browse your entries" button → navigates to Home

**Data:** Filter `entriesStore.entries` where `isFavorited === true`.

**Output:** Core Memories screen shows only favorited entries with elevated card treatment. Empty state encourages action. Child tabs filter correctly.

---

## Chunk 11: Settings Screen

**Goal:** Configuration screen with all sections. Functional against local Zustand state.

**Reference:** `/docs/design/app-workflow.md` → "7. Settings Screen".

### Layout:

**Top bar:** Back arrow + "Settings" centered (`typography.screenTitle`, system sans)

**Sections as card groups (white background, border, `radii.card`, vertical stack):**

**1. Children**
- List each child: name + "Born [formatted birthday]" (e.g., "Emma — Born Oct 15, 2023")
- Tapping opens an edit view (can be a simple modal or pushed screen with name/birthday/nickname fields)
- "+ Add Child" button at bottom (accent colored) → opens same Add Child form

**2. Reminder**
- Current time shown (e.g., "Time: 8:30 PM")
- Toggle switch for enabling/disabling
- Tapping time opens a simple time picker

**3. Subscription**
- "Plan: Core Memories Premium" (or "Free Trial — X days remaining")
- "Manage Subscription" link (no-op for now)

**4. Recently Deleted**
- Accent-tinted border on this section (stands out visually — deliberate, see spec)
- "View deleted memories" with sublabel "Entries are kept for 30 days"
- Tapping shows soft-deleted entries with restore/permanent-delete options

**5. Data & Privacy**
- "Export All Entries" row (no-op for now)
- "Delete Account" row — danger-styled (red text). Tapping shows `ConfirmationDialog`

**6. About**
- App version (hardcode "1.0.0")
- Privacy Policy link
- Terms of Service link
- Contact Support link

**Row style:** 13px vertical padding, 16px horizontal, chevron on right for navigable rows.

**Output:** All settings sections rendered. Children editable. Reminder time changeable. Recently Deleted section visually prominent. Delete account shows confirmation.

---

## Chunk 12: Empty State + Polish

**Goal:** The edge-case empty state screen, push notification mockup component, and animation polish across all screens.

### 12a. Empty State Screen (`empty-state.tsx`)

Shown when user has zero entries (all deleted or data loss).

**Reference:** `/docs/design/app-workflow.md` → "Edge Case: Empty State".

- Warm radial gradient backdrop (same as Recording screen and First Recording onboarding)
- Prompt card with paper texture, encouraging message
- `MicButton` size="large" with pulsing glow
- "or write instead" link below
- `fadeInUp` entrance animation
- Mic → Recording, write → Entry Detail (new blank)

### 12b. Push Notification Component

Not a screen — a styled component for previewing/demoing the notification design. Build as a reusable component in `components/NotificationPreview.tsx`.

- App icon (accent orange circle with mic), "Core Memories" app name, "now" timestamp
- Personalized prompt: "What made [child name] smile today?"
- Age line: "[pronoun] [age] old — these days go fast."
- Two buttons: "Record" (accent orange) and "Remind me later" (neutral)
- Warm gradient background (`#F5F0EB`)
- Frosted glass card effect

### 12c. Animation Polish

Go through every screen and verify these animations are implemented:

1. **Entry cards:** `fadeInUp` with 60ms stagger delay per card (Home, Search, Core Memories)
2. **Mic button pulse:** `pulseGlow` on Recording, First Recording, Empty State
3. **Breathing circle:** `breathe` + `ringPulse` during active recording
4. **Memory Saved heart:** `scaleIn` animation
5. **Post-recording banner:** `bannerIn` → fade → collapse sequence
6. **Inline pickers:** `fadeInUp 0.2s ease` on child picker and tag editor
7. **Screen transitions:** Use React Navigation's default slide animation for stack navigators
8. **Respect `prefers-reduced-motion`:** Check `AccessibilityInfo.isReduceMotionEnabled` — if true, skip all decorative animations (keep functional ones like navigation transitions)

### 12d. Screen State Coverage

Verify every screen handles:
- **Empty state** (no data to show)
- **Loading state** (show nothing or subtle skeleton — NOT a spinner)
- **Error state** (warm message, never blank screen)

These are requirements from `CLAUDE.md`: "Every screen must handle empty, loading, and error states — never show blank screens."

**Output:** Empty state screen works. Notification preview component exists. All animations implemented. Every screen handles empty/loading/error.

---

## Chunk Dependency Map

```
Chunk 0 (Scaffolding)
  └─► Chunk 1 (Theme)
        └─► Chunk 2 (Components)
              └─► Chunk 3 (Navigation)
                    ├─► Chunk 4 (Onboarding: Sign In + Add Child)
                    │     └─► Chunk 5 (Onboarding: Permissions → Paywall)
                    ├─► Chunk 6 (Home)
                    │     ├─► Chunk 7 (Recording)
                    │     │     └─► Chunk 8 (Entry Detail)
                    │     ├─► Chunk 9 (Search)
                    │     ├─► Chunk 10 (Core Memories)
                    │     └─► Chunk 11 (Settings)
                    └─► Chunk 12 (Empty State + Polish)
```

Chunks 4–5 (onboarding) and 6–11 (main screens) can be built in parallel after Chunk 3 is done. Chunk 12 should be last.

---

## Notes for the AI Implementer

1. **Never hardcode colors.** Always import from `constants/theme.ts`. This is enforced in `CLAUDE.md`.

2. **Read the design docs.** Before implementing each chunk, read the relevant sections of `/docs/design/design-style.md` and `/docs/design/app-workflow.md`. They contain pixel-level specs this plan intentionally doesn't duplicate.

3. **Use mock data.** Every screen should be fully interactive with hardcoded data. The backend (Supabase) comes later — these screens should work entirely against Zustand stores seeded with mock data.

4. **Touch targets.** Every tappable element must have a minimum 44×44px hit area. Small icons (20–22px) need padding to reach this minimum.

5. **4px spacing grid.** Every margin, padding, and gap must be divisible by 4.

6. **Font rule.** Georgia serif for: app title, onboarding headings, transcript body, prompt cards, Core Memories title and card previews, empty state messages. System sans for everything else.

7. **Paper texture.** Applied to: entry cards, transcript areas, prompt cards, form cards. NOT applied to: tabs, pills, buttons, settings rows.

8. **Shadows always warm.** Base color `rgba(44,36,32,...)` — never `rgba(0,0,0,...)`.

9. **The wireframe reference.** `/wireframe-review.jsx` contains a working React prototype of every screen. Use it as a visual reference for layout and data structures, but don't copy the code — it's web React, not React Native.

10. **Minimal scope.** Build exactly what's specified. Don't add features, error handling, or abstractions beyond what each chunk describes.
