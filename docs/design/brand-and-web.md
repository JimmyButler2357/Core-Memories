# Forever Fireflies — Brand Identity & Web

Visual identity, web design, and marketing asset guide. Companion to `design-style.md` (which covers the app). Everything here is about how Forever Fireflies looks *outside* the app — on the web, in the App Store, and across social channels.

---

## Brand Signature Colors

Two colors define the Forever Fireflies visual identity across all contexts:

| Role | Token | Hex | What it represents |
|---|---|---|---|
| **Warm Orange** | `accent` | `#E8724A` | Action — record, save, favorite. The doing color. |
| **Gold Glow** | `glow` | `#F2C94C` | Magic — firefly light, caught moments, celebrations. The feeling color. |

Supporting palette (same as app):

| Role | Hex |
|---|---|
| Background / page cream | `#FAF8F5` |
| Dark brown text | `#2C2420` |
| Soft brown secondary text | `#8C7E74` |
| Warm white card | `#FFFFFF` |
| Warm gold background (hero sections) | `#FDF6E3` |
| Border / divider | `#EDE8E3` |

**Rule:** Never introduce new colors in website or marketing materials. Always extend from this palette. The brand should feel like the app, just bigger.

---

## App Logo

### Concept

A **mason jar silhouette** with **2–3 glowing gold dots** inside. The jar is the metaphor — a place where you collect and keep small, precious things. The dots are fireflies, each one a memory.

### Style Notes

- Slightly organic / imperfect feel — not sharp corporate vector. Think "hand-drawn with a steady hand."
- Jar outline in dark brown (`#2C2420`), possibly slightly rounded corners on the lid
- Gold dots (`#F2C94C`) with soft glow halos — blur/glow, not hard circles
- Background: warm cream (`#FAF8F5`)
- Optional: very faint paper texture overlay in the background at ~2.5% opacity (matches in-app aesthetic)
- The jar lid could have a subtle curve rather than perfectly straight lines

### Alternatives Considered

| Option | Description | Verdict |
|---|---|---|
| A: Jar + Fireflies | Jar outline + 2-3 gold glowing dots inside | **Recommended** — tells the story, scales to small sizes |
| B: Single Firefly | One stylized firefly with a gold glow trail | More abstract — risk of not reading at small icon sizes |
| C: Jar Silhouette Only | Jar shape filled with warm-to-gold gradient | Too generic — many apps use jar imagery |

### Logo Lockups

| Lockup | When to Use |
|---|---|
| **Icon only** | App icon, favicon, square social profile image |
| **Horizontal** (icon left, text right) | Website header, email signatures, social profile bios |
| **Stacked** (icon above text) | App Store feature graphic, square social posts |

Text treatment in logo lockups: **Merriweather Black (900)**, `#2C2420`, same as the app title style.

---

## How to Create the Logo

### Option 1: Figma (DIY, Free)

1. Create a free account at figma.com
2. Draw the jar using rounded rectangles + a trapezoid lid shape
3. Add circles inside for the fireflies, apply a gaussian blur + yellow tint for the glow effect
4. Export at 1024×1024 for the app icon master file
5. Good starting search: "design minimal app icon figma" on YouTube — under 20 minutes

### Option 2: Fiverr (Hire Out, ~$30–80)

- Search: "app icon design" or "minimal logo design"
- Brief to send the designer:
  - App name: Forever Fireflies
  - Concept: mason jar silhouette, 2-3 glowing amber/gold dots inside
  - Colors: `#FAF8F5` background, `#2C2420` jar outline, `#F2C94C` glowing dots
  - Style: slightly hand-drawn / organic, warm, journal-like — NOT corporate vector
  - Deliverables: 1024×1024 icon + horizontal logo lockup as SVG and PNG
- Budget: $30–50 for a good icon, $60–80 for icon + full logo lockup set

### Option 3: AI + Figma Cleanup

1. Generate concepts in Midjourney or Ideogram: `"minimal mason jar logo, 2-3 glowing amber dots inside, warm cream background, app icon style, flat design, organic, journal aesthetic"`
2. Pick the best result, then trace/clean it up in Figma for crisp vector output
3. Good for brainstorming, but you'll still need Figma to produce final production-quality assets

---

## Splash Screen

The first thing users see when they open the app. Think of it as the cover of the journal — it sets the emotional tone in ~1.5 seconds.

### Animation Sequence

| Time | What happens |
|---|---|
| 0ms | Screen fills with warm cream (`#FAF8F5`) |
| 200ms | A single gold dot (`#F2C94C`) fades in at center, gently pulses once — like a firefly blinking |
| 600ms | "Forever Fireflies" fades in below the dot in Merriweather Black, dark brown (`#2C2420`) |
| 1000ms | The gold dot slowly drifts upward and fades out — like a firefly floating away |
| 1300ms | The screen cross-fades into the Home feed |

**Optional tagline** below the title at `#B5AAA0` (textMuted): *"Catch the moments before they fade."* — only include if it doesn't feel cluttered.

### Design Details

| Element | Value |
|---|---|
| Background | Flat `#FAF8F5` — no gradient, keep it clean |
| Gold dot size | 8–12px circle |
| Gold dot glow | `box-shadow: 0 0 20px rgba(242,201,76,0.35)` |
| App title font | Merriweather Black (900), 28px, letter-spacing -0.5 |
| App title color | `#2C2420` |

### How the Splash Connects to the Logo

The gold dot on the splash screen is the *same dot* as the ones inside the jar in your app icon. Same color, same glow. When users see the dot on the splash and then see it in the jar, it creates a visual thread — the firefly is moving from the wild into the jar. This is subtle but it makes the brand feel considered and cohesive.

### Implementation Notes

- **Static splash** (shown while JS bundle loads): Expo's `expo-splash-screen` package — a flat image of the cream background + centered logo. No animation, just a clean first frame.
- **Animated splash** (shown after JS loads, before Home feed): the sequence above, built with React Native's `Animated` API or `react-native-reanimated`.
- Static splash asset: 1284×2778px (iPhone 15 Pro Max), just logo centered on cream.
- The animated version is code, not an image.

---

## Website

### Purpose

A single "coming soon" landing page for now, expanding into a full marketing site pre-launch. Start simple: one paragraph, your tagline, an email capture field.

### Color Mapping (App → Web)

| Web Element | Color | Hex |
|---|---|---|
| Page background | `bg` | `#FAF8F5` |
| Hero section background | `glowSoft` | `#FDF6E3` |
| Body text | `text` | `#2C2420` |
| Subheadings / captions | `textSoft` | `#8C7E74` |
| CTA buttons | `accent` | `#E8724A` |
| CTA button hover | `accentPressed` | `#D4613B` |
| Highlight accents / sparkle elements | `glow` | `#F2C94C` |
| Card / section backgrounds | `card` | `#FFFFFF` |
| Borders & dividers | `border` | `#EDE8E3` |
| Footer background | `tag` | `#F3EDE8` |

### Typography on Web

| Usage | Font |
|---|---|
| All headings | **Merriweather** (free on Google Fonts — matches in-app serif exactly) |
| All body text | **Inter** or system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) |
| Brand name / hero title | Merriweather Black (900), same as app title |

### Header Layout

```
[ Jar logo ]  Forever Fireflies          Features  Pricing  About  Download
```

- Cream (`#FAF8F5`) background, warm brown (`#EDE8E3`) bottom border
- Logo mark + wordmark side by side
- Sticky on scroll

### Hero Section Concept

- Background: warm gold gradient (`#FDF6E3` → `#FAF8F5`)
- Headline (Merriweather Black, large): **"Catch the moments before they fade."**
- Subheadline (body text): "A 60-second voice journal for parents who don't want to forget the little things."
- CTA button (accent orange): "Get early access" → email capture
- Optional: small floating firefly dots (like the in-app Firefly Jar animation) behind the headline

### Sections (Full Marketing Site)

| Section | Purpose |
|---|---|
| **Hero** | Tagline + email capture |
| **How It Works** | 3-step visual: Record → Save → Revisit |
| **The Firefly Jar** | Spotlight the favorites feature — "a treasure box for your best moments" |
| **Real Stories** | Anonymized user quotes / testimonials |
| **Pricing** | Free trial + subscription tiers |
| **Download** | App Store + Play Store badges |
| **Footer** | Links, social icons, legal |

### Recommended Tool

**Framer** (framer.com) — free tier, drag-and-drop web builder. You can set your exact hex values and load Merriweather from Google Fonts. Start with a single-page "coming soon" template and expand it over time.

---

## Marketing Asset Checklist

### Priority 1 — Need at Launch

| Asset | Dimensions | Notes |
|---|---|---|
| App icon master | 1024×1024 | Source file — exported down to all sizes |
| Static splash image | 1284×2778 | iPhone 15 Pro Max — cream bg + centered logo |
| App Store screenshots | 1290×2796 × 5–8 screens | Your #1 conversion tool in the App Store |
| Social profile image | 400×400 | Cropped icon |
| Horizontal logo | SVG + PNG | Website header, email |

### Priority 2 — Before/Around Launch

| Asset | Dimensions | Notes |
|---|---|---|
| OG / link preview image | 1200×630 | Shows when you share the website link |
| App Store feature graphic | 1024×500 | Optional but adds polish to App Store listing |
| Social banner (Twitter/X) | 1500×500 | Profile header |
| Instagram story template | 1080×1920 | For behind-the-scenes content |
| Email header | ~600px wide | For waitlist emails |

### Priority 3 — Growth Phase

| Asset | Notes |
|---|---|
| Instagram Reels / TikTok templates | Short video frames for user spotlight series |
| "Memory of the Week" quote graphic | Canva template — parent quote on warm cream background |
| Google Play feature graphic | 1024×500 |
| Press kit | Logo files, screenshots, one-paragraph description, founder photo |

---

## Social Media Brand Kit (Canva)

Set up a **Forever Fireflies brand kit** in Canva (free) with:

| Item | Value |
|---|---|
| Brand color 1 | `#FAF8F5` (cream — background) |
| Brand color 2 | `#2C2420` (dark brown — text) |
| Brand color 3 | `#E8724A` (warm orange — action) |
| Brand color 4 | `#F2C94C` (gold glow — magic) |
| Heading font | Merriweather (add via Google Fonts) |
| Body font | Inter or Lato |

This lets you create on-brand posts quickly without hunting for hex codes every time.

**Hashtags to use consistently:** `#ForeverFireflies` `#CatchTheGlow` `#TonightsFirefly`

---

## Priority Order (When to Build What)

| Order | Asset | Reason |
|---|---|---|
| 1 | **App icon** | Needed for TestFlight and App Store submission |
| 2 | **Static splash** | First impression after app install |
| 3 | **Horizontal logo** | Needed for website + all social profiles |
| 4 | **Coming soon landing page** | Email capture before launch |
| 5 | **Social profile image** | Crop from icon — takes 5 minutes |
| 6 | **App Store screenshots** | Needed at launch — your most important marketing asset |
| 7 | **Animated splash** | Polish — code-based, can ship after v1 |
| 8 | Everything else | As you grow and have capacity |
