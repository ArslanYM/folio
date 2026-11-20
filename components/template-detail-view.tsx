"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { FileTabBar } from "@/components/file-tab";
import { MdViewer } from "@/components/md-viewer";
import { Palette } from "@/components/palette";
import {
  ScreenshotLightbox,
  type LightboxShot,
} from "@/components/screenshot-lightbox";
import { TemplateMonogram } from "@/components/template-monogram";
import { TemplatePreview } from "@/components/template-preview";
import { TypeSpecimen } from "@/components/type-specimen";
import { Button } from "@/components/ui/button";
import { isDarkColor, luminance, pickReadableForeground } from "@/lib/color";
import { GITHUB_AI_GUIDE_URL } from "@/components/icons";
import { buildLandingPagePrompt } from "@/lib/prompts/landing-page";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplateDetailViewProps {
  template: ParsedTemplate;
}

/**
 * 3-card token-driven preview strip shown on the Preview tab when static
 * screenshots haven't been captured into public/previews/<slug>/ yet.
 */
function TokenPreviewStrip({ template }: { template: ParsedTemplate }) {
  const accent = template.accent?.hex ?? "#C8F23D";
  const accentFg = pickReadableForeground(accent, "#0E0D0B", "#FFFFFF");
  const darkBg =
    template.palette.find((s) => luminance(s.hex) < 0.14)?.hex ?? "#0c0c0d";
  const lightBg =
    template.palette.find((s) => luminance(s.hex) > 0.82)?.hex ?? "#f8f7f4";

  const primaryBg = template.theme === "light" ? lightBg : darkBg;
  const primaryFg = pickReadableForeground(primaryBg, "#111113", "#f4f2ec");
  const altBg =
    template.theme === "mixed"
      ? isDarkColor(primaryBg)
        ? lightBg
        : darkBg
      : isDarkColor(primaryBg)
        ? template.palette.find(
            (s) =>
              luminance(s.hex) >= 0.04 &&
              luminance(s.hex) <= 0.25 &&
              s.hex !== primaryBg
          )?.hex ?? "#181715"
        : "#efede7";
  const altFg = pickReadableForeground(altBg, "#111113", "#f4f2ec");
  const borderOnPrimary = isDarkColor(primaryBg)
    ? "rgba(255,255,255,0.12)"
    : "rgba(17,17,19,0.12)";
  const borderOnAlt = isDarkColor(altBg)
    ? "rgba(255,255,255,0.12)"
    : "rgba(17,17,19,0.12)";

  const isBrutalist =
    template.tags.includes("brutalist") ||
    template.tags.includes("pixel-field");
  const isUppercase = template.tags.includes("uppercase");
  const btnRadius =
    !isBrutalist && !isUppercase && /999px/i.test(template.rawMarkdown)
      ? "999px"
      : isBrutalist || isUppercase
        ? "2px"
        : "8px";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Frame 1: Hero & Primary CTA */}
      <div
        style={{ backgroundColor: primaryBg, color: primaryFg }}
        className="flex aspect-[16/11] flex-col justify-between overflow-hidden rounded-xl border border-border p-5"
      >
        <div
          className="flex items-center justify-between pb-2.5 text-[10px]"
          style={{ borderBottom: `1px solid ${borderOnPrimary}` }}
        >
          <span className="font-semibold">{template.title}</span>
          <span className="opacity-60">Overview · System · Docs</span>
        </div>

        <div className="my-auto py-3">
          <p
            className="font-mono text-[9px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            01 / HERO STAGE
          </p>
          <p
            className={cn(
              "mt-1.5 font-display text-xl font-bold leading-[1.06] tracking-tight",
              isUppercase && "uppercase tracking-wider text-lg"
            )}
          >
            Your product, one clear sentence.
          </p>
          <p className="mt-2 line-clamp-2 text-[11px] opacity-70">
            {template.tagline || template.summary}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 text-[10px] font-semibold"
            style={{
              backgroundColor: accent,
              color: accentFg,
              borderRadius: btnRadius,
            }}
          >
            Get started
          </span>
          <span
            className="px-2.5 py-1.5 font-mono text-[9px] opacity-75"
            style={{
              border: `1px solid ${borderOnPrimary}`,
              borderRadius: btnRadius,
            }}
          >
            {accent.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Frame 2: Secondary / Alternating Stage */}
      <div
        style={{ backgroundColor: altBg, color: altFg }}
        className="flex aspect-[16/11] flex-col justify-between overflow-hidden rounded-xl border border-border p-5"
      >
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider opacity-65">
          <span>
            {template.theme === "mixed"
              ? "02 / ALTERNATING STAGE"
              : "02 / FEATURE BAND"}
          </span>
          <span>{template.fonts[0]?.name ?? "Grotesk"}</span>
        </div>

        <div className="my-auto flex flex-col gap-2.5 py-2">
          <div
            className="flex items-baseline justify-between pb-2"
            style={{ borderBottom: `1px solid ${borderOnAlt}` }}
          >
            <span className="font-mono text-[10px] opacity-60">01</span>
            <span className="text-xs font-semibold">Exact tokens</span>
            <span
              className="font-mono text-[10px]"
              style={{ color: accent }}
            >
              {template.palette.length} swatches
            </span>
          </div>
          <div
            className="flex items-baseline justify-between pb-2"
            style={{ borderBottom: `1px solid ${borderOnAlt}` }}
          >
            <span className="font-mono text-[10px] opacity-60">02</span>
            <span className="text-xs font-semibold">Measured hierarchy</span>
            <span className="font-mono text-[10px] opacity-65">
              {template.fonts.length || 1} fonts
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] opacity-60">03</span>
            <span className="text-xs font-semibold">Polarity</span>
            <span className="font-mono text-[10px] uppercase opacity-65">
              {template.theme}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {template.palette.slice(0, 6).map((sw) => (
            <span
              key={sw.hex}
              className="h-5"
              style={{
                backgroundColor: sw.hex,
                borderRadius: isBrutalist ? "0px" : "4px",
                border: `1px solid ${borderOnAlt}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Frame 3: Surface, Typography & Component Accent */}
      <div
        style={{ backgroundColor: template.cardBgHex, color: pickReadableForeground(template.cardBgHex, "#111113", "#f4f2ec") }}
        className="flex aspect-[16/11] flex-col justify-between overflow-hidden rounded-xl border border-border p-5"
      >
        <div className="flex items-start justify-between">
          <span
            className="font-display text-5xl font-bold leading-none tracking-tight"
            style={{
              color:
                luminance(template.cardBgHex) > 0.5 && luminance(accent) < 0.55
                  ? accent
                  : undefined,
            }}
          >
            Aa
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider opacity-65">
            03 / SPECIMEN
          </span>
        </div>

        <div className="my-auto py-2">
          <p className="text-xs font-semibold">
            {template.fonts.map((f) => f.name).join(" + ") || "System Sans"}
          </p>
          <p className="mt-1 text-[11px] opacity-70">
            Drop real screenshots into{" "}
            <code className="font-mono text-[10px]">
              public/previews/{template.slug}/
            </code>{" "}
            or run <code className="font-mono text-[10px]">pnpm capture-previews</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {template.palette.slice(0, 6).map((sw) => (
            <span
              key={sw.hex}
              className="h-4 w-4 rounded-full border border-black/15"
              style={{ backgroundColor: sw.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TemplateDetailView({ template }: TemplateDetailViewProps) {
  const [mainTab, setMainTab] = useState<"preview" | "design-md">("preview");
  const [mdMode, setMdMode] = useState<"rendered" | "raw">("rendered");
  const [showFullMock, setShowFullMock] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const accentHex = template.accent?.hex ?? "#C8F23D";
  const accentFg = pickReadableForeground(accentHex);

  const landingPagePrompt = useMemo(
    () =>
      buildLandingPagePrompt(template.rawMarkdown, template.hasSectionRecipes),
    [template.rawMarkdown, template.hasSectionRecipes]
  );

  const lightboxShots: LightboxShot[] = useMemo(() => {
    const items: LightboxShot[] = template.previewMedia.shots.map((src, i) => ({
      src,
      label: i === 0 ? "Hero viewport" : `Section ${i + 1}`,
    }));
    if (template.previewMedia.full) {
      items.push({ src: template.previewMedia.full, label: "Full page" });
    }
    return items;
  }, [template.previewMedia]);

  function handleDownload() {
    const blob = new Blob([template.rawMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.slug}.DESIGN.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${template.slug}.DESIGN.md`);
  }

  const wrapperStyle = {
    "--tpl-accent": accentHex,
    "--tpl-bg": template.canvasHex,
    "--tpl-fg": template.foregroundHex,
  } as CSSProperties;

  const isUppercaseDisplay = template.tags.includes("uppercase");

  return (
    <div
      style={wrapperStyle}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Back navigation */}
      <div className="mb-5">
        <Link
          href="/templates"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to gallery
        </Link>
      </div>

      {/* Full-width Hero Banner Card (Image 2 style) */}
      <section className="mb-6 flex flex-col justify-between gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
              style={{
                borderColor: `color-mix(in srgb, ${accentHex} 45%, #2E2A21)`,
                color: accentHex,
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: accentHex }}
              />
              {accentHex.toUpperCase()}
            </span>
            <span className="rounded-full border border-border bg-canvas px-2.5 py-0.5 font-mono text-[11px] capitalize text-muted-foreground">
              {template.theme}
            </span>
            {template.platform.map((p) => (
              <span
                key={p}
                className="rounded-full border border-border bg-canvas px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {p}
              </span>
            ))}
            {template.mood.map((m) => (
              <span
                key={m}
                className="rounded-full border border-border/70 bg-raised/60 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {template.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {template.tagline || template.summary}
          </p>

          {template.websiteUrl && (
            <div className="mt-4">
              <a
                href={template.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                <span>{template.websiteUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        <TemplateMonogram template={template} size="lg" />
      </section>

      {/* Segmented Mode Toggle + Actions Bar (Image 2 style) */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Left: Pill switcher Preview | DESIGN.md */}
        <div
          role="tablist"
          aria-label="Template view"
          className="inline-flex w-fit items-center rounded-full border border-border bg-surface p-1"
        >
          <button
            type="button"
            role="tab"
            id="main-tab-preview"
            aria-selected={mainTab === "preview"}
            onClick={() => setMainTab("preview")}
            className={cn(
              "min-h-9 cursor-pointer rounded-full px-5 text-sm font-medium transition-colors",
              mainTab === "preview"
                ? "bg-foreground text-canvas font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            id="main-tab-design-md"
            aria-selected={mainTab === "design-md"}
            onClick={() => setMainTab("design-md")}
            className={cn(
              "min-h-9 cursor-pointer rounded-full px-5 font-mono text-xs font-medium transition-colors sm:text-sm",
              mainTab === "design-md"
                ? "bg-foreground text-canvas font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            DESIGN.md
          </button>
        </div>

        {/* Right: Copy .md | Download .md | Copy AI Prompt */}
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            text={template.rawMarkdown}
            label="Copy .md"
            toastMessage={`Copied ${template.title} DESIGN.md`}
            variant="outline"
            size="default"
            className="h-10 rounded-full border-border bg-surface px-4 text-foreground hover:bg-raised"
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleDownload}
            className="h-10 cursor-pointer gap-1.5 rounded-full border-border bg-surface px-4 text-foreground hover:bg-raised"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download .md
          </Button>
          <CopyButton
            text={landingPagePrompt}
            label='Copy "build a landing page" prompt'
            copiedLabel="Prompt copied"
            toastMessage="Copied landing-page prompt"
            variant="default"
            size="default"
            className="h-10 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/90"
          />
          <a
            href={GITHUB_AI_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:bg-raised hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span className="hidden sm:inline">AI Generation Guide</span>
            <span className="sm:hidden">AI Guide</span>
          </a>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {mainTab === "preview" ? (
        <div
          role="tabpanel"
          aria-labelledby="main-tab-preview"
          className="flex flex-col gap-10"
        >
          {/* 3-Card Website Screenshot Showcase (or sandboxed HTML / Token Preview Strip) */}
          <section aria-labelledby="visual-showcase-heading" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="visual-showcase-heading"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                {template.previewMedia.shots.length > 0
                  ? "Captured Website Screens — Click any screen to expand"
                  : template.hasPreviewHtml
                    ? "Sandboxed Example Preview"
                    : "Visual System Preview"}
              </h2>
              {!template.hasPreviewHtml && (
                <button
                  type="button"
                  onClick={() => setShowFullMock((prev) => !prev)}
                  className="cursor-pointer font-mono text-xs text-accent hover:underline"
                >
                  {showFullMock
                    ? "Hide full interactive page mock"
                    : "Show full interactive page mock"}
                </button>
              )}
            </div>

            {template.previewMedia.shots.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {template.previewMedia.shots.slice(0, 3).map((src, idx) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    aria-label={`Expand ${template.title} screenshot ${idx + 1}`}
                    className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-(--tpl-accent)"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${template.title} preview ${idx + 1}`}
                      fetchPriority={idx === 0 ? "high" : undefined}
                      loading={idx === 0 ? undefined : "lazy"}
                      className="h-full w-full object-cover object-top transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-canvas/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            ) : template.hasPreviewHtml ? (
              <TemplatePreview template={template} />
            ) : (
              <TokenPreviewStrip template={template} />
            )}

            {showFullMock && !template.hasPreviewHtml && (
              <div className="mt-2">
                <TemplatePreview template={template} />
              </div>
            )}
          </section>

          {/* Palette + Type Specimen + Component Strip below */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <section
              aria-labelledby="palette-heading"
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:col-span-7"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  id="palette-heading"
                  className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Palette — Click any chip to copy hex
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {template.palette.length} colors
                </span>
              </div>
              <Palette
                swatches={template.palette}
                grouped
                size="sm"
                showMeta
              />
            </section>

            <div className="flex flex-col gap-6 lg:col-span-5">
              <section
                aria-labelledby="type-heading"
                className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
              >
                <h2
                  id="type-heading"
                  className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Type Specimen
                </h2>
                <TypeSpecimen
                  fonts={template.fonts}
                  accentHex={accentHex}
                  uppercaseDisplay={isUppercaseDisplay}
                />
              </section>

              <section
                aria-labelledby="strip-heading"
                className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
              >
                <h2
                  id="strip-heading"
                  className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Component Strip
                </h2>
                <div
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-4"
                  style={{
                    backgroundColor: template.canvasHex,
                    color: template.foregroundHex,
                  }}
                >
                  <span
                    className="inline-flex items-center px-3.5 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: accentHex,
                      color: accentFg,
                      borderRadius: template.tags.includes("brutalist")
                        ? "2px"
                        : "999px",
                    }}
                  >
                    Primary CTA
                  </span>
                  <span
                    className="inline-flex items-center border px-3 py-2 text-xs font-medium"
                    style={{
                      borderColor: `color-mix(in srgb, ${template.foregroundHex} 28%, transparent)`,
                      borderRadius: template.tags.includes("brutalist")
                        ? "2px"
                        : "999px",
                    }}
                  >
                    Secondary
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[11px]"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${accentHex} 18%, transparent)`,
                      color: accentHex,
                    }}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Active badge
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        /* DESIGN.md tab: TOC + Rendered / Raw viewer */
        <div
          role="tabpanel"
          aria-labelledby="main-tab-design-md"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start"
        >
          {template.sectionHeadings.length > 0 && (
            <aside className="rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-20 lg:col-span-3">
              <h2 className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Sections ({template.sectionHeadings.length})
              </h2>
              <ol className="flex flex-col gap-0.5">
                {template.sectionHeadings.map((heading, idx) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      onClick={() => setMdMode("rendered")}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-raised hover:text-foreground"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate">{heading.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          )}

          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-surface",
              template.sectionHeadings.length > 0
                ? "lg:col-span-9"
                : "lg:col-span-12"
            )}
          >
            <FileTabBar
              ariaLabel="DESIGN.md view mode"
              activeId={mdMode}
              onChange={setMdMode}
              accentColor={accentHex}
              tabs={[
                { id: "rendered", label: "Rendered", badge: "DESIGN.md" },
                { id: "raw", label: "Raw", badge: ".md" },
              ]}
              rightSlot={
                <CopyButton
                  text={template.rawMarkdown}
                  label="Copy"
                  size="xs"
                  variant="ghost"
                  toastMessage={`Copied ${template.slug}.DESIGN.md`}
                />
              }
            />

            <div
              role="tabpanel"
              aria-labelledby={`tab-${mdMode}`}
              className="p-5 sm:p-7"
            >
              {mdMode === "rendered" ? (
                <MdViewer markdown={template.rawMarkdown} />
              ) : (
                <pre className="overflow-x-auto rounded-md border border-border bg-canvas p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{template.rawMarkdown}</code>
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Native <dialog> lightbox for captured screenshots */}
      <ScreenshotLightbox
        shots={lightboxShots}
        activeIndex={lightboxIdx}
        title={template.title}
        onClose={() => setLightboxIdx(null)}
        onSelectIndex={(idx) => setLightboxIdx(idx)}
      />
    </div>
  );
}
