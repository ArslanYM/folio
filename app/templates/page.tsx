import type { Metadata } from "next";
import Link from "next/link";
import { GitPullRequest } from "lucide-react";
import { GITHUB_TEMPLATE_GUIDE_URL } from "@/components/icons";
import { TemplatesGallery } from "@/components/templates-gallery";
import { getAllTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Browse ready-made DESIGN.md design-system templates with live palettes, fonts, and previews.",
};

export default async function TemplatesPage() {
  const templates = await getAllTemplates();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Specimen Gallery
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Ready-made DESIGN.md specs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Pick a system, click any chip to copy its hex, inspect the type
            specimen and landing preview, or copy the full spec straight into
            your coding assistant.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={GITHUB_TEMPLATE_GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:bg-raised"
          >
            <GitPullRequest className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>Submit a template</span>
          </a>
          <Link
            href="/generate"
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Generate from URL
          </Link>
        </div>
      </div>

      <TemplatesGallery templates={templates} />
    </section>
  );
}
