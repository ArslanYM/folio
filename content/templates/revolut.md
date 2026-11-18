# Revolut — Consumer fintech with crisp daylight clarity & object photography

## Overview

Revolut combines a dramatic obsidian hero stage showcasing a physical metal card or device object with crisp, high-trust daylight-white product chapters, confident geometric display typography, and unmistakable cobalt-blue actions. Built for consumer fintech across desktop and mobile web.

### Essentials

- **Dual-stage trust:** Opens on an immersive obsidian hero stage (`#10131a`) to spotlight physical cards and photography, then transitions cleanly into bright white (`#ffffff`) and mist-grey (`#f4f6f9`) chapters for financial clarity.
- **Action color:** Cobalt blue (`#0075eb`) signals interactive links and primary triggers; positive balances use crisp emerald (`#00b876`).
- **Typography:** Bold, tightly set `halyard-display-variable` (substituted with `Inter`) for punchy headlines, with `Inter` tabular numerals for every balance, rate, and exchange figure.
- **Object-first imagery:** Physical cards, coins, and clean mobile app screens floating over lifestyle photography rather than abstract 3D blobs.
- **Mobile-first ergonomics:** Large `48px` pill buttons, generous `20px` card radii, and thumb-friendly segmented controls.

---

## Colors

### Accent

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Fintech Cobalt | `#0075eb` | `--color-accent` | Primary CTA, active links | High-priority buttons, interactive rates, focus ring |
| Deep Cobalt | `#0052cc` | `--color-accent-hover` | CTA hover / pressed | Hover and active feedback on cobalt controls |
| Mint Positive | `#00b876` | `--color-positive` | Gains, verified badges | Positive FX movement, cashback, confirmation icons |
| Coral Alert | `#e53935` | `--color-negative` | Declines, errors | Negative deltas and form validation errors |

### Neutral

| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Obsidian Stage | `#10131a` | `--color-stage-dark` | Dark hero background / stage | Full-bleed hero and dark metal-tier showcase |
| Daylight White | `#ffffff` | `--color-stage-light` | Light page background / canvas | Primary product chapters, calculators, comparison grids |
| Mist Surface | `#f4f6f9` | `--color-surface-light` | Soft light card background | Feature tiles, FX widget shells, FAQ drawers |
| Midnight Card | `#1b202b` | `--color-surface-dark` | Dark stage card background | Floating balances and dark hero widgets |
| Hairline Mist | `#e2e7ef` | `--color-border-light` | Light dividers | Table rules and card outlines on `#ffffff` |
| Ink Slate | `#191c1f` | `--color-text-dark` | Primary text on light | Headlines, balances, and body text on white |
| Steel Muted | `#66707a` | `--color-text-muted` | Secondary text | Disclaimers, FX rate timestamps, captions |
| Pure Light Ink | `#f7f9fc` | `--color-text-light` | Primary text on dark | Hero headlines and controls on `#10131a` |

### Page-type variants

| Name | Value | Token | Roles | Use | Only for |
| --- | --- | --- | --- | --- | --- |
| Titanium Silver | `#c8ced8` | `--color-tier-metal` | Premium tier accent | Metallic plan card highlights and borders | Metal & Ultra tiers |
| Business Indigo | `#1e293b` | `--color-tier-business` | B2B hero stage | Corporate treasury and multi-currency headers | Business accounts |

---

## Typography

- **halyard-display-variable** — Bold, high-impact consumer display typeface for hero statements and large financial figures. Substitute with `Inter` (weight 700–800, tight tracking) when unavailable.
- **Inter** — Body copy, transaction lists, currency calculators, and legal footnotes. Always enable `font-variant-numeric: tabular-nums` on monetary values.

| Recipe | Font | Weight | Size | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- | --- |
| Hero Statement | halyard-display-variable | 700 | 64px | 1.02 | -0.03em | Opening hero headline |
| Section Display | halyard-display-variable | 700 | 42px | 1.08 | -0.025em | Product chapter headlines |
| Balance Metric | halyard-display-variable | 700 | 32px | 1.1 | -0.02em | Live currency/savings readouts |
| Body Lead | Inter | 400 | 18px | 1.55 | -0.005em | Chapter intro paragraph |
| UI Body | Inter | 400 | 15px | 1.55 | 0em | Feature copy and transaction rows |
| Legal Footnote | Inter | 400 | 12px | 1.5 | 0em | Regulatory notices and rate notes |

### Notes
- Keep headlines concise (3–6 words) and set in sentence case for consumer warmth.
- Monetary values must align cleanly in columns using `tabular-nums`.

---

## Layout

- **Density:** Balanced, scannable consumer layout with `1200px` max container width (`16px` mobile padding, `32px` desktop padding).
- **Spacing scale:** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `56px`, `96px`.
- **Grids:** 12-column desktop grid; interactive calculator and card preview rows use `6 cols / 6 cols` or `5 cols / 7 cols` splits, collapsing to single-column cards on mobile web.

---

## Corner radius

- Primary pill buttons: `999px`
- Feature & product cards: `20px`
- Floating balance / notification chips: `14px`
- Inputs & currency selectors: `12px`

---

## Surfaces and depth

- On `#ffffff` stages, cards sit on `#f4f6f9` with zero or minimal elevation (`0 1px 2px rgba(16, 19, 26, 0.04)`).
- Floating transaction overlays atop photography use `rgba(255, 255, 255, 0.92)` with `backdrop-filter: blur(16px)` and a soft `0 12px 32px rgba(16, 19, 26, 0.14)` shadow.
- On `#10131a` dark stages, surfaces step up to `#1b202b` with `1px solid rgba(255, 255, 255, 0.1)`.

---

## Components

### Consumer Pill CTA
- **Use:** Primary account signup and app download actions.
- **CSS:** `background: #0075eb; color: #ffffff; border-radius: 999px; height: 48px; padding: 0 28px; font-weight: 600; font-size: 15px;`
- **States:** Hover darkens to `#0052cc`; focus adds a `2px` offset `#0075eb` ring.

### Live Balance / FX Widget Card
- **Use:** Interactive currency converter or instant balance preview.
- **CSS:** `background: #f4f6f9; border: 1px solid #e2e7ef; border-radius: 20px; padding: 24px;`
- **Text style:** `32px` tabular numerals in `#191c1f`, currency code label in `14px` weight `600` `#66707a`.

### Segmented Plan Switcher
- **Use:** Switching between Personal / Business or currency tabs on desktop and mobile web.
- **CSS:** `display: inline-flex; background: #f4f6f9; border-radius: 999px; padding: 4px; gap: 4px;`
- **States:** Active segment flips to `#191c1f` background with `#ffffff` text.

---

## Imagery and graphics

- Crisp editorial lifestyle photography with natural daylight lighting, layered with sharp physical product objects (brushed metal card, contactless terminal) and one translucent floating transaction pill.
- **Build recipe (Floating Transaction Overlay):** Place a `border-radius: 14px` white/92% pill over the lower third of a lifestyle photo (`padding: 12px 16px`, merchant icon left, title + timestamp middle, tabular amount right in `#191c1f` or `#00b876` for incoming credit).

---

## Section recipes

### First screen (Dark Obsidian Hero)
- Clean top bar with wordmark, 3 top-level links, and right-aligned pill login/signup buttons.
- Left column (`6 cols`): punchy 4-word `64px` headline, 2-line value prop, single `#0075eb` pill CTA, and subtle trust note.
- Right column (`6 cols`): full-height portrait photography framed with `24px` corners and a single Floating Transaction Overlay.

### Daylight Interactive Utility Band
- Transitions to `#ffffff` stage.
- Left: headline and 3 short benefit rows (icon + title + 1-line proof). Right: interactive Live Balance / FX Widget Card on `#f4f6f9`.

### Tier / Card Comparison Strip
- Dark `#10131a` band showcasing physical card finishes side-by-side with concise scannable specs and a sticky mobile swipe rail.

---

## Page flow

1. Obsidian hero stage with photography + single floating balance pill (`#10131a`)
2. Daylight trust strip (regulatory & security facts on `#ffffff`)
3. Interactive currency / spending chapter (`#ffffff` + `#f4f6f9` widget)
4. Card craftsmanship & tier showcase (`#10131a`)
5. Global lifestyle & travel photography band (`#ffffff`)
6. Closing pill CTA + structured multi-column footer with regulatory footnotes

---

## Writing

- **Voice:** Direct, confident, consumer-friendly, transparent about numbers and fees.
- **Patterns:** Active benefit headlines (`"Spend abroad without hidden fees."`), concrete figures (`"30+ currencies"`, `"Instant freeze"`).
- **Words to use:** instant, global, transparent, everyday, control, smart, protected.
- **Words to avoid:** disrupt finance, legacy banking dinosaurs, frictionless synergy.
- **Do not copy:** Never copy actual regulatory license numbers, customer counts, trademarked plan names, or real brand marks.

---

## Do's and Don'ts

### Do
- Use `tabular-nums` for every price, exchange rate, and percentage.
- Keep touch targets and primary pills at least `48px` tall on mobile web.
- Pair dark `#10131a` hero photography with bright `#ffffff` utility chapters for clarity.

### Don't
- Do not clutter photography with more than one floating transaction overlay.
- Do not use low-contrast grey text below `#66707a` on `#f4f6f9`.
- Do not replace physical-feeling product photography with generic cartoon illustrations.

---

## Motion and responsive

- **Observed:** Smooth `200ms ease-out` pill transitions, subtle `4px` float entrance on the hero transaction overlay, horizontal snap-scrolling card rail on mobile (`scroll-snap-type: x mandatory`).
- **Transfer:** On `< 768px`, pin primary CTA comfortably within thumb reach, keep single-column cards at `20px` radius, and respect `env(safe-area-inset-bottom)` on sticky mobile bars.
- **Unknown:** Exact scroll-choreographed card rotation angle on desktop — keep static with crisp hover elevation under `prefers-reduced-motion: reduce`.

---

## How to use this guide

Paste this `DESIGN.md` into your coding assistant and describe your consumer fintech or payments product. Ensure the output implements both the `#10131a` dark hero stage and `#ffffff` daylight utility stages with exact `#0075eb` cobalt actions and tabular financial typography.
