"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { Globe, ImageUp, Loader2, Square, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { FileTabBar } from "@/components/file-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProgressStepId } from "@/lib/generate-protocol";
import {
  GENERATION_TARGETS,
  type GenerationTarget,
} from "@/lib/prompts/design-md";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;
const PENDING_IMAGE_KEY = "swatchbook:pending-image";

export interface GeneratorSubmitPayload {
  mode: "url" | "image";
  url?: string;
  imageDataUrl?: string;
  imageName?: string;
  target: GenerationTarget;
  notes?: string;
}

export interface GeneratorFormProps {
  initialMode?: "url" | "image";
  initialUrl?: string;
  isGenerating: boolean;
  currentStep?: ProgressStepId | null;
  onSubmit: (payload: GeneratorSubmitPayload) => void;
  onStop: () => void;
}

async function resizeToJpegDataUrl(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image."));
      el.src = objectUrl;
    });

    const scale =
      img.width > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser canvas is unavailable for resizing.");
    }
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { dataUrl, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function normalizeInputUrl(raw: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: "Enter a website URL to inspect." };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Only http:// and https:// URLs are supported." };
    }
    if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
      return { valid: false, error: "Enter a full domain name (e.g. stripe.com)." };
    }
    return { valid: true, normalized: parsed.toString() };
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }
}

export function GeneratorForm({
  initialMode = "url",
  initialUrl = "",
  isGenerating,
  currentStep,
  onSubmit,
  onStop,
}: GeneratorFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"url" | "image">(initialMode);
  const [urlValue, setUrlValue] = useState(initialUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    name: string;
    dims?: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [target, setTarget] = useState<GenerationTarget>("landing-page");
  const [notes, setNotes] = useState("");

  // Pick up screenshot dropped on the landing page hero if present
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      try {
        const pending = window.sessionStorage.getItem(PENDING_IMAGE_KEY);
        if (!pending) return;
        window.sessionStorage.removeItem(PENDING_IMAGE_KEY);
        const parsed = JSON.parse(pending) as {
          name?: string;
          dataUrl?: string;
        };
        if (parsed.dataUrl) {
          setMode("image");
          setImageDataUrl(parsed.dataUrl);
          setImageMeta({ name: parsed.name || "Dropped screenshot" });
        }
      } catch {
        // Ignore storage read errors
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  async function processImageFile(file: File) {
    setImageError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      const msg = "Unsupported format. Upload a PNG, JPEG, or WebP screenshot.";
      setImageError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      const msg = "Image exceeds the 5 MB limit. Choose a smaller screenshot.";
      setImageError(msg);
      toast.error(msg);
      return;
    }

    try {
      const resized = await resizeToJpegDataUrl(file);
      setImageDataUrl(resized.dataUrl);
      setImageMeta({
        name: file.name || "Pasted screenshot",
        dims: `${resized.width}×${resized.height} JPEG`,
      });
      setMode("image");
      toast.success(`Screenshot loaded: ${file.name || "Image"} (${resized.width}×${resized.height})`);
    } catch {
      const msg = "Could not process that image. Try another PNG or JPEG.";
      setImageError(msg);
      toast.error(msg);
    }
  }

  // Support Ctrl/Cmd+V clipboard image paste anywhere on the generator page
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setMode("image");
            void processImageFile(file);
          }
          break;
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setMode("image");
      void processImageFile(file);
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (isGenerating) return;

    if (mode === "url") {
      const check = normalizeInputUrl(urlValue);
      if (!check.valid || !check.normalized) {
        setUrlError(check.error ?? "Invalid URL.");
        toast.error(check.error ?? "Enter a valid website URL.");
        return;
      }
      setUrlError(null);
      setUrlValue(check.normalized);
      toast.loading(`Fetching ${check.normalized} & extracting styles...`, {
        id: "generator-status",
      });
      onSubmit({
        mode: "url",
        url: check.normalized,
        target,
        notes: notes.trim() || undefined,
      });
    } else {
      if (!imageDataUrl) {
        const msg = "Upload, drop, or paste a screenshot first.";
        setImageError(msg);
        toast.error(msg);
        return;
      }
      setImageError(null);
      toast.loading("Analyzing screenshot & extracting styles...", {
        id: "generator-status",
      });
      onSubmit({
        mode: "image",
        imageDataUrl,
        imageName: imageMeta?.name ?? "Screenshot",
        target,
        notes: notes.trim() || undefined,
      });
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      className="overflow-hidden rounded-lg border border-border bg-surface"
    >
      <FileTabBar
        ariaLabel="Input source mode"
        activeId={mode}
        onChange={(nextMode) => {
          setMode(nextMode);
          setUrlError(null);
          setImageError(null);
        }}
        tabs={[
          { id: "url", label: "URL", badge: "HTML + CSS" },
          { id: "image", label: "Screenshot", badge: "Vision" },
        ]}
      />

      <div className="flex flex-col gap-6 p-5 sm:p-6">
        {/* Source input panel */}
        {mode === "url" ? (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="generator-url"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Website URL
            </Label>
            <p id="generator-url-hint" className="text-xs text-muted-foreground">
              We fetch the HTML and linked CSS directly — no headless browser.
              We&apos;ll add <code className="font-mono">https://</code> if
              missing.
            </p>
            <div className="relative mt-1">
              <Globe
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="generator-url"
                type="text"
                inputMode="url"
                value={urlValue}
                onChange={(e) => {
                  setUrlValue(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                aria-invalid={Boolean(urlError)}
                aria-describedby={
                  urlError ? "generator-url-error" : "generator-url-hint"
                }
                placeholder="https://linear.app"
                className="h-11 border-border bg-canvas pl-9 font-mono text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {urlError && (
              <p
                id="generator-url-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {urlError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="generator-file-input"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Screenshot (PNG, JPEG, WebP &middot; max 5 MB)
            </Label>
            <p className="text-xs text-muted-foreground">
              Drop an image, pick a file, or press{" "}
              <kbd className="rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[10px]">
                Cmd/Ctrl+V
              </kbd>{" "}
              to paste from your clipboard. Resized client-side to 1600px JPEG.
            </p>

            {imageDataUrl ? (
              <div className="mt-1 flex flex-col gap-3 rounded-md border border-border bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt={imageMeta?.name ?? "Uploaded screenshot preview"}
                    className="h-16 w-24 shrink-0 rounded border border-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {imageMeta?.name ?? "Screenshot"}
                    </p>
                    {imageMeta?.dims && (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {imageMeta.dims} &middot; colors will be estimated
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageDataUrl(null);
                    setImageMeta(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="w-fit cursor-pointer gap-1.5 border-border bg-surface text-foreground hover:bg-raised"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "mt-1 flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-10 text-center transition-colors",
                  isDragging
                    ? "border-accent bg-accent/10"
                    : "border-border bg-canvas/60 hover:border-foreground/30"
                )}
              >
                <ImageUp
                  className="h-7 w-7 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">
                    Drop a screenshot here or paste from clipboard
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    PNG, JPEG, or WebP up to 5 MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="generator-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void processImageFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer gap-1.5 border-border bg-surface text-foreground hover:bg-raised"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Choose image
                </Button>
              </div>
            )}

            {imageError && (
              <p role="alert" className="text-xs text-destructive">
                {imageError}
              </p>
            )}
          </div>
        )}

        {/* Target selector */}
        <fieldset className="flex flex-col gap-2.5">
          <legend className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Target platform
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GENERATION_TARGETS.map((item) => {
              const selected = target === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTarget(item.id)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border bg-canvas/70 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2 text-xs font-semibold">
                    <span>{item.label}</span>
                    {selected && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-full bg-accent"
                      />
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Optional notes */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="generator-notes"
              className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Notes (optional)
            </Label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {notes.length}/500
            </span>
          </div>
          <Textarea
            id="generator-notes"
            maxLength={500}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='e.g. "It is for a fintech app" or "Focus on the dark theme and tables"'
            className="resize-none border-border bg-canvas text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Submit / Stop row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="font-mono text-[11px] text-muted-foreground">
            Streams validated DESIGN.md + deterministic CSS &amp; Tailwind v4{" "}
            <code>@theme</code>
          </p>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <Button
                  type="button"
                  disabled
                  className="h-10 cursor-wait gap-2 bg-accent/85 px-4 text-sm font-semibold text-accent-foreground opacity-95"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" aria-hidden="true" />
                  <span>
                    {currentStep === "fetching-page"
                      ? "Fetching site..."
                      : currentStep === "reading-styles"
                        ? "Extracting tokens..."
                        : currentStep === "asking-model"
                          ? "Asking AI model..."
                          : currentStep === "switching-models"
                            ? "Switching model..."
                            : currentStep === "writing-spec"
                              ? "Drafting spec..."
                              : "Extracting DESIGN.md..."}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onStop}
                  className="h-10 cursor-pointer gap-1.5 border-destructive/50 bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20"
                >
                  <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                  Stop
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                className="h-10 cursor-pointer bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Generate DESIGN.md
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
