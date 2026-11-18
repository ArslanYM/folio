"use client";

import { pickReadableForeground } from "@/lib/color";
import type { ParsedTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplateMonogramProps {
  template: Pick<
    ParsedTemplate,
    "title" | "canvasHex" | "accent" | "previewMedia" | "theme"
  >;
  size?: "sm" | "lg";
  className?: string;
}

function getInitials(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function TemplateMonogram({
  template,
  size = "sm",
  className,
}: TemplateMonogramProps) {
  const bg =
    template.theme === "light"
      ? "#111113"
      : template.accent?.hex ?? "#C8F23D";
  const fg = pickReadableForeground(bg, "#0E0D0B", "#F2EDE2");
  const initials = getInitials(template.title);

  if (template.previewMedia.icon) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-surface",
          size === "lg" ? "h-20 w-20 rounded-2xl p-3 sm:h-24 sm:w-24" : "h-10 w-10 rounded-lg p-1.5",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.previewMedia.icon}
          alt=""
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        backgroundColor: bg,
        color: fg,
      }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-display font-bold tracking-tighter border border-white/10",
        size === "lg"
          ? "h-20 w-20 rounded-2xl text-3xl sm:h-24 sm:w-24 sm:text-4xl"
          : "h-10 w-10 rounded-lg text-sm",
        className
      )}
    >
      {initials}
    </span>
  );
}
