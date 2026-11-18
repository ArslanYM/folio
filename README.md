# Swatchbook

Turn any website or screenshot into a `DESIGN.md` — a complete design-system spec (colors, typography, spacing, components, section recipes, writing voice, do's and don'ts, and deterministic CSS/Tailwind v4 tokens) ready to paste into Copilot, Cursor, or Claude Code.

## Two Ways In

1. **Browse Templates (`/templates`):** Pick a ready-made design system, click any paint-chip swatch to copy its hex, inspect real/substituted font specimens and a token-driven landing-page preview, copy or download its `DESIGN.md`, or copy a ready-made **"build a landing page"** prompt.
2. **Generate (`/generate`):** Paste a public website URL or upload/drop/paste a screenshot, choose a target (`desktop-web`, `mobile-web`, `ios`, `android`, `landing-page`, `dashboard`), and stream a validated `DESIGN.md` with deterministic `:root` and Tailwind v4 `@theme` blocks.

## Requirements

- **Node.js 20+**
- **pnpm 10+**
- An [OpenRouter](https://openrouter.ai/) API key (only needed for `/generate`; `/`, `/templates`, and `/templates/[slug]` work completely offline without keys)

## Quick Start

```bash
git clone <repo-url>
cd swatchbook
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | For `/generate` | Your OpenRouter API key |
| `OPENROUTER_MODEL_TEXT` | For URL mode | Any capable text model ID from [openrouter.ai/models](https://openrouter.ai/models) |
| `OPENROUTER_MODEL_VISION` | For screenshot mode | Any model ID from [openrouter.ai/models](https://openrouter.ai/models) filtered by **"image input"** |
| `OPENROUTER_FALLBACK_MODEL` | Optional | Fallback model tried automatically if the primary fails or rate-limits |
| `NEXT_PUBLIC_APP_URL` | Optional | Sent as `HTTP-Referer` to OpenRouter (`X-Title` is always `"Swatchbook"`; default `http://localhost:3000`) |
| `ENABLE_SCREENSHOT` | Optional | Reserved stub in `lib/screenshot.ts` for future Playwright capture (default `false`) |
| `RATE_LIMIT_PER_HOUR` | Optional | Per-IP hourly request cap on `/api/generate` (default `20`) |

> **Picking models:** Browse [openrouter.ai/models](https://openrouter.ai/models) and copy any model slug into `.env.local`. Filter by **"image input"** when choosing `OPENROUTER_MODEL_VISION`. Free models on OpenRouter are slower and frequently rate-limited — setting `OPENROUTER_FALLBACK_MODEL` is recommended.

## Adding a Template (Zero Code Changes)

1. Drop any `.md` file into `content/templates/<slug>.md`.
2. Optionally add curated `platform`, `mood`, and `tags` metadata for `<slug>` in `content/templates/templates.meta.json` — or include YAML frontmatter at the top of the `.md` file (frontmatter always takes priority).
3. Optionally add a static `content/templates/<slug>.preview.html` file to render a custom preview inside a scriptless sandboxed `<iframe sandbox="">` on the template's **Preview** tab.
4. Restart or rebuild — the template appears automatically in `/templates` and gets its own `/templates/<slug>` page.

The parser in `lib/templates.ts` tolerates both Format A (ORYZO style) and Format B (Orbi/Yuga/Revolut style), skips malformed hex values (such as a 5-digit `#40372` typo) with a dev-only warning instead of crashing, deduplicates identical hex codes keeping the first occurrence, and never rewrites the raw markdown you copy or download.

## Scripts

```bash
pnpm dev        # Start Next.js 16 dev server (Turbopack)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript strict check
pnpm test       # Run Vitest unit & route tests
```

## Architecture & Implementation Notes (v1)

- **Deterministic extraction & Quick Start:** URL mode fetches HTML and up to 5 linked stylesheets with strict SSRF protection (`lib/ssrf.ts`), extracts CSS variables, color frequencies, fonts, radii, spacing, shadows, breakpoints, and motion in code (`lib/extract-styles.ts`), and passes trimmed JSON (never raw HTML) to the LLM. After streaming completes, `lib/quickstart.ts` deterministically generates and replaces `## Quick Start` with validated `:root` CSS and Tailwind v4 `@theme` blocks.
- **No auth or database in v1:** Recent generations (last 10) are stored in `localStorage`. Extension points are clearly marked with `// TODO(auth)` and `// TODO(bookmarks)` behind swappable interfaces (`TemplateStore`, `RateLimiter`).
- **Next.js 16 configuration:** `cacheComponents` is intentionally kept off in `next.config.ts` so `/api/generate` can declare `runtime = "nodejs"` and `maxDuration = 120` cleanly alongside build-time filesystem template loading.

## Known Limitations

- **JavaScript-rendered SPAs:** URL mode fetches raw HTML and linked CSS without executing JavaScript. Client-rendered SPAs may yield thin extraction; Swatchbook displays a notice recommending screenshot upload while still generating a spec from whatever tokens were found.
- **Playwright screenshot capture:** Not implemented in v1 (`lib/screenshot.ts` is stubbed behind `ENABLE_SCREENSHOT=true`).
- **Free-tier OpenRouter models:** Free models may rate-limit, respond slowly, or omit sections. Swatchbook retries once, falls back to `OPENROUTER_FALLBACK_MODEL` when configured, and surfaces a warning banner if any of the 16 required sections are missing without hiding the generated output.

## Contributing & Security

Contributions — especially new `DESIGN.md` templates and parser edge-case fixes — are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
