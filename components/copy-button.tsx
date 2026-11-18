"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "xs" | "icon";
  className?: string;
  ariaLabel?: string;
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  toastMessage,
  variant = "outline",
  size = "sm",
  className,
  ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(toastMessage ?? `Copied ${label.toLowerCase()}`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={ariaLabel ?? label}
      className={cn("cursor-pointer gap-1.5", className)}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {size !== "icon" && (
        <span>{copied ? copiedLabel : label}</span>
      )}
    </Button>
  );
}
