# Forever Fireflies — Bug Tracker

> **How to use this file:**
> 1. Voice-record bugs as you test — dump the transcript into the "Raw Dump" section below
> 2. In a new Claude chat, paste the transcript and say: *"Fill out BUGS.md for me. Categorize each issue as Critical / UX / Visual. App is Forever Fireflies — React Native, screens: auth, add-child, home feed, entries, settings."*
> 3. Claude fills in the sections above
> 4. In another new chat, paste the filled-in list and ask Claude to triage + group by file area for fixing

---

## Critical — App broken / data loss / crashes

<!-- No critical bugs at this time -->

---

## UX — Wrong behavior / broken flows

- [ ] **children.service.ts** — TypeScript type mismatches in `createChild` RPC call
  - `p_nickname` typed as `string` in generated types but passed `string | null` (line 32)
  - `p_color_index` and `p_display_order` typed as required `number` but source type allows `undefined` (lines 33-34)
  - Works at runtime (PostgreSQL handles null for `text` columns) but fails `tsc --noEmit`
  - Fix: add null coalescing defaults or cast to match the generated RPC types

---

## Visual / Polish — Wrong colors, spacing, text

<!-- No visual bugs at this time -->

---

## Resolved

- [x] **Recording screen** — Voice transcription lost between pauses; only last speech segment saved — fixed by accumulating finalized segments in `useSpeechRecognition.ts`
- [x] **Recording screen** — Prompts show `[child name]` placeholder instead of actual name — fixed with `.replace()` at render time, rotates names across cards for multi-child families
- [x] **Recording screen** — Prompts flicker/refresh ~1s after opening — fixed with skeleton loading cards instead of fallback swap
- [x] **Entry detail** — Back arrow navigates to recording screen instead of home — fixed by using `router.replace()` so recording is removed from the nav stack
- [x] **Entry detail** — Blank entry can be saved with no content — fixed: text entries auto-delete on exit if empty; voice entries with no transcript blocked at recording screen
- [x] **Entry detail** — Date picker calendar uses green color instead of app theme — fixed with `themeVariant="light"` prop


---

## Notes & Decisions

### Blank entry save (UX bug above)
> User asked: "should we allow saving blank entries? What's best practice?"

**Recommendation: No, don't allow it.** Two reasons:
1. **Data quality** — blank entries are noise in the database and confusing in the feed
2. **UX signal** — a disabled Save button tells the user "you're not done yet" which is helpful, not punishing

**Recommended approach:**
- Disable the Save button when `entryText.trim() === ''`
- Show a subtle hint like "Add some words to save your memory" if they tap a disabled button
- For voice entries: if transcription is blank (the data-loss bug above), also disable Save and show "No words were captured — try recording again"

This is the pattern used by Notes, Day One, and most journal apps.

---

## Raw Dump

<!-- Paste voice transcripts or unprocessed notes here before Claude processes them -->

### Session 1 — [2026-03-03]
On the recording screen the prompts have a bracketed child name taxed where it should have the actual child name pulled through. When you click a new recording three prompts show up immediately, but then they after a 2nd they refresh to a new one or a new set of three, we shouldn't have that refresh happening when as soon as you click the record button from the home screen the three prompts should be set. I also noticed the initial three used the "they" For the child's name and are always the same. so maybe these are our system default preset from initial testing but we should be pulling in three unique ones immediately ready for viewing when they click the record button. When making the actual recording as I'm speaking I see the words flashing across the screen which is good but if I pause for a second those words disappear and when I start talking again the new words appear and when I hit the stop record button only the last set of words appears in the text memo. what should happen is all words spoken in the recording are shown on the preview and shown in the details memo. When we open the date selector on a entry detail page it opens a whiz calendar wizard which is great but the color is a green color. we need to align this more with our theme colors although I'm okay for a unique color splash but it should be based on our design philosophy and system. After recording and you're on a detailed entry page if you when you click the back arrow at the top left it takes you back to your recording but it shouldn't do that it should take you back to your home page. If I click right instead it opens up the detail view page as expected but it allows me to save a blank memory with no words written in it. I don't think we should allow a save for blank entries with their voice or text. please review this one and let me know your thoughts and best practices of how to proceed.
