"use client";

import { useEffect } from "react";
import { buildGoogleFontsHref, type FontResolution } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export interface TypeSpecimenProps {
  fonts: readonly FontResolution[];
  accentHex?: string;
  uppercaseDisplay?: boolean;
  className?: string;
}

export function TypeSpecimen({
  fonts,
  accentHex = "#C8F23D",
  uppercaseDisplay = false,
  className,
}: TypeSpecimenProps) {
  const googleFontsHref = buildGoogleFontsHref(fonts);

  // Inject Google Fonts stylesheet only when TypeSpecimen mounts (never blocking the gallery)
  useEffect(() => {
    if (!googleFontsHref) return;
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-swatchbook-fonts="${googleFontsHref}"]`
    );
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = googleFontsHref;
    link.dataset.swatchbookFonts = googleFontsHref;
    document.head.appendChild(link);
  }, [googleFontsHref]);

  if (fonts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No explicit font families detected in this specification.
      </p>
    );
  }

  const displayFont = fonts[0];
  const bodyFont = fonts[1] ?? fonts[0];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {fonts.map((font, index) => {
        const isPrimary = index === 0;
        const familyCss = `"${font.substitute}", ui-sans-serif, system-ui, sans-serif`;
        const sampleWeight = font.displayWeight ?? (isPrimary ? 700 : 400);

        return (
          <div
            key={`${font.name}-${index}`}
            className="rounded-md border border-border bg-canvas/70 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {isPrimary ? "Display" : "Body / UI"}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {font.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {font.isSubstituted ? (
                  <span className="rounded border border-border bg-raised px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    substituted &rarr; {font.substitute}
                    {font.displayWeight ? ` ${font.displayWeight}` : ""}
                  </span>
                ) : (
                  <span
                    className="rounded border px-2 py-0.5 font-mono text-[10px]"
                    style={{
                      borderColor: `color-mix(in srgb, ${accentHex} 45%, #2E2A21)`,
                      color: accentHex,
                    }}
                  >
                    exact Google Font
                  </span>
                )}
              </div>
            </div>

            {isPrimary ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
                <div
                  className="select-none text-6xl leading-none tracking-tight text-foreground"
                  style={{
                    fontFamily: familyCss,
                    fontWeight: sampleWeight,
                  }}
                >
                  Aa
                </div>
                <div className="flex flex-col gap-1.5">
                  <p
                    className={cn(
                      "text-xl leading-tight text-foreground sm:text-2xl",
                      uppercaseDisplay && "uppercase tracking-wider"
                    )}
                    style={{
                      fontFamily: familyCss,
                      fontWeight: sampleWeight,
                    }}
                  >
                    Crafted systems scale clearly.
                  </p>
                  <p
                    className="text-xs tracking-wide text-muted-foreground"
                    style={{
                      fontFamily: familyCss,
                      fontWeight: 500,
                    }}
                  >
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p
                  className="text-sm leading-relaxed text-foreground/90"
                  style={{
                    fontFamily: familyCss,
                    fontWeight: 400,
                  }}
                >
                  Good design systems keep tokens explicit and legible across
                  surfaces. Measured hierarchy lets content carry the weight
                  while controls stay predictable at every breakpoint.
                </p>
                <p
                  className="font-mono text-xs text-muted-foreground"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  $1,240.00 · 14px / 1.55 · 400 / 500 / 600
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Quick specimen pairing summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 font-mono text-[11px] text-muted-foreground">
        <span>
          Pairing: {displayFont.name} + {bodyFont.name}
        </span>
        <span>Loaded via Google Fonts on detail view only</span>
      </div>
    </div>
  );
}
