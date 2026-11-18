import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  extractHexAlpha,
  isDarkColor,
  isValidHex,
  luminance,
  normalizeHex,
  pickAccent,
  pickReadableForeground,
  saturation,
  type Swatch,
} from "./color";
import { isGenericFont, resolveFont, type FontResolution } from "./fonts";
import { slugifyHeading } from "./slug";

export { slugifyHeading };

export type TemplateTheme = "dark" | "light" | "mixed";

export interface SectionHeading {
  title: string;
  id: string;
}

export interface ParsedTemplate {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  theme: TemplateTheme;
  palette: Swatch[];
  fonts: FontResolution[];
  platform: string[];
  tags: string[];
  mood: string[];
  accent: Swatch | undefined;
  canvasHex: string;
  foregroundHex: string;
  sections: Record<string, string>;
  sectionHeadings: SectionHeading[];
  hasSectionRecipes: boolean;
  hasPreviewHtml: boolean;
  previewHtml?: string;
  rawMarkdown: string;
}

export interface TemplateFilters {
  platform?: string;
  mood?: string;
  theme?: TemplateTheme;
}

export interface TemplateStore {
  getAllTemplates(): Promise<ParsedTemplate[]>;
  getTemplate(slug: string): Promise<ParsedTemplate | null>;
  searchTemplates(
    query: string,
    filters?: TemplateFilters
  ): Promise<ParsedTemplate[]>;
}

const StringArraySchema = z
  .union([z.array(z.string()), z.string()])
  .transform((val) =>
    (Array.isArray(val) ? val : val.split(","))
      .map((s) => s.trim())
      .filter(Boolean)
  );

const FrontmatterSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    tagline: z.string().trim().optional(),
    summary: z.string().trim().optional(),
    theme: z.enum(["dark", "light", "mixed"]).optional(),
    fonts: StringArraySchema.optional(),
    platform: StringArraySchema.optional(),
    tags: StringArraySchema.optional(),
    mood: StringArraySchema.optional(),
  })
  .passthrough();

const TemplateMetaEntrySchema = z.object({
  platform: z.array(z.string()).optional(),
  mood: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const TemplatesMetaFileSchema = z.record(z.string(), TemplateMetaEntrySchema);

export type TemplateMetaEntry = z.infer<typeof TemplateMetaEntrySchema>;

const TEMPLATES_DIR = path.join(process.cwd(), "content", "templates");

function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  return /^\|?[\s:|-]+\|?$/.test(trimmed);
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
  h2: string;
  h3: string;
}

/**
 * Extracts markdown tables along with their nearest enclosing H2 and H3 headings,
 * skipping fenced code blocks.
 */
function extractMarkdownTables(body: string): ParsedTable[] {
  const lines = body.split(/\r?\n/);
  const tables: ParsedTable[] = [];

  let inCodeFence = false;
  let currentH2 = "";
  let currentH3 = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const h2Match = /^##\s+(.+)$/.exec(trimmed);
    if (h2Match) {
      currentH2 = stripInlineMarkdown(h2Match[1]);
      currentH3 = "";
      continue;
    }

    const h3Match = /^###\s+(.+)$/.exec(trimmed);
    if (h3Match) {
      currentH3 = stripInlineMarkdown(h3Match[1]);
      continue;
    }

    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isSeparatorRow(lines[i + 1])
    ) {
      const headers = splitMarkdownRow(trimmed);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length) {
        const rowLine = lines[j].trim();
        if (!rowLine || !rowLine.includes("|") || /^```/.test(rowLine)) {
          break;
        }
        rows.push(splitMarkdownRow(rowLine));
        j += 1;
      }
      tables.push({
        headers,
        rows,
        h2: currentH2,
        h3: currentH3,
      });
      i = j - 1;
    }
  }

  return tables;
}

function extractSections(body: string): {
  sections: Record<string, string>;
  sectionHeadings: SectionHeading[];
} {
  const lines = body.split(/\r?\n/);
  const sections: Record<string, string> = {};
  const sectionHeadings: SectionHeading[] = [];

  let inCodeFence = false;
  let currentTitle: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentTitle !== null) {
      sections[currentTitle] = buffer.join("\n").trim();
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence) {
      const h2Match = /^##\s+(.+)$/.exec(trimmed);
      if (h2Match) {
        flush();
        currentTitle = stripInlineMarkdown(h2Match[1]);
        sectionHeadings.push({
          title: currentTitle,
          id: slugifyHeading(currentTitle),
        });
        buffer = [];
        continue;
      }
    }

    if (currentTitle !== null) {
      buffer.push(line);
    }
  }

  flush();
  return { sections, sectionHeadings };
}

function extractTitleAndTagline(
  body: string,
  slug: string
): { title: string; tagline: string } {
  const lines = body.split(/\r?\n/);
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const h1Match = /^#\s+(.+)$/.exec(trimmed);
    if (h1Match) {
      const raw = stripInlineMarkdown(h1Match[1]);
      const parts = raw.split(" — ");
      if (parts.length >= 2) {
        return {
          title: parts[0].trim() || titleFromSlug(slug),
          tagline: parts.slice(1).join(" — ").trim(),
        };
      }
      return { title: raw || titleFromSlug(slug), tagline: "" };
    }
  }

  return { title: titleFromSlug(slug), tagline: "" };
}

function extractSummary(
  body: string,
  sections: Record<string, string>
): string {
  // Format B: first paragraph under ## Overview
  const overviewKey = Object.keys(sections).find(
    (key) => key.toLowerCase() === "overview"
  );
  if (overviewKey) {
    const overviewLines = sections[overviewKey].split(/\r?\n/);
    const paraLines: string[] = [];
    for (const line of overviewLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (paraLines.length > 0) break;
        continue;
      }
      if (/^(#{1,6}\s|[-*]\s|\||```|>)/.test(trimmed)) {
        if (paraLines.length > 0) break;
        continue;
      }
      paraLines.push(trimmed);
    }
    if (paraLines.length > 0) {
      return stripInlineMarkdown(paraLines.join(" "));
    }
  }

  // Format A: first blockquote
  const lines = body.split(/\r?\n/);
  const quoteLines: string[] = [];
  let inCodeFence = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (trimmed.startsWith(">")) {
      quoteLines.push(trimmed.replace(/^>\s?/, ""));
    } else if (quoteLines.length > 0) {
      break;
    }
  }

  if (quoteLines.length > 0) {
    return stripInlineMarkdown(quoteLines.join(" "));
  }

  return "";
}

function extractPalette(tables: readonly ParsedTable[], slug: string): Swatch[] {
  const swatches: Swatch[] = [];
  const seenHex = new Set<string>();

  for (const table of tables) {
    const lowerHeaders = table.headers.map((h) => h.toLowerCase().trim());
    const valueIdx = lowerHeaders.findIndex(
      (h) => h === "value" || h === "hex"
    );
    if (valueIdx === -1) continue;

    const nameIdx = lowerHeaders.findIndex(
      (h) => h === "name" || h === "color" || h === "surface" || h === "swatch"
    );
    const tokenIdx = lowerHeaders.findIndex(
      (h) => h === "token" || h === "css" || h === "variable"
    );
    const roleIdx = lowerHeaders.findIndex(
      (h) => h === "role" || h === "roles"
    );
    const useIdx = lowerHeaders.findIndex(
      (h) => h === "use" || h === "usage" || h === "notes"
    );
    const onlyForIdx = lowerHeaders.findIndex(
      (h) => h === "only for" || h === "onlyfor" || h === "variant"
    );

    const isVariantSection = /page-type\s+variants?/i.test(table.h3);

    for (const row of table.rows) {
      const rawValueCell = row[valueIdx];
      if (!rawValueCell) continue;

      // Match any #hex-like token in the Value cell (including malformed ones so we can warn & skip)
      const hexTokenMatch = /#[0-9a-zA-Z]+/.exec(rawValueCell);
      if (!hexTokenMatch) continue;

      const rawHex = hexTokenMatch[0];
      if (!isValidHex(rawHex)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[Swatchbook] Skipping invalid hex "${rawHex}" in template "${slug}"`
          );
        }
        continue;
      }

      const normalized = normalizeHex(rawHex);
      if (!normalized || seenHex.has(normalized)) continue;
      seenHex.add(normalized);

      const fallbackNameIdx = valueIdx === 0 ? 1 : 0;
      const rawName = row[nameIdx !== -1 ? nameIdx : fallbackNameIdx] ?? normalized;
      const rawToken = tokenIdx !== -1 ? row[tokenIdx] : undefined;
      const rawRole = roleIdx !== -1 ? row[roleIdx] : undefined;
      const rawUse = useIdx !== -1 ? row[useIdx] : undefined;
      const rawOnlyFor =
        onlyForIdx !== -1
          ? row[onlyForIdx]
          : isVariantSection
            ? table.h3
            : undefined;

      const cleanField = (val?: string): string | undefined => {
        if (!val) return undefined;
        const cleaned = stripInlineMarkdown(val);
        return cleaned && cleaned !== "—" && cleaned !== "-"
          ? cleaned
          : undefined;
      };

      const swatch: Swatch = {
        name: cleanField(rawName) ?? normalized,
        hex: normalized,
      };

      const alpha = extractHexAlpha(rawHex);
      if (alpha !== undefined) swatch.alpha = alpha;

      const token = cleanField(rawToken);
      if (token) swatch.token = token;

      const role = cleanField(rawRole);
      if (role) swatch.role = role;

      const use = cleanField(rawUse);
      if (use) swatch.use = use;

      const group = table.h3 || table.h2 || undefined;
      if (group) swatch.group = group;

      const onlyFor = cleanField(rawOnlyFor);
      if (onlyFor) swatch.onlyFor = onlyFor;

      swatches.push(swatch);
    }
  }

  return swatches;
}

function extractFonts(
  body: string,
  sections: Record<string, string>,
  tables: readonly ParsedTable[],
  frontmatterFonts?: string[]
): FontResolution[] {
  const candidates: string[] = [];

  const pushFontName = (raw: string) => {
    // Handle comma-separated font stacks by taking each entry
    const parts = raw
      .split(",")
      .map((part) =>
        stripInlineMarkdown(part)
          .replace(/^["'`]+|["'`]+$/g, "")
          .replace(/\s*\([^)]*\)\s*/g, " ")
          .trim()
      )
      .filter(Boolean);

    for (const part of parts) {
      if (part.length > 0 && part.length <= 60) {
        candidates.push(part);
      }
    }
  };

  // 1. Frontmatter fonts
  if (frontmatterFonts) {
    for (const font of frontmatterFonts) {
      pushFontName(font);
    }
  }

  // Locate Typography section (Format A: "Tokens — Typography", Format B: "Typography")
  const typoSectionEntries = Object.entries(sections).filter(([key]) =>
    /typography/i.test(key) && !/voice/i.test(key)
  );

  for (const [, sectionBody] of typoSectionEntries) {
    const lines = sectionBody.split(/\r?\n/);
    let inCodeFence = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^```/.test(trimmed)) {
        inCodeFence = !inCodeFence;
        continue;
      }
      if (inCodeFence) continue;

      // 2. Format A: ### font-name — ...
      const formatAMatch = /^###\s+(.+?)\s+—/.exec(trimmed);
      if (formatAMatch) {
        pushFontName(formatAMatch[1]);
        continue;
      }

      // 3. Format B: - **Font Name** — description
      const formatBMatch = /^[-*]\s+\*\*(.+?)\*\*\s*(?:—|--|–)/.exec(trimmed);
      if (formatBMatch) {
        pushFontName(formatBMatch[1]);
      }
    }
  }

  // 4. Font column of any type-scale / recipe table
  for (const table of tables) {
    const fontIdx = table.headers.findIndex(
      (h) => h.toLowerCase().trim() === "font"
    );
    if (fontIdx === -1) continue;

    for (const row of table.rows) {
      const cell = row[fontIdx];
      if (cell) {
        pushFontName(cell);
      }
    }
  }

  // Dedupe case-insensitively
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const name of candidates) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(name);
    }
  }

  const nonGeneric = deduped.filter((name) => !isGenericFont(name));
  const chosen = nonGeneric.length > 0 ? nonGeneric : deduped;

  return chosen.map((name) => resolveFont(name));
}

function inferThemeAndCanvas(
  body: string,
  palette: readonly Swatch[],
  frontmatterTheme?: TemplateTheme
): { theme: TemplateTheme; canvasHex: string; foregroundHex: string } {
  const canvasMatches = palette.filter((swatch) => {
    const haystack = `${swatch.name} ${swatch.token ?? ""} ${swatch.role ?? ""}`.toLowerCase();
    return /\b(background|canvas|stage)\b/.test(haystack);
  });

  const hasDarkCanvas = canvasMatches.some((s) => luminance(s.hex) < 0.2);
  const hasLightCanvas = canvasMatches.some((s) => luminance(s.hex) > 0.7);

  // Pick primary canvas swatch (most extreme luminance among canvas matches, else first neutral)
  let primaryCanvas: Swatch | undefined;
  if (canvasMatches.length > 0) {
    primaryCanvas = canvasMatches.reduce((best, curr) => {
      const bestDist = Math.abs(luminance(best.hex) - 0.5);
      const currDist = Math.abs(luminance(curr.hex) - 0.5);
      return currDist > bestDist ? curr : best;
    });
  } else {
    primaryCanvas =
      palette.find((s) => /neutral/i.test(s.group ?? "")) ??
      palette.find((s) => saturation(s.hex) < 0.15) ??
      palette[0];
  }

  let theme: TemplateTheme;
  if (frontmatterTheme) {
    theme = frontmatterTheme;
  } else {
    const explicitThemeMatch = /\*\*Theme:\*\*\s*(dark|light|mixed)/i.exec(body);
    if (explicitThemeMatch) {
      theme = explicitThemeMatch[1].toLowerCase() as TemplateTheme;
    } else if (hasDarkCanvas && hasLightCanvas) {
      theme = "mixed";
    } else if (primaryCanvas) {
      theme = isDarkColor(primaryCanvas.hex) ? "dark" : "light";
    } else {
      theme = "dark";
    }
  }

  const canvasHex =
    primaryCanvas?.hex ?? (theme === "light" ? "#ffffff" : "#0e0d0b");
  const foregroundHex = pickReadableForeground(canvasHex);

  return { theme, canvasHex, foregroundHex };
}

/**
 * Pure parser for any DESIGN.md template file (Format A, Format B, frontmatter, or freeform).
 */
export function parseTemplateMarkdown(
  rawMarkdown: string,
  slug: string,
  meta?: TemplateMetaEntry,
  previewHtml?: string
): ParsedTemplate {
  const parsedMatter = matter(rawMarkdown);
  const fmResult = FrontmatterSchema.safeParse(parsedMatter.data);
  const fm = fmResult.success ? fmResult.data : {};

  const body = parsedMatter.content;
  const { sections, sectionHeadings } = extractSections(body);
  const tables = extractMarkdownTables(body);

  const inferredTitle = extractTitleAndTagline(body, slug);
  const title = fm.title ?? inferredTitle.title;
  const tagline = fm.tagline ?? inferredTitle.tagline;
  const summary = fm.summary ?? extractSummary(body, sections);

  const palette = extractPalette(tables, slug);
  const fonts = extractFonts(body, sections, tables, fm.fonts);
  const { theme, canvasHex, foregroundHex } = inferThemeAndCanvas(
    body,
    palette,
    fm.theme
  );

  const platform =
    fm.platform && fm.platform.length > 0
      ? fm.platform
      : meta?.platform && meta.platform.length > 0
        ? meta.platform
        : ["web"];

  const mood =
    fm.mood && fm.mood.length > 0
      ? fm.mood
      : meta?.mood && meta.mood.length > 0
        ? meta.mood
        : [theme];

  const tags =
    fm.tags && fm.tags.length > 0
      ? fm.tags
      : meta?.tags && meta.tags.length > 0
        ? meta.tags
        : [];

  const accent = pickAccent(palette);
  const hasSectionRecipes = sectionHeadings.some((h) =>
    /^(section|screen)\s+recipes?$/i.test(h.title)
  );

  return {
    slug,
    title,
    tagline,
    summary,
    theme,
    palette,
    fonts,
    platform,
    tags,
    mood,
    accent,
    canvasHex,
    foregroundHex,
    sections,
    sectionHeadings,
    hasSectionRecipes,
    hasPreviewHtml: Boolean(previewHtml),
    ...(previewHtml ? { previewHtml } : {}),
    rawMarkdown,
  };
}

// TODO(bookmarks): Replace FileTemplateStore with a database-backed TemplateStore when user bookmarks and saved templates are added.
export class FileTemplateStore implements TemplateStore {
  private readonly dir: string;

  constructor(dir = TEMPLATES_DIR) {
    this.dir = dir;
  }

  private async readMetaFile(): Promise<Record<string, TemplateMetaEntry>> {
    const metaPath = path.join(this.dir, "templates.meta.json");
    try {
      const content = await fs.readFile(metaPath, "utf8");
      const json: unknown = JSON.parse(content);
      const parsed = TemplatesMetaFileSchema.safeParse(json);
      return parsed.success ? parsed.data : {};
    } catch {
      return {};
    }
  }

  private async readPreviewHtml(slug: string): Promise<string | undefined> {
    const previewPath = path.join(this.dir, `${slug}.preview.html`);
    try {
      return await fs.readFile(previewPath, "utf8");
    } catch {
      return undefined;
    }
  }

  async getAllTemplates(): Promise<ParsedTemplate[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch {
      return [];
    }

    const mdFiles = entries
      .filter((name) => name.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b));

    const metaMap = await this.readMetaFile();

    const templates = await Promise.all(
      mdFiles.map(async (filename) => {
        const slug = filename.replace(/\.md$/, "");
        const rawMarkdown = await fs.readFile(
          path.join(this.dir, filename),
          "utf8"
        );
        const previewHtml = await this.readPreviewHtml(slug);
        return parseTemplateMarkdown(
          rawMarkdown,
          slug,
          metaMap[slug],
          previewHtml
        );
      })
    );

    return templates;
  }

  async getTemplate(slug: string): Promise<ParsedTemplate | null> {
    // Guard against path traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return null;
    }

    const filePath = path.join(this.dir, `${slug}.md`);
    try {
      const [rawMarkdown, metaMap, previewHtml] = await Promise.all([
        fs.readFile(filePath, "utf8"),
        this.readMetaFile(),
        this.readPreviewHtml(slug),
      ]);
      return parseTemplateMarkdown(
        rawMarkdown,
        slug,
        metaMap[slug],
        previewHtml
      );
    } catch {
      return null;
    }
  }

  async searchTemplates(
    query: string,
    filters?: TemplateFilters
  ): Promise<ParsedTemplate[]> {
    const all = await this.getAllTemplates();
    const normalizedQuery = query.trim().toLowerCase();

    return all.filter((tpl) => {
      if (filters?.platform) {
        const wanted = filters.platform.toLowerCase();
        if (!tpl.platform.some((p) => p.toLowerCase() === wanted)) {
          return false;
        }
      }

      if (filters?.mood) {
        const wanted = filters.mood.toLowerCase();
        if (
          !tpl.mood.some((m) => m.toLowerCase() === wanted) &&
          !tpl.tags.some((t) => t.toLowerCase() === wanted)
        ) {
          return false;
        }
      }

      if (filters?.theme && tpl.theme !== filters.theme) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        tpl.title,
        tpl.tagline,
        tpl.summary,
        tpl.slug,
        ...tpl.platform,
        ...tpl.mood,
        ...tpl.tags,
        ...tpl.fonts.map((f) => f.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }
}

const defaultStore: TemplateStore = new FileTemplateStore();

export async function getAllTemplates(): Promise<ParsedTemplate[]> {
  return defaultStore.getAllTemplates();
}

export async function getTemplate(slug: string): Promise<ParsedTemplate | null> {
  return defaultStore.getTemplate(slug);
}

export async function searchTemplates(
  query: string,
  filters?: TemplateFilters
): Promise<ParsedTemplate[]> {
  return defaultStore.searchTemplates(query, filters);
}
