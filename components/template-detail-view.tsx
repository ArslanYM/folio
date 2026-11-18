"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { FileTabBar } from "@/components/file-tab";
import { MdViewer } from "@/components/md-viewer";
import { Palette } from "@/components/palette";
import { TemplatePreview } from "@/components/template-preview";
import { TypeSpecimen } from "@/components/type-specimen";
import { Button } from "@/components/ui/button";
import { pickReadableForeground } from "@/lib/color";
import { buildLandingPagePrompt } from "@/lib/prompts/landing-page";
import type { ParsedTemplate } from "@/lib/templates";

export interface TemplateDetailViewProps {
  template: ParsedTemplate;
}

export function TemplateDetailView({ template }: TemplateDetailViewProps) {
  const [leftTab, setLeftTab] = useState<"specimen" | "preview">("specimen");
  const [rightTab, setRightTab] = useState<"rendered" | "raw">("rendered");

  const accentHex = template.accent?.hex ?? "#C8F23D";
  const accentFg = pickReadableForeground(accentHex);

  const landingPagePrompt = useMemo(
    () =>
      buildLandingPagePrompt(template.rawMarkdown, template.hasSectionRecipes),
    [template.rawMarkdown, template.hasSectionRecipes]
  );

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
    <div style={wrapperStyle} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb & title header */}
      <div className="mb-8 flex flex-col gap-6 border-b border-border pb-7">
        <Link
          href="/templates"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to gallery
        </Link>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px]"
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
              <span className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] capitalize text-muted-foreground">
                {template.theme}
              </span>
              {template.platform.map((p) => (
                <span
                  key={p}
                  className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {p}
                </span>
              ))}
              {template.mood.map((m) => (
                <span
                  key={m}
                  className="rounded border border-border/70 bg-raised/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {m}
                </span>
              ))}
            </div>

            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              {template.title}
            </h1>
            {template.tagline && (
              <p className="mt-1.5 text-base text-muted-foreground">
                {template.tagline}
              </p>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              text={template.rawMarkdown}
              label="Copy DESIGN.md"
              toastMessage={`Copied ${template.title} DESIGN.md`}
              variant="default"
              size="default"
              className="h-9 bg-accent px-3.5 text-accent-foreground hover:bg-accent/90"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleDownload}
              className="h-9 cursor-pointer gap-1.5 border-border bg-surface px-3 text-foreground hover:bg-raised"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download .md
            </Button>
            <CopyButton
              text={landingPagePrompt}
              label='Copy "build a landing page" prompt'
              copiedLabel="Prompt copied"
              toastMessage="Copied landing-page prompt"
              variant="outline"
              size="default"
              className="h-9 border-border bg-surface px-3 text-foreground hover:border-(--tpl-accent) hover:bg-raised"
            />
          </div>
        </div>
      </div>

      {/* Main 12-column split workbench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: Specimen (Palette + Type + Component Strip) & Preview tab */}
        <div className="overflow-hidden rounded-lg border border-border bg-surface lg:col-span-5">
          <FileTabBar
            ariaLabel="Visual specimen and preview"
            activeId={leftTab}
            onChange={setLeftTab}
            accentColor={accentHex}
            tabs={[
              {
                id: "specimen",
                label: "Specimen",
                badge: `${template.palette.length}`,
              },
              { id: "preview", label: "Preview" },
            ]}
          />

          <div
            role="tabpanel"
            aria-labelledby={`tab-${leftTab}`}
            className="p-4 sm:p-5"
          >
            {leftTab === "specimen" ? (
              <div className="flex flex-col gap-8">
                {/* Palette */}
                <section aria-labelledby="palette-heading">
                  <div className="mb-3 flex items-center justify-between">
                    <h2
                      id="palette-heading"
                      className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Palette — click any chip to copy
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

                {/* Type Specimen */}
                <section aria-labelledby="type-heading">
                  <h2
                    id="type-heading"
                    className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Type Specimen
                  </h2>
                  <TypeSpecimen
                    fonts={template.fonts}
                    accentHex={accentHex}
                    uppercaseDisplay={isUppercaseDisplay}
                  />
                </section>

                {/* Component Preview Strip */}
                <section aria-labelledby="strip-heading">
                  <h2
                    id="strip-heading"
                    className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Component Strip
                  </h2>
                  <div
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border p-4"
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

                {/* Section Table of Contents */}
                {template.sectionHeadings.length > 0 && (
                  <section aria-labelledby="toc-heading">
                    <h2
                      id="toc-heading"
                      className="mb-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Sections ({template.sectionHeadings.length})
                    </h2>
                    <ol className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {template.sectionHeadings.map((heading, idx) => (
                        <li key={heading.id}>
                          <a
                            href={`#${heading.id}`}
                            onClick={() => setRightTab("rendered")}
                            className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-raised hover:text-foreground"
                          >
                            <span className="font-mono text-[10px] text-muted-foreground/60">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="truncate">{heading.title}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>
                    {template.hasPreviewHtml
                      ? "Sandboxed HTML preview"
                      : "Token-driven landing-page mock"}
                  </span>
                  <span>{template.theme} polarity</span>
                </div>
                <TemplatePreview template={template} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: File-tab style Rendered / Raw DESIGN.md viewer */}
        <div className="overflow-hidden rounded-lg border border-border bg-surface lg:col-span-7">
          <FileTabBar
            ariaLabel="DESIGN.md view mode"
            activeId={rightTab}
            onChange={setRightTab}
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
            aria-labelledby={`tab-${rightTab}`}
            className="p-5 sm:p-7"
          >
            {rightTab === "rendered" ? (
              <MdViewer markdown={template.rawMarkdown} />
            ) : (
              <pre className="overflow-x-auto rounded-md border border-border bg-canvas p-4 font-mono text-xs leading-relaxed text-foreground/90">
                <code>{template.rawMarkdown}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
