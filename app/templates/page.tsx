import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse ready-made DESIGN.md design-system templates.",
};

export default function TemplatesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Templates</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Gallery coming in Step 3.
      </p>
    </section>
  );
}
