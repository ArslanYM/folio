"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import type { Swatch } from "@/lib/color";
import { cn } from "@/lib/utils";

export interface MarqueeSwatchItem extends Swatch {
  sourceTitle: string;
}

export interface SwatchMarqueeProps {
  swatches: readonly MarqueeSwatchItem[];
  className?: string;
}

export function SwatchMarquee({ swatches, className }: SwatchMarqueeProps) {
  const [paused, setPaused] = useState(false);

  if (swatches.length === 0) return null;

  async function handleCopy(item: MarqueeSwatchItem) {
    const hex = item.hex.toUpperCase();
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex}`);
    } catch {
      toast.error(`Could not copy ${hex}`);
    }
  }

  const renderChip = (item: MarqueeSwatchItem, key: string, isDuplicate = false) => {
    const hex = item.hex.toUpperCase();
    return (
      <button
        key={key}
        type="button"
        tabIndex={isDuplicate ? -1 : 0}
        aria-hidden={isDuplicate ? true : undefined}
        aria-label={isDuplicate ? undefined : `Copy ${hex}, ${item.name}`}
        onClick={() => handleCopy(item)}
        className="group flex w-40 shrink-0 cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-surface text-left transition-colors hover:border-foreground/40"
      >
        <span
          className="h-12 w-full border-b border-border/60"
          style={{ backgroundColor: item.hex }}
        />
        <span className="flex flex-col gap-0.5 px-2.5 py-2">
          <span className="truncate text-xs font-medium text-foreground">
            {item.name}
          </span>
          <span className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>{hex}</span>
            <span className="truncate pl-2 text-[10px] opacity-70">
              {item.sourceTitle}
            </span>
          </span>
        </span>
      </button>
    );
  };

  return (
    <section
      aria-label="Live palette swatch strip"
      className={cn("border-y border-border bg-surface/40 py-5", className)}
    >
      <div className="mx-auto mb-3 flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Live Swatch Strip &middot; Click any chip to copy hex
        </p>
        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          className="inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded border border-border bg-canvas px-2.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3" aria-hidden="true" />
              Play
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" aria-hidden="true" />
              Pause
            </>
          )}
        </button>
      </div>

      <div className="swatch-marquee overflow-hidden px-4 sm:px-6">
        <div
          data-paused={paused ? "true" : "false"}
          className="swatch-marquee-track flex w-max gap-3 will-change-transform"
        >
          {swatches.map((item, idx) => renderChip(item, `a-${item.hex}-${idx}`, false))}
          {swatches.map((item, idx) => renderChip(item, `b-${item.hex}-${idx}`, true))}
        </div>
      </div>
    </section>
  );
}
