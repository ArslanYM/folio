import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDetailView } from "@/components/template-detail-view";
import { getAllTemplates, getTemplate } from "@/lib/templates";

interface TemplateSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const templates = await getAllTemplates();
  return templates.map((tpl) => ({ slug: tpl.slug }));
}

export async function generateMetadata({
  params,
}: TemplateSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) {
    return { title: "Template Not Found" };
  }

  return {
    title: template.title,
    description:
      template.tagline ||
      template.summary ||
      `${template.title} DESIGN.md design-system specification.`,
  };
}

export default async function TemplateSlugPage({
  params,
}: TemplateSlugPageProps) {
  const { slug } = await params;
  const template = await getTemplate(slug);

  if (!template) {
    notFound();
  }

  return <TemplateDetailView template={template} />;
}
