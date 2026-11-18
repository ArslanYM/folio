import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FileTemplateStore,
  getAllTemplates,
  getTemplate,
  parseTemplateMarkdown,
  searchTemplates,
} from "./templates";

describe("lib/templates", () => {
  it("loads all four curated templates from content/templates", async () => {
    const templates = await getAllTemplates();
    const slugs = templates.map((t) => t.slug).sort();

    expect(slugs).toEqual(["orbi", "oryzo-ai", "revolut", "yuga"]);

    // Every template should receive a distinct accent color
    const accents = new Set(templates.map((t) => t.accent?.hex));
    expect(accents.size).toBe(4);
  });

  it("parses Format A (oryzo-ai) accurately and preserves raw markdown", async () => {
    const tpl = await getTemplate("oryzo-ai");
    expect(tpl).not.toBeNull();
    if (!tpl) return;

    expect(tpl.title).toBe("ORYZO AI");
    expect(tpl.tagline).toBe("Style Reference");
    expect(tpl.summary).toContain("museum-grade dark editorial showcase");
    expect(tpl.theme).toBe("dark");
    expect(tpl.platform).toEqual(["web"]);
    expect(tpl.mood).toEqual(["dark", "editorial", "product"]);
    expect(tpl.hasSectionRecipes).toBe(false);

    // Fixed #40372e cork border swatch is present
    const corkBorder = tpl.palette.find(
      (s) => s.token === "--surface-cork-border"
    );
    expect(corkBorder?.hex).toBe("#40372e");

    // Fonts extracted from Format A ### headings
    expect(tpl.fonts.map((f) => f.name)).toEqual([
      "AK Monument Grotesk",
      "Inter",
    ]);
    expect(tpl.fonts[0].substitute).toBe("Inter");
    expect(tpl.fonts[0].displayWeight).toBe(800);
    expect(tpl.fonts[0].isSubstituted).toBe(true);

    // Sections map populated for TOC
    expect(Object.keys(tpl.sections)).toContain("Tokens — Colors");
    expect(Object.keys(tpl.sections)).toContain("Quick Start");

    // Raw markdown matches disk verbatim
    const diskRaw = await fs.readFile(
      path.join(process.cwd(), "content", "templates", "oryzo-ai.md"),
      "utf8"
    );
    expect(tpl.rawMarkdown).toBe(diskRaw);
  });

  it("skips the 5-digit #40372 hex typo without crashing or losing other swatches", async () => {
    const original = await getTemplate("oryzo-ai");
    expect(original).not.toBeNull();
    if (!original) return;

    const corruptedMarkdown = original.rawMarkdown.replaceAll(
      "#40372e",
      "#40372"
    );
    const parsed = parseTemplateMarkdown(corruptedMarkdown, "oryzo-ai");

    expect(parsed.palette.length).toBe(original.palette.length - 1);
    expect(
      parsed.palette.find((s) => s.token === "--surface-cork-border")
    ).toBeUndefined();
    expect(parsed.palette.find((s) => s.hex === "#d99b26")).toBeDefined();
    expect(parsed.palette.find((s) => s.hex === "#0a0a09")).toBeDefined();
  });

  it("parses Format B (orbi), dedupes #232323 keeping the first occurrence", async () => {
    const tpl = await getTemplate("orbi");
    expect(tpl).not.toBeNull();
    if (!tpl) return;

    expect(tpl.title).toBe("Orbi");
    expect(tpl.theme).toBe("dark");
    expect(tpl.hasSectionRecipes).toBe(true);
    expect(tpl.fonts.map((f) => f.name)).toEqual(["Instrument Sans", "Inter"]);
    expect(tpl.fonts[0].isSubstituted).toBe(false);

    const matches232323 = tpl.palette.filter((s) => s.hex === "#232323");
    expect(matches232323).toHaveLength(1);
    expect(matches232323[0].name).toBe("Charcoal Artifact");
  });

  it("parses mixed-theme templates (yuga, revolut) and captures Page-type variants Only for column", async () => {
    const yuga = await getTemplate("yuga");
    const revolut = await getTemplate("revolut");

    expect(yuga).not.toBeNull();
    expect(revolut).not.toBeNull();
    if (!yuga || !revolut) return;

    expect(yuga.theme).toBe("mixed");
    expect(revolut.theme).toBe("mixed");

    expect(yuga.fonts.map((f) => f.name)).toEqual(["Aeonik Pro", "Inter"]);
    expect(yuga.fonts[0].substitute).toBe("DM Sans");
    expect(yuga.fonts[0].isSubstituted).toBe(true);

    expect(revolut.fonts.map((f) => f.name)).toEqual([
      "halyard-display-variable",
      "Inter",
    ]);
    expect(revolut.fonts[0].substitute).toBe("Inter");
    expect(revolut.fonts[0].isSubstituted).toBe(true);

    const yugaVariants = yuga.palette.filter((s) => Boolean(s.onlyFor));
    expect(yugaVariants.length).toBeGreaterThanOrEqual(2);
    expect(yugaVariants.map((s) => s.onlyFor)).toContain("Live drops & events");

    const revolutVariants = revolut.palette.filter((s) => Boolean(s.onlyFor));
    expect(revolutVariants.length).toBeGreaterThanOrEqual(2);
    expect(revolutVariants.map((s) => s.onlyFor)).toContain(
      "Metal & Ultra tiers"
    );
    expect(revolut.platform).toEqual(["web", "mobile web"]);
  });

  it("supports frontmatter overrides and dropping a brand-new .md file with no frontmatter", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "swatchbook-tpl-"));
    try {
      const noFrontmatterMd = `# Studio Mono — Quiet editorial specimen

## Overview

A crisp light paper system for independent publications.

## Colors

| Name | Value | Role |
| --- | --- | --- |
| Paper | \`#f9f8f4\` | Page canvas background |
| Ink | \`#181816\` | Primary text |
| Cobalt | \`#2563eb\` | Primary link accent |
| ShortHex | \`#0f0\` | Three-digit hex test |

## Typography

| Recipe | Font | Size |
| --- | --- | --- |
| Heading | Space Grotesk | 48px |
| Body | Arial | 16px |
`;
      await fs.writeFile(
        path.join(tmpDir, "studio-mono.md"),
        noFrontmatterMd,
        "utf8"
      );

      const store = new FileTemplateStore(tmpDir);
      const all = await store.getAllTemplates();
      expect(all).toHaveLength(1);

      const loaded = all[0];
      expect(loaded.slug).toBe("studio-mono");
      expect(loaded.title).toBe("Studio Mono");
      expect(loaded.tagline).toBe("Quiet editorial specimen");
      expect(loaded.theme).toBe("light");
      expect(loaded.platform).toEqual(["web"]);
      expect(loaded.palette.map((s) => s.hex)).toEqual([
        "#f9f8f4",
        "#181816",
        "#2563eb",
        "#00ff00",
      ]);
      // Generic "Arial" ignored because "Space Grotesk" exists
      expect(loaded.fonts.map((f) => f.name)).toEqual(["Space Grotesk"]);

      // Frontmatter always wins
      const withFm = parseTemplateMarkdown(
        `---
title: Custom Title
theme: dark
platform: [ios, android]
mood: [minimal]
fonts: [Outfit]
---
# Ignored Heading — Ignored Tagline
`,
        "custom-fm"
      );
      expect(withFm.title).toBe("Custom Title");
      expect(withFm.theme).toBe("dark");
      expect(withFm.platform).toEqual(["ios", "android"]);
      expect(withFm.mood).toEqual(["minimal"]);
      expect(withFm.fonts.map((f) => f.name)).toEqual(["Outfit"]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("filters and searches templates cleanly", async () => {
    const mobileWeb = await searchTemplates("", { platform: "mobile web" });
    expect(mobileWeb.map((t) => t.slug)).toEqual(["revolut"]);

    const fintech = await searchTemplates("fintech");
    expect(fintech.map((t) => t.slug)).toEqual(["revolut"]);

    const darkTemplates = await searchTemplates("", { theme: "dark" });
    expect(darkTemplates.map((t) => t.slug).sort()).toEqual([
      "orbi",
      "oryzo-ai",
    ]);
  });
});
