import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate DESIGN.md",
  description: "Generate a DESIGN.md spec from any website URL or screenshot.",
};

export default function GeneratePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Generate DESIGN.md
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Streaming generator coming in Step 9.
      </p>
    </section>
  );
}
