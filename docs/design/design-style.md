# Core Memories — Design Style Guide (v2)

Updated to reflect all wireframe iterations through v13. This document captures the visual language as built — not aspirational, but actual patterns extracted from the working wireframe. Save pixel-perfect specs for implementation; this guide ensures consistency across screens.

---

## Design Direction

Core Memories should feel like a personal journal, not a tech product. Warm, quiet, and analog — closer to a leather notebook than a dashboard. The palette is intentionally muted with a single warm accent to keep the focus on the content (your kid's words), not the interface. Serif text and paper textures reinforce the journal metaphor. The app is built for speed — one-tap recording for busy parents — but the visual language should never feel rushed or utilitarian. It should feel like the end of the day: settled, reflective, yours.

**Key tensions to get right:**
- **Fast to use, calm to look at.** The interaction model is optimized for speed. The visual design is not.
- **Simple, not empty.** Minimal UI, but every screen should feel considered and warm, never barren.
- **Emotional, not sentimental.** The content is inherently emotional. The app should hold that without amplifying it — no pastel illustrations, no cursive fonts, no "precious moments" energy.

---

## Colors

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| bg | `#FAF8F5` | Screen background (cream) |
| card | `#FFFFFF` | Card surfaces |
| text | `#2C2420` | Primary text, dynamic island, phone frame |
| textSoft | `#8C7E74` | Secondary text, inactive icons, labels |
| textMuted | `#B5AAA0` | Placeholder, tertiary text, timestamps, ages |
| accent | `#E8724A` | Primary action (mic button, CTA, hearts, links) |
| accentSoft | `#FFF0EB` | Accent tint backgrounds (banners, play buttons, picker highlights) |
| accentGlow | `rgba(232,114,74,0.12)` | Favorited card glow shadow |
| border | `#EDE8E3` | Card borders, section dividers, input underlines |
| tag | `#F3EDE8` | Tag pill background, neutral button background |
| danger | `#D94F4F` | Delete actions, destructive text |
| overlay | `rgba(44,36,32,0.45)` | Modal/dialog backdrops |
| general | `#B5AAA0` | "All" tab color (matches textMuted) |

### Child Colors

Auto-assigned in order as children are added. These persist across the entire app for pills, tabs, dots, and card accents.

| Slot | Name | Hex | 12% Opacity (pills/tabs) |
|---|---|---|---|
| 1 | Blue | `#7BAFD4` | `#7BAFD420` |
| 2 | Amber | `#D4A07B` | `#D4A07B20` |
| 3 | Green | `#9BC49B` | `#9BC49B20` |
| 4 | Plum | `#B88BB4` | `#B88BB418` |
| 5 | Teal | `#6BB5A8` | `#6BB5A820` |
| 6 | Rose | `#D48B8B` | `#D48B8B20` |

Use child color at full opacity for text, dots, and active borders. Use at ~12% opacity (`+ "20"` hex suffix) for pill backgrounds and tab fills.

### Screen-Specific Colors

| Where | Color | Usage |
|---|---|---|
| Core Memories background | `#F9F2EB` | Warm gradient top, fades to `bg` — distinguishes from Home |
| Notification background | `#F5F0EB` | Subtle warm gradient behind notification card |
| Recording backdrop | `rgba(244,226,214,0.45)` | Radial gradient warmth for recording/onboarding |
| First-entry banner | `linear-gradient(135deg, accentSoft, rgba(255,240,235,0.5))` | Celebration banner after first recording |

---

## Typography

### Font Families

| Font | Usage |
|---|---|
| **System sans** (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) | Default everywhere — UI chrome, labels, buttons, tags, metadata, navigation |
| **Georgia serif** (`'Georgia', serif`) | App title, onboarding headings, transcript body text, prompt cards, Core Memories title and card previews, empty state messages, birthday picker values, child name input. Georgia = journal voice. System sans = app voice. |

### Type Scale

Extracted from the wireframe. Sizes cluster around a handful of values — keep it tight at implementation.

| Size | Weight | Usage |
|---|---|---|
| 28px | 800 | App title on Sign In (Georgia serif, tight letter-spacing -0.5) |
| 22px | 800 | App title in top bar on Home/Empty/Recording screens (Georgia serif, -0.5 tracking) |
| 20px | 700 | Onboarding headings — Memory Saved, Paywall (Georgia serif) |
| 18px | 700 | Section headings — Add Child, Mic Permission, Notifications (Georgia serif) |
| 18px | 500 | Prompt card text (Georgia serif, 1.5 line-height) |
| 17px | 700 | Core Memories screen title (Georgia serif, 0.3 tracking) |
| 16px | 700 | Screen titles — Settings, Search (system sans) |
| 16px | — | Child name input field (Georgia serif) |
| 15px | 400-700 | Transcript body text (Georgia serif, 1.65 line-height), Core Memories card previews (Georgia, 1.6 line-height), onboarding tagline |
| 14px-15px | 450-500 | Entry card preview text (system sans, 1.55 line-height), body copy |
| 14px | 500-600 | Form labels, settings row text, filter chips |
| 13px | 600-700 | Child pills, tab labels, button labels, banner text |
| 12px | 500-600 | Timestamps, secondary labels, tag editor section headers, legal text |
| 11px | 500-600 | Tags, captions, age lines, auto-detect hints, sublabels |
| 10px | 600-700 | Date/time on cards, audio duration, flow map labels |

### Weight Scale

| Weight | Meaning |
|---|---|
| 800 | App title only |
| 700 | Headings, child pill names, active tab labels, primary buttons |
| 600 | Emphasized labels, section headers, secondary buttons |
| 500 | Default body weight, form values, pill text |
| 450 | Entry card preview text (slightly bolder than regular body) |
| 400 | Regular body, placeholder text, descriptions |

### Line Heights

| Value | Usage |
|---|---|
| 1.65 | Transcript text area (Georgia serif — needs room to breathe) |
| 1.6 | Core Memories card previews, empty state text |
| 1.55 | Entry card previews on Home |
| 1.5 | General body text, descriptions, prompt cards |
| 1.4 | Compact body — notification text, headings with tight leading |

---

## Spacing & Layout

### Border Radius Scale

| Radius | Usage |
|---|---|
| 40px | Phone frame (wireframe only) |
| 20px | Child tabs, child pills, notification card, search pill |
| 16px | Large cards (first-entry glow card, Core Memories cards) |
| 14px | Standard cards (entry cards, form cards, pickers, transcript area) |
| 12px | Buttons (primary CTA, confirm/cancel), child pill in onboarding, settings rows |
| 10px | Inner inputs, notification action buttons, birthday picker confirm, banner |
| 8px | Tags, small badges, flow map elements |

### Common Padding Patterns

| Pattern | Pixels | Where |
|---|---|---|
| Screen padding | `0 20px` | Standard horizontal inset for content |
| Card padding | `14px 16px` to `18px` | Entry cards, transcript area |
| Prompt cards | `20px 24px` | Onboarding and recording prompt cards |
| Pills (child tabs) | `7px 14px` | Child filter tabs |
| Pills (metadata) | `5px 12px` | Child pills on Entry Detail |
| Tags | `2px 8px` | Tag pills |
| Buttons (full-width) | `15px 0` | Primary CTA buttons |
| Settings rows | `13px 16px` | Settings list items |

### Touch Targets

| Element | Size | Notes |
|---|---|---|
| Mic button (recording) | 96×96px | Largest element in the app. Pulsing glow animation. |
| Mic button (home) | 68×68px | Prominent but secondary to the recording screen version |
| Back/X/gear icons | ~20-22px | Icon size; tappable area should be padded to 44px minimum |
| Child picker + button | 24×24px | Small; consider padding tappable area for implementation |
| Play button (audio) | 36×36px (Detail), 26×26px (Core Memories card) | AccentSoft background circle |

---

## Component Patterns

### Entry Cards (Home)

Standard entry cards on the Home screen and Search results. Consistent format across the app.

- Background: `card` with `paperTex` overlay
- Border: `1px solid border`
- Border radius: 14px
- Shadow: `0 1px 3px rgba(44,36,32,0.06)` (subtle, warm)
- Content: child dot + name (colored), date, time, then 2-line transcript preview (system sans, 14.5px, 450 weight, `-webkit-line-clamp: 2`)
- **Favorited variant:** Border becomes `1px solid accent25`, shadow adds accent glow (`0 0 0 1.5px accent30, 0 2px 8px accentGlow`), filled heart icon shown

### Entry Cards (Core Memories)

Elevated treatment for the favorites screen. Should feel warmer and more expansive than Home cards.

- Border radius: 16px (larger than standard)
- Shadow: `0 0 0 1.5px accent25, 0 3px 12px accent10` (warmer, more prominent)
- Border: `1px solid accent20`
- Transcript preview: **Georgia serif**, 15px, 400 weight, 1.6 line-height, **3 lines** (vs. Home's 2)
- Includes inline audio play button at bottom of card (26px circle, accentSoft background, play triangle icon)
- Play button area uses `stopPropagation` — tapping audio stays on Core Memories; tapping card text navigates to Detail

### Child Pills

Used in metadata rows on Entry Detail and on entry cards.

- Dot (8px circle, full child color) + name (13px, 700 weight, full child color)
- Background: child color at 12% opacity
- Border radius: 20px
- On Detail: includes × for removal (11px, 60% opacity)

### Child Tabs

Horizontal scrollable row on Home and Core Memories screens.

- Padding: 7px 14px
- Border radius: 20px
- **Active:** `2px solid childColor`, background `childColor20`, text `childColor`, shadow `0 2px 8px childColor18`
- **Inactive:** `2px solid transparent`, background `card`, text `textMuted`, shadow `0 1px 3px rgba(44,36,32,0.04)`
- "All" tab uses `general` color (#B5AAA0)

### Tags

Uniform treatment for all tag types — no color-coding by tag type.

- Background: `tag` (#F3EDE8)
- Text: `textSoft`, 11px, 500 weight
- Border radius: 8px
- Padding: 2px 8px
- × icon for removal (XSmall, textMuted color)

### Primary Button (CTA)

Full-width action buttons used in onboarding and modals.

- Background: `accent` (or `border` when disabled)
- Text: white (or `textMuted` when disabled)
- Font: 15px, 700 weight, system sans
- Padding: 15px 0
- Border radius: 14px
- No border
- Cursor changes to default when disabled

### Confirmation Dialog

Overlay dialog for destructive actions (delete) and confirmations.

- Backdrop: `overlay` (rgba(44,36,32,0.45))
- Card: `card` background, 18px border radius, `0 12px 40px rgba(44,36,32,0.2)` shadow
- Title: 16px, 700 weight
- Body: 14px, textSoft, 1.5 line-height
- Two buttons side by side: Cancel (tag background, textSoft) and action (accent or danger background, white text)

### Inline Pickers (Child Picker, Tag Editor)

Panels that expand inline below their trigger element. Consistent card treatment.

- Background: `card`
- Border: `1px solid border`
- Border radius: 14px
- Padding: 12px 16px
- Entry animation: `fadeInUp 0.2s ease both`
- Child picker: toggle pills for all children (selected = colored border + tinted background + checkmark; unselected = border color, card background, textMuted)
- Tag editor: text input + "Your Frequent Tags" section with tappable pills
- Both stay open for multi-select; dismiss by tapping outside (child picker) or selecting (tag editor)

### Birthday Picker (Inline Scroll Wheels)

Expands inline within the Add Child card when the birthday row is tapped.

- Three columns: Month (35% width), Day (25%), Year (30%)
- Column height: 120px with overflow hidden
- Each row: 40px height, centered text
- Selected row: Georgia serif 16px 700 weight, text color; highlighted by `accentSoft` band behind it (40px tall, 10px radius)
- Unselected rows: 14px 400 weight, textMuted color
- Fade edges: linear gradient from card → transparent at top and bottom of each column (36px fade height)
- Confirm button: full-width "Set birthday" (accent background, white text, 10px radius)
- Entry animation: `fadeInUp 0.2s ease both`

---

## Shadows

All shadows use warm-tinted rgba based on the text color `(44,36,32,...)` — never pure black.

| Shadow | Usage |
|---|---|
| `0 1px 3px rgba(44,36,32,0.04)` | Inactive tabs |
| `0 1px 3px rgba(44,36,32,0.06)` | Standard entry cards |
| `0 2px 8px childColor18` | Active child tabs (tinted to child color) |
| `0 2px 12px rgba(44,36,32,0.06)` | Prompt cards |
| `0 2px 12px rgba(232,114,74,0.2)` | Accent-tinted elements |
| `0 4px 20px rgba(232,114,74,0.35)` | Mic button (Home) |
| `0 4px 24px rgba(44,36,32,0.12)` | Notification card |
| `0 8px 32px rgba(44,36,32,0.12)` | Phone frame (wireframe) |
| `0 12px 40px rgba(44,36,32,0.2)` | Modal/dialog cards |
| `0 0 20px/40px rgba(232,114,74,...)` | Pulsing mic button glow (animated) |
| `0 0 0 1.5px accent30, 0 2px 8px accentGlow` | Favorited entry card glow |
| `0 0 0 1.5px accent25, 0 3px 12px accent10` | Core Memories card glow |
| `0 0 20px accent18, 0 2px 12px rgba(44,36,32,0.06)` | First-entry celebration card |

---

## Animations

| Name | Keyframes | Usage |
|---|---|---|
| `pulseGlow` | Shadow 20px↔40px at accent opacity | Mic button pulse — recording screens, onboarding |
| `fadeInUp` | opacity 0→1, translateY 16px→0 | Entry cards staggered entrance, inline pickers, prompt cards |
| `slideUp` | opacity 0→1, translateY 40px→0 | Larger entrance movements |
| `scaleIn` | opacity 0→1, scale 0.8→1 | Heart icon on Memory Saved screen |
| `breathe` | scale 1→1.15→1 | Breathing circle during active recording |
| `ringPulse` | scale 1→1.7, opacity 0.12→0 | Expanding ring behind breathing circle |
| `bannerIn` | translateY -100%→0, opacity 0→1 | "Memory saved" confirmation banner |
| `panelIn` | translateX 100%→0, opacity 0→1 | Flow map detail panel |

**Entry card stagger:** Cards animate in with `fadeInUp` at 60ms intervals (`delay={i * 60}`).

**Banner auto-dismiss:** The "Memory saved" banner on Entry Detail goes through phases: `in` (bannerIn) → `fading` (opacity 0.4s) → `collapsing` (max-height/margin/padding 0.3s) → `none`.

---

## Paper Texture

Cards and transcript areas use a subtle SVG noise texture overlay for a journal feel. The texture is a fractal noise pattern at 2.5% opacity — visible on close inspection but never distracting.

```
feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4"
rect opacity="0.025"
```

Applied via CSS `backgroundImage` on: entry cards, transcript text area, prompt cards, form cards (Add Child), and text entry areas. Not applied to: tabs, pills, buttons, settings rows, or UI chrome.

---

## Gradients

| Gradient | Where |
|---|---|
| `radial-gradient(ellipse at 50% 40%, rgba(244,226,214,0.45) 0%, transparent 70%)` | Recording and Empty State backdrop — warm center glow |
| `linear-gradient(180deg, #F9F2EB 0%, bg 35%)` | Core Memories screen — warmer top fading to standard cream |
| `linear-gradient(180deg, bg 0%, #F5F0EB 100%)` | Notification screen — subtle warm base |
| `linear-gradient(to bottom, bg@0 0%, bg@55% 55%, bg 100%)` | Home screen bottom fade — content dissolves into mic button area |
| `linear-gradient(135deg, accentSoft 0%, rgba(255,240,235,0.5) 100%)` | First-entry celebration banner |
| `linear-gradient(card, transparent)` / `linear-gradient(transparent, card)` | Birthday picker scroll wheel fade edges |

---

## Tone & Language

The interface speaks in warm, encouraging language. Never clinical, never instructive, never guilt-inducing.

| Context | ✅ Do | ❌ Don't |
|---|---|---|
| Empty states | "No memories yet" | "No data found" |
| Core Memories empty | "Tap the heart on any entry to save it as a Core Memory" | "You haven't favorited any entries" |
| Search empty | "No memories found. Try different keywords or filters." | "0 results" |
| Delete confirmation | "Delete this memory?" | "Are you sure you want to delete?" |
| Recovery | "Entries are kept for 30 days" | "Items in trash will be permanently deleted" |
| Notification | "What made Emma smile today?" | "You haven't recorded today" |
| Notification age line | "She's 2 years, 4 months old — these days go fast." | (no age reference) |
| Memory saved | "Your voice and your words — kept forever." | "Entry saved successfully" |
| Onboarding | "A gentle nudge at bedtime" | "Enable push notifications" |
| Mic permission | "Nothing is ever recorded without you pressing the button" | "Microphone access required" |
| First entry | "This is where all your memories will live" | "Welcome to your dashboard" |

**General principles:**
- Use the child's name whenever possible — "Emma's first memory" not "your first entry."
- Frame features as emotional outcomes — "kept forever" not "stored in cloud."
- No streak counters, no "you missed X days," no guilt for inactivity.
- Encourage, don't instruct. "Or write instead" not "Switch to text input mode."
- The notification is a "gentle nudge" not a "reminder" or "alert."

---

## Visual Hierarchy by Screen

Each screen has a distinct emotional weight, created through background treatment and typography choices.

| Screen | Background | Title Font | Card Style | Emotional Role |
|---|---|---|---|---|
| Home | Flat `bg` cream | Georgia serif (app title only) | Standard cards (system sans preview) | Inbox — scan, capture, move on |
| Recording | Radial warm gradient | — | Prompt cards (Georgia serif) | Focus — calm, encouraging |
| Entry Detail | Flat `bg` cream | — | Transcript area (Georgia serif, paper texture) | Workshop — edit, refine, enrich |
| Search | Flat `bg` cream | System sans | Standard cards with highlights | Utility — find, filter |
| Core Memories | Warm gradient top (#F9F2EB→cream) | Georgia serif | Larger cards (serif preview, inline audio, amber glow) | Treasure box — slow down, savor |
| Settings | Flat `bg` cream | System sans | Grouped list rows | Configuration — functional |
| Notification | Warm gradient | System sans | Frosted glass card | Nudge — personal, inviting |
| Onboarding | Flat `bg` cream (except recording step) | Georgia serif | Paper-textured form cards | Welcome — emotional, progressive |