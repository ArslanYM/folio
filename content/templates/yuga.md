# Yuga — High-contrast mixed-stage editorial & brutalist grid

## Overview

Yuga alternates stark obsidian-black and warm paper-white full-bleed stages separated by hard 1px rules, kinetic pixel-field textures, and bold grotesque headlines. It pairs Swiss editorial discipline with punchy vermilion accents and zero ornamental gradients.

### Essentials

- **Mixed polarity stages:** Alternates between deep stage black (`#0b0b0c`) and warm paper white (`#f8f7f4`) chapters so every scroll transition feels like turning an exhibition print.
- **Accent discipline:** Signal vermilion (`#ff3b1f`) hits hard against both black and white stages; never soften it with blur or transparency gradients.
- **Typography:** Tightly tracked geometric grotesk (`Aeonik Pro`, substituted with `DM Sans`) paired with `Inter` for dense editorial captions and numeric indices.
- **Brutalist geometry:** Sharp `0px`–`4px` corners, visible structural gridlines, and 1-bit pixel-field visual accents.
- **Page-type variants:** Supports dedicated drop/event accent overrides while keeping the core grid invariant.

---

## Colors

### Accent

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Signal Vermilion | `#ff3b1f` | `--color-accent` | Primary CTA, active index | Primary buttons, ticker badges, focal highlights |
| Vermilion Dark | `#cc2b14` | `--color-accent-hover` | Hover state | Pressed and hover state for vermilion fills |
| Acid Pixel | `#19c37d` | `--color-signal-live` | Live status indicator | Active drop badge and terminal status dot |

### Neutral

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Stage Black | `#0b0b0c` | `--color-stage-dark` | Dark stage background / canvas | Hero, media chapters, and footer background |
| Paper White | `#f8f7f4` | `--color-stage-light` | Light stage background / canvas | Editorial manifesto and archive index chapters |
| Carbon Panel | `#161618` | `--color-surface-dark` | Dark stage card | Recessed media wells on dark stages |
| Chalk Panel | `#eeece6` | `--color-surface-light` | Light stage card | Inset table panels on light stages |
| Graphite Rule | `#2b2b30` | `--color-border-dark` | Dark structural rule | 1px gridlines on `#0b0b0c` stages |
| Stone Rule | `#d8d5cc` | `--color-border-light` | Light structural rule | 1px gridlines on `#f8f7f4` stages |
| Ink Primary | `#111113` | `--color-ink-light-stage` | Text on light stage | High-contrast headlines and prose on `#f8f7f4` |
| Bone White | `#f4f3ef` | `--color-ink-dark-stage` | Text on dark stage | Headlines and prose on `#0b0b0c` |
| Slate Muted | `#7c7b78` | `--color-text-muted` | Secondary captions | Timestamps, column indices, credits |

### Page-type variants

| Name | Value | Token | Roles | Use | Only for |
| --- | --- | --- | --- | --- | --- |
| Ultraviolet Flash | `#7c3aed` | `--color-variant-drop` | Event hero accent | Countdown numbers and ticket CTA | Live drops & events |
| Archive Ochre | `#e0a82e` | `--color-variant-editorial` | Pull-quote rule | Marginalia callouts and issue badges | Longform manifesto |

---

## Typography

- **Aeonik Pro** — Display headlines, oversized index numbers, and navigation labels. Substitute with `DM Sans` (bold/medium) when licensing is unavailable.
- **Inter** — Body paragraphs, dense metadata tables, and fine print.

| Recipe | Font | Weight | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- | --- |
| Monument Headline | Aeonik Pro | 700 | 84px | 0.94 | -0.04em | Full-bleed hero statement |
| Chapter Title | Aeonik Pro | 700 | 44px | 1.02 | -0.03em | Stage transition headings |
| Grid Index | Aeonik Pro | 500 | 20px | 1.2 | -0.01em | Numbered rows (`01`, `02`, `03`) |
| Editorial Body | Inter | 400 | 16px | 1.6 | 0em | Manifesto and project descriptions |
| Rail Metadata | Inter | 600 | 11px | 1.2 | 0.12em | Uppercase grid column headers |

### Notes
- Large headings (`>= 44px`) sit flush left against visible grid lines with `-0.03em` to `-0.04em` tracking.
- Numeric indices use `font-variant-numeric: tabular-nums`.

---

## Layout

- **Density:** High-signal editorial density inside a strict 12-column hairline grid (`max-width: 1440px`).
- **Spacing scale:** `0px` (shared cell borders), `8px`, `16px`, `24px`, `48px`, `96px`, `144px`.
- **Stage rhythm:** Never place two dark stages or two light stages back-to-back without a full-bleed `1px` rule and contrasting background flip.

---

## Corner radius

- Cards, media frames, and tables: `0px` (hard architectural edges)
- Buttons and chips: `2px`
- Live status dot only: `999px`

---

## Surfaces and depth

- Zero drop shadows anywhere. Depth is conveyed purely through polarity shifts (`#0b0b0c` <-> `#f8f7f4`), `1px` structural borders, and flat inset panels (`#161618` / `#eeece6`).

---

## Components

### Hard-Edge Primary Button
- **Use:** Primary stage CTA.
- **CSS:** `background: #ff3b1f; color: #0b0b0c; border: 1px solid #ff3b1f; border-radius: 2px; padding: 14px 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;`
- **States:** Hover swaps to `#cc2b14` fill; focus renders a `2px` offset outline in `#ff3b1f`.

### Ruled Index Row
- **Use:** Interactive list of projects, releases, or capabilities spanning the full 12-column grid.
- **CSS:** `display: grid; grid-template-columns: 72px 1fr auto; gap: 24px; padding: 24px 0; border-top: 1px solid currentColor;`
- **States:** Hover shifts background to `#ff3b1f` with `#0b0b0c` ink in a snappy `120ms` step.

---

## Imagery and graphics

- Full-bleed high-contrast editorial photography, monochrome halftone cuts, and generative pixel grids.
- **Build recipe (Pixel-Field Divider):** Create a `24px`-tall band using a repeating CSS radial or conic dot pattern (`background-image: radial-gradient(#2b2b30 1.5px, transparent 1.5px); background-size: 6px 6px;`) to separate dark and light chapters without soft gradients.

---

## Section recipes

### First screen (Dark Stage Hero)
- Top 1px-ruled ticker bar with wordmark left, 3 uppercase links center, vermilion action button right.
- Oversized 2-line `84px` headline pinned left across 9 columns, paired with a dense 3-column metadata rail on the right and a full-bleed framed visual below.

### Light Stage Editorial Index
- Flips background to `#f8f7f4` with `#111113` ink.
- Sticky left rail (`4 cols`) with chapter index (`02 / CAPABILITIES`) + right column (`8 cols`) of Ruled Index Rows.

### Dark Stage Showcase Band
- Flips back to `#0b0b0c`, featuring a 16:9 media stage framed by 1px `#2b2b30` hairlines and a 4-column spec strip underneath.

---

## Page flow

1. Dark stage hero (`#0b0b0c`)
2. Pixel-field divider band
3. Light stage manifesto & numbered index (`#f8f7f4`)
4. Dark stage full-bleed showcase (`#0b0b0c`)
5. Light stage partner/artifact grid (`#f8f7f4`)
6. Dark stage closing CTA & architectural footer (`#0b0b0c`)

---

## Writing

- **Voice:** Assertive, clipped, cultural-magazine tone; short declarative lines with zero filler.
- **Patterns:** Two-to-five word headlines (`"Built for kinetic brands."`), numbered labels (`"01 — SYSTEM"`).
- **Words to use:** stage, index, archive, craft, signal, print, kinetic, grid.
- **Words to avoid:** elevate, empower, bespoke solutions, next-gen platform.
- **Do not copy:** Never reuse brand names, drop titles, or copyrighted artwork from existing studio sites.

---

## Do's and Don'ts

### Do
- Alternate `#0b0b0c` and `#f8f7f4` stages so the page has unmistakable visual cadence.
- Keep corners at `0px`–`2px` and align every block to visible 1px gridlines.
- Use tabular numerals for every index number and metadata readout.

### Don't
- Do not add `box-shadow`, glassmorphism blur, or rounded `16px+` cards.
- Do not scatter multiple accent colors in the same viewport; keep vermilion `#ff3b1f` dominant.
- Do not center-align long paragraphs inside brutalist grids.

---

## Motion and responsive

- **Observed:** Crisp linear/snappy hover inversions (`120ms ease-out`) on index rows; subtle pixel-grid shimmer on hover.
- **Transfer:** On viewports `< 768px`, collapse 12-column rails into stacked full-width bordered bands (`16px` gutter) and scale hero headline from `84px` to `44px`.
- **Unknown:** Continuous WebGL pixel-field shaders on low-power devices — replace with static CSS dot patterns when `prefers-reduced-motion: reduce` is active.

---

## How to use this guide

Provide this `DESIGN.md` to your coding tool and ask it to preserve the dark/light stage alternation (`#0b0b0c` and `#f8f7f4`), `0px`–`2px` sharp geometry, and single `#ff3b1f` vermilion accent.
