"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxShot {
  src: string;
  label: string;
}

export interface ScreenshotLightboxProps {
  shots: readonly LightboxShot[];
  activeIndex: number | null;
  title: string;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export function ScreenshotLightbox({
  shots,
  activeIndex,
  title,
  onClose,
  onSelectIndex,
}: ScreenshotLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeIndex !== null && !dialog.open) {
      dialog.showModal();
    } else if (activeIndex === null && dialog.open) {
      dialog.close();
    }
  }, [activeIndex]);

  // Safari fallback for closedby="any" light dismiss via pointer coordinates
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if ("closedBy" in HTMLDialogElement.prototype) return;

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
    };

    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointerup", onUp);
    return () => {
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointerup", onUp);
    };
  }, []);

  const current =
    activeIndex !== null && shots[activeIndex] ? shots[activeIndex] : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lightbox-heading"
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = "";
        }
        onClose();
      }}
      {...({ closedby: "any" } as Record<string, string>)}
      className="lightbox-dialog m-auto max-h-[92vh] w-[min(94vw,1160px)] overflow-hidden rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border bg-canvas px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2
            id="lightbox-heading"
            className="truncate font-display text-sm font-semibold text-foreground sm:text-base"
          >
            {title}
            {current ? ` — ${current.label}` : ""}
          </h2>
          {activeIndex !== null && shots.length > 1 && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {activeIndex + 1} / {shots.length}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeIndex !== null && shots.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous preview"
                onClick={() =>
                  onSelectIndex(
                    (activeIndex - 1 + shots.length) % shots.length
                  )
                }
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-raised"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next preview"
                onClick={() =>
                  onSelectIndex((activeIndex + 1) % shots.length)
                }
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-raised"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
          <form method="dialog">
            <button
              type="submit"
              autoFocus
              aria-label="Close preview"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-raised"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {current && (
        <div className="flex-1 overflow-y-auto bg-canvas/90 p-3 sm:p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={`${title} — ${current.label}`}
            className="mx-auto w-full rounded-lg border border-border object-contain"
          />
        </div>
      )}
    </dialog>
  );
}
