"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplateCardProps {
  template: ParsedTemplate;
  compact?: boolean;
  className?: string;
}

export function TemplateCard({
  template,
  compact = false,
  className,
}: TemplateCardProps) {
  const accentHex = template.accent?.hex ?? "#C8F23D";
  const cardSwatches = template.palette.slice(0, 8);
  const extraCount = Math.max(0, template.palette.length - cardSwatches.length);

  async function copyHex(hex: string) {
    const upper = hex.toUpperCase();
    try {
      await navigator.clipboard.writeText(upper);
      toast.success(`Copied ${upper}`);
    } catch {
      toast.error(`Could not copy ${upper}`);
    }
  }

  const cardStyle = {
    "--tpl-accent": accentHex,
    "--tpl-bg": template.canvasHex,
    "--tpl-fg": template.foregroundHex,
    backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${accentHex} 7%, #17150F) 0%, #17150F 56%)`,
  } as CSSProperties;

  return (
    <article
      style={cardStyle}
      className={cn(
        "tpl-card flex flex-col overflow-hidden rounded-lg border bg-surface",
        className
      )}
    >
      {/* Pantone-chip swatch strip across top (max 8 swatches) */}
      <div
        className="grid border-b border-border/80"
        style={{
          gridTemplateColumns: `repeat(${Math.max(cardSwatches.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {cardSwatches.map((swatch) => {
          const upper = swatch.hex.toUpperCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              onClick={() => copyHex(swatch.hex)}
              aria-label={`Copy ${upper}, ${swatch.name}`}
              title={`${swatch.name} · ${upper}`}
              className="group/chip relative flex h-14 cursor-pointer items-end justify-center pb-1 transition-opacity hover:opacity-90"
              style={{ backgroundColor: swatch.hex }}
            >
              <span className="sr-only">
                Copy {upper}, {swatch.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Paint-chip mono readout strip */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-canvas/40 px-4 py-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5 truncate">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs border border-white/15"
            style={{ backgroundColor: accentHex }}
          />
          <span>{accentHex.toUpperCase()}</span>
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <span className="capitalize">{template.theme}</span>
        </span>
        <span className="shrink-0">
          {template.palette.length} swatches
          {extraCount > 0 ? ` (+${extraCount})` : ""}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              <Link
                href={`/templates/${template.slug}`}
                className="card-link hover:text-(--tpl-accent) transition-colors"
              >
                {template.title}
              </Link>
            </h2>
            {template.tagline && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {template.tagline}
              </p>
            )}
          </div>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors"
            style={{ color: accentHex }}
          />
        </div>

        {!compact && template.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80">
            {template.summary}
          </p>
        )}

        {/* Font metadata preview */}
        {template.fonts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-3 font-mono text-[11px] text-muted-foreground">
            <span className="uppercase tracking-wider text-muted-foreground/70">
              Type
            </span>
            <span className="text-foreground/90">
              {template.fonts.map((f) => f.name).join(" / ")}
            </span>
          </div>
        )}

        {/* Platform & mood chips */}
        <footer className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {template.platform.map((plat) => (
            <span
              key={`plat-${plat}`}
              className="rounded border px-2 py-0.5 font-mono text-[11px] text-foreground"
              style={{
                borderColor: `color-mix(in srgb, ${accentHex} 38%, #2E2A21)`,
                backgroundColor: `color-mix(in srgb, ${accentHex} 10%, transparent)`,
              }}
            >
              {plat}
            </span>
          ))}
          {template.mood.map((m) => (
            <span
              key={`mood-${m}`}
              className="rounded border border-border bg-raised/70 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </footer>
      </div>
    </article>
  );
}
