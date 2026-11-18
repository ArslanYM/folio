# ORYZO AI — Style Reference

> A museum-grade dark editorial showcase that treats a hardware or 3D AI product as a sculptural artifact under dramatic overhead lighting, paired with uppercase grotesk typography and warm cork-toned surfaces.

**Theme:** dark

---

## Tokens — Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Gallery Void | `#0a0a09` | `--color-canvas` | Primary page background / canvas |
| Basalt Stage | `#141311` | `--color-surface` | Default card and plinth surface |
| Warm Charcoal | `#1d1b18` | `--color-surface-raised` | Raised panels and specification drawers |
| Ochre Gold | `#d99b26` | `--color-accent` | Primary accent, active indicators, CTA fill |
| Burnished Brass | `#9e6f18` | `--color-accent-muted` | Subtle accent border and hover tint |
| Limestone Ivory | `#f3efe6` | `--color-text` | Primary headline and body foreground |
| Warm Stone | `#b9b1a3` | `--color-text-secondary` | Supporting editorial prose |
| Muted Ash | `#857d70` | `--color-text-muted` | Captions, metadata, specimen labels |
| Hairline Umber | `#2c2822` | `--color-border` | Structural 1px dividers |
| Telemetry Cyan | `#4ea8de` | `--color-info` | Subtle technical readout indicator |
| Signal Crimson | `#e05252` | `--color-danger` | Error and alert states |

---

## Tokens — Typography

### AK Monument Grotesk —

Display typeface for hero titles, section numerals, and museum-plaque headers. Always set in uppercase with tight line-height and measured tracking. Substitute with `Inter` (weight 800) when unavailable.

- Weights: `700`, `800`
- Transform: `uppercase`
- Tracking: `0.06em` to `0.12em`

### Inter —

Neutral body and specification typeface for technical specs, descriptions, and UI controls. Keeps long copy quiet so the product render remains the focal point.

- Weights: `400`, `500`, `600`
- Line height: `1.55` for prose, `1.35` for spec tables

### Type Scale

| Level | Font | Weight | Size | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Hero Plaque | AK Monument Grotesk | 800 | 72px | 0.96 | 0.06em |
| Section Display | AK Monument Grotesk | 700 | 40px | 1.05 | 0.08em |
| Artifact Title | AK Monument Grotesk | 700 | 22px | 1.15 | 0.08em |
| Lead Copy | Inter | 400 | 18px | 1.55 | 0em |
| Body | Inter | 400 | 15px | 1.6 | 0em |
| Specimen Label | Inter | 600 | 11px | 1.2 | 0.14em |

---

## Surfaces

Warm mineral and cork-tinted dark surfaces prevent the page from feeling cold or clinical.

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| Cork Plinth | `#2a241d` | `--surface-cork` | Featured hardware callout block |
| Cork Border | `#40372e` | `--surface-cork-border` | 1px hairline border around cork panels |
| Recessed Well | `#060605` | `--surface-well` | Deep recessed frame for 3D canvas |

---

## Elevation

- No heavy drop shadows on dark backgrounds; separate planes strictly with luminance steps (`#0a0a09` -> `#141311` -> `#1d1b18`) and 1px hairline borders (`#2c2822` or `#40372e`).
- Overlays and floating spec bars use `backdrop-filter: blur(12px)` over `rgba(10, 10, 9, 0.84)`.

---

## Components

### Primary Action Button

- **Use:** Single hero action or preorder trigger.
- **CSS:** `background: #d99b26; color: #0a0a09; border-radius: 2px; padding: 14px 26px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;`
- **States:** Hover shifts fill to `#e5ab3c`; focus uses a 2px offset outline in `#d99b26`.

### Specimen Metadata Strip

- **Use:** Horizontal 1px-bordered spec bar beneath a 3D render listing dimensions, materials, and latency.
- **CSS:** `display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #2c2822; border-bottom: 1px solid #2c2822;`

### Cork Feature Panel

- **Use:** Editorial deep-dive beside an exploded hardware diagram.
- **CSS:** `background: #2a241d; border: 1px solid #40372e; border-radius: 4px; padding: 32px;`

---

## Imagery

- Product objects are centered on a `#060605` or `#0a0a09` stage with a single top-left warm specular highlight.
- Avoid stock office photography, floating UI mockups with neon glows, or cluttered collage backgrounds.
- Keep at least 20% negative space around every 3D artifact frame.

---

## Layout

- 12-column grid, max width `1320px`, `24px` gutters, `48px` outer padding on desktop (`20px` on mobile).
- Generous vertical cadence: `120px` to `160px` between major exhibition chapters.
- Asymmetric splits (`5 cols copy / 7 cols artifact` or `4 cols spec list / 8 cols render`) rather than symmetrical 3-column feature grids.

---

## Typography Voice

- Spare, curatorial, declarative. Sentences stay under 16 words.
- Lead with physical materials, precision numbers, and tactile verbs.
- Uppercase labels read like gallery wall placards (`01 / ACOUSTIC CHASSIS`, `WEIGHT — 412G`).

---

## Do's and Don'ts

### Do
- Pair `#2a241d` cork callout surfaces with `#40372e` hairline borders for warm tonal separation.
- Keep display headings uppercase in `AK Monument Grotesk` (or `Inter` 800) with at least `0.06em` letter-spacing.
- Reserve `#d99b26` for at most one primary button per viewport.
- Maintain 120px+ vertical breathing room around hero and object stages.

### Don't
- Do not use rounded pill buttons (`border-radius: 999px`) — corners stay architectural (`2px` to `4px`).
- Do not add purple/blue gradients or glowing blurred background orbs.
- Do not place three identical feature cards in a row; alternate asymmetric editorial rows and spec strips.
- Do not drop body contrast below `#b9b1a3` on `#0a0a09`.

---

## Agent Prompt Guide

When prompting an AI coding agent with this reference:
1. Specify the single hero object or visual centerpiece first.
2. Enforce `2px`–`4px` architectural radii and zero drop shadows.
3. Ask the agent to audit uppercase tracking and hairline borders before completing.

---

## Quick Start

```css
:root {
  --color-canvas: #0a0a09;
  --color-surface: #141311;
  --color-surface-raised: #1d1b18;
  --color-accent: #d99b26;
  --color-accent-muted: #9e6f18;
  --color-text: #f3efe6;
  --color-text-secondary: #b9b1a3;
  --color-text-muted: #857d70;
  --color-border: #2c2822;
  --surface-cork: #2a241d;
  --surface-cork-border: #40372e;
  --surface-well: #060605;
  --font-display: "AK Monument Grotesk", "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-sharp: 2px;
  --radius-panel: 4px;
}
```
