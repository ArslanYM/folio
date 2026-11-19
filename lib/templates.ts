import fs from "node:fs/promises";
import path from "node:path";
import {
  parseTemplateMarkdown,
  TemplatesMetaFileSchema,
  type ParsedTemplate,
  type PreviewMedia,
  type TemplateFilters,
  type TemplateMetaEntry,
  type TemplateStore,
} from "./template-parser";

export * from "./template-parser";

const TEMPLATES_DIR = path.join(process.cwd(), "content", "templates");
const PREVIEWS_DIR = path.join(process.cwd(), "public", "previews");
const IMAGE_EXT_RE = /\.(webp|png|jpe?g|avif)$/i;
const ICON_EXT_RE = /\.(svg|webp|png|jpe?g|ico)$/i;

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

  private async discoverPreviewMedia(
    slug: string
  ): Promise<PreviewMedia> {
    const result: PreviewMedia = { shots: [] };

    // 1. Check for single full-page preview in public/previews/<slug>-full.webp
    try {
      const fullPath = path.join(PREVIEWS_DIR, `${slug}-full.webp`);
      await fs.access(fullPath);
      result.full = `/previews/${slug}-full.webp`;
    } catch {
      // No dedicated full screenshot
    }

    // 2. Check for multi-shot directory public/previews/<slug>/
    try {
      const slugDir = path.join(PREVIEWS_DIR, slug);
      const entries = await fs.readdir(slugDir);
      const imageFiles = entries
        .filter((file) => IMAGE_EXT_RE.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      result.shots = imageFiles.map((file) => `/previews/${slug}/${file}`);

      const iconFile = entries.find((file) =>
        /^icon\./i.test(file) && ICON_EXT_RE.test(file)
      );
      if (iconFile) {
        result.icon = `/previews/${slug}/${iconFile}`;
      }
    } catch {
      // Directory may not exist yet
    }

    // Fallback: If no directory shots were found but full exists, provide it as primary shot
    if (result.shots.length === 0 && result.full) {
      result.shots = [result.full];
    }

    return result;
  }

  async getAllTemplates(): Promise<ParsedTemplate[]> {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(this.dir);
    } catch {
      return [];
    }

    const mdFiles = entries
      .filter((file) => file.endsWith(".md") && !file.startsWith("."))
      .sort();

    const metaMap = await this.readMetaFile();
    const templates: ParsedTemplate[] = [];

    for (const filename of mdFiles) {
      const slug = filename.replace(/\.md$/, "");
      const fullPath = path.join(this.dir, filename);
      try {
        const raw = await fs.readFile(fullPath, "utf8");
        const meta = metaMap[slug];
        const previewHtml = await this.readPreviewHtml(slug);
        const previewMedia = await this.discoverPreviewMedia(slug);
        const parsed = parseTemplateMarkdown(
          raw,
          slug,
          meta,
          previewHtml,
          previewMedia
        );
        templates.push(parsed);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(`[Swatchbook] Failed to parse template "${filename}":`, err);
        }
      }
    }

    return templates;
  }

  async getTemplate(slug: string): Promise<ParsedTemplate | null> {
    if (!/^[a-zA-Z0-9._-]+$/.test(slug) || slug.includes("..")) return null;

    const fullPath = path.join(this.dir, `${slug}.md`);
    try {
      const raw = await fs.readFile(fullPath, "utf8");
      const metaMap = await this.readMetaFile();
      const meta = metaMap[slug];
      const previewHtml = await this.readPreviewHtml(slug);
      const previewMedia = await this.discoverPreviewMedia(slug);
      return parseTemplateMarkdown(raw, slug, meta, previewHtml, previewMedia);
    } catch {
      return null;
    }
  }

  async searchTemplates(
    query: string,
    filters?: TemplateFilters
  ): Promise<ParsedTemplate[]> {
    const all = await this.getAllTemplates();
    const q = query.trim().toLowerCase();

    return all.filter((tpl) => {
      if (filters?.platform && !tpl.platform.includes(filters.platform)) {
        return false;
      }
      if (filters?.mood && !tpl.mood.includes(filters.mood)) {
        return false;
      }
      if (filters?.theme && tpl.theme !== filters.theme) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        tpl.title,
        tpl.tagline,
        tpl.summary,
        ...tpl.tags,
        ...tpl.mood,
        ...tpl.platform,
        ...tpl.palette.map((s) => `${s.name} ${s.hex} ${s.token ?? ""}`),
        ...tpl.fonts.map((f) => `${f.name} ${f.substitute}`),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }
}

const defaultStore = new FileTemplateStore();

export async function getAllTemplates(): Promise<ParsedTemplate[]> {
  return defaultStore.getAllTemplates();
}

export async function getTemplateBySlug(
  slug: string
): Promise<ParsedTemplate | null> {
  return defaultStore.getTemplate(slug);
}

export const getTemplate = getTemplateBySlug;

export async function searchTemplates(
  query: string,
  filters?: TemplateFilters
): Promise<ParsedTemplate[]> {
  return defaultStore.searchTemplates(query, filters);
}
