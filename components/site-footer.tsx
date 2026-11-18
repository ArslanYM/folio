import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-canvas">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-display text-sm font-medium text-foreground">
            Swatchbook
          </span>
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span className="font-mono">Website &amp; screenshot &rarr; DESIGN.md</span>
          <span aria-hidden="true" className="text-border">
            /
          </span>
          <span className="font-mono">MIT License</span>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link
            href="/templates"
            className="transition-colors hover:text-foreground"
          >
            Templates
          </Link>
          <Link
            href="/generate"
            className="transition-colors hover:text-foreground"
          >
            Generator
          </Link>
          {/* TODO(bookmarks): Add Saved / Bookmarks link when DB storage is enabled */}
        </nav>
      </div>
    </footer>
  );
}
