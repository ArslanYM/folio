"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PENDING_IMAGE_KEY = "swatchbook:pending-image";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

async function resizeImageToJpegDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image."));
      el.src = objectUrl;
    });

    const maxW = 1600;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function HeroGeneratorInput() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlValue, setUrlValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function handleUrlSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = urlValue.trim();
    if (!raw) {
      router.push("/generate");
      return;
    }
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        toast.error("Enter an http:// or https:// website URL.");
        return;
      }
      router.push(`/generate?url=${encodeURIComponent(parsed.toString())}`);
    } catch {
      toast.error("That doesn't look like a valid URL.");
    }
  }

  async function handleImageFile(file: File) {
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Please drop a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Screenshot must be 5 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await resizeImageToJpegDataUrl(file);
      try {
        sessionStorage.setItem(
          PENDING_IMAGE_KEY,
          JSON.stringify({ name: file.name, dataUrl })
        );
      } catch {
        // Ignore storage quota errors and still open image mode
      }
      router.push("/generate?mode=image");
    } catch {
      toast.error("Could not read that image file.");
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleImageFile(file);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:p-5">
      {/* URL form */}
      <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="hero-url-input" className="sr-only">
            Website URL
          </label>
          <Globe
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="hero-url-input"
            type="text"
            inputMode="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="stripe.com, linear.app, or any URL..."
            className="h-11 border-border bg-canvas pl-9 font-mono text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button
          type="submit"
          className="h-11 shrink-0 cursor-pointer gap-2 bg-accent px-5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Extract DESIGN.md
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      {/* Drop a screenshot target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-start justify-between gap-2 rounded-md border border-dashed px-3.5 py-3 transition-colors sm:flex-row sm:items-center",
          isDragging
            ? "border-accent bg-accent/10"
            : "border-border bg-canvas/60 hover:border-foreground/30"
        )}
      >
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <ImageUp
            className="h-4 w-4 shrink-0 text-foreground/80"
            aria-hidden="true"
          />
          <span>
            Or <strong className="font-medium text-foreground">drop a screenshot</strong>{" "}
            (PNG, JPEG, WebP up to 5 MB) for vision extraction
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Choose screenshot image"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImageFile(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 cursor-pointer rounded border border-border bg-raised px-2.5 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-accent/60 hover:text-accent"
        >
          Choose image
        </button>
      </div>
    </div>
  );
}
