import type { Metadata } from "next";

interface TemplateSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: TemplateSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug,
  };
}

export default async function TemplateSlugPage({
  params,
}: TemplateSlugPageProps) {
  const { slug } = await params;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Template: <span className="font-mono text-accent">{slug}</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Template detail view coming in Step 4.
      </p>
    </section>
  );
}
