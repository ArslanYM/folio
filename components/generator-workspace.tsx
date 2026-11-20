"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { GITHUB_AI_GUIDE_URL } from "@/components/icons";
import { CopyButton } from "@/components/copy-button";
import { FileTabBar } from "@/components/file-tab";
import {
  GeneratorForm,
  type GeneratorSubmitPayload,
} from "@/components/generator-form";
import { MdViewer } from "@/components/md-viewer";
import { ProgressSteps } from "@/components/progress-steps";
import {
  clearRecentGenerations,
  getRecentServerSnapshot,
  loadRecentGenerations,
  RecentDrawer,
  removeRecentGeneration,
  saveRecentGeneration,
  subscribeRecentGenerations,
  type RecentGeneration,
} from "@/components/recent-drawer";
import { TemplatePreview } from "@/components/template-preview";
import { Button } from "@/components/ui/button";
import type {
  GenerateStreamEvent,
  ProgressStepId,
} from "@/lib/generate-protocol";
import { buildLandingPagePrompt } from "@/lib/prompts/landing-page";
import { slugifyHeading } from "@/lib/slug";
import { parseTemplateMarkdown, type ParsedTemplate } from "@/lib/template-parser";

type WorkspaceTab = "preview" | "rendered" | "raw" | "tokens";

function extractTitleFromMarkdown(markdown: string, fallback: string): string {
  const match = /^#\s+(.+)$/m.exec(markdown);
  if (!match) return fallback;
  const raw = match[1].trim();
  const titlePart = raw.split(" — ")[0]?.trim();
  return titlePart || fallback;
}

function extractQuickStartSection(markdown: string): string {
  const match = /## Quick Start([\s\S]*?)(?=## |$)/i.exec(markdown);
  if (match) return match[1].trim();
  return "";
}

export function GeneratorWorkspace() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? "";
  const initialMode: "url" | "image" =
    searchParams.get("mode") === "image" ? "image" : "url";

  const abortRef = useRef<AbortController | null>(null);
  const [lastPayload, setLastPayload] = useState<GeneratorSubmitPayload | null>(
    null
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<"url" | "image">(initialMode);
  const [currentStep, setCurrentStep] = useState<ProgressStepId | null>(null);
  const [isSwitchingModels, setIsSwitchingModels] = useState(false);
  const [activeModel, setActiveModel] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  const [markdown, setMarkdown] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [colorsEstimated, setColorsEstimated] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    retryable: boolean;
    retryAfter?: number;
  } | null>(null);

  const [viewTab, setViewTab] = useState<WorkspaceTab>("preview");
  const [recentOpen, setRecentOpen] = useState(false);
  const recentItems = useSyncExternalStore(
    subscribeRecentGenerations,
    loadRecentGenerations,
    getRecentServerSnapshot
  );

  // Abort any active stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const landingPagePrompt = useMemo(
    () => (markdown ? buildLandingPagePrompt(markdown) : ""),
    [markdown]
  );

  const parsedTemplate: ParsedTemplate | null = useMemo(() => {
    if (!markdown || markdown.trim().length < 60) return null;
    try {
      const parsed = parseTemplateMarkdown(markdown, "generated-spec");
      return parsed;
    } catch {
      return null;
    }
  }, [markdown]);

  const quickStartCode = useMemo(
    () => (markdown ? extractQuickStartSection(markdown) : ""),
    [markdown]
  );

  const runGeneration = useCallback(async (payload: GeneratorSubmitPayload) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLastPayload(payload);

    setIsGenerating(true);
    setActiveMode(payload.mode);
    setCurrentStep(
      payload.mode === "url" ? "fetching-page" : "reading-screenshot"
    );
    setIsSwitchingModels(false);
    setActiveModel(undefined);
    setNotice(null);
    setMarkdown("");
    setIsComplete(false);
    setMissingSections([]);
    setColorsEstimated(payload.mode === "image");
    setErrorState(null);

    // Initial toast notification
    toast.loading(
      payload.mode === "url"
        ? `Fetching ${payload.url || "site"} & extracting design tokens...`
        : "Analyzing screenshot with vision model...",
      { id: "generator-status" }
    );

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: payload.mode,
          url: payload.url,
          imageDataUrl: payload.imageDataUrl,
          target: payload.target,
          notes: payload.notes,
        }),
      });

      if (!response.ok) {
        let message = `Request failed with status ${response.status}.`;
        let retryAfter: number | undefined;

        const retryHeader = response.headers.get("Retry-After");
        if (retryHeader) {
          const parsedRetry = Number.parseInt(retryHeader, 10);
          if (!Number.isNaN(parsedRetry)) retryAfter = parsedRetry;
        }

        try {
          const errJson = (await response.json()) as {
            message?: string;
            retryAfter?: number;
          };
          if (errJson.message) message = errJson.message;
          if (errJson.retryAfter) retryAfter = errJson.retryAfter;
        } catch {
          // Keep default status message
        }

        setErrorState({
          message,
          retryable: response.status !== 413,
          retryAfter,
        });
        setCurrentStep(null);
        toast.error(message, { id: "generator-status", duration: 5000 });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setErrorState({
          message: "No stream received from the server.",
          retryable: true,
        });
        toast.error("No stream received from server", { id: "generator-status" });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: GenerateStreamEvent) => {
        switch (event.type) {
          case "status":
            if (event.step === "switching-models") {
              setIsSwitchingModels(true);
              toast.info("Switching to fallback model on OpenRouter...", {
                id: "generator-status",
              });
            }
            if (!event.heartbeat) {
              setCurrentStep(event.step);
              if (event.step === "reading-styles") {
                toast.loading("Extracting CSS variables, color frequencies & font stacks...", {
                  id: "generator-status",
                });
              } else if (event.step === "asking-model") {
                toast.loading(
                  `Connecting to model ${event.model ? `(${event.model})` : ""}...`,
                  { id: "generator-status" }
                );
              } else if (event.step === "writing-spec") {
                toast.loading("Streaming 16-section DESIGN.md specification...", {
                  id: "generator-status",
                });
              } else if (event.step === "validating") {
                toast.loading("Validating spec tokens & generating Quick Start...", {
                  id: "generator-status",
                });
              }
            }
            if (event.model) {
              setActiveModel(event.model);
            }
            break;

          case "notice":
            setNotice(event.message);
            break;

          case "reset":
            setMarkdown("");
            break;

          case "delta":
            setMarkdown((prev) => prev + event.text);
            break;

          case "done": {
            setMarkdown(event.markdown);
            setMissingSections(event.missing);
            setColorsEstimated(event.colorsEstimated);
            setIsComplete(true);
            setCurrentStep(null);
            if (event.model) setActiveModel(event.model);

            const sourceLabel =
              payload.mode === "url"
                ? payload.url ?? "URL"
                : payload.imageName ?? "Uploaded screenshot";
            const title = extractTitleFromMarkdown(
              event.markdown,
              sourceLabel
            );

            saveRecentGeneration({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              title,
              source: sourceLabel,
              mode: payload.mode,
              target: payload.target,
              createdAt: new Date().toISOString(),
              markdown: event.markdown,
              missing: event.missing,
              colorsEstimated: event.colorsEstimated,
            });

            toast.success("DESIGN.md and live visual preview generated!", {
              id: "generator-status",
              duration: 4000,
            });
            break;
          }

          case "error":
            setErrorState({
              message: event.message,
              retryable: event.retryable,
              retryAfter: event.retryAfter,
            });
            setCurrentStep(null);
            toast.error(event.message, {
              id: "generator-status",
              duration: 5000,
            });
            break;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            try {
              const parsed = JSON.parse(line) as GenerateStreamEvent;
              handleEvent(parsed);
            } catch {
              // Ignore malformed line fragments
            }
          }
          newlineIndex = buffer.indexOf("\n");
        }
      }

      if (buffer.trim()) {
        try {
          handleEvent(JSON.parse(buffer.trim()) as GenerateStreamEvent);
        } catch {
          // Ignore trailing fragment
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast.info("Generation stopped", { id: "generator-status" });
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Network error while contacting /api/generate.";
        setErrorState({
          message: msg,
          retryable: true,
        });
        toast.error(msg, { id: "generator-status", duration: 5000 });
      }
      setCurrentStep(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  function handleStop() {
    abortRef.current?.abort();
    setIsGenerating(false);
    setCurrentStep(null);
    toast.info("Generation stopped", { id: "generator-status" });
  }

  function handleRegenerate() {
    if (lastPayload) {
      void runGeneration(lastPayload);
    }
  }

  function handleDownload() {
    if (!markdown) return;
    const title = extractTitleFromMarkdown(markdown, "design-system");
    const fileSlug = slugifyHeading(title) || "design-system";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileSlug}.DESIGN.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${fileSlug}.DESIGN.md`);
  }

  function handleLoadRecent(item: RecentGeneration) {
    abortRef.current?.abort();
    setIsGenerating(false);
    setCurrentStep(null);
    setErrorState(null);
    setNotice(null);
    setMarkdown(item.markdown);
    setMissingSections(item.missing ?? []);
    setColorsEstimated(Boolean(item.colorsEstimated));
    setIsComplete(true);
    setViewTab("preview");
    toast.success(`Loaded ${item.title}`);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Spec Generator
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Generate a DESIGN.md
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a public URL or drop a screenshot, choose a target, and stream
            a validated spec with deterministic tokens and a live visual preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RecentDrawer
            items={recentItems}
            open={recentOpen}
            onOpenChange={setRecentOpen}
            onSelect={handleLoadRecent}
            onDelete={(id) => removeRecentGeneration(id)}
            onClearAll={() => clearRecentGenerations()}
          />
        </div>
      </div>

      {/* Form */}
      <GeneratorForm
        initialMode={initialMode}
        initialUrl={initialUrl}
        isGenerating={isGenerating}
        currentStep={currentStep}
        onSubmit={runGeneration}
        onStop={handleStop}
      />

      {/* Progress & Live Pipeline Status */}
      <ProgressSteps
        mode={activeMode}
        currentStep={currentStep}
        isComplete={isComplete}
        isSwitchingModels={isSwitchingModels}
        activeModel={activeModel}
        notice={notice}
      />

      {/* Error banner */}
      {errorState && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-lg border border-destructive/45 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{errorState.message}</p>
              {errorState.retryAfter && (
                <p className="font-mono text-xs text-muted-foreground">
                  Retry-After: {errorState.retryAfter}s
                </p>
              )}
            </div>
          </div>

          {lastPayload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="w-fit shrink-0 cursor-pointer gap-1.5 border-border bg-surface text-foreground hover:bg-raised"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
          )}
        </div>
      )}

      {/* Missing sections validation banner */}
      {isComplete && missingSections.length > 0 && (
        <div
          role="status"
          className="flex flex-col justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-100 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              <strong className="font-semibold">Some sections are missing:</strong>{" "}
              {missingSections.join(", ")}. You can still copy what was
              generated or regenerate for a fuller pass.
            </p>
          </div>
          {lastPayload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              className="w-fit shrink-0 cursor-pointer gap-1.5 border-amber-400/40 bg-canvas text-amber-100 hover:bg-raised"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Regenerate
            </Button>
          )}
        </div>
      )}

      {/* Output Panel with Live Visual Preview & Tokens */}
      {(markdown || isGenerating) && (
        <section
          aria-label="Generated DESIGN.md output"
          className="overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        >
          <FileTabBar
            ariaLabel="Output view mode"
            activeId={viewTab}
            onChange={(tab) => setViewTab(tab as WorkspaceTab)}
            tabs={[
              { id: "preview", label: "Live Preview", badge: "Visual" },
              { id: "rendered", label: "DESIGN.md", badge: "Spec" },
              { id: "tokens", label: "Quick Start", badge: "CSS / @theme" },
              { id: "raw", label: "Raw", badge: ".md" },
            ]}
            rightSlot={
              <div className="flex flex-wrap items-center gap-1.5">
                {colorsEstimated && (
                  <span className="rounded border border-border bg-canvas px-2 py-1 font-mono text-[10px] text-muted-foreground">
                    colors estimated
                  </span>
                )}
                {isGenerating ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleStop}
                    className="cursor-pointer gap-1 border-destructive/50 text-destructive hover:bg-destructive/15"
                  >
                    <Square className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                    Stop
                  </Button>
                ) : (
                  lastPayload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={handleRegenerate}
                      className="cursor-pointer gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      Regenerate
                    </Button>
                  )
                )}
                {markdown && (
                  <>
                    <CopyButton
                      text={markdown}
                      label="Copy"
                      size="xs"
                      variant="outline"
                      toastMessage="Copied DESIGN.md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={handleDownload}
                      className="cursor-pointer gap-1 border-border bg-canvas text-foreground hover:bg-raised"
                    >
                      <Download className="h-3 w-3" aria-hidden="true" />
                      Download .md
                    </Button>
                    <CopyButton
                      text={landingPagePrompt}
                      label="Landing prompt"
                      copiedLabel="Prompt copied"
                      size="xs"
                      variant="default"
                      toastMessage='Copied "build a landing page" prompt'
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    />
                    <a
                      href={GITHUB_AI_GUIDE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded border border-border bg-canvas px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/60 hover:bg-raised hover:text-foreground"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-accent" aria-hidden="true" />
                      <span>AI Guide</span>
                    </a>
                  </>
                )}
              </div>
            }
          />

          {/* Extracted tokens specimen header when available */}
          {parsedTemplate && parsedTemplate.palette.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-canvas/60 px-4 py-2.5 text-xs sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Extracted Palette:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {parsedTemplate.palette.slice(0, 8).map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(swatch.hex);
                        toast.success(`Copied ${swatch.hex}`);
                      }}
                      title={`${swatch.name || "Color"}: ${swatch.hex} (Click to copy)`}
                      className="group flex items-center gap-1.5 rounded border border-border/80 bg-surface px-2 py-0.5 font-mono text-[11px] transition-colors hover:border-foreground/40"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full border border-white/10"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {swatch.hex}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {parsedTemplate.fonts.length > 0 && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <span>Fonts:</span>
                  <span className="font-medium text-foreground">
                    {parsedTemplate.fonts.map((f) => f.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Main content body */}
          <div
            role="tabpanel"
            aria-labelledby={`tab-${viewTab}`}
            className="min-h-64 p-5 sm:p-7"
          >
            {!markdown && isGenerating ? (
              <div className="flex flex-col gap-5 py-8 animate-pulse">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-full bg-accent motion-safe:animate-ping"
                  />
                  <span className="font-mono text-xs font-medium text-foreground">
                    Extracting design language &amp; generating live visual preview...
                  </span>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-canvas/40 p-5">
                  <div className="h-6 w-2/5 rounded bg-surface/80" />
                  <div className="h-4 w-3/5 rounded bg-surface/60" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-9 w-28 rounded bg-accent/20" />
                    <div className="h-9 w-28 rounded bg-surface/70" />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="h-24 rounded border border-border/60 bg-surface/40" />
                    <div className="h-24 rounded border border-border/60 bg-surface/40" />
                    <div className="h-24 rounded border border-border/60 bg-surface/40" />
                  </div>
                </div>
              </div>
            ) : viewTab === "preview" ? (
              parsedTemplate ? (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        Live Component Mockup
                      </p>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        Rendered with extracted tokens
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      Theme:{" "}
                      <strong className="text-foreground">
                        {parsedTemplate.theme}
                      </strong>
                    </span>
                  </div>

                  <TemplatePreview template={parsedTemplate} />
                </div>
              ) : (
                <MdViewer markdown={markdown} isStreaming={isGenerating} />
              )
            ) : viewTab === "rendered" ? (
              <MdViewer markdown={markdown} isStreaming={isGenerating} />
            ) : viewTab === "tokens" ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Quick Start Tokens
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Deterministic CSS custom properties and Tailwind v4 @theme
                      block.
                    </p>
                  </div>
                  {quickStartCode && (
                    <CopyButton
                      text={quickStartCode}
                      label="Copy Tokens"
                      toastMessage="Copied Quick Start tokens"
                      size="xs"
                    />
                  )}
                </div>

                <pre className="overflow-x-auto rounded-md border border-border bg-canvas p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{quickStartCode || "Quick Start tokens will appear here after generation completes."}</code>
                </pre>
              </div>
            ) : (
              <pre className="overflow-x-auto rounded-md border border-border bg-canvas p-4 font-mono text-xs leading-relaxed text-foreground/90">
                <code>{markdown}</code>
              </pre>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
