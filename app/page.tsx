import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Specimen Book &amp; Generator
      </p>
      <h1 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        Paste a URL. Get the palette, the type, the rules.
      </h1>
      <p className="max-w-xl text-base text-muted-foreground">
        Swatchbook turns any website or screenshot into a{" "}
        <code className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
          DESIGN.md
        </code>{" "}
        spec ready for Copilot, Cursor, or Claude Code.
      </p>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          href="/generate"
          className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Open Generator
        </Link>
        <Link
          href="/templates"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-raised"
        >
          Browse Templates
        </Link>
      </div>
    </section>
  );
}
