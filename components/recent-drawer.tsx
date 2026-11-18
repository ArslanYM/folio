"use client";

import { Clock, Globe, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { GenerationTarget } from "@/lib/prompts/design-md";

// TODO(bookmarks): Replace localStorage recent history with persistent database bookmarks once user accounts exist.
// TODO(auth): Scope saved generations to the signed-in user profile.
export const RECENT_STORAGE_KEY = "swatchbook:recent-generations";
export const MAX_RECENT_ITEMS = 10;

export interface RecentGeneration {
  id: string;
  title: string;
  source: string;
  mode: "url" | "image";
  target: GenerationTarget;
  createdAt: string;
  markdown: string;
  missing?: string[];
  colorsEstimated?: boolean;
}

const recentListeners = new Set<() => void>();
const EMPTY_RECENT: RecentGeneration[] = [];
let cachedRaw: string | null = null;
let cachedSnapshot: RecentGeneration[] = EMPTY_RECENT;

function emitRecentChange() {
  for (const listener of recentListeners) {
    listener();
  }
}

export function subscribeRecentGenerations(listener: () => void): () => void {
  recentListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === RECENT_STORAGE_KEY) listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    recentListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getRecentServerSnapshot(): RecentGeneration[] {
  return EMPTY_RECENT;
}

export function loadRecentGenerations(): RecentGeneration[] {
  if (typeof window === "undefined") return EMPTY_RECENT;
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_RECENT;
      return cachedSnapshot;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedSnapshot = EMPTY_RECENT;
      return cachedSnapshot;
    }
    cachedSnapshot = parsed
      .filter(
        (item): item is RecentGeneration =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as RecentGeneration).id === "string" &&
          typeof (item as RecentGeneration).title === "string" &&
          typeof (item as RecentGeneration).markdown === "string"
      )
      .slice(0, MAX_RECENT_ITEMS);
    return cachedSnapshot;
  } catch {
    return EMPTY_RECENT;
  }
}

export function saveRecentGeneration(
  entry: RecentGeneration
): RecentGeneration[] {
  const existing = loadRecentGenerations().filter((item) => item.id !== entry.id);
  const next = [entry, ...existing].slice(0, MAX_RECENT_ITEMS);
  try {
    const serialized = JSON.stringify(next);
    window.localStorage.setItem(RECENT_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedSnapshot = next;
  } catch {
    // Ignore storage quota or private-mode errors
  }
  emitRecentChange();
  return next;
}

export function removeRecentGeneration(id: string): RecentGeneration[] {
  const next = loadRecentGenerations().filter((item) => item.id !== id);
  try {
    const serialized = JSON.stringify(next);
    window.localStorage.setItem(RECENT_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedSnapshot = next;
  } catch {
    // Ignore
  }
  emitRecentChange();
  return next;
}

export function clearRecentGenerations(): RecentGeneration[] {
  try {
    window.localStorage.removeItem(RECENT_STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY_RECENT;
  } catch {
    // Ignore
  }
  emitRecentChange();
  return EMPTY_RECENT;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString();
}

export interface RecentDrawerProps {
  items: readonly RecentGeneration[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: RecentGeneration) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function RecentDrawer({
  items,
  open,
  onOpenChange,
  onSelect,
  onDelete,
  onClearAll,
}: RecentDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer gap-2 border-border bg-surface text-foreground hover:bg-raised"
          />
        }
      >
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Recent</span>
        <span className="rounded bg-raised px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {items.length}
        </span>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-border bg-canvas text-foreground sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-2 pr-6">
            <SheetTitle className="font-display text-lg text-foreground">
              Recent generations
            </SheetTitle>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="cursor-pointer font-mono text-[11px] text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Last {MAX_RECENT_ITEMS} specs stored locally in this browser.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/40 px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                No saved specs yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated DESIGN.md files appear here automatically.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group relative rounded-md border border-border bg-surface transition-colors hover:border-accent/50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                    className="flex w-full cursor-pointer flex-col gap-1.5 p-3 pr-10 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {item.mode === "url" ? (
                        <Globe
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <ImageIcon
                          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate font-display text-sm font-semibold text-foreground group-hover:text-accent">
                        {item.title}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {item.source}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground/80">
                      <span className="rounded border border-border bg-canvas px-1.5 py-0.5">
                        {item.target}
                      </span>
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${item.title} from recent`}
                    onClick={() => onDelete(item.id)}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-raised hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
