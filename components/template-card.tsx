"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TemplateMonogram } from "@/components/template-monogram";
import {
  isDarkColor,
  luminance,
  pickReadableForeground,
} from "@/lib/color";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplateCardProps {
  template: ParsedTemplate;
  priority?: boolean;
  className?: string;
}

/**
 * Miniature token-driven website preview rendered inside the card viewport
 * when static screenshots haven't been captured into public/previews/<slug>/ yet.
 * Still scrolls smoothly on hover so every card feels alive out of the box!
 */
function MiniSiteMock({ template }: { template: ParsedTemplate }) {
  const accent = template.accent?.hex ?? "#C8F23D";
  const accentFg = pickReadableForeground(accent, "#0E0D0B", "#FFFFFF");
  const isBrutalist =
    template.tags.includes("brutalist") ||
    template.tags.includes("pixel-field");
  const isUppercase = template.tags.includes("uppercase");
  const isPill =
    !isBrutalist && !isUppercase && /999px/i.test(template.rawMarkdown);

  const darkBg =
    template.palette.find((s) => luminance(s.hex) < 0.14)?.hex ?? "#0c0c0d";
  const lightBg =
    template.palette.find((s) => luminance(s.hex) > 0.8)?.hex ?? "#f8f7f4";

  // Give the inner browser window high contrast against the outer card background
  const stageBg =
    template.theme === "light"
      ? lightBg
      : template.theme === "mixed"
        ? isDarkColor(template.cardBgHex)
          ? lightBg
          : darkBg
        : darkBg;
  const stageFg = pickReadableForeground(stageBg, "#111113", "#f4f2ec");
  const stageBorder = isDarkColor(stageBg)
    ? "rgba(255,255,255,0.12)"
    : "rgba(17,17,19,0.12)";

  const altStageBg =
    template.theme === "mixed"
      ? isDarkColor(stageBg)
        ? lightBg
        : darkBg
      : isDarkColor(stageBg)
        ? template.palette.find(
            (s) => luminance(s.hex) >= 0.04 && luminance(s.hex) <= 0.22 && s.hex !== stageBg
          )?.hex ?? "#17171a"
        : "#efede7";
  const altStageFg = pickReadableForeground(altStageBg, "#111113", "#f4f2ec");

  return (
    <div
      style={
        {
          "--scroll-shift": "-38%",
          backgroundColor: stageBg,
          color: stageFg,
        } as CSSProperties
      }
      className="tpl-preview-scroll-img flex w-full flex-col select-none"
    >
      {/* Mini navbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 text-[9px]"
        style={{ borderBottom: `1px solid ${stageBorder}` }}
      >
        <span className="flex items-center gap-1.5 font-semibold tracking-tight">
          <span
            className="inline-block h-2 w-2"
            style={{
              backgroundColor: accent,
              borderRadius: isPill ? "999px" : "2px",
            }}
          />
          {template.title}
        </span>
        <span className="flex items-center gap-2.5 opacity-55">
          <span>Work</span>
          <span>System</span>
          <span>Specs</span>
        </span>
      </div>

      {/* Mini hero viewport */}
      <div className="flex min-h-[155px] flex-col justify-between px-4 py-5">
        <div>
          <p
            className="font-mono text-[8px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {template.mood.slice(0, 2).join(" · ")}
          </p>
          <p
            className={cn(
              "mt-1.5 max-w-[88%] font-display text-lg font-bold leading-[1.06] tracking-tight",
              isUppercase && "uppercase tracking-wider text-base"
            )}
          >
            {template.tagline || `${template.title} design language`}
          </p>
          <p className="mt-1.5 line-clamp-2 max-w-[85%] text-[10px] leading-snug opacity-65">
            {template.summary ||
              "Grounded typography, measured surfaces, and exact token contrast."}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex px-2.5 py-1 text-[9px] font-semibold"
            style={{
              backgroundColor: accent,
              color: accentFg,
              borderRadius: isPill ? "999px" : isBrutalist ? "2px" : "5px",
            }}
          >
            Explore system
          </span>
          <span
            className="inline-flex px-2 py-1 font-mono text-[8px] opacity-75"
            style={{
              border: `1px solid ${stageBorder}`,
              borderRadius: isPill ? "999px" : "4px",
            }}
          >
            {accent.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Second stage revealed smoothly as card hovers/scrolls */}
      <div
        className="flex flex-col gap-2 px-4 py-4"
        style={{
          backgroundColor: altStageBg,
          color: altStageFg,
          borderTop: `1px solid ${stageBorder}`,
        }}
      >
        <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-wider opacity-65">
          <span>01 / Tokens</span>
          <span>{template.palette.length} colors</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {template.palette.slice(0, 5).map((sw) => (
            <div
              key={sw.hex}
              className="h-7"
              style={{
                backgroundColor: sw.hex,
                borderRadius: isBrutalist ? "0px" : "4px",
                border: `1px solid ${stageBorder}`,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] opacity-75">
          <span>{template.fonts[0]?.name ?? "Sans"}</span>
          <span className="font-mono">{template.theme} stage</span>
        </div>
      </div>
    </div>
  );
}

export function TemplateCard({
  template,
  priority = false,
  className,
}: TemplateCardProps) {
  const accentHex = template.accent?.hex ?? "#C8F23D";
  const cardBg = template.cardBgHex;
  const cardFg = pickReadableForeground(cardBg, "#111113", "#F4F2EC");
  const isLightCard = !isDarkColor(cardBg);

  // Use accent color for "Aa" if it has strong contrast on cardBg, otherwise cardFg
  const aaColor =
    isLightCard && luminance(accentHex) < 0.55
      ? accentHex
      : !isLightCard && luminance(accentHex) > 0.3
        ? accentHex
        : cardFg;

  const dotSwatches = template.palette.slice(0, 7);
  const dotRing = isLightCard
    ? "rgba(17, 17, 19, 0.14)"
    : "rgba(255, 255, 255, 0.22)";

  const previewImgSrc =
    template.previewMedia.full ?? template.previewMedia.shots[0] ?? null;
  const hasFullScrollShot = Boolean(template.previewMedia.full);

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
  } as CSSProperties;

  return (
    <article
      style={cardStyle}
      className={cn(
        "tpl-card group flex flex-col gap-3 rounded-[22px] border border-transparent bg-transparent p-0",
        className
      )}
    >
      {/* Colored rounded specimen showcase card (Image 1 style) */}
      <div
        style={{ backgroundColor: cardBg, color: cardFg }}
        className="flex flex-col overflow-hidden rounded-[20px] border border-white/10 pt-5"
      >
        {/* Top bar: oversized Aa left + circular swatch dots right */}
        <div className="mb-4 flex items-start justify-between gap-4 px-5">
          <span
            aria-hidden="true"
            className="select-none font-display text-5xl font-medium leading-none tracking-tight"
            style={{ color: aaColor }}
          >
            Aa
          </span>

          <div
            className="flex max-w-[140px] flex-wrap justify-end gap-1.5 pt-1"
            aria-label={`${template.title} palette swatches`}
          >
            {dotSwatches.map((swatch) => {
              const upper = swatch.hex.toUpperCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => copyHex(swatch.hex)}
                  aria-label={`Copy ${upper}, ${swatch.name}`}
                  title={`${swatch.name} · ${upper}`}
                  style={{
                    backgroundColor: swatch.hex,
                    boxShadow: `inset 0 0 0 1px ${dotRing}`,
                  }}
                  className="h-5 w-5 cursor-pointer rounded-full transition-transform hover:scale-115"
                />
              );
            })}
          </div>
        </div>

        {/* Inset website preview frame anchored flush to bottom */}
        <div className="px-5">
          <div
            className={cn(
              "h-[200px] overflow-hidden rounded-t-xl border border-b-0 sm:h-[220px]",
              isLightCard ? "border-black/10 bg-black/5" : "border-white/15 bg-black/30"
            )}
          >
            {previewImgSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewImgSrc}
                alt={`${template.title} website preview`}
                fetchPriority={priority ? "high" : undefined}
                loading={priority ? undefined : "lazy"}
                style={
                  hasFullScrollShot
                    ? ({ "--scroll-shift": "calc(-100% + 220px)" } as CSSProperties)
                    : undefined
                }
                className={cn(
                  "block w-full object-cover object-top",
                  hasFullScrollShot
                    ? "tpl-preview-scroll-img h-auto min-h-full"
                    : "tpl-preview-lift h-full"
                )}
              />
            ) : (
              <MiniSiteMock template={template} />
            )}
          </div>
        </div>
      </div>

      {/* Caption strip below card (monogram + Title + 1-line tagline) */}
      <div className="flex items-start gap-3 px-1">
        <TemplateMonogram template={template} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate font-display text-base font-semibold tracking-tight text-foreground">
              <Link
                href={`/templates/${template.slug}`}
                className="card-link transition-colors group-hover:text-(--tpl-accent)"
              >
                {template.title}
              </Link>
            </h2>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {template.theme}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
            {template.tagline || template.summary || `${template.palette.length} colors · ${template.fonts[0]?.name ?? "System"}`}
          </p>
        </div>
      </div>
    </article>
  );
}
