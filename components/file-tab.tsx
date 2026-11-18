"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface FileTabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string;
}

export interface FileTabBarProps<T extends string = string> {
  tabs: readonly FileTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  accentColor?: string;
  className?: string;
  rightSlot?: React.ReactNode;
}

export function FileTabBar<T extends string = string>({
  tabs,
  activeId,
  onChange,
  ariaLabel,
  accentColor,
  className,
  rightSlot,
}: FileTabBarProps<T>) {
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[nextIndex].id);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border bg-canvas/80 px-2 pt-2",
        className
      )}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-end gap-1 overflow-x-auto"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={
                isActive && accentColor
                  ? { borderTopColor: accentColor }
                  : undefined
              }
              className={cn(
                "relative inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-t-md border border-b-0 px-3.5 py-1.5 font-mono text-xs transition-colors",
                isActive
                  ? "border-border border-t-2 border-t-accent bg-surface text-foreground font-medium -mb-px"
                  : "border-transparent bg-transparent text-muted-foreground hover:bg-surface/50 hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {rightSlot && (
        <div className="flex items-center gap-1.5 pb-1.5 pr-1">{rightSlot}</div>
      )}
    </div>
  );
}
