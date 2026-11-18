"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";
import { TemplateCard } from "@/components/template-card";
import { Input } from "@/components/ui/input";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplatesGalleryProps {
  templates: readonly ParsedTemplate[];
}

export function TemplatesGallery({ templates }: TemplatesGalleryProps) {
  const [query, setQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Derive platform & mood filter options dynamically from loaded templates
  const platformOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      for (const p of tpl.platform) set.add(p);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const moodOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      for (const m of tpl.mood) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((tpl) => {
      if (
        selectedPlatform &&
        !tpl.platform.some(
          (p) => p.toLowerCase() === selectedPlatform.toLowerCase()
        )
      ) {
        return false;
      }
      if (
        selectedMood &&
        !tpl.mood.some((m) => m.toLowerCase() === selectedMood.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        tpl.title,
        tpl.tagline,
        tpl.summary,
        tpl.slug,
        ...tpl.platform,
        ...tpl.mood,
        ...tpl.tags,
        ...tpl.fonts.map((f) => f.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [templates, query, selectedPlatform, selectedMood]);

  const hasFilters = Boolean(query.trim() || selectedPlatform || selectedMood);

  return (
    <div className="flex flex-col gap-8">
      {/* Search + derived filters bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="template-search" className="sr-only">
              Search templates
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="template-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, mood, font, or tag..."
              className="h-10 border-border bg-canvas pl-9 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-3">
            <p
              aria-live="polite"
              className="font-mono text-xs text-muted-foreground"
            >
              {filtered.length} of {templates.length} specs
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedPlatform(null);
                  setSelectedMood(null);
                }}
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md border border-border bg-raised px-2.5 font-mono text-xs text-foreground transition-colors hover:border-accent/60 hover:text-accent"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2.5">
          {/* Platform filter */}
          {platformOptions.length > 0 && (
            <div
              role="group"
              aria-label="Filter by platform"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Platform
              </span>
              {platformOptions.map((plat) => {
                const active = selectedPlatform === plat;
                return (
                  <button
                    key={plat}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setSelectedPlatform(active ? null : plat)
                    }
                    className={cn(
                      "min-h-7 cursor-pointer rounded border px-2.5 py-0.5 font-mono text-xs transition-colors",
                      active
                        ? "border-accent bg-accent text-accent-foreground font-semibold"
                        : "border-border bg-canvas text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mood filter */}
          {moodOptions.length > 0 && (
            <div
              role="group"
              aria-label="Filter by mood"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Mood
              </span>
              {moodOptions.map((mood) => {
                const active = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedMood(active ? null : mood)}
                    className={cn(
                      "min-h-7 cursor-pointer rounded border px-2.5 py-0.5 font-mono text-xs transition-colors",
                      active
                        ? "border-accent bg-accent text-accent-foreground font-semibold"
                        : "border-border bg-canvas text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Masonry-ish column layout (not a uniform equal-height grid) */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
          <p className="font-display text-lg font-medium text-foreground">
            No matching design systems
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try another keyword or clear your filters — or drop a new{" "}
            <code className="font-mono text-xs text-foreground">.md</code> file
            into <code className="font-mono text-xs text-foreground">content/templates/</code>.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
          {filtered.map((tpl, idx) => (
            <motion.div
              key={tpl.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: shouldReduceMotion ? 0 : idx * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mb-5 break-inside-avoid"
            >
              <TemplateCard template={tpl} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
