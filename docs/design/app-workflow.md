# App Workflow — Forever Fireflies (v4)

Updated to reflect all wireframe iterations through v13. This document covers the complete user experience: onboarding (8 screens), core app (6 screens + 1 edge case), push notification, all screen states, navigation flows, and resolved design decisions.

---

## Screen Inventory

### Onboarding (8 screens)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Sign In | Authentication + emotional first impression |
| 2 | Add Child | Create child profiles (name, birthday required) |
| 3 | Mic Permission | Pre-permission primer before iOS system prompt |
| 4 | Notifications | Set nightly reminder time |
| 5 | First Recording | Capture first memory (voice) |
| 6 | First Memory (Text) | Alternative text entry path |
| 7 | Memory Saved | Emotional payoff — heart animation |
| 8 | Paywall | Trial conversion after experiencing value |

### Main App (6 screens + 1 edge case)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Home | Central hub — browse, search, filter, launch capture |
| 2 | Recording | Voice capture — focused, distraction-free |
| 3 | Entry Detail | View, edit, enrich a single entry |
| 4 | Firefly Jar | Curated favorites — visually elevated |
| 5 | Settings | Configuration, child management, data controls |
| 6 | Push Notification | Nightly bedtime prompt (external to app) |
| — | Empty State | Edge case when all entries deleted |

---

## Onboarding Flow

### 1. Sign In

**Purpose:** Authentication and first impression. Sets the emotional tone before any setup begins.

**Layout:** The app title "Forever Fireflies" in Merriweather serif with the tagline "You'll never forget the little things." dominates the upper half. Three auth buttons stack at the bottom: Continue with Apple (black, required by Apple for apps offering social login), Continue with Google (white with Google logo), Continue with Email (neutral). Legal links (Terms of Service, Privacy Policy) sit below the buttons in small muted text.

**Flow:** Any auth method → Add Child.

---

### 2. Add Child

**Purpose:** Create child profiles. Parents can add all their children before proceeding — building their whole family book from the start.

**Layout:** The heading is dynamic and responds to context. Before any name is entered: "Who are we remembering?" Once a name is typed: "Let's start [name]'s memory book." After at least one child is added: "Anyone else?" Previously added children appear as colored pills above the form with their name and birthday.

**Form fields** are presented inside a card with paper texture. All fields are visible upfront — no hidden expanders or progressive disclosure. The fields are: name (required, Merriweather serif input), birthday (required — gates the continue button), and nickname (optional, used for voice auto-detection from transcripts, e.g., "Bug").

**Birthday picker:** Tapping the birthday row expands an inline styled scroll wheel within the card — three columns for Month, Day, and Year. The selected row gets a warm accentSoft highlight band, with fade-to-transparent edges at the top and bottom of each column. Merriweather serif text on the values. A "Set birthday" button confirms the selection. After confirming, the row shows the formatted date with an accent checkmark and a small "change" link to reopen the picker. This inline approach was chosen over the iOS system date wheel to maintain the app's warm journal aesthetic.

**Button logic:** The primary button is disabled until both name and birthday are provided. Label changes contextually: "Enter a name to continue" → "Add a birthday to continue" → "Add [name]." After at least one child is added, the button becomes "Add [name] & continue" (or just "Continue" if the form is empty), and an "Add another child" link appears below.

**Child colors** are auto-assigned from a palette (Blue #7BAFD4, Amber #D4A07B, Green #9BC49B, Plum #B88BB4, Teal #6BB5A8, Rose #D48B8B) in order as children are added. These colors persist throughout the app for pills, tabs, and dots.

**States:**
- **Empty:** Fresh form, no children added yet.
- **Children Added:** One or more children shown as colored pills above the form, heading changes to "Anyone else?"

**Flow:** Continue → Mic Permission. "Add another child" loops back to this screen with an empty form.

---

### 3. Mic Permission

**Purpose:** Pre-permission primer. Explains *why* before iOS asks, improving grant rates.

**Layout:** Centered content — large mic icon, heading "One tap to capture a memory," body text emphasizing privacy ("Nothing is ever recorded without you pressing the button — and your recordings stay private"). A single "Allow microphone" button.

**Flow:** Allow → triggers iOS system permission prompt → Notifications. Deny → graceful fallback (text-only mode available).

---

### 4. Notifications

**Purpose:** Set up the nightly bedtime reminder that drives the journaling habit.

**Layout:** Centered content — bell icon, heading "A gentle nudge at bedtime." Time picker shows a scrollable list of times in 30-minute increments from 7:00 PM to 10:00 PM, defaulting to 8:30 PM. "Set reminder" button and a "Not now" skip link.

**Design note:** The notification is framed as a "gentle nudge," not a "notification" — the language matters for perception.

**Flow:** Set reminder or skip → First Recording.

---

### 5. First Recording

**Purpose:** The climax of onboarding — capturing the first memory. Reuses the empty state visual treatment with personalized copy.

**Layout:** Warm radial gradient backdrop. A personalized prompt card with the child's name ("What's something [child name] did recently that you don't want to forget?") styled with paper texture. A large pulsing mic button with glow animation (96px, accent color). A "or write instead" text link below. 60-second recording limit.

**Flow:** Record → Memory Saved. "Or write instead" → First Memory (Text).

---

### 6. First Memory (Text)

**Purpose:** Text alternative to voice recording during onboarding. For parents who can't or don't want to record audio at this moment.

**Layout:** Back arrow to return to the recording screen. Child pill pre-populated from onboarding setup. Merriweather serif text area for typing. Save button disabled until text is entered.

**Flow:** Save → Memory Saved.

---

### 7. Memory Saved

**Purpose:** Emotional payoff after the first recording. Acknowledges the moment without overproducing it.

**Layout:** Centered content only — heart icon with a scale-in animation, "[Child name]'s first memory, saved." in Merriweather serif, and "Your voice and your words — kept forever." below. A single "Keep going" button.

**Design note:** This screen is intentionally minimal. Do not add anything to it — the restraint is the design.

**Flow:** Keep going → Paywall.

---

### 8. Paywall

**Purpose:** Convert to trial subscriber after the parent has already experienced the core value of recording and saving a memory.

**Layout:** X/dismiss button in the top right (no dark patterns — the user can always skip). Heading "Keep every memory safe." Three value props with icons: unlimited voice & text memories, recordings preserved forever, search/organize/relive anytime.

**Pricing cards:** Two options side by side — Monthly ($5.99/mo) and Annual ($49.99/yr, "$4.17/mo" broken down). Annual is pre-selected. A "Save 30%" badge on the annual card. "Start your free trial" button. 7-day trial messaging with the exact trial end date calculated dynamically. "Already subscribed? Restore purchase" link at the bottom.

**Flow:** Start trial or dismiss → Home (first-entry state).

---

## Main App Screens

### 1. Home Screen

**Purpose:** The hub. Browse recent entries, switch between children, launch a recording, or type an entry.

**Layout (top to bottom):**

**Top bar:** The app title "Forever Fireflies" in Merriweather serif sits on the left. On the right, a search icon (magnifying glass — toggles inline search mode), a heart icon for Firefly Jar navigation, and a settings gear icon. In the first-entry state, search and heart icons are hidden to keep the celebration focused.

**Inline search mode:** Tapping the search icon reveals a collapsible area below the top bar containing a search bar (auto-focuses keyboard), filter chips (tag chips + date range chip), and a "Clear" chip when filters are active. The search icon changes to an X while search is active. Child tabs remain visible and compose with search filters — selecting "Emma" tab + searching "bedtime" shows only Emma's entries containing "bedtime." Entry cards show tags and highlighted matching text during search. A floating result count pill ("X memories found") appears above the mic button. Tapping X or clearing all filters collapses the search area with a 250ms animation.

**Child area:** The layout adapts based on how many children are registered and the current state.

**Entry cards:** The main content area is a reverse-chronological list of entry cards. Each card shows child name pills (colored dot + name), date, time, and the first two lines of transcript text. Favorited entries get a warm orange border glow and a filled heart icon. Tapping any card opens Entry Detail.

**Bottom area:** A gradient fade overlays the bottom of the entry list to visually transition into the action area. A large circular mic button (68px, accent orange, drop shadow) dominates the bottom center. Below it, an "or write instead" link with a pencil icon opens a blank Entry Detail for text-only entries.

**States:**
- **Multi-child (default):** Horizontal scrollable child tab row below the top bar. "All" tab (default, shows every child's entries) plus one tab per child. Active tab gets a colored border, tinted background, and subtle shadow. Entries mentioning multiple children appear under every relevant tab plus "All."
- **Single-child:** No tabs. Instead, a warm pill showing the child's name, age, and total memory count sits below the top bar.
- **First-entry:** Post-onboarding celebration. A gradient banner with sparkle emoji reads "Your first memory is saved" with encouraging body text. Below, a single child info row and one entry card with a warm glow border. Search and Firefly Jar icons are hidden. This state is reached directly from the paywall.

**Navigation from Home:**
- Tap mic → Recording
- Tap "or write instead" → Entry Detail (new, blank)
- Tap entry card → Entry Detail (existing entry)
- Tap search icon → Inline search mode (no navigation — stays on Home)
- Tap heart icon → Firefly Jar
- Tap gear icon → Settings

---

### 2. Push Notification (Nightly Prompt)

**Purpose:** A gentle nightly nudge that makes it easy to record or come back later. This is the daily habit driver — it should feel personal, not like a generic app ping.

**Trigger:** Fires at the user's configured reminder time each evening.

**Notification content:** The notification displays the app icon (accent orange with mic), "Forever Fireflies" as the app name, and "now" as the timestamp. The primary prompt uses the child's name: "What made Emma smile today?" A secondary line references the child's age: "She's 2 years, 4 months old — these days go fast." The prompt text rotates nightly from a curated bank. The warm gradient background behind the notification card distinguishes it visually from standard system notifications.

**Action buttons (two visible):**

"Record" (accent orange) — launches the app directly into the Recording Screen. No child pre-selection at the notification level; the child gets assigned after recording via auto-detection on the Entry Detail screen.

"Remind me later" (neutral) — snoozes the notification by a fixed 30 minutes from the time it's tapped. One fixed interval, no choices. This is valuable because the parent is often in the middle of bedtime routine when the reminder fires.

**If the user just taps the notification body** (without selecting an action), it opens to the Home Screen.

---

### 3. Recording Screen

**Purpose:** Capture a voice entry. The screen should feel focused, calm, and encouraging — no distractions, no decisions beyond "talk."

**Layout:**

**Top bar:** A cancel/X button on the left discards the recording and returns to Home. No other navigation elements — this screen is intentionally minimal.

**Prompt cards:** The center-upper area displays prompt cards — wide, tappable-looking cards stacked vertically. Each card contains a conversation starter drawn from a curated bank of 20–30 prompts, organized by child age range and shuffled so the parent sees fresh prompts regularly. Example prompts for toddlers (1–3): "Any new words or phrases today?", "What made them laugh the hardest?" Example prompts for infants (0–1): "How did they sleep last night?", "Any new sounds or expressions?" Prompts serve as read-only inspiration — tapping a prompt does not auto-start recording. The parent reads prompts, then taps the mic button when ready.

**Recording area:** Before recording starts, the large mic/record button (96px, accent orange, pulsing glow animation) is centered and prominent below the prompts, matching the warm radial gradient backdrop used in onboarding. Once the parent taps it, the button transforms into a stop button, a breathing circle visualization with a gentle pulse animation appears (not a technical waveform — the aesthetic is calm, not clinical), and a timer counts up from 0:00 toward the 1:00 max. The prompt cards fade once recording begins.

**Auto-stop:** Recording automatically stops at 60 seconds. The parent can also tap the stop button at any time.

**After recording stops:** The app transitions directly to the Entry Detail screen with the transcript populated. There is no intermediate child-selection step on the Recording screen — auto-detection runs on the transcript and pre-fills child pills on the Entry Detail screen. This was a deliberate simplification from an earlier design that had a full-screen child-select step after recording.

**Re-record mode:** When launched from Entry Detail with a `reRecordEntryId` param, the Recording screen behaves slightly differently. Instead of 3 random prompt cards, a single context card reads "Take your time and re-record this memory" with a refresh icon. After stopping, the existing entry is updated (not a new one created) and `router.back()` returns to Entry Detail. The X button also returns to Entry Detail (not Home). Timer, breathing circle, and mic/stop behavior are identical.

**States:**
- **Prompts:** Pre-recording — prompt cards visible (or re-record context card), mic button ready, warm gradient backdrop.
- **Recording:** Active recording — prompts fade out, breathing circle + timer shown, stop button replaces mic.

**Navigation:**
- Stop recording → Entry Detail (from recording, with auto-detect)
- Stop recording (re-record mode) → Entry Detail (existing entry, updated transcript)
- Cancel/X → Home (or Entry Detail in re-record mode)

---

### 4. Entry Detail / Editor Screen

**Purpose:** View, edit, and enrich a single journal entry. This is where the parent sees their transcribed words and can refine them. Used for both new entries (from recording or text input) and existing entries (from Home or Firefly Jar).

**Layout:**

**Top bar:** A back arrow on the left returns to the previous screen (Home, Firefly Jar, or wherever the user came from). On the right, two icons: a heart toggle (tap to mark/unmark as a Firefly — filled state means favorited) and a delete/trash icon.

**Post-recording banner:** When arriving from a recording, a brief "Memory saved" confirmation banner appears at the top with a heart icon. It auto-dismisses after a few seconds with a fade-out and collapse animation.

**Metadata block (always stacked — three lines):**

Line 1: Date in bold (e.g., "Tuesday, Feb 18") and time in muted text (e.g., "8:47 PM").

Line 2: Child pills — one colored pill per child associated with this entry. Each pill shows a colored dot, the child's name, and a small × for removal. A + button after the pills opens the child picker. The + button is hidden when all children are already tagged.

Line 3: Age line in muted text — each child's name and age at the time of the entry (e.g., "Emma 2y 4m · Liam 4y 1m").

The always-stacked layout was chosen over a side-by-side (date left, pills right) arrangement because the horizontal split gets crowded with 2–3 children tagged. Stacking gives pills the full width to breathe regardless of child count.

**Child pill interactions:**
- Tap × on a pill to remove that child (if multiple children are tagged).
- Tap × on the last remaining pill: instead of removing it (which would leave zero children), the picker opens in **swap mode** showing "Switch from [name]:" with toggle pills for all other children. The parent selects a replacement, and the old child is swapped out.
- Tap + to open the child picker in **add mode** showing all children as toggle pills. Selected children have a colored border, tinted background, and checkmark. The picker stays open for multi-select — the parent can toggle multiple children on/off before dismissing. Tapping outside the picker (e.g., on the transcript area) closes it, as long as at least one child is selected. If zero children are selected, a "Select at least one child" warning appears and the picker won't close.
- **Auto-detect hint:** When the entry comes from a recording and multiple children were auto-detected (low confidence), a subtle italic hint reads "Auto-detected · tap × to remove or + to add" below the pills. This hint is only shown for low-confidence auto-detection, not on manually tagged entries.

**Tags row:** Below the metadata, a row of small tag pills (e.g., "milestone," "funny," "bedtime"). Each tag has an × to remove it. A "+ add" link opens the tag editor panel — a card with a text input for custom tags and a "Your Frequent Tags" section showing commonly used tags as tappable pills. Tags use uniform neutral backgrounds (no color-coding by type).

**Transcript text area:** The main body is an editable text field styled with Merriweather serif font, paper texture background, and warm border — the feel of a clean, minimal journal page. The full transcription appears here for voice entries; for text-only entries, a placeholder reads "Start typing your memory..." All edits auto-save with no save button. A subtle "All changes saved" indicator appears below the transcript.

**Audio playback bar:** At the bottom of the screen, a persistent mini-player with a play button (accent-tinted circle) and a scrub bar for the original audio recording. This lets the parent replay what they said. For text-only entries (no recording), this bar is hidden.

**Re-record button:** A small mic icon (accent-tinted circle, 28px) at the right edge of the audio playback bar. Tapping opens a confirmation dialog: "Re-record this memory?" with the body "Your current recording will be replaced with a new one. The transcript will update to match." The confirm button uses the default accent variant (not danger — re-recording is a "try again," not a destruction). On confirm, the Recording screen opens in re-record mode. After stopping, the new audio overwrites the old file, the transcript updates, and the parent returns to Entry Detail with all metadata (children, tags, location, date, favorite status) preserved. Only visible for voice entries.

**States:**
- **Viewing (default):** Reading/editing the entry, all panels closed.
- **Child Picker:** Inline child picker panel open with toggle pills.
- **Tag Editor:** Tag editor panel open with text input and frequent tags.
- **Delete Confirm:** Confirmation dialog overlay — "Delete this memory?" with a note that deleted entries can be recovered for 30 days. Soft delete always; permanent purge after 30 days. Cancel and Delete buttons.
- **Re-record Confirm:** Confirmation dialog overlay — "Re-record this memory?" with a note that the recording will be replaced. Cancel and Re-record buttons (accent, not danger).

**Navigation:**
- Back arrow → previous screen (Home, Firefly Jar)
- Heart toggle → marks/unmarks as Firefly (stays on this screen)
- Delete → confirmation dialog → soft delete → returns to previous screen
- Re-record → confirmation dialog → Recording screen (re-record mode) → returns to Entry Detail with updated audio/transcript

---

### 4. Firefly Jar Screen (Favorites)

**Purpose:** The app's emotional centerpiece — a curated treasure box of the parent's most meaningful moments. Visually elevated from Home to feel like opening something special, not just filtering a list.

**Visual distinction from Home:** The Firefly Jar screen has a warm gradient background (#F9F2EB → cream) instead of Home's flat cream. The title "Firefly Jar" uses Merriweather serif (not system sans like other screen titles). A memory count sits below the header ("♡ 3 memories saved"). These details create a different texture — Home is the inbox (scan, capture, move on); Firefly Jar is the keepsake box (slow down, relive, savor).

**Layout:**

**Top bar:** Back arrow on the left, "Firefly Jar" in Merriweather serif centered. No settings or search icons — this is a focused, curated view.

**Memory count:** Below the header, a small line with a filled heart icon and the count of favorited entries.

**Child tabs:** Horizontal scrollable row matching Home's tab pattern. "All" plus each child's name. Filters favorites by child.

**Entry cards (larger, warmer than Home):** Favorited entry cards use a different treatment than standard Home cards. They have Merriweather serif transcript previews at 3 lines (vs. Home's 2 lines in system font), a warm amber glow border, and an inline audio play button at the bottom of each card with a scrub bar and duration. Tapping the play button area plays the audio without navigating to Entry Detail (stopPropagation). Tapping anywhere else on the card opens Entry Detail.

**States:**
- **Filled (default):** Showing favorited entries with the elevated card treatment and inline audio.
- **Empty:** Warm encouragement text in Merriweather serif — "Tap the heart on any entry to save it as a Firefly." with a "Browse your entries" button that navigates back to Home. This completes the loop so the parent isn't stranded on an empty screen.

**Navigation:**
- Tap card (non-audio area) → Entry Detail
- Tap "Browse your entries" (empty state) → Home
- Back arrow → Home

---

### 5. Settings Screen

**Purpose:** Configure the app, manage children, manage subscription, and access data controls.

**Layout:** Back arrow and "Settings" title centered. Below, sections in card groups:

**Children:** A list of each child with their name and birthday (e.g., "Emma — Born Oct 15, 2023"). Tapping a child opens an edit view. An "+ Add Child" button (accent-colored) at the bottom.

**Reminder:** Current time shown (e.g., "Time: 8:30 PM"). Toggle for enabling/disabling reminders.

**Family Contributors (V2):** Lists all invited family members (e.g., "Grandma Sarah — Active", "Uncle Dave — Revoked"). Tap to edit display name, view their recordings, revoke access, or generate a new invite link. "+ Invite Family Member" button at the bottom. *(See Product Spec §6, Contributor Management.)*

**Subscription:** Current plan status (e.g., "Plan: Forever Fireflies Premium"). "Manage Subscription" link to App Store subscription management.

**Recently Deleted:** A dedicated section (not buried inside Data & Privacy) with an accent-tinted border to make it findable in a panic moment. Shows "View deleted memories" with a sublabel "Entries are kept for 30 days." Tapping opens the recovery view. This prominent placement was a deliberate decision — recovery is a rare action, but when someone accidentally deletes a precious memory, it needs to be findable immediately.

**Data & Privacy:** Export All Entries (text + audio as downloadable archive). Delete Account (danger-styled, red text).

**About:** App version, Privacy Policy, Terms of Service, Contact Support.

**Navigation:** Back arrow → Home.

---

### Edge Case: Empty State

**Purpose:** Shown when a user has deleted all entries or (theoretically) if data is lost. A warm invitation to start recording again.

**Layout:** Warm radial gradient backdrop (matching the Recording screen and onboarding first-recording screen for visual consistency). A prompt card with paper texture containing an encouraging message. A pulsing mic button with glow animation. An "or write instead" text entry link below. fadeInUp entrance animation.

**Navigation:** Tap mic → Recording. Tap "or write" → Entry Detail (new, blank).

---

## Multi-Child Entry Behavior

Entries can be associated with one child, multiple children, or (in theory) a general/untagged entry — but the zero-child state is blocked by the picker's protection logic, so every entry always has at least one child.

When an entry is tagged to multiple children, it appears on every relevant child's tab on the Home Screen and Firefly Jar screen, as well as under the "All" tab. The entry is not duplicated — it's the same entry, just visible in multiple filtered views. A story about two siblings playing together shows up on both children's pages.

On entry cards, multiple child pills are always visible so the parent knows which children are associated at a glance.

**Auto-detection from recording:** When a recording completes, the app analyzes the transcript and pre-fills child pills on the Entry Detail screen. If multiple children are detected (lower confidence), a subtle "Auto-detected · tap × to remove or + to add" hint appears. The parent can always adjust by tapping the pills.

---

## Navigation Map

### Onboarding Flow (linear with one branch)

```
Sign In → Add Child → Mic Permission → Notifications → First Recording → Memory Saved → Paywall → Home (first-entry state)
                ↺ (add another child)                          ↘ First Memory (Text) ↗
```

### Main App Flow (hub-and-spoke from Home)

```
                    ├─ ♡ Firefly Jar ─── Entry Detail
 Notification ──→ Recording ──→ Entry Detail
                    │
              ┌─────┤
              Home ──┤
              └─────┤
                    ├─ 🔍 Inline search mode (no navigation)
                    ├─ Settings
                    ├─ Entry Detail (tap card)
                    └─ Entry Detail (new text entry)
```

All secondary screens return to Home via back arrow. Entry Detail returns to whichever screen launched it (Home or Firefly Jar). Search is inline on the Home screen — no separate route.

---

## Decisions Made (Resolved)

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Birthday field | Required, inline scroll wheel picker | Powers age stamps; inline wheels maintain warm aesthetic vs. system picker |
| Child color assignment | Auto-assigned from palette in order | Less friction than parent choosing; 6-color palette covers most families |
| Recording → child selection | No child-select step; auto-detect on Detail | Reduces post-recording friction; parent corrects on Detail if wrong |
| Detail metadata layout | Always stacked (date, pills, ages on 3 lines) | Side-by-side gets crowded with 2–3 children; stacking gives pills full width |
| Child picker behavior | Multi-select toggle pills, tap outside to close | Mirrors tag editor pattern; more flexible than single-select-and-close |
| Zero-child protection | Last pill × opens swap mode instead of removing | Every entry must have at least one child; swap prevents accidental orphaning |
| Prompt card interaction | Read-only inspiration, separate record button | Parent may want to browse prompts before choosing; auto-start is too aggressive |
| Regenerate transcription | Included in paid tier, 1 per entry, ~5/week cap | Poor transcription is the app's shortcoming, not the user's; no extra charge |
| Notification personalization | Child name + age in prompt text | Makes the notification feel personal, not generic; drives habit better |
| Firefly Jar visual treatment | Warm gradient, serif title, larger cards, inline audio | Must feel like a treasure box, not a filtered list; it's the app's centerpiece |
| Firefly Jar empty state | CTA button "Browse your entries" → Home | Completes the navigation loop; doesn't strand the parent |
| Text entry placement | "or write instead" link below mic button | Clearly secondary to voice; always available but doesn't compete visually |
| Remind Me Later | Fixed 30-minute snooze from time of tap | Simple; parent is usually mid-bedtime and wants one more nudge |
| Entry deletion | Soft delete with 30-day recovery | Content is irreplaceable; Recently Deleted in Settings with accent border |
| Recently Deleted placement | Own section in Settings, accent-bordered | Must be findable in a panic; not buried inside Data & Privacy |
| Multi-child entries | Entry gets a pill per child, appears on all relevant tabs | Intuitive; siblings playing together should show on both children's pages |
| Paywall exit destination | Home (first-entry state) | Parent sees their entry celebrated before normal app experience |
| Age display on Detail | Subtle muted line below child pills | Keeps age visible as context without cluttering the pills themselves |
| Flow map labeling | Paywall → "Home (first-entry state)" explicit | Reviewer can see exactly which Home variant is the destination |
| Re-record placement | Mic icon on audio bar, not top bar | Action is about the audio, so it belongs with audio controls; top bar placement creates ambiguity with "add recording" |
| Re-record confirm variant | Default (accent), not danger | Re-recording is a "try again," not a destruction; warm orange says "go ahead" |
| Re-record original_transcript | Replace with new transcript | Old transcript has no value once old audio is gone; new baseline for future edits |
| Search integration | Merged into Home screen as collapsible inline mode | Reduces navigation depth; follows Apple Photos pattern; child tabs compose with search filters; one less screen to maintain |

---

## Remaining Open Questions

1. **Age display granularity:** The age line shows the child's age at the time of the entry. For infants, "3 months, 12 days" might be meaningful (parents track in weeks and days early on). For older kids, "4 years, 2 months" is sufficient. Should the granularity auto-adjust based on age (days for 0–3 months, weeks for 3–12 months, months for 1–3 years, years+months for 3+), or keep it simple with one format?

2. **Entry card preview length:** Two lines on Home cards gives a taste without overwhelming. But some entries might benefit from three lines, especially if the first line is throat-clearing. Two lines is probably right, but worth testing with real content.

3. **Audio playback on Home cards:** Should entry cards on the Home Screen have a small play button (like Firefly Jar cards do) so the parent can listen without opening Entry Detail? More immersive but adds UI complexity to the feed. Probably post-MVP, but compelling. Firefly Jar already has this — if it works well there, it validates bringing it to Home.

4. **Prompt rotation strategy:** MVP uses age-bracketed shuffle from a bank of 20–30 curated prompts. Future versions should surface contextually relevant prompts based on the child's age, recent entry topics, time of year, and milestones. The prompt bank should grow to hundreds over time.

5. **Notification frequency adaptation:** If ignored for multiple consecutive days, should the app reduce notification frequency automatically? The philosophy is "never increase pressure" — no streak counters, no "you missed X days" messaging. But auto-reducing could mean a lapsed user never gets nudged back. Consider a weekly catch-up prompt instead of daily when ignored.

6. **Child deletion behavior:** When a child is deleted from Settings, what happens to their entries? Options: entries remain but lose their child association (moved to "All / General"), entries are soft-deleted along with the child, or entries are reassigned to another child. Needs a confirmation dialog explaining the consequence.