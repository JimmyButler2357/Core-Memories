# Core Memories — Design Style Guide

Extracted from the wireframe prototype (React inline-style implementation).

---

## Color Tokens

| Token        | Hex         | Usage                              |
|--------------|-------------|------------------------------------|
| bg           | `#FAF8F5`   | Page / screen background           |
| card         | `#FFFFFF`   | Card surfaces                      |
| text         | `#2C2420`   | Primary text, dark brown           |
| textSoft     | `#8C7E74`   | Secondary text, icons              |
| textMuted    | `#B5AAA0`   | Tertiary / placeholder text        |
| accent       | `#E8724A`   | Primary accent (warm orange)       |
| accentSoft   | `#FFF0EB`   | Accent tint background             |
| heartFilled  | `#E8724A`   | Favorited heart                    |
| heartEmpty   | `#D9D2CB`   | Unfavorited heart stroke           |
| border       | `#EDE8E3`   | Card/section borders               |
| tag          | `#F3EDE8`   | Tag pill background                |
| accentPressed| `#D4613B`   | Pressed/active state for accent    |
| danger       | `#D94F4F`   | Destructive action (delete)        |
| success      | `#4CAF7C`   | Positive feedback (saved, done)    |
| successSoft  | `#E8F5EE`   | Success tint background            |
| warning      | `#E8A94A`   | Warning states                     |
| warningSoft  | `#FFF5E6`   | Warning tint background            |
| overlay      | `rgba(44,36,32,0.45)` | Modal backdrop          |

### Per-Child Colors
| Child   | Color       |
|---------|-------------|
| Emma    | `#7BAFD4` (blue)   |
| Liam    | `#D4A07B` (amber)  |
| Nora    | `#9BC49B` (green)  |
| General | `#B5AAA0` (muted)  |

Child color used at 100% for text/dot, at `{color}20` (12% opacity) for pill background.

---

## Typography

- **System font stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Serif accent**: `'Georgia', serif` — used for app title ("Core Memories") and entry body text
- **Title**: 22px, weight 800, letter-spacing -0.5
- **Screen headers**: 16px, weight 700
- **Body / entry text**: 14px, line-height 1.5
- **Labels / timestamps**: 12px, weight 500–600
- **Tags**: 11px, weight 500
- **Tiny labels (section headers)**: 12px, weight 700, uppercase, letter-spacing 0.8

---

## Spacing & Layout

- **Phone frame**: 375px wide, 720–780px tall, border-radius 40
- **Screen padding**: 20px horizontal
- **Card padding**: 16px
- **Card border-radius**: 16px
- **Card shadow**: `0 1px 3px rgba(44,36,32,0.06)`
- **Card border**: 1px solid `#EDE8E3`
- **Section gap (between cards)**: 12px margin-bottom
- **Button border-radius**: 12px
- **Pill border-radius**: 12px (child pills), 8px (tags), 9999px (filter chips)

---

## Component Patterns

### Child Pill
- Inline-flex, gap 4, padding 4px 12px (small: 4px 8px)
- Color dot (6px circle) + name
- Background: child color at 12% opacity
- Text: child color at 100%

### Tag Pill
- Padding 4px 8px, border-radius 8
- Background: `#F3EDE8`, text: `#8C7E74`, weight 500

### Entry Card
- White card, border-radius 16, 1px border
- Top row: date/time (muted) + heart icon (if loved)
- Middle row: child pills + tag pills
- Bottom: 2-line clamped entry text (webkit-line-clamp: 2)

### Confirm Dialog
- Centered overlay modal
- Card: border-radius 16, padding 24px 22px 18px, max-width 300
- Title (16px bold) + message (14px soft) + two buttons (Cancel grey / Action colored)
- Shadow: `0 12px 40px rgba(44,36,32,0.2)`

### Bottom Action Area (Home)
- Gradient fade: 70px, from transparent to bg at 0.55 midpoint
- Centered buttons: write (46px circle, outlined accent) + record (68px circle, filled accent)
- Record button shadow: `0 4px 20px rgba(232,114,74,0.35)`

### Audio Playback Bar
- Play button: 36px circle, accentSoft background
- Progress bar: 4px tall, border-radius 2, accent fill
- Timestamp: 11px, tabular-nums

### Filter Tabs
- Horizontal scrollable row
- Active: child color at 25% opacity bg, child color text
- Inactive: transparent bg, muted text
- Padding 6px 16px, border-radius 9999

---

## Screens

1. **Home** — Title bar, favorites shortcut, child filter tabs, entry card list, floating record/write buttons
2. **Recording** — Prompt suggestions → waveform visualization → child selection after stop
3. **Entry Detail** — Back/heart/regen/delete toolbar, date card, tags (with + add), serif body text, audio player
4. **Entry Detail (Text Only)** — Same as above but italic placeholder, no audio bar
5. **Search** — Search input, filter chips (children + tags), results list
6. **Core Memories (Favorites)** — Child filter tabs, loved entries only, empty state with heart icon
7. **Settings** — Grouped sections (Children, Reminder, Subscription, Data & Privacy, About)
8. **Push Notification** — Frosted glass card with prompt, Record/Open/Later buttons

---

## Design Principles

- **Warm & organic**: Earth-tone palette, soft shadows, rounded corners everywhere
- **Mobile-first**: 375px phone frame, touch-friendly tap targets (min 44px)
- **Gentle hierarchy**: Light borders and subtle shadows instead of harsh dividers
- **Serif for sentiment**: Georgia serif on the title and memory body text to feel personal/journal-like
- **Color-coded children**: Each child has a distinct, soft hue for instant recognition
- **Minimal chrome**: No heavy nav bars — back arrows, floating buttons, subtle tab bars
- **Soft transitions**: 0.15s transition on interactive elements
