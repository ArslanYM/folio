import { isValidHex, normalizeHex } from "./color";

export interface QuickStartColorToken {
  token: string;
  hex: string;
  name: string;
}

export interface QuickStartBlocks {
  colors: QuickStartColorToken[];
  cssBlock: string;
  tailwindBlock: string;
  sectionMarkdown: string;
}

function toTokenSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTokenName(rawToken: string | undefined, fallbackName: string): string {
  if (rawToken) {
    const clean = rawToken.replace(/`/g, "").trim();
    const match = /--[a-zA-Z0-9_-]+/.exec(clean);
    if (match) return match[0].toLowerCase();
  }
  const slug = toTokenSlug(fallbackName) || "swatch";
  return slug.startsWith("color-") ? `--${slug}` : `--color-${slug}`;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("-") && /^\|?[\s:|-]+\|?$/.test(trimmed);
}

/**
 * Extracts validated color tokens from all markdown tables inside the model output.
 * Skips any malformed hex strings deterministically.
 */
export function extractValidatedColorTokens(
  markdown: string
): QuickStartColorToken[] {
  const lines = markdown.split(/\r?\n/);
  const tokens: QuickStartColorToken[] = [];
  const seenTokenNames = new Set<string>();
  const seenHex = new Set<string>();

  let inCodeFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isSeparator(lines[i + 1])
    ) {
      const headers = splitRow(trimmed).map((h) => h.toLowerCase());
      const valueIdx = headers.findIndex((h) => h === "value" || h === "hex");
      if (valueIdx === -1) continue;

      const nameIdx = headers.findIndex(
        (h) => h === "name" || h === "color" || h === "surface"
      );
      const tokenIdx = headers.findIndex(
        (h) => h === "token" || h === "css" || h === "variable"
      );

      let j = i + 2;
      while (j < lines.length) {
        const rowLine = lines[j].trim();
        if (!rowLine || !rowLine.includes("|") || /^```/.test(rowLine)) break;
        const cells = splitRow(rowLine);
        const valueCell = cells[valueIdx] ?? "";
        const hexMatch = /#[0-9a-zA-Z]+/.exec(valueCell);

        if (hexMatch && isValidHex(hexMatch[0])) {
          const hex = normalizeHex(hexMatch[0]);
          if (hex && !seenHex.has(hex)) {
            const rawName =
              cells[nameIdx !== -1 ? nameIdx : valueIdx === 0 ? 1 : 0] ?? hex;
            const cleanName = rawName.replace(/[`*]/g, "").trim() || hex;
            const rawToken = tokenIdx !== -1 ? cells[tokenIdx] : undefined;
            let token = normalizeTokenName(rawToken, cleanName);

            if (seenTokenNames.has(token)) {
              let suffix = 2;
              while (seenTokenNames.has(`${token}-${suffix}`)) {
                suffix += 1;
              }
              token = `${token}-${suffix}`;
            }

            seenHex.add(hex);
            seenTokenNames.add(token);
            tokens.push({ token, hex, name: cleanName });
          }
        }
        j += 1;
      }

      i = j - 1;
    }
  }

  return tokens;
}

function findH2SectionRange(
  lines: readonly string[],
  headingPattern: RegExp
): { start: number; end: number } | null {
  let inFence = false;
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (/^##\s+/.test(trimmed)) {
      if (start !== -1) {
        return { start, end: i };
      }
      if (headingPattern.test(trimmed)) {
        start = i;
      }
    }
  }

  if (start !== -1) {
    return { start, end: lines.length };
  }
  return null;
}

function extractFontsFromMarkdown(markdown: string): string[] {
  const fonts: string[] = [];
  const seen = new Set<string>();
  const lines = markdown.split(/\r?\n/);

  const range = findH2SectionRange(
    lines,
    /^##\s+(?:Tokens\s+[—-]\s+)?Typography\b/i
  );
  const scope = range ? lines.slice(range.start, range.end).join("\n") : markdown;

  for (const m of scope.matchAll(/^[-*]\s+\*\*([^*]+)\*\*\s*(?:—|--|–)/gm)) {
    const name = m[1].trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      fonts.push(name);
    }
  }

  for (const m of scope.matchAll(/^###\s+([^\n—]+?)\s+—/gm)) {
    const name = m[1].trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      fonts.push(name);
    }
  }

  return fonts.slice(0, 3);
}

function extractUnitTokens(
  markdown: string,
  headingPattern: RegExp,
  limit: number
): string[] {
  const lines = markdown.split(/\r?\n/);
  const range = findH2SectionRange(lines, headingPattern);
  if (!range) return [];
  const body = lines.slice(range.start, range.end).join("\n");
  const matches = body.match(/\b\d+(?:\.\d+)?(?:px|rem|pt|dp)\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches)).slice(0, limit);
}

/**
 * Generates deterministic `:root` CSS and Tailwind v4 `@theme` Quick Start blocks
 * strictly from validated tokens parsed from the markdown.
 */
export function buildDeterministicQuickStart(markdown: string): QuickStartBlocks {
  const colors = extractValidatedColorTokens(markdown);
  const fonts = extractFontsFromMarkdown(markdown);
  const radii = extractUnitTokens(
    markdown,
    /^##\s+(?:Corner|Border)\s+radi(?:us|i)\b/i,
    4
  );
  const spacings = extractUnitTokens(markdown, /^##\s+Layout\b/i, 5);

  const rootLines: string[] = [":root {"];
  if (colors.length > 0) {
    rootLines.push("  /* Colors */");
    for (const c of colors) {
      rootLines.push(`  ${c.token}: ${c.hex}; /* ${c.name} */`);
    }
  }

  if (fonts.length > 0) {
    rootLines.push("");
    rootLines.push("  /* Typography */");
    rootLines.push(`  --font-display: "${fonts[0]}", ui-sans-serif, system-ui, sans-serif;`);
    rootLines.push(
      `  --font-body: "${fonts[1] ?? fonts[0]}", ui-sans-serif, system-ui, sans-serif;`
    );
  }

  if (radii.length > 0) {
    const radiusNames = ["sm", "md", "lg", "pill"];
    rootLines.push("");
    rootLines.push("  /* Corner radius */");
    radii.forEach((val, idx) => {
      rootLines.push(`  --radius-${radiusNames[idx] ?? idx + 1}: ${val};`);
    });
  }

  if (spacings.length > 0) {
    rootLines.push("");
    rootLines.push("  /* Spacing scale */");
    spacings.forEach((val, idx) => {
      rootLines.push(`  --space-${idx + 1}: ${val};`);
    });
  }
  rootLines.push("}");

  const themeLines: string[] = ["@theme {"];
  for (const c of colors) {
    const twToken = c.token.startsWith("--color-")
      ? c.token
      : `--color-${c.token.replace(/^--/, "")}`;
    themeLines.push(`  ${twToken}: ${c.hex};`);
  }
  if (fonts.length > 0) {
    themeLines.push(`  --font-display: "${fonts[0]}", ui-sans-serif, sans-serif;`);
    themeLines.push(
      `  --font-sans: "${fonts[1] ?? fonts[0]}", ui-sans-serif, sans-serif;`
    );
  }
  if (radii.length > 0) {
    const radiusNames = ["sm", "md", "lg", "xl"];
    radii.forEach((val, idx) => {
      themeLines.push(`  --radius-${radiusNames[idx] ?? idx + 1}: ${val};`);
    });
  }
  themeLines.push("}");

  const cssBlock = rootLines.join("\n");
  const tailwindBlock = themeLines.join("\n");

  const sectionMarkdown = [
    "## Quick Start",
    "",
    "<!-- Generated deterministically by Swatchbook from validated tokens above -->",
    "",
    "### CSS Custom Properties",
    "",
    "```css",
    cssBlock,
    "```",
    "",
    "### Tailwind v4 `@theme`",
    "",
    "```css",
    tailwindBlock,
    "```",
  ].join("\n");

  return {
    colors,
    cssBlock,
    tailwindBlock,
    sectionMarkdown,
  };
}

/**
 * Replaces any existing `## Quick Start` section in `markdown` with the deterministic
 * Quick Start section, or inserts it before `## How to use this guide` (or appends it).
 */
export function applyDeterministicQuickStart(markdown: string): string {
  const { sectionMarkdown } = buildDeterministicQuickStart(markdown);
  const lines = markdown.split(/\r?\n/);

  const existingRange = findH2SectionRange(lines, /^##\s+Quick\s*Start\b/i);
  if (existingRange) {
    const before = lines.slice(0, existingRange.start).join("\n").trimEnd();
    const after = lines.slice(existingRange.end).join("\n").trimStart();
    return [before, sectionMarkdown, after].filter(Boolean).join("\n\n");
  }

  const howToUseRange = findH2SectionRange(lines, /^##\s+How to use\b/i);
  if (howToUseRange) {
    const before = lines.slice(0, howToUseRange.start).join("\n").trimEnd();
    const after = lines.slice(howToUseRange.start).join("\n").trimStart();
    return [before, sectionMarkdown, after].filter(Boolean).join("\n\n");
  }

  return `${markdown.trimEnd()}\n\n${sectionMarkdown}\n`;
}
