"use client";

import { useMemo } from "react";
import {
  isDarkColor,
  luminance,
  pickReadableForeground,
  type Swatch,
} from "@/lib/color";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplatePreviewProps {
  template: ParsedTemplate;
  className?: string;
}

interface DerivedThemeTokens {
  primaryBg: string;
  primaryFg: string;
  primarySurface: string;
  primaryMuted: string;
  primaryBorder: string;
  altBg: string;
  altFg: string;
  altSurface: string;
  altBorder: string;
  accent: string;
  accentFg: string;
  secondaryAccents: string[];
  displayFont: string;
  bodyFont: string;
  displayWeight: number;
  isUppercase: boolean;
  isBrutalist: boolean;
  isPillButtons: boolean;
  isPrism: boolean;
  isFintech: boolean;
  isMuseum: boolean;
  cardRadius: string;
  buttonRadius: string;
}

function findSwatchByKeywords(
  palette: readonly Swatch[],
  pattern: RegExp
): Swatch | undefined {
  return palette.find((s) =>
    pattern.test(`${s.name} ${s.token ?? ""} ${s.role ?? ""} ${s.use ?? ""}`)
  );
}

function derivePreviewTokens(template: ParsedTemplate): DerivedThemeTokens {
  const { palette, fonts, theme, tags, mood, rawMarkdown } = template;
  const tagSet = new Set([...tags, ...mood].map((t) => t.toLowerCase()));

  const darkCanvases = palette
    .filter((s) => luminance(s.hex) < 0.14)
    .sort((a, b) => luminance(a.hex) - luminance(b.hex));
  const lightCanvases = palette
    .filter((s) => luminance(s.hex) > 0.78)
    .sort((a, b) => luminance(b.hex) - luminance(a.hex));

  const darkBg = darkCanvases[0]?.hex ?? "#0d0d0d";
  const lightBg = lightCanvases[0]?.hex ?? "#f8f7f4";

  const primaryBg = theme === "light" ? lightBg : darkBg;
  const primaryFg = pickReadableForeground(primaryBg, "#111113", "#f4f2ec");

  const surfaceMatch = findSwatchByKeywords(
    palette,
    /\b(surface|card|plinth|cork|panel)\b/i
  );
  const borderMatch = findSwatchByKeywords(palette, /\b(border|rule|edge|divider)\b/i);
  const mutedMatch = findSwatchByKeywords(palette, /\b(muted|secondary|ash|graphite|steel)\b/i);

  const primarySurface =
    surfaceMatch && isDarkColor(surfaceMatch.hex) === isDarkColor(primaryBg)
      ? surfaceMatch.hex
      : isDarkColor(primaryBg)
        ? "#181715"
        : "#f1f0ec";

  const primaryBorder =
    borderMatch && borderMatch.hex !== primaryBg
      ? borderMatch.hex
      : isDarkColor(primaryBg)
        ? "rgba(255,255,255,0.14)"
        : "rgba(17,17,19,0.14)";

  const primaryMuted =
    mutedMatch?.hex ?? (isDarkColor(primaryBg) ? "#9c978f" : "#66707a");

  // Mixed themes alternate stages! Single-polarity themes step subtly.
  const altBg =
    theme === "mixed"
      ? isDarkColor(primaryBg)
        ? lightBg
        : darkBg
      : primarySurface;
  const altFg = pickReadableForeground(altBg, "#111113", "#f4f2ec");
  const altSurface = isDarkColor(altBg)
    ? "#1a1b20"
    : findSwatchByKeywords(palette, /mist|chalk|surface-light/i)?.hex ??
      "#eceae4";
  const altBorder = isDarkColor(altBg)
    ? "rgba(255,255,255,0.14)"
    : "rgba(17,17,19,0.14)";

  const accent = template.accent?.hex ?? "#C8F23D";
  const accentFg = pickReadableForeground(accent, "#0E0D0B", "#FFFFFF");

  const secondaryAccents = palette
    .filter((s) => s.hex !== accent && luminance(s.hex) > 0.12 && luminance(s.hex) < 0.85)
    .slice(0, 4)
    .map((s) => s.hex);

  const displaySpec = fonts[0];
  const bodySpec = fonts[1] ?? fonts[0];

  const isBrutalist =
    tagSet.has("brutalist") ||
    tagSet.has("pixel-field") ||
    /border-radius:\s*0px/i.test(rawMarkdown);
  const isMuseum =
    tagSet.has("museum") || tagSet.has("3d-object") || tagSet.has("uppercase");
  const isPrism = tagSet.has("rainbow-glow") || tagSet.has("handmade");
  const isFintech = tagSet.has("fintech") || tagSet.has("photography");

  const isPillButtons =
    !isBrutalist &&
    !isMuseum &&
    (/999px/i.test(rawMarkdown) || isPrism || isFintech);

  const cardRadius = isBrutalist
    ? "0px"
    : isMuseum
      ? "4px"
      : isPrism
        ? "22px"
        : isFintech
          ? "20px"
          : "12px";

  const buttonRadius = isPillButtons
    ? "999px"
    : isBrutalist || isMuseum
      ? "2px"
      : "8px";

  return {
    primaryBg,
    primaryFg,
    primarySurface,
    primaryMuted,
    primaryBorder,
    altBg,
    altFg,
    altSurface,
    altBorder,
    accent,
    accentFg,
    secondaryAccents,
    displayFont: displaySpec
      ? `"${displaySpec.substitute}", sans-serif`
      : "var(--font-bricolage), sans-serif",
    bodyFont: bodySpec
      ? `"${bodySpec.substitute}", sans-serif`
      : "var(--font-geist-sans), sans-serif",
    displayWeight: displaySpec?.displayWeight ?? 700,
    isUppercase: isMuseum,
    isBrutalist,
    isPillButtons,
    isPrism,
    isFintech,
    isMuseum,
    cardRadius,
    buttonRadius,
  };
}

export function TemplatePreview({ template, className }: TemplatePreviewProps) {
  const tokens = useMemo(() => derivePreviewTokens(template), [template]);

  // 1. If content/templates/<slug>.preview.html exists, render inside a scriptless sandboxed iframe
  if (template.hasPreviewHtml && template.previewHtml) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-canvas",
          className
        )}
      >
        <iframe
          sandbox=""
          srcDoc={template.previewHtml}
          title={`${template.title} landing page preview`}
          className="min-h-[680px] w-full border-0"
        />
      </div>
    );
  }

  const prismGradient =
    tokens.secondaryAccents.length >= 3
      ? `linear-gradient(125deg, ${tokens.accent}, ${tokens.secondaryAccents.slice(0, 3).join(", ")})`
      : `linear-gradient(125deg, ${tokens.accent}, #ff9f43, #45d9e8, #a78bfa)`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border shadow-none",
        className
      )}
      style={{
        backgroundColor: tokens.primaryBg,
        color: tokens.primaryFg,
        fontFamily: tokens.bodyFont,
      }}
    >
      {/* Top navigation bar */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3.5"
        style={{
          borderBottom: `1px solid ${tokens.primaryBorder}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5"
            style={{
              backgroundColor: tokens.accent,
              borderRadius: tokens.isPillButtons ? "999px" : "2px",
            }}
          />
          <span
            className={cn(
              "text-sm font-semibold tracking-tight",
              tokens.isUppercase && "uppercase tracking-widest"
            )}
            style={{ fontFamily: tokens.displayFont }}
          >
            Specimen
          </span>
        </div>

        <div
          className="hidden items-center gap-4 text-xs sm:flex"
          style={{ color: tokens.primaryMuted }}
        >
          <span>Overview</span>
          <span>Architecture</span>
          <span>Pricing</span>
        </div>

        <span
          className={cn(
            "inline-flex items-center px-3 py-1.5 text-xs font-semibold",
            tokens.isUppercase && "uppercase tracking-wider"
          )}
          style={{
            backgroundColor: tokens.accent,
            color: tokens.accentFg,
            borderRadius: tokens.buttonRadius,
          }}
        >
          Start now
        </span>
      </div>

      {/* Hero section — varies meaningfully by template vocabulary */}
      <div className="px-5 py-10 sm:px-7 sm:py-12">
        <div
          className={cn(
            "grid gap-6",
            tokens.isPrism
              ? "grid-cols-1 text-center items-center"
              : "grid-cols-1 sm:grid-cols-12 sm:items-end"
          )}
        >
          <div
            className={cn(
              tokens.isPrism ? "mx-auto max-w-md" : "sm:col-span-7"
            )}
          >
            <p
              className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: tokens.accent }}
            >
              {tokens.isMuseum
                ? "01 / ARTIFACT EDITION"
                : tokens.isFintech
                  ? "GLOBAL ACCOUNT · ZERO HIDDEN FEES"
                  : tokens.isBrutalist
                    ? "INDEX 01 — SYSTEM"
                    : "PRIVATE BETA · BATCH 04"}
            </p>
            <h3
              className={cn(
                "text-2xl leading-[1.04] tracking-tight sm:text-4xl",
                tokens.isUppercase && "uppercase tracking-[0.06em]"
              )}
              style={{
                fontFamily: tokens.displayFont,
                fontWeight: tokens.displayWeight,
              }}
            >
              Your product, one clear sentence.
            </h3>
            <p
              className="mt-3 text-xs leading-relaxed sm:text-sm"
              style={{ color: tokens.primaryMuted }}
            >
              Every surface, corner radius, and contrast step comes straight
              from the template tokens above — ready for desktop and mobile.
            </p>

            <div
              className={cn(
                "mt-5 flex flex-wrap items-center gap-2.5",
                tokens.isPrism && "justify-center"
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center px-4 py-2 text-xs font-semibold",
                  tokens.isUppercase && "uppercase tracking-wider"
                )}
                style={{
                  backgroundColor: tokens.accent,
                  color: tokens.accentFg,
                  borderRadius: tokens.buttonRadius,
                }}
              >
                {tokens.isPrism ? "Join the waitlist" : "Get started"}
              </span>
              {tokens.isMuseum && (
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: tokens.primaryMuted }}
                >
                  412G · ANODIZED SHELL
                </span>
              )}
            </div>
          </div>

          {/* Product / visual block */}
          <div className={cn(tokens.isPrism ? "w-full" : "sm:col-span-5")}>
            <div
              style={{
                padding: tokens.isPrism ? "1px" : "0px",
                background: tokens.isPrism ? prismGradient : "transparent",
                borderRadius: tokens.cardRadius,
              }}
            >
              <div
                className="relative flex min-h-44 flex-col justify-between overflow-hidden p-4"
                style={{
                  backgroundColor: tokens.primarySurface,
                  border: tokens.isPrism
                    ? "none"
                    : `1px solid ${tokens.primaryBorder}`,
                  borderRadius: tokens.cardRadius,
                }}
              >
                {tokens.isFintech ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: tokens.primaryMuted }}>
                        Main balance
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${tokens.accent}22`,
                          color: tokens.accent,
                        }}
                      >
                        USD · EUR · GBP
                      </span>
                    </div>
                    <div className="my-3">
                      <p
                        className="text-2xl font-bold tracking-tight"
                        style={{
                          fontFamily: tokens.displayFont,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        $14,820.50
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "#00b876" }}
                      >
                        +$420.00 settled today
                      </p>
                    </div>
                    <div
                      className="flex items-center justify-between px-3 py-2 text-[11px]"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        color: "#191c1f",
                        borderRadius: "12px",
                      }}
                    >
                      <span className="font-medium">Tokyo Transit</span>
                      <span
                        className="font-mono font-semibold"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        -$6.40
                      </span>
                    </div>
                  </>
                ) : tokens.isMuseum ? (
                  <>
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest opacity-60">
                      <span>FIG. 01</span>
                      <span>3D OBJECT STAGE</span>
                    </div>
                    <div className="my-4 flex items-center justify-center">
                      <div
                        className="h-20 w-20 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 32% 28%, ${tokens.accent}, ${tokens.primaryBg} 74%)`,
                          border: `1px solid ${tokens.primaryBorder}`,
                        }}
                      />
                    </div>
                    <div
                      className="grid grid-cols-3 gap-2 pt-2 font-mono text-[10px]"
                      style={{
                        borderTop: `1px solid ${tokens.primaryBorder}`,
                        color: tokens.primaryMuted,
                      }}
                    >
                      <span>12MS</span>
                      <span>AL-6061</span>
                      <span>24-BIT</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between font-mono text-[10px] opacity-70">
                      <span>CANVAS PREVIEW</span>
                      <span>{tokens.accent.toUpperCase()}</span>
                    </div>
                    <div className="my-4 grid grid-cols-4 gap-1.5">
                      {template.palette.slice(0, 4).map((sw) => (
                        <div
                          key={sw.hex}
                          className="h-12"
                          style={{
                            backgroundColor: sw.hex,
                            borderRadius: tokens.isBrutalist ? "0px" : "8px",
                            border: `1px solid ${tokens.primaryBorder}`,
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-[11px]"
                      style={{ color: tokens.primaryMuted }}
                    >
                      Interactive visual stage anchored to real tokens.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brutalist pixel-field divider when relevant */}
      {tokens.isBrutalist && (
        <div
          aria-hidden="true"
          className="h-5 w-full"
          style={{
            backgroundImage: `radial-gradient(${tokens.primaryBorder} 1.5px, transparent 1.5px)`,
            backgroundSize: "6px 6px",
            borderTop: `1px solid ${tokens.primaryBorder}`,
            borderBottom: `1px solid ${tokens.primaryBorder}`,
          }}
        />
      )}

      {/* 3-row feature section (NOT three identical cards!) — flips polarity on mixed templates */}
      <div
        className="px-5 py-8 sm:px-7"
        style={{
          backgroundColor: tokens.altBg,
          color: tokens.altFg,
          borderTop: `1px solid ${tokens.altBorder}`,
        }}
      >
        <p
          className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ color: tokens.accent }}
        >
          {template.theme === "mixed"
            ? "ALTERNATING STAGE · CAPABILITIES"
            : "KEY CAPABILITIES"}
        </p>

        <div className="flex flex-col">
          {/* Row 1: Asymmetric wide split */}
          <div
            className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-12 sm:items-center"
            style={{ borderTop: `1px solid ${tokens.altBorder}` }}
          >
            <span className="font-mono text-xs opacity-60 sm:col-span-2">
              01
            </span>
            <p
              className={cn(
                "text-sm font-semibold sm:col-span-4",
                tokens.isUppercase && "uppercase tracking-wider"
              )}
              style={{ fontFamily: tokens.displayFont }}
            >
              Exact token discipline
            </p>
            <p className="text-xs leading-relaxed opacity-75 sm:col-span-6">
              Surface elevation, borders, and contrast pairs stay consistent
              across every viewport width.
            </p>
          </div>

          {/* Row 2: Highlighted callout panel */}
          <div
            className="my-2 flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            style={{
              backgroundColor: tokens.altSurface,
              border: `1px solid ${tokens.altBorder}`,
              borderRadius: tokens.cardRadius,
            }}
          >
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  tokens.isUppercase && "uppercase tracking-wider"
                )}
                style={{ fontFamily: tokens.displayFont }}
              >
                02 · Built around one signature focal point
              </p>
              <p className="mt-1 text-xs opacity-75">
                Avoids repetitive grids by pacing editorial rows with tactile
                product moments.
              </p>
            </div>
            <span
              className="shrink-0 px-2.5 py-1 font-mono text-[10px] font-semibold"
              style={{
                backgroundColor: tokens.accent,
                color: tokens.accentFg,
                borderRadius: tokens.buttonRadius,
              }}
            >
              {tokens.cardRadius} radius
            </span>
          </div>

          {/* Row 3: Compact metric strip */}
          <div
            className="grid grid-cols-3 gap-3 py-4 font-mono text-xs"
            style={{ borderTop: `1px solid ${tokens.altBorder}` }}
          >
            <div>
              <p className="text-base font-bold" style={{ color: tokens.accent }}>
                {template.palette.length}
              </p>
              <p className="text-[10px] opacity-65">SWATCHES</p>
            </div>
            <div>
              <p className="text-base font-bold">{template.fonts.length || 1}</p>
              <p className="text-[10px] opacity-65">TYPEFACES</p>
            </div>
            <div>
              <p className="text-base font-bold uppercase">{template.theme}</p>
              <p className="text-[10px] opacity-65">POLARITY</p>
            </div>
          </div>
        </div>
      </div>

      {/* Closing CTA + minimal footer */}
      <div
        className="flex flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7"
        style={{
          backgroundColor: tokens.primaryBg,
          color: tokens.primaryFg,
          borderTop: `1px solid ${tokens.primaryBorder}`,
        }}
      >
        <div>
          <p
            className={cn(
              "text-base font-semibold",
              tokens.isUppercase && "uppercase tracking-wider"
            )}
            style={{ fontFamily: tokens.displayFont }}
          >
            Ready to build in this style?
          </p>
          <p className="mt-0.5 text-xs" style={{ color: tokens.primaryMuted }}>
            Copy the DESIGN.md or the landing-page prompt above.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center px-4 py-2 text-xs font-semibold",
            tokens.isUppercase && "uppercase tracking-wider"
          )}
          style={{
            backgroundColor: tokens.accent,
            color: tokens.accentFg,
            borderRadius: tokens.buttonRadius,
          }}
        >
          Launch project
        </span>
      </div>

      <div
        className="flex items-center justify-between px-5 py-3 font-mono text-[10px]"
        style={{
          borderTop: `1px solid ${tokens.primaryBorder}`,
          color: tokens.primaryMuted,
        }}
      >
        <span>&copy; Specimen Mock</span>
        <span>{template.slug}.DESIGN.md</span>
      </div>
    </div>
  );
}
