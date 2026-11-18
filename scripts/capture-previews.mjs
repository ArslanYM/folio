#!/usr/bin/env node
/**
 * Captures compressed WebP preview screenshots for every template with a `websiteUrl`
 * defined in `content/templates/templates.meta.json` or YAML frontmatter.
 *
 * Usage:
 *   pnpm capture-previews                   # capture all templates with websiteUrl
 *   pnpm capture-previews --slug my-site    # capture a single template
 *   pnpm capture-previews --force           # overwrite existing previews
 *
 * Requires Playwright locally:
 *   pnpm add -D playwright && pnpm exec playwright install chromium
 */

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const TEMPLATES_DIR = path.join(ROOT, "content", "templates");
const PREVIEWS_DIR = path.join(ROOT, "public", "previews");

const VIEWPORT = { width: 1440, height: 900 };
const MAX_FULL_HEIGHT = 3600;

function parseArgs(argv) {
  let slugFilter = null;
  let force = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--slug" && argv[i + 1]) {
      slugFilter = argv[i + 1];
      i += 1;
    } else if (argv[i] === "--force") {
      force = true;
    }
  }
  return { slugFilter, force };
}

async function readMetaMap() {
  try {
    const raw = await fs.readFile(
      path.join(TEMPLATES_DIR, "templates.meta.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function discoverTargets(slugFilter) {
  const metaMap = await readMetaMap();
  const entries = await fs.readdir(TEMPLATES_DIR);
  const mdFiles = entries.filter((f) => f.endsWith(".md")).sort();

  const targets = [];
  for (const filename of mdFiles) {
    const slug = filename.replace(/\.md$/, "");
    if (slugFilter && slug !== slugFilter) continue;

    const raw = await fs.readFile(path.join(TEMPLATES_DIR, filename), "utf8");
    const parsed = matter(raw);
    const fmUrl =
      typeof parsed.data?.websiteUrl === "string"
        ? parsed.data.websiteUrl.trim()
        : "";
    const metaUrl =
      typeof metaMap[slug]?.websiteUrl === "string"
        ? metaMap[slug].websiteUrl.trim()
        : "";

    const websiteUrl = fmUrl || metaUrl;
    if (websiteUrl && /^https?:\/\//i.test(websiteUrl)) {
      targets.push({ slug, websiteUrl });
    }
  }

  return targets;
}

async function dismissCookieBanners(page) {
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("Got it")',
    'button:has-text("Agree")',
    '[aria-label*="accept" i]',
  ];
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 400 })) {
        await btn.click({ timeout: 500 });
        await page.waitForTimeout(300);
        break;
      }
    } catch {
      // Ignore if not present
    }
  }
}

async function main() {
  const { slugFilter, force } = parseArgs(process.argv.slice(2));
  const targets = await discoverTargets(slugFilter);

  if (targets.length === 0) {
    console.log(
      "No templates with a `websiteUrl` found. Add `websiteUrl` to content/templates/templates.meta.json or YAML frontmatter."
    );
    return;
  }

  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    console.error(
      "Playwright is not installed.\nInstall it locally with:\n  pnpm add -D playwright && pnpm exec playwright install chromium"
    );
    process.exit(1);
  }

  const browser = await playwright.chromium.launch({ headless: true });

  try {
    for (const target of targets) {
      const outDir = path.join(PREVIEWS_DIR, target.slug);
      const shot1Path = path.join(outDir, "shot-1.png");

      if (!force) {
        try {
          await fs.access(shot1Path);
          console.log(`Skipping ${target.slug} (already captured; use --force to overwrite)`);
          continue;
        } catch {
          // Proceed to capture
        }
      }

      await fs.mkdir(outDir, { recursive: true });
      console.log(`Capturing ${target.slug} -> ${target.websiteUrl}`);

      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();

      try {
        await page.goto(target.websiteUrl, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.evaluate(() => document.fonts?.ready);
        await page.waitForTimeout(800);
        await dismissCookieBanners(page);

        // 1. Hero viewport (shot-1)
        await page.screenshot({ path: path.join(outDir, "shot-1.png") });

        // 2. Scroll to mid & lower sections (shot-2, shot-3)
        const totalHeight = await page.evaluate(() =>
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          )
        );

        if (totalHeight > VIEWPORT.height * 1.25) {
          await page.evaluate((y) => window.scrollTo(0, y), VIEWPORT.height);
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(outDir, "shot-2.png") });
        }

        if (totalHeight > VIEWPORT.height * 2.1) {
          await page.evaluate(
            (y) => window.scrollTo(0, y),
            VIEWPORT.height * 2
          );
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(outDir, "shot-3.png") });
        }

        // 3. Tall full-page capture (clipped to MAX_FULL_HEIGHT for smooth card hover-scroll)
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
        const clipHeight = Math.min(totalHeight, MAX_FULL_HEIGHT);
        await page.screenshot({
          path: path.join(outDir, "full.png"),
          clip: {
            x: 0,
            y: 0,
            width: VIEWPORT.width,
            height: Math.max(VIEWPORT.height, clipHeight),
          },
        });

        console.log(`  Saved previews in public/previews/${target.slug}/`);
      } catch (err) {
        console.error(`  Failed to capture ${target.slug}:`, err.message);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
