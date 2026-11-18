# Orbi — Tactile dark SaaS with handmade prism warmth

## Overview

Orbi pairs a deep charcoal-ink canvas with playful, tactile micro-interactions, soft prism-glow edges, and generous rounded corners. It feels crafted by an indie studio rather than assembled from an enterprise UI kit, making it ideal for creative SaaS launches and invite-only waitlists.

### Essentials

- **Canvas:** Warm ink-black `#0d0d0d` with tactile charcoal cards (`#171717`, `#232323`) and subtle hairline rims.
- **Color energy:** Quiet monochrome shell punctuated by coral-pink `#ff5e7e` primary actions and a delicate multi-stop prism edge glow (`#ff5e7e`, `#ff9f43`, `#45d9e8`, `#a78bfa`) used only on the hero focal frame.
- **Typography:** Friendly geometric `Instrument Sans` headings paired with crisp `Inter` UI copy.
- **Shape language:** Soft, approachable `16px`–`24px` cards and pill-shaped buttons (`999px`).
- **Pacing:** Compact centered hero with an inline waitlist input, followed by interactive bento artifacts rather than repetitive text columns.

---

## Colors

### Accent

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Coral Spark | `#ff5e7e` | `--color-accent` | Primary CTA, active tab | Primary buttons, focus highlights, prism start |
| Tangerine Glow | `#ff9f43` | `--color-prism-warm` | Secondary prism stop | Subtle border shimmer and badge accent |
| Cyan Mist | `#45d9e8` | `--color-prism-cool` | Tertiary prism stop | Live status dots and canvas cursor tags |
| Iris Halo | `#a78bfa` | `--color-prism-violet` | Accent tint | Collaboration cursor and prism tail |

### Neutral

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Ink Canvas | `#0d0d0d` | `--color-canvas` | Page background / stage | Root viewport background |
| Soft Obsidian | `#161616` | `--color-surface` | Card background | Bento modules and input wells |
| Charcoal Artifact | `#232323` | `--color-surface-raised` | Raised chip / hover fill | Interactive artifact trays and pill tags |
| White-alpha Edge | `#232323` | `--color-border` | Hairline border | Subtle 1px divider (renders identically over `#0d0d0d` to `rgba(255,255,255,0.09)`) |
| Chalk Paper | `#f6f4ef` | `--color-text` | Primary text | Headlines and primary labels |
| Warm Graphite | `#9c978f` | `--color-text-muted` | Secondary text | Subcopy, hints, timestamps |
| Ash Caption | `#6b6760` | `--color-text-subtle` | Micro-labels | Footer metadata and shortcut hints |

---

## Typography

- **Instrument Sans** — Display and section headings; geometric yet warm with slightly pinched terminals that reinforce the handmade tone. Exact Google Font available.
- **Inter** — Body prose, form labels, and keyboard shortcut pills. Exact Google Font available.

| Recipe | Font | Weight | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- | --- |
| Hero Title | Instrument Sans | 600 | 56px | 1.06 | -0.03em | Main landing headline |
| Section Heading | Instrument Sans | 600 | 32px | 1.15 | -0.02em | Feature chapter headers |
| Card Title | Instrument Sans | 500 | 18px | 1.3 | -0.01em | Bento artifact titles |
| Body Lead | Inter | 400 | 17px | 1.6 | 0em | Hero subtitle and intro |
| UI Body | Inter | 400 | 14px | 1.55 | 0em | Card descriptions and inputs |
| Shortcut Chip | Inter | 500 | 12px | 1.2 | 0.02em | Keycaps and waitlist status pills |

### Notes
- Never use uppercase all-caps for long headings; keep headings in sentence case for friendliness.
- Pair tight negative tracking (`-0.03em`) on `Instrument Sans` above `32px`.

---

## Layout

- **Density:** Airy, centered focal flow with `1080px` max container width (`20px` side padding on mobile, `32px` on desktop).
- **Spacing scale:** `4px`, `8px`, `12px`, `16px`, `24px`, `40px`, `72px`, `112px`.
- **Grids:** Asymmetric bento (`7 cols + 5 cols` alternating with `5 cols + 7 cols`), never three identical narrow cards.

---

## Corner radius

- Outer artifact cards: `22px`
- Nested preview frames: `14px`
- Input shells and pills: `999px`
- Keycap badges: `8px`

---

## Surfaces and depth

- Base canvas `#0d0d0d` -> Card surface `#161616` -> Interactive chip `#232323`.
- Cards rely on `1px solid #232323` plus a subtle inner top highlight `inset 0 1px 0 rgba(255, 255, 255, 0.06)`.
- The single hero preview frame uses a soft `1px` rainbow-prism border gradient (`linear-gradient(120deg, #ff5e7e, #ff9f43, #45d9e8, #a78bfa)`) at 40% opacity — nowhere else on the page.

---

## Components

### Waitlist Pill Form
- **Use:** Hero and closing CTA email capture.
- **CSS:** `display: flex; align-items: center; background: #161616; border: 1px solid #232323; border-radius: 999px; padding: 6px 6px 6px 20px;`
- **Text style:** `14px` Inter `#f6f4ef`, placeholder `#6b6760`.
- **States:** Focus-within shifts border to `#ff5e7e` with a soft `0 0 0 3px rgba(255, 94, 126, 0.18)` ring.

### Primary Pill Button
- **Use:** Submitting the waitlist or launching the interactive sandbox.
- **CSS:** `background: #ff5e7e; color: #0d0d0d; font-weight: 600; border-radius: 999px; padding: 10px 20px;`
- **States:** Hover brightens to `#ff7893`; active presses `scale(0.98)`.

### Handmade Artifact Card
- **Use:** Showcasing a single live micro-interaction (sticker drag, color picker, multiplayer cursor).
- **CSS:** `background: #161616; border: 1px solid #232323; border-radius: 22px; padding: 28px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);`

---

## Imagery and graphics

- Use custom vector UI vignettes, crisp cursors, and tactile stickers instead of stock photography.
- **Build recipe (Prism Rim Frame):** Wrap the hero showcase in a `1px` padded container with `background: linear-gradient(135deg, rgba(255,94,126,0.5), rgba(255,159,67,0.4), rgba(69,217,232,0.4), rgba(167,139,250,0.45))` and place an inner `#161616` panel at `border-radius: 21px`. Keep any outer blur under `24px` and opacity below `0.15`.

---

## Section recipes

### First screen (Hero)
- Compact floating top bar (brand mark left, 2 links center, single pill CTA right).
- Small translucent status pill (`"Private beta · Batch 04"`), 2-line sentence-case headline (`56px`), 1-sentence subtitle, and the Waitlist Pill Form centered above the Prism Rim interactive showcase.

### Alternating Artifact Rows
- Row 1: `7/5` split — interactive canvas vignette left, crisp 3-line explanation and keyboard shortcut chip right.
- Row 2: `5/7` split — narrative left, tactile toggle/reaction strip right.

### Closing Invitation
- Full-width `#161616` rounded card (`24px`) with centered headline, Waitlist Pill Form, and tiny monospace privacy promise.

---

## Page flow

1. Floating navigation bar
2. Centered hero + waitlist pill + prism-rimmed product stage
3. Asymmetric bento chapter 1 (speed / craft)
4. Asymmetric bento chapter 2 (playful multiplayer details)
5. Single quiet pull-quote from a maker
6. Closing waitlist card + minimal single-row footer

---

## Writing

- **Voice:** Warm, playful, self-aware, concrete — sounds like a craftsperson showing a prototype to a friend.
- **Patterns:** Short verb-led headlines (`"Make messy ideas feel tidy."`), crisp micro-hints (`"Press Space to shuffle"`).
- **Words to use:** craft, sketch, canvas, play, tactile, quick, tidy.
- **Words to avoid:** supercharge, unlock, revolutionize, seamless, AI-powered synergy.
- **Do not copy:** Never copy existing waitlist counts, founder names, or trademarked product names.

---

## Do's and Don'ts

### Do
- Keep the prism gradient strictly to a 1px rim on the hero stage so the `#0d0d0d` canvas stays calm.
- Use `22px` card radii and `999px` pill buttons consistently.
- Give interactive chips tactile hover states (`#232323` fill shift + `1px` lift).

### Don't
- Do not flood the background with massive blurred rainbow blobs.
- Do not mix sharp `2px` enterprise corners with `22px` rounded cards.
- Do not add dense multi-tier pricing tables on a waitlist-style landing page.

---

## Motion and responsive

- **Observed:** Springy micro-lifts (`220ms`, `cubic-bezier(0.22, 1, 0.36, 1)`) on pill buttons and artifact chips; gentle hover tilt (`1deg`) on stickers.
- **Transfer:** Collapse 7/5 bento splits into single-column stacks below `768px` with `16px` horizontal padding; keep touch targets at least `44px` tall.
- **Unknown:** Scroll-linked parallax speed on mobile Safari — default to static layout under `prefers-reduced-motion: reduce`.

---

## How to use this guide

Paste this entire `DESIGN.md` into your coding assistant alongside a one-paragraph description of your product. Ask it to implement the tokens first, then assemble the hero and asymmetric artifact chapters while auditing against the Don'ts list.
