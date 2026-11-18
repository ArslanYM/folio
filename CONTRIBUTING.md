# Contributing to Swatchbook

Thank you for your interest in contributing to Swatchbook! Whether you're adding a new `DESIGN.md` template, fixing a parser edge case, or improving the UI, your help is welcome.

## Development Setup

1. Ensure you have **Node.js 20+** and **pnpm 10+** installed.
2. Fork and clone the repository.
3. Install dependencies and start the dev server:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Contributing a Design Template

Adding a new template requires **no code changes**:

1. Create `content/templates/<slug>.md` using lowercase kebab-case for `<slug>`.
2. Follow the `DESIGN.md` structure (colors table with hex values, typography, components, do's & don'ts). Do not copy trademarked logos, brand claims, or proprietary artwork — describe the visual system and patterns only.
3. Optionally add platform/mood/tags metadata to `content/templates/templates.meta.json` (or YAML frontmatter in the `.md` file).
4. Optionally add `content/templates/<slug>.preview.html` (static HTML/CSS only; rendered in a scriptless sandboxed `<iframe>`).
5. Run `pnpm test` and verify the template renders cleanly in `/templates` and `/templates/<slug>`.

## Code Contributions

- **TypeScript strict:** Avoid `any` (if unavoidable, add an inline comment explaining why).
- **Validate external inputs:** Use `zod` for request payloads and external data.
- **No hardcoded secrets or model IDs:** All configurable values belong in `.env.example`.
- **Accessibility:** Keep every interactive control keyboard reachable with visible focus states and AA+ contrast. Respect `prefers-reduced-motion`.

### Checks before opening a PR

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Pull Request Process

1. Create a feature branch from `main` (e.g., `feat/add-template-foo` or `fix/hex-parser`).
2. Keep commits focused and descriptive.
3. Fill out the PR template and link any relevant issues.
