"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { pickReadableForeground, type Swatch as SwatchType } from "@/lib/color";
import { cn } from "@/lib/utils";

export interface SwatchProps {
  swatch: SwatchType;
  size?: "sm" | "md" | "lg";
  showMeta?: boolean;
  className?: string;
}

export function Swatch({
  swatch,
  size = "md",
  showMeta = false,
  className,
}: SwatchProps) {
  const [copied, setCopied] = useState(false);
  const displayHex = swatch.hex.toUpperCase();
  const fgOnSwatch = pickReadableForeground(swatch.hex);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayHex);
      setCopied(true);
      toast.success(`Copied ${displayHex}`);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error(`Could not copy ${displayHex}`);
    }
  }

  const chipHeights = {
    sm: "h-12",
    md: "h-20",
    lg: "h-24",
  } as const;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${displayHex}, ${swatch.name}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border border-border bg-surface text-left transition-colors hover:border-foreground/40 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      <span
        className={cn(
          "relative flex w-full items-start justify-between p-2",
          chipHeights[size]
        )}
        style={{ backgroundColor: swatch.hex }}
      >
        {swatch.onlyFor && (
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none"
            style={{
              backgroundColor:
                fgOnSwatch === "#0E0D0B"
                  ? "rgba(14,13,11,0.16)"
                  : "rgba(242,237,226,0.16)",
              color: fgOnSwatch,
            }}
          >
            {swatch.onlyFor}
          </span>
        )}
        <span
          aria-hidden="true"
          className={cn(
            "ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100",
            copied && "opacity-100"
          )}
          style={{
            backgroundColor:
              fgOnSwatch === "#0E0D0B"
                ? "rgba(14,13,11,0.18)"
                : "rgba(242,237,226,0.2)",
            color: fgOnSwatch,
          }}
        >
          <Check className="h-3 w-3" />
        </span>
      </span>

      <span className="flex flex-1 flex-col gap-0.5 px-2.5 py-2">
        <span className="truncate text-xs font-medium text-foreground">
          {swatch.name}
        </span>
        <span className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{displayHex}</span>
          {swatch.alpha !== undefined && (
            <span className="text-[10px]">
              {Math.round(swatch.alpha * 100)}%
            </span>
          )}
        </span>
        {showMeta && swatch.token && (
          <span className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
            {swatch.token}
          </span>
        )}
        {showMeta && (swatch.role || swatch.use) && (
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {swatch.role ?? swatch.use}
          </span>
        )}
      </span>
    </button>
  );
}
