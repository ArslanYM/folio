import Link from "next/link";
import { ArrowRight, GitPullRequest } from "lucide-react";
import {
  GithubIcon,
  GITHUB_REPO_URL,
  GITHUB_CONTRIBUTING_URL,
} from "@/components/icons";
import { HeroGeneratorInput } from "@/components/hero-generator-input";
import {
  SwatchMarquee,
  type MarqueeSwatchItem,
} from "@/components/swatch-marquee";
import { TemplateCard } from "@/components/template-card";
import { getAllTemplates } from "@/lib/templates";

export default async function HomePage() {
  const templates = await getAllTemplates();

  // Build marquee list from all loaded templates (deduped by hex)
  const seen = new Set<string>();
  const marqueeSwatches: MarqueeSwatchItem[] = [];
  for (const tpl of templates) {
    for (const sw of tpl.palette.slice(0, 6)) {
      if (seen.has(sw.hex)) continue;
      seen.add(sw.hex);
      marqueeSwatches.push({
        ...sw,
        sourceTitle: tpl.title,
      });
    }
  }

  return (
    <div className="flex flex-col">
      {/* Asymmetric 12-column Hero */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          {/* Left 8 cols: Pitch + embedded generator input */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex w-fit items-center gap-2 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full bg-accent"
                />
                <span>SPECIMEN BOOK &amp; DESIGN.MD GENERATOR</span>
              </div>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-border bg-surface/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground"
              >
                <GithubIcon className="h-3 w-3" />
                <span>Open Source</span>
              </a>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[64px]">
              Paste a URL. Get the palette, the type, the rules.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Swatchbook extracts real tokens from any website or screenshot
              into a structured{" "}
              <code className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
                DESIGN.md
              </code>{" "}
              spec — ready to paste into Copilot, Cursor, or Claude Code.
            </p>

            <div className="pt-1">
              <HeroGeneratorInput />
            </div>
          </div>

          {/* Right 4 cols: Paint-chip fan specimen summary */}
          <aside
            aria-label="Template palette fan preview"
            className="flex flex-col gap-3 rounded-lg border border-border/80 bg-surface/80 p-4 shadow-2xl backdrop-blur-md lg:col-span-4"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-2 font-mono text-[11px] text-muted-foreground">
              <span>CATALOG SPECIMENS</span>
              <span>{templates.length} SYSTEMS</span>
            </div>

            <div className="flex flex-col gap-2">
              {templates.map((tpl) => {
                const accent = tpl.accent?.hex ?? "#C8F23D";
                return (
                  <Link
                    key={tpl.slug}
                    href={`/templates/${tpl.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-md border border-border/80 bg-canvas/60 px-3 py-2.5 backdrop-blur-sm transition-colors hover:border-foreground/35"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="h-7 w-7 shrink-0 rounded border border-white/10"
                        style={{ backgroundColor: accent }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-semibold text-foreground group-hover:text-accent">
                          {tpl.title}
                        </p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {accent.toUpperCase()} &middot; {tpl.theme}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {tpl.palette.length}c
                    </span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/templates"
              className="mt-1 inline-flex items-center justify-between rounded border border-border bg-raised/70 px-3 py-2 font-mono text-xs text-foreground transition-colors hover:border-accent/60 hover:text-accent"
            >
              <span>Browse all templates</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      {/* Live scrolling swatch marquee */}
      <SwatchMarquee swatches={marqueeSwatches} />

      {/* Featured Templates */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Ready to copy
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Featured specimen books
            </h2>
          </div>
          <Link
            href="/templates"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-accent transition-opacity hover:opacity-80"
          >
            View full gallery
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
          {templates.slice(0, 4).map((tpl, idx) => (
            <TemplateCard key={tpl.slug} template={tpl} priority={idx < 2} />
          ))}
        </div>
      </section>

      {/* How it works — 3 editorial steps (intentionally NOT 3 identical cards in a row) */}
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              From live reference to buildable spec in three passes.
            </h2>
          </div>

          <ol className="flex flex-col divide-y divide-border border-y border-border">
            {/* Step 01 */}
            <li className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-12 lg:items-center">
              <div className="flex items-baseline gap-4 lg:col-span-5">
                <span className="font-mono text-xs font-semibold text-accent">
                  01
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  Drop a URL or screenshot
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground lg:col-span-4">
                For URLs, Swatchbook safely fetches HTML and linked CSS, parses
                custom properties, hex frequencies, font stacks, radii, and
                breakpoints in code — never letting an LLM hallucinate hexes.
              </p>
              <div className="rounded-md border border-border bg-canvas px-3.5 py-2.5 font-mono text-xs text-muted-foreground lg:col-span-3">
                <span className="text-accent">GET</span> styles &rarr;{" "}
                <span className="text-foreground">JSON tokens</span>
              </div>
            </li>

            {/* Step 02 */}
            <li className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-12 lg:items-center">
              <div className="flex items-baseline gap-4 lg:col-span-5">
                <span className="font-mono text-xs font-semibold text-accent">
                  02
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  Pick your target &amp; stream
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground lg:col-span-4">
                Target desktop web, mobile web, iOS, Android, landing pages, or
                dashboards. Swatchbook streams a 16-section spec, validates
                required headings, and deterministically builds the CSS &amp;
                Tailwind v4{" "}
                <code className="font-mono text-xs text-foreground">@theme</code>{" "}
                Quick Start in code.
              </p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] lg:col-span-3">
                {["desktop-web", "ios", "android", "dashboard"].map((t) => (
                  <span
                    key={t}
                    className="rounded border border-border bg-canvas px-2 py-1 text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </li>

            {/* Step 03 */}
            <li className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-12 lg:items-center">
              <div className="flex items-baseline gap-4 lg:col-span-5">
                <span className="font-mono text-xs font-semibold text-accent">
                  03
                </span>
                <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                  Paste into your coding tool
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground lg:col-span-4">
                Copy the full{" "}
                <code className="font-mono text-xs text-foreground">
                  DESIGN.md
                </code>
                , download the markdown file, or grab the ready-made &ldquo;build
                a landing page&rdquo; prompt so Copilot, Cursor, or Claude Code
                ships in the exact visual language without copying brand assets.
              </p>
              <div className="lg:col-span-3">
                <Link
                  href="/generate"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Start generating
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Community & Contributing */}
      <section className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-canvas/70 p-8 shadow-2xl backdrop-blur-md sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-accent">
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>100% OPEN SOURCE &amp; COMMUNITY DRIVEN</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Add your favorite site&apos;s design system.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Swatchbook thrives on community contributions. Adding a new{" "}
                  <code className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
                    DESIGN.md
                  </code>{" "}
                  template takes 5 minutes and requires{" "}
                  <strong className="text-foreground">zero code changes</strong> &mdash; just drop a markdown file into the templates directory.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>Star &amp; Fork on GitHub</span>
                </a>
                <a
                  href={GITHUB_CONTRIBUTING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:bg-raised"
                >
                  <GitPullRequest className="h-4 w-4 text-accent" />
                  <span>Contribution Guide</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
