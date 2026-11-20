# Contributing to Swatchbook

Thank you for your interest in contributing to Swatchbook! Whether you're adding a new design-system template, improving prompt extraction, or refining the UI, we're excited to have your help.

---

## 🧭 Ways to Contribute

There are two primary ways to contribute to Swatchbook:

1. **[Adding a Design Template](#-contributing-a-design-template-zero-code-changes)** (No code required — just Markdown!)
2. **[Code Contributions](#-code-contributions)** (Features, bug fixes, UI improvements)

---

## 🎨 Contributing a Design Template (Zero Code Changes!)

Adding a new design template requires **no coding experience**. You only need to create a markdown file describing the design system.

### Step 1: Create the Template File

Create `content/templates/<slug>.md` using lowercase kebab-case (e.g., `content/templates/linear-app.md`):

```markdown
---
title: "Linear"
theme: "dark"
platform: "desktop-web"
mood: ["minimal", "developer", "precise"]
websiteUrl: "https://linear.app"
cardBg: "#0F0F12"
---

# Linear Design System

## 1. Brand Essence
- **Core aesthetic:** Utilitarian, dark-mode first, mechanical precision.
- **Visual weight:** High contrast, crisp borders, subtle glows.

## 2. Color Palette
| Token | Hex | Role | Usage |
| --- | --- | --- | --- |
| `background` | `#0F0F12` | Canvas | Application dark background |
| `surface` | `#1A1A1F` | Container | Cards, dialogs, dropdowns |
| `accent` | `#5E6AD2` | Primary | Action buttons, active badges |
| `foreground` | `#EEEEF0` | Text | Primary typography |
| `muted` | `#8A8F98` | Text | Subtitles, disabled states |

## 3. Typography
- **Primary Font:** Inter, system-ui, sans-serif
- **Code Font:** JetBrains Mono, monospace

## 4. Components & Recipes
...
```

> [!IMPORTANT]
> **Respect Intellectual Property:** Do NOT copy trademarked logos, company slogans, or proprietary code. Describe the general visual system, color relationships, component patterns, and typography.

### Step 2: Add Screenshots (Optional, but recommended)

To display hover-scroll previews in the gallery, create a directory in `public/previews/<slug>/`:

```text
public/previews/<slug>/
├── full.webp        # Full-page tall screenshot for the card hover-scroll
├── shot-1.webp      # Detail page lightbox showcase 1
├── shot-2.webp      # Detail page lightbox showcase 2
└── shot-3.webp      # Detail page lightbox showcase 3
```

You can also run the automated Playwright utility to capture them:

```bash
pnpm capture-previews
```

### Step 3: Verify & Submit

Run the test suite to verify your template parses cleanly:

```bash
pnpm test
```

Start the dev server and verify your template renders at `http://localhost:3000/templates/<slug>`:

```bash
pnpm dev
```

Then open a Pull Request using the `[template]: <name>` title convention.

---

## 💻 Code Contributions

### Development Setup

1. **Prerequisites:**
   - **Node.js 20+**
   - **pnpm 10+**
2. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/swatchbook.git
   cd swatchbook
   ```
3. **Install dependencies and start dev server:**
   ```bash
   pnpm install
   cp .env.example .env.local
   pnpm dev
   ```

### Code Standards

- **Strict TypeScript:** No `any` types. Provide explicit interfaces for all data structures.
- **SSRF Defense:** Any server-side HTTP request must pass through `safeFetchText` in `lib/ssrf.ts`. Never perform unvalidated fetches against private IP ranges.
- **Deterministic Token Math:** Extracted tokens must be derived deterministically in code via `lib/extract-styles.ts` and `lib/quickstart.ts`, not left to LLM guesswork.
- **Accessibility:** All interactive elements must have visible focus rings, keyboard navigability, and AA contrast. Honor `prefers-reduced-motion`.
- **Styling:** Follow Tailwind CSS v4 conventions with design tokens declared in `app/globals.css`.

### Verification Checklist Before Submitting PR

Make sure all 4 checks pass without errors:

```bash
pnpm typecheck   # Check TypeScript types
pnpm lint        # Run ESLint
pnpm test        # Run Vitest unit & route tests
pnpm build       # Verify Next.js production build
```

---

## 🚀 Pull Request Guidelines

1. Branch from `main` with a clear prefix:
   - `feat/add-template-<name>` for new templates
   - `feat/<feature-name>` for enhancements
   - `fix/<bug-name>` for bug fixes
2. Keep commits concise and descriptive (e.g., `feat(templates): add Raycast design system`).
3. Fill out the provided [Pull Request Template](.github/pull_request_template.md).

Thank you for helping build Swatchbook! 🎉
