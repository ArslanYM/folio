import { Suspense } from "react";
import type { Metadata } from "next";
import { GeneratorWorkspace } from "@/components/generator-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Generate DESIGN.md",
  description:
    "Generate a validated DESIGN.md design-system spec from any public website URL or screenshot.",
};

function GeneratorFallback() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-72 bg-surface" />
      <Skeleton className="h-80 w-full rounded-lg bg-surface" />
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<GeneratorFallback />}>
      <GeneratorWorkspace />
    </Suspense>
  );
}
