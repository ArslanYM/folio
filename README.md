# Swatchbook

Turn any website or screenshot into a `DESIGN.md` — a complete design-system spec (colors, typography, spacing, components, section recipes, writing voice, do's and don'ts, and CSS/Tailwind tokens) ready to paste into Copilot, Cursor, or Claude Code.

## Features (v1)

- **Template Gallery (`/templates`):** Browse ready-made `DESIGN.md` specs, inspect live paint-chip palettes, type specimens, and token-driven previews, copy or download the markdown, or copy a ready-made "build a landing page" prompt.
- **Generator (`/generate`):** Paste a URL or drop/paste a screenshot, pick a target platform (`desktop-web`, `mobile-web`, `ios`, `android`, `landing-page`, `dashboard`), and stream a validated `DESIGN.md` with deterministic CSS & Tailwind v4 `@theme` blocks.
- **Zero-code template additions:** Drop any `.md` file into `content/templates/` to publish it to the gallery automatically.

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- An [OpenRouter](https://openrouter.ai/) API key (only needed for `/generate`; browsing templates works offline without keys)

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
| `OPENROUTER_MODEL_VISION` | For screenshot mode | Any model ID from [openrouter.ai/models](https://openrouter.ai/models) filtered by **image input** |
| `OPENROUTER_FALLBACK_MODEL` | Optional | Fallback model tried if the primary fails or rate-limits |
| `NEXT_PUBLIC_APP_URL` | Optional | Sent as `HTTP-Referer` to OpenRouter (default `http://localhost:3000`) |
| `ENABLE_SCREENSHOT` | Optional | Reserved for future Playwright screenshot capture (default `false`) |
| `RATE_LIMIT_PER_HOUR` | Optional | Per-IP hourly request cap for `/api/generate` (default `20`) |

> **Note on models:** Pick model IDs directly at [openrouter.ai/models](https://openrouter.ai/models) (filter by **"image input"** for `OPENROUTER_MODEL_VISION`). Free-tier models on OpenRouter are slower and frequently rate-limited; configure `OPENROUTER_FALLBACK_MODEL` for better reliability.

## Scripts

```bash
pnpm dev        # Start Next.js dev server
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm typecheck  # Run TypeScript strict check
pnpm test       # Run Vitest unit tests
```

## Adding a Template

1. Drop a `.md` file into `content/templates/<slug>.md`.
2. Optionally add curated `platform`, `mood`, and `tags` metadata for `<slug>` in `content/templates/templates.meta.json` (or include YAML frontmatter in the markdown file).
3. Restart or rebuild — the template appears automatically in `/templates`.

## Known Limitations (v1)

- **JS-rendered SPAs:** URL extraction fetches raw HTML and linked stylesheets without running a headless browser. Client-rendered SPAs may yield thin extraction; Swatchbook warns you and recommends uploading a screenshot instead.
- **Screenshot capture:** Automated server-side Playwright capture is stubbed behind `ENABLE_SCREENSHOT=true` and not enabled in v1.
- **Free models:** Free OpenRouter models may rate-limit or omit sections; Swatchbook retries, falls back when configured, and validates required sections.
- **No auth or database in v1:** Recent generations are stored locally in `localStorage`. `// TODO(auth)` and `// TODO(bookmarks)` markers indicate extension points.

## Contributing

Contributions are welcome — new design-system templates, parser improvements, bug fixes, and accessibility polish! See [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

Swatchbook fetches user-supplied URLs with strict SSRF protections. To report a security issue responsibly, please see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
