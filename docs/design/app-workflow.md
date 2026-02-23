# App Workflow — Core Memories (v3)

## Screen Map

The app has **7 distinct screens** plus a **push notification** with actions. Onboarding is deferred — this document covers the core experience only.

---

## 1. Home Screen

**Purpose:** The hub. Browse recent entries, switch between children, launch a recording, or type an entry.

**Layout (top to bottom):**

**Top bar:** The app name or logo sits on the left. On the right, a magnifying glass icon for search and a settings gear icon. Tapping the magnifying glass opens the Search Screen; tapping the gear opens Settings. The magnifying glass sits to the left of the gear so the two icons feel like a natural pair without crowding.

**Core Memories button:** A dedicated, warmly styled button (heart icon, bookmark, or star — something that feels personal, not utilitarian) sits prominently below the top bar. Tapping it navigates to the Core Memories screen. This is a first-class element on the Home Screen because revisiting your best memories is a core emotional loop, not a secondary feature.

**Child tabs:** A horizontal scrollable row of tabs below the Core Memories button area. The first tab is "All" (default, shows every child's entries mixed together). Each additional tab is a child's name. Tapping a tab filters the entry cards below to only that child. The active tab is visually highlighted. Entries that mention multiple children appear under every relevant child's tab as well as under "All."

**Entry cards:** The main content area is a reverse-chronological list of entry cards. Each card shows the date, child name pills (one colored pill per child mentioned — an entry about two kids shows two pills), the first two or so lines of the transcript text, and any auto-generated tag pills (like "milestone," "funny," "first"). Tapping any card opens the Entry Detail screen for that entry.

**Bottom area — Record button and Text Entry button:** A large, prominent, circular microphone button dominates the bottom center of the screen. This is the single most important element in the entire app — everything else defers to it visually. A smaller floating icon button (pencil/compose icon) sits near the record button — adjacent but clearly secondary — giving users a way to type a new entry without recording. Tapping the pencil opens a blank Entry Detail screen with no audio, just the text editor, metadata header, and child selector. Tapping the mic opens the Recording Screen.

---

## 2. Push Notification (Nightly Prompt)

**Purpose:** A gentle nightly nudge that makes it easy to record or come back later.

**Trigger:** Fires at the user's configured reminder time each evening.

**Notification content:**

The notification title uses rotating, warm prompt text that changes each night — things like "Anything worth remembering today?", "What made you smile today?", or "What was the funniest thing that happened?" The body can be left empty or contain a brief secondary nudge.

**Action buttons (three total, visible when the user expands the notification or on the lock screen):**

"Record" launches the app directly into the Recording Screen. No child pre-selection at the notification level — the child gets assigned after the recording finishes, which keeps the notification interaction as frictionless as possible.

"Open App" launches the app to the Home Screen.

"Remind Me Later" snoozes the notification by a fixed 30 minutes from the time it's tapped. This is valuable because the parent is often in the middle of bedtime routine when the reminder fires and wants the nudge again once the kids are actually down. One fixed interval keeps it simple — no choices, no settings, just "nudge me again in half an hour."

**If the user just taps the notification body** (without selecting an action), it opens to the Home Screen.

---

## 3. Recording Screen

**Purpose:** Capture a voice entry. The screen should feel focused, calm, and encouraging — no distractions, no decisions beyond "talk."

**Layout:**

**Top bar:** A cancel/X button on the left discards the recording and returns to the previous screen (Home or notification launch). No other navigation elements — this screen is intentionally minimal.

**Prompt cards:** The center-upper area of the screen displays several prompt cards — wide, button-like cards stacked vertically or in a short scrollable list. Each card contains a different conversation starter to help the parent who sits down and doesn't know what to say. Prompts are drawn from a curated bank of 20–30 prompts, organized by child age range, and shuffled so the parent sees fresh prompts regularly without repeats within a reasonable window. Examples for the toddler range (ages 1–3) might include "Any new words or phrases today?", "What made them laugh the hardest?", or "Did they try something for the first time?" Examples for the infant range (0–1) might include "How did they sleep last night?", "Any new sounds or expressions?", or "What was the sweetest moment today?" The prompts should feel warm and specific to the child's developmental stage, not generic. Over time, the prompt bank will grow to hundreds of prompts, eventually surfacing contextually relevant ones based on the child's age, recent entry topics, time of year, and milestones — but for MVP, the age-bracketed shuffle is the right starting point.

**Recording area:** Below the prompts sits the main recording interface. Before recording starts, the large mic/record button is centered and prominent. Once the parent taps it, the button transforms into a stop button, a waveform or pulse animation appears showing the app is actively listening, and a timer counts up from 0:00 toward the 1:00 max. The prompt cards fade or collapse once recording begins to keep the focus on the active recording.

**Auto-stop:** Recording automatically stops at 60 seconds. The parent can also tap the stop button at any time.

**After recording stops — child selection:** Once the recording ends, a child selection step appears as a bottom sheet or overlay. This shows the list of children as tappable pill buttons, plus an "All / General" option. The parent taps the child (or children) this entry is about, and the app transitions to the Entry Detail screen with the transcript populated and those children assigned. If the parent selects "All / General," the auto-detection system will attempt to identify the child (or children) from the transcript content and assign them as editable pills on the Entry Detail screen. The parent can select multiple children here if the story is about more than one kid.

---

## 4. Entry Detail / Editor Screen

**Purpose:** View, edit, and enrich a single journal entry. This is where the parent sees their transcribed words and can refine them.

**Layout:**

**Top bar:** A back arrow on the left returns to the previous screen (Home, Search, Core Memories, or wherever the user came from). On the right, two icons: a favorite/star toggle (tap to mark as a Core Memory — filled state means favorited) and a delete/X button. Tapping delete triggers a confirmation dialog: "Delete this memory?" with a note that deleted entries can be recovered for 30 days. Deletion is always a soft delete — the entry moves to a hidden "Recently Deleted" holding area and is permanently purged after 30 days. This is critical given the irreplaceable nature of the content. A "Recently Deleted" section in Settings (or accessible from the Core Memories / Home screen) lets the parent recover accidentally deleted entries within that window.

**Metadata header:** A clean, non-editable info block at the top of the entry displaying the date (e.g., "Tuesday, February 18, 2026"), the time (e.g., "8:47 PM"), child name pills (one colored pill per child associated with this entry — tappable to open a picker and add/remove/change child assignments), and the child's age auto-calculated from their birthday (e.g., "2 years, 4 months"). If multiple children are tagged, each child's name and age appear. The pills are the same visual treatment whether they were manually selected or auto-detected — no "auto-detected" label, just the pill, and the parent taps to change if it's wrong.

**Tags row:** Below the metadata, a row of small auto-generated tag pills (e.g., "milestone," "funny," "bedtime," "first"). The parent can tap an X on a tag to remove it, or tap a "+" to add a custom tag.

**Transcript text area:** The main body of the screen is an editable text field styled like a clean, minimal text editor (think Apple Notes, Bear, or iA Writer). The full transcription appears here. The parent can tap into the text to correct transcription errors, add more detail, or expand on what they said. All edits auto-save with no save button. A subtle "Saved" indicator briefly appears when changes are committed.

**Regenerate button:** A small but visible button (refresh/sparkle icon) labeled "Regenerate" or "Improve transcription" sits near the transcript area — either just above it or as a contextual action. Tapping this sends the original audio through a higher-quality cloud transcription API and replaces the transcript with the improved version. This feature is included in the standard paid tier with no additional charge, because poor transcription accuracy is the app's shortcoming, not the user's — charging extra to fix it would feel punitive. However, a reasonable usage limit applies to manage API costs: one regeneration per entry, with a weekly cap (e.g., 5 regenerations per week) to prevent abuse while being generous enough that any normal user never hits it. The button shows a brief loading state while processing, then the new transcript replaces the old one inline. The parent can continue editing from there.

**Audio playback bar:** A persistent mini-player bar sits at the bottom of the screen (or just below the metadata header) with play/pause and a scrub bar for the original audio recording. This lets the parent replay what they said — useful for catching transcription errors or just reliving the moment. For text-only entries (no recording), this bar is hidden.

**Behavior notes:** New entries and existing entries use the same screen. New entries arrive with a freshly populated transcript; existing entries load from storage. All edits auto-save in both cases. The delete X in the top right is the way to discard an entry.

---

## 5. Search Screen

**Purpose:** Find any memory across the entire archive using full-text search and filters.

**Layout:**

**Search bar:** A full-text search input at the top that auto-focuses the keyboard when the screen opens. Results filter as the parent types, or on submit depending on performance and dataset size.

**Filter chips:** A horizontal scrollable row of filter options below the search bar. Filters include child name (multi-select), date range, and tags (milestone, funny, first, etc.). Tapping a chip opens a small picker or toggles it. Filters combine with the search text — so you can search "first steps" filtered to a specific child.

**Results area:** Entry cards in the same format as the Home Screen, with matching search text highlighted in the preview snippet. Tapping a card opens Entry Detail.

**Empty state:** If no results match: "No memories found. Try different keywords or filters."

---

## 6. Core Memories Screen (Favorites)

**Purpose:** A curated, special collection of the entries the parent has starred as their most meaningful moments.

**Layout:** This screen mirrors the Home Screen structure but only shows favorited entries. Child tabs run across the top ("All" plus each child's name) to filter favorites by child. Below, favorited entry cards appear in reverse-chronological order, using the same card design as the Home Screen. Tapping any card opens Entry Detail.

**Top bar:** Back arrow on the left returns to Home. The title "Core Memories" is centered.

**Empty state:** If no entries have been favorited yet: "Tap the star on any entry to save it as a Core Memory."

---

## 7. Settings Screen

**Purpose:** Configure the app, manage children, manage subscription, and access data controls.

**Sections:**

**Children:** A list of each child with their name and birthday. Tapping a child opens an edit view to change the name or birthday. An "Add Child" button lets the parent add more children at any time. Swipe to delete a child (with a confirmation dialog warning about what happens to their entries — entries remain but lose their child association, or get moved to "All / General").

**Reminder:** A time picker for the nightly notification time. A toggle to enable or disable reminders entirely.

**Subscription:** Shows the current plan status and provides a manage/upgrade button that links to the RevenueCat paywall or App Store subscription management.

**Data & Privacy:** Export all entries (text + audio as a downloadable archive). Account deletion option. Access to "Recently Deleted" entries for recovery within the 30-day soft-delete window.

**About:** App version, links to privacy policy, terms of service, and a support/contact channel.

---

## Multi-Child Entry Behavior

Entries can be associated with one child, multiple children, or no specific child ("All / General"). This is handled through child pills that appear on the Entry Detail screen and on entry cards throughout the app.

When an entry is tagged to multiple children, it appears on every relevant child's tab on the Home Screen and Core Memories screen, as well as under the "All" tab. The entry is not duplicated — it's the same entry, just visible in multiple filtered views. This means a story about two siblings playing together shows up on both children's pages, which is the intuitive behavior. On the entry card itself, multiple child pills are visible so the parent always knows which children are associated.

The auto-detection system, when enabled (i.e., the parent selected "All / General" at the post-recording child selection step), analyzes the transcript and assigns one or more child pills based on which children are mentioned. The parent can always tap the pills on the Entry Detail screen to add, remove, or change child assignments.

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Prompt rotation | Curated bank of 20–30 prompts bracketed by child age range, shuffled. Grows to hundreds over time with contextual surfacing. |
| Regenerate transcription | Included in standard paid tier. One regen per entry, weekly cap (~5/week). No free tier exists. |
| Search access | Magnifying glass icon in the Home Screen top bar (right side, left of the settings gear). |
| Text entry placement | Floating pencil/compose icon button near the record button, clearly secondary. |
| Remind Me Later | Fixed 30-minute snooze from time of tap. |
| Entry deletion | Soft delete with 30-day recovery. "Recently Deleted" accessible from Settings. |
| Multi-child entries | Entry gets a pill per child. Appears on every tagged child's tab plus "All." Single entry, multiple views. |

---

## Remaining Open Questions

1. **Prompt card interaction:** When a parent taps a prompt card before recording, should it just serve as inspiration (they read it and then hit record), or should tapping a prompt card automatically start the recording? Starting on tap would reduce one more button press, but the parent might want to read a few prompts before choosing. Leaning toward prompts as read-only inspiration with the record button as a separate action, but worth testing.

2. **Recently Deleted access point:** Where should the "Recently Deleted" section live? Options are inside Settings under "Data & Privacy" (most hidden, least cluttered), accessible via a small link on the Home Screen or Core Memories screen, or as a filter option in Search. Settings is the cleanest place since recovery is a rare action, but it needs to be findable in a panic moment when someone accidentally deletes something precious.

3. **Age display granularity:** The metadata header shows the child's age at the time of the entry. For infants, "3 months, 12 days" might be meaningful (parents track in weeks and days early on). For older kids, "4 years, 2 months" is sufficient. Should the granularity auto-adjust based on the child's age (days for 0–3 months, weeks for 3–12 months, months for 1–3 years, years+months for 3+), or keep it simple with one format?

4. **Entry card preview length:** How much transcript text should show on the entry cards on the Home Screen? Two lines gives a taste without overwhelming the scroll. But some entries might benefit from showing three lines, especially if the first line is just throat-clearing. Two lines is probably right, but worth testing with real content.

5. **Audio playback on cards:** Should entry cards on the Home Screen have a small play button so the parent can listen to the audio without opening the full Entry Detail? This would make browsing more immersive (hearing your own voice describing the memory as you scroll), but it adds UI complexity to the cards and could make the Home Screen feel busy. Probably a post-MVP feature, but a compelling one.

6. **Child color assignment:** Each child gets a colored pill. Should the parent pick the color during child setup, or should the app auto-assign from a pleasing palette? Auto-assign is less friction; parent choice is more personal. Could auto-assign with an option to change in Settings.
