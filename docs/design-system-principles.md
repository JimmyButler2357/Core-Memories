# Core Memories — Design System Principles

This document is the **source of truth** for all UI implementation in Core Memories. Every component, screen, and style must conform to these principles. When in doubt, reference this file — not individual component code.

---

## 1. Typography Scale

Five sizes only. No in-between values.

| Name          | Size | Weight  | Line-height | Usage                                      |
|---------------|------|---------|-------------|--------------------------------------------|
| title         | 22px | 800     | 1.3         | App title ("Core Memories")                |
| heading       | 16px | 700     | 1.4         | Screen headers, dialog titles              |
| body          | 14px | 400     | 1.5         | Entry text, descriptions, form inputs      |
| label         | 12px | 500–700 | 1.4         | Timestamps, section headers, labels        |
| caption       | 11px | 500     | 1.3         | Tags, audio timestamps, tiny metadata      |

### Font families

- **System sans**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — used everywhere by default
- **Serif accent**: `'Georgia', serif` — used **only** for the app title and entry body text

### Rules

- Never invent a 6th size. If a design calls for 13px or 15px, use the nearest scale value (12 or 14).
- Weight 500–600 is acceptable for labels; weight 700 is reserved for section headers and tiny-label uppercase treatments.
- Uppercase + letter-spacing 0.8px is only used for tiny section headers at 12px.

---

## 2. Color Palette

All colors must come from this token table. Never hardcode hex values in components — always reference the theme.

### Core tokens

| Token         | Hex                      | Usage                              |
|---------------|--------------------------|------------------------------------|
| bg            | `#FAF8F5`                | Page / screen background           |
| card          | `#FFFFFF`                | Card surfaces                      |
| text          | `#2C2420`                | Primary text, dark brown           |
| textSoft      | `#8C7E74`                | Secondary text, icons              |
| textMuted     | `#B5AAA0`                | Tertiary / placeholder text        |
| accent        | `#E8724A`                | Primary accent (warm orange)       |
| accentSoft    | `#FFF0EB`                | Accent tint background             |
| accentPressed | `#D4613B`                | Pressed/active state for accent    |
| heartFilled   | `#E8724A`                | Favorited heart                    |
| heartEmpty    | `#D9D2CB`                | Unfavorited heart stroke           |
| border        | `#EDE8E3`                | Card/section borders               |
| tag           | `#F3EDE8`                | Tag pill background                |
| success       | `#4CAF7C`                | Positive feedback (saved, done)    |
| successSoft   | `#E8F5EE`               | Success tint background            |
| warning       | `#E8A94A`                | Warning states                     |
| warningSoft   | `#FFF5E6`               | Warning tint background            |
| danger        | `#D94F4F`                | Destructive action (delete)        |
| overlay       | `rgba(44,36,32,0.45)`   | Modal backdrop                     |

### Per-child colors

| Child   | Color                |
|---------|----------------------|
| Emma    | `#7BAFD4` (blue)     |
| Liam    | `#D4A07B` (amber)    |
| Nora    | `#9BC49B` (green)    |
| General | `#B5AAA0` (muted)    |

- Child color at **100%** for text and dot indicators
- Child color at **12% opacity** (`{color}20`) for pill backgrounds
- Child color at **25% opacity** for active filter tab backgrounds

### Rules

- Never use raw hex in component code. Always pull from the theme object.
- If a new semantic color is needed, add it here first, then implement.
- Opacity variants of existing colors don't need new tokens — use runtime opacity.

---

## 3. Spacing System

All spacing values must land on the **4px grid**. No odd numbers, no 3px, no 10px, no 14px, no 18px.

### Scale

| Token | Value |
|-------|-------|
| xs    | 4px   |
| sm    | 8px   |
| md    | 12px  |
| lg    | 16px  |
| xl    | 20px  |
| 2xl   | 24px  |
| 3xl   | 32px  |
| 4xl   | 48px  |

### Common assignments

| Context                 | Value  | Token |
|-------------------------|--------|-------|
| Screen padding (horiz.) | 20px   | xl    |
| Card padding            | 16px   | lg    |
| Section gap (cards)     | 12px   | md    |
| Inner element gap       | 8px    | sm    |
| Tight spacing (pills)   | 4px    | xs    |

### Rules

- If a spacing value doesn't appear in the scale, round to the nearest value that does.
- Margin-bottom between cards is always `md` (12px).
- Padding inside cards is always `lg` (16px).

---

## 4. Border Radius

Four tiers only. No 14px, no 18px, no 10px, no 20px.

| Tier | Value    | Usage                                         |
|------|----------|-----------------------------------------------|
| sm   | 8px      | Tags, small pills, progress bars              |
| md   | 12px     | Buttons, child pills, inputs, dialogs         |
| lg   | 16px     | Cards, entry cards, modals, confirm dialogs   |
| full | 9999px   | Filter chips, filter tabs, circular elements  |

### Rules

- Every `border-radius` in the codebase must use one of these four values.
- If a design shows a value between tiers, round to the nearest tier.
- The phone frame itself uses radius 40 — this is the only exception (it's a device bezel, not UI).

---

## 5. Shadow & Elevation

Three levels plus an accent glow. All shadows use warm brown `rgba(44,36,32,...)` as the base color.

| Level       | Value                                  | Usage                          |
|-------------|----------------------------------------|--------------------------------|
| sm          | `0 1px 3px rgba(44,36,32,0.06)`       | Cards, default surfaces        |
| md          | `0 4px 12px rgba(44,36,32,0.10)`      | Raised elements, dropdowns     |
| lg          | `0 12px 40px rgba(44,36,32,0.20)`     | Modals, confirm dialogs        |
| accent glow | `0 4px 20px rgba(232,114,74,0.35)`    | Primary CTA (record button)    |

### Rules

- Never use black (`rgba(0,0,0,...)`) for shadows. Always use the warm brown base.
- Cards always get `sm` shadow. Modals always get `lg`.
- The accent glow is only for the primary floating action button.

---

## 6. Interactive States

Every tappable element must meet accessibility standards and provide visible feedback.

### Touch targets

- **Minimum hit area**: 44×44px (Apple HIG / Material guideline)
- If the visual element is smaller (e.g., a 36px icon button), expand the tappable area with padding or an invisible hit-area wrapper.

### Pressed states

| Element type    | Pressed feedback                                          |
|-----------------|-----------------------------------------------------------|
| Accent button   | Background → `accentPressed` (#D4613B)                    |
| Ghost button    | Background → `accentSoft` (#FFF0EB)                       |
| Card (tappable) | Background → `#F7F4F1` (slight darken from card white)    |
| Icon button     | Opacity 0.6                                               |
| Filter tab      | Opacity 0.7                                               |

### Focus rings

- Visible focus ring for keyboard/assistive navigation: `2px solid accent` with `2px offset`
- Only visible on `:focus-visible`, not on tap/click

---

## 7. Transitions

Keep everything fast and purposeful. Motion should feel responsive, never sluggish.

### Duration table

| Element              | Duration | Easing                |
|----------------------|----------|-----------------------|
| Button press         | 100ms    | ease-out              |
| Background/color     | 150ms    | ease-in-out           |
| Card hover/press     | 150ms    | ease-in-out           |
| Modal enter          | 200ms    | ease-out              |
| Modal exit           | 150ms    | ease-in               |
| Screen transition    | 250ms    | ease-in-out           |
| Skeleton shimmer     | 1500ms   | linear (loop)         |

### Rules

- **Maximum duration**: 300ms for any user-initiated transition. Nothing should feel slow.
- Skeleton/loading shimmer is the only exception (loops at 1500ms).
- Always respect `prefers-reduced-motion: reduce` — disable all non-essential animation, keep only opacity fades at 0ms.

---

## 8. Empty, Loading & Error States

Every screen must handle all three states. Never show a blank screen.

### Empty states

- Centered layout with a relevant icon (muted color, 48px)
- Warm, encouraging headline (16px heading weight)
- Supportive body text (14px, textSoft)
- Primary action button when applicable ("Record your first memory")
- Tone: warm, never clinical. "No memories yet" not "No data found"

### Loading states

- Use skeleton screens that mirror the final layout shape
- Skeleton color: `#EDE8E3` (border token) with shimmer animation
- Never use spinners as the sole loading indicator
- Skeleton cards should match card dimensions (radius, padding)

### Error states

- Friendly icon + warm message ("Something went wrong" not "Error 500")
- Body text explaining what happened in plain language
- "Try again" button as primary action
- Optional secondary action ("Go back")
- Use `danger` color sparingly — only for the icon or a subtle accent, not the entire message
