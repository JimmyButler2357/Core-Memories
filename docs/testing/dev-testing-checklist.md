# Dev Testing Checklist — First Run

## Phase 1: Onboarding Flow (first launch)

### Sign In Screen
- [ ] App opens without crashing
- [ ] "Sign in with Apple" button is visible and tappable
- [ ] "Sign in with Google" button is visible and tappable
- [ ] "Sign in with Email" button navigates to email screen
- [ ] Layout looks correct — no overlapping text, proper spacing

### Email Auth Screen
- [ ] Can type an email address
- [ ] Can type a password
- [ ] Toggle between "Sign Up" and "Sign In" modes works
- [ ] Sign up with a new email creates an account
- [ ] Error shows if you use a bad email or short password
- [ ] After sign up, navigates forward to next onboarding step

### Add Child Screen
- [ ] Can type a child's name
- [ ] Can pick a birthdate with the date picker
- [ ] Can select a color/avatar for the child
- [ ] "Add Child" button saves and moves forward
- [ ] Can skip or add multiple children (if supported)
- [ ] Long child name doesn't overflow or break layout

### Mic Permission Screen
- [ ] Explanation text displays properly
- [ ] Tapping "Allow" triggers the Android mic permission popup
- [ ] After granting, moves to next screen
- [ ] Denying doesn't crash — handles gracefully

### Location Permission Screen
- [ ] Explanation text displays properly
- [ ] Tapping "Allow" triggers Android location permission popup
- [ ] After granting, moves to next screen
- [ ] Denying doesn't crash

### Notifications Screen
- [ ] Time picker shows and is interactive
- [ ] Can pick a reminder time
- [ ] "Continue" moves forward

### Welcome Preview Screen
- [ ] Shows sample/preview data
- [ ] Looks correct visually
- [ ] CTA button moves to paywall or main app

### Paywall Screen
- [ ] Subscription options display correctly
- [ ] Prices show (or placeholder if RevenueCat isn't configured yet)
- [ ] "Start Trial" or "Continue" button works
- [ ] "Skip" or "X" to dismiss works without crashing

---

## Phase 2: Main App — Empty State

### First Launch (No Entries Yet)
- [ ] Home screen shows empty state, not a blank screen
- [ ] Empty state has clear CTA to record first memory
- [ ] Firefly Jar screen shows empty state too
- [ ] No crashes on any tab when there's no data

---

## Phase 3: Recording Flow (the core feature)

### Recording Screen
- [ ] Tapping the record button starts recording
- [ ] Microphone actually captures audio (check permission worked)
- [ ] Live transcript appears as you speak
- [ ] Timer/duration indicator shows while recording
- [ ] Can stop recording
- [ ] Can cancel/discard a recording
- [ ] After stopping, transitions to entry detail/save screen

### Entry Detail / Save Screen
- [ ] Transcript text displays correctly
- [ ] Can edit the transcript text
- [ ] Can assign entry to a child (child tabs/selector)
- [ ] Can add/remove tags
- [ ] Can toggle as favorite (Firefly Jar entry)
- [ ] Save button works — entry appears on home screen
- [ ] Audio playback button works (plays back your recording)
- [ ] Date displays correctly
- [ ] Location tags (if location was granted)
- [ ] With 1 child: child auto-selected, no selector needed
- [ ] With 2+ children: child selector appears and works
- [ ] Entry with 0 tags looks fine (no empty tag area)
- [ ] Entry with many tags wraps properly, not cut off

---

## Phase 4: Home Screen (with data)

### Timeline Feed
- [ ] Entries show in chronological order (newest first)
- [ ] Each entry card shows: child name, date, preview text, tags
- [ ] Tapping an entry card navigates to entry detail
- [ ] Scrolling is smooth with multiple entries
- [ ] Pull-to-refresh works (if implemented)
- [ ] Card with very long transcript text truncates cleanly
- [ ] Card with no tags doesn't show empty tag area

### Search & Filter
- [ ] Search bar is visible and tappable
- [ ] Typing filters entries by text content
- [ ] Child filter tabs work (if you added multiple children)
- [ ] Clearing search shows all entries again
- [ ] With 1 child: no child filter tabs shown (not needed)
- [ ] Search with no results shows a "nothing found" state

---

## Phase 5: Firefly Jar (Favorites)

- [ ] Shows only entries marked as favorites
- [ ] Empty state if no favorites yet
- [ ] Tapping an entry navigates to detail view
- [ ] Visual design matches the "special" feel (firefly/glow theme)
- [ ] Unfavoriting an entry removes it from this screen

---

## Phase 6: Settings

- [ ] Settings screen loads without crashing
- [ ] Profile/account info displays
- [ ] Child management — can see children you added
- [ ] Can add a second child from settings
- [ ] Notification time is editable
- [ ] Sign out button works and returns to sign-in screen
- [ ] Sign back in — all previous data still there
- [ ] Any modals open and close properly

---

## General (every screen)

- [ ] No blank screens — every screen has loading/empty/error states
- [ ] No console errors — watch the terminal for red errors
- [ ] Touch targets — all buttons are easy to tap (not too small)
- [ ] Text overflow — no text getting cut off or running off-screen
- [ ] Back navigation — Android back button works on every screen
- [ ] Keyboard — doesn't cover the input field when typing
- [ ] Status bar — text readable, not hidden behind notch
- [ ] Orientation — app stays portrait, doesn't rotate

---

## Bug Report Template

For each bug, note:
1. **Screen** — where were you
2. **Action** — what did you tap/do
3. **Expected** — what should have happened
4. **Actual** — what actually happened (crash? wrong text? nothing?)
5. **Screenshot** — if visual
