"use client";

import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import type { ProgressStepId } from "@/lib/generate-protocol";
import { cn } from "@/lib/utils";

export interface ProgressStepsProps {
  mode: "url" | "image";
  currentStep: ProgressStepId | null;
  isComplete: boolean;
  isSwitchingModels: boolean;
  activeModel?: string;
  notice?: string | null;
}

interface StepDef {
  id: ProgressStepId;
  label: string;
}

const URL_STEPS: readonly StepDef[] = [
  { id: "fetching-page", label: "Fetching page" },
  { id: "reading-styles", label: "Reading styles" },
  { id: "asking-model", label: "Asking the model" },
  { id: "writing-spec", label: "Writing spec" },
  { id: "validating", label: "Validating" },
];

const IMAGE_STEPS: readonly StepDef[] = [
  { id: "reading-screenshot", label: "Reading screenshot" },
  { id: "asking-model", label: "Asking the model" },
  { id: "writing-spec", label: "Writing spec" },
  { id: "validating", label: "Validating" },
];

export function ProgressSteps({
  mode,
  currentStep,
  isComplete,
  isSwitchingModels,
  activeModel,
  notice,
}: ProgressStepsProps) {
  const steps = mode === "url" ? URL_STEPS : IMAGE_STEPS;
  const effectiveStep: ProgressStepId | null =
    currentStep === "switching-models" ? "asking-model" : currentStep;

  const activeIdx = effectiveStep
    ? steps.findIndex((s) => s.id === effectiveStep)
    : -1;

  return (
    <div className="flex flex-col gap-3">
      {(currentStep || isComplete) && (
        <div
          aria-label="Generation progress"
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {isComplete ? "Generation complete" : "Pipeline status"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {isSwitchingModels && !isComplete && (
                <span className="inline-flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                  <RefreshCw
                    className="h-3 w-3 motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  Switching models...
                </span>
              )}
              {activeModel && (
                <span className="rounded border border-border bg-canvas px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {activeModel}
                </span>
              )}
            </div>
          </div>

          <ol className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {steps.map((step, idx) => {
              const done = isComplete || (activeIdx !== -1 && idx < activeIdx);
              const active = !isComplete && idx === activeIdx;

              return (
                <li
                  key={step.id}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors",
                    done &&
                      "border-border bg-canvas/80 text-foreground",
                    active &&
                      "border-accent/60 bg-accent/10 text-accent font-medium",
                    !done &&
                      !active &&
                      "border-border/50 bg-canvas/30 text-muted-foreground/60"
                  )}
                >
                  {done ? (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                  ) : active ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent motion-safe:animate-pulse"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-border"
                    />
                  )}
                  <span className="truncate">{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            aria-hidden="true"
          />
          <p>{notice}</p>
        </div>
      )}
    </div>
  );
}
