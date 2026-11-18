"use client";

import { Swatch } from "@/components/swatch";
import type { Swatch as SwatchType } from "@/lib/color";
import { cn } from "@/lib/utils";

export interface PaletteProps {
  swatches: readonly SwatchType[];
  maxDisplay?: number;
  grouped?: boolean;
  size?: "sm" | "md" | "lg";
  showMeta?: boolean;
  className?: string;
}

export function Palette({
  swatches,
  maxDisplay,
  grouped = false,
  size = "md",
  showMeta = false,
  className,
}: PaletteProps) {
  if (swatches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No color swatches detected in this spec.
      </p>
    );
  }

  const visible =
    maxDisplay !== undefined ? swatches.slice(0, maxDisplay) : swatches;
  const hiddenCount = Math.max(0, swatches.length - visible.length);

  if (grouped) {
    const groups = new Map<string, SwatchType[]>();
    for (const swatch of visible) {
      const key = swatch.group || "Palette";
      const list = groups.get(key) ?? [];
      list.push(swatch);
      groups.set(key, list);
    }

    return (
      <div className={cn("flex flex-col gap-6", className)}>
        {Array.from(groups.entries()).map(([groupName, items]) => (
          <div key={groupName} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {groupName}
              </h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {items.map((swatch) => (
                <Swatch
                  key={swatch.hex}
                  swatch={swatch}
                  size={size}
                  showMeta={showMeta}
                />
              ))}
            </div>
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="font-mono text-xs text-muted-foreground">
            +{hiddenCount} more swatches
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((swatch) => (
          <Swatch
            key={swatch.hex}
            swatch={swatch}
            size={size}
            showMeta={showMeta}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <p className="font-mono text-xs text-muted-foreground">
          +{hiddenCount} more swatches
        </p>
      )}
    </div>
  );
}
