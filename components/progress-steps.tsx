"use client";

import { AlertTriangle, Check, Loader2, RefreshCw } from "lucide-react";
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
  description: string;
}

const URL_STEPS: readonly StepDef[] = [
  {
    id: "fetching-page",
    label: "Fetching page",
    description: "Safely retrieving HTML and linked CSS stylesheets...",
  },
  {
    id: "reading-styles",
    label: "Reading styles",
    description: "Extracting CSS variables, color frequencies & font stacks...",
  },
  {
    id: "asking-model",
    label: "Asking the model",
    description: "Connecting to AI model to structure 16-section design spec...",
  },
  {
    id: "writing-spec",
    label: "Writing spec",
    description: "Streaming design tokens, typography, and section recipes...",
  },
  {
    id: "validating",
    label: "Validating",
    description: "Checking required sections and generating Quick Start code...",
  },
];

const IMAGE_STEPS: readonly StepDef[] = [
  {
    id: "reading-screenshot",
    label: "Reading screenshot",
    description: "Preprocessing image for multimodal vision extraction...",
  },
  {
    id: "asking-model",
    label: "Asking the model",
    description: "Connecting to AI model to structure 16-section design spec...",
  },
  {
    id: "writing-spec",
    label: "Writing spec",
    description: "Streaming design tokens, typography, and section recipes...",
  },
  {
    id: "validating",
    label: "Validating",
    description: "Checking required sections and generating Quick Start code...",
  },
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

  const currentStepDef = activeIdx !== -1 ? steps[activeIdx] : null;

  return (
    <div className="flex flex-col gap-3">
      {(currentStep || isComplete) && (
        <div
          aria-label="Generation progress"
          className="rounded-lg border border-border/80 bg-surface/90 p-4 shadow-lg backdrop-blur-sm sm:p-5"
        >
          {/* Header & animated indicator */}
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              {isComplete ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              ) : (
                <Loader2
                  className="h-4 w-4 animate-spin text-accent"
                  aria-hidden="true"
                />
              )}
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                {isComplete
                  ? "Generation complete"
                  : currentStepDef?.label || "Pipeline processing"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSwitchingModels && !isComplete && (
                <span className="inline-flex items-center gap-1.5 rounded border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-medium text-accent">
                  <RefreshCw
                    className="h-3 w-3 motion-safe:animate-spin"
                    aria-hidden="true"
                  />
                  Switching to fallback model...
                </span>
              )}
              {activeModel && (
                <span className="rounded border border-border bg-canvas px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {activeModel}
                </span>
              )}
            </div>
          </div>

          {/* Active step explanation text */}
          {!isComplete && currentStepDef && (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>{currentStepDef.description}</span>
            </div>
          )}

          {/* Steps checklist */}
          <ol className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            {steps.map((step, idx) => {
              const done = isComplete || (activeIdx !== -1 && idx < activeIdx);
              const active = !isComplete && idx === activeIdx;

              return (
                <li
                  key={step.id}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-all",
                    done &&
                      "border-border bg-canvas/80 text-foreground",
                    active &&
                      "border-accent/70 bg-accent/10 text-accent font-medium shadow-sm ring-1 ring-accent/30",
                    !done &&
                      !active &&
                      "border-border/40 bg-canvas/20 text-muted-foreground/50"
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
                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent motion-safe:animate-ping"
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
