"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GithubIcon, GITHUB_REPO_URL } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/templates", label: "Templates" },
  { href: "/generate", label: "Generate" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group inline-flex min-h-9 items-center gap-2.5 rounded-md px-1 text-foreground transition-colors hover:text-accent"
        >
          <span
            aria-hidden="true"
            className="relative flex h-6 w-6 items-center justify-center"
          >
            {/* Paint-chip fan emblem */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="4"
                width="8"
                height="16"
                rx="1.5"
                fill="#2E2A21"
                stroke="#8F887A"
                strokeWidth="1"
              />
              <rect
                x="7"
                y="4"
                width="8"
                height="16"
                rx="1.5"
                transform="rotate(14 11 19)"
                fill="#211E17"
                stroke="#F2EDE2"
                strokeOpacity="0.45"
                strokeWidth="1"
              />
              <rect
                x="11"
                y="4"
                width="8"
                height="16"
                rx="1.5"
                transform="rotate(28 11 19)"
                fill="#C8F23D"
              />
              <circle cx="7" cy="17.5" r="1" fill="#0E0D0B" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Swatchbook
          </span>
          <span className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            DESIGN.md
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isGenerate = item.href === "/generate";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                  isGenerate && !isActive &&
                    "border border-border bg-surface text-foreground hover:border-accent/60 hover:text-accent",
                  isGenerate && isActive &&
                    "bg-accent text-accent-foreground font-semibold",
                  !isGenerate && isActive &&
                    "bg-raised text-accent",
                  !isGenerate && !isActive &&
                    "text-muted-foreground hover:bg-surface hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contribute on GitHub (opens in a new tab)"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:bg-raised hover:text-foreground sm:gap-2 sm:px-3"
          >
            <GithubIcon className="h-4 w-4 text-foreground" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          {/* TODO(auth): Add user menu / sign-in trigger once authentication is implemented */}
        </nav>
      </div>
    </header>
  );
}
