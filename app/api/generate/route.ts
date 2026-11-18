import { NextResponse } from "next/server";
import {
  extractStyles,
  extractStylesheetUrls,
  serializeExtractedStylesForPrompt,
} from "@/lib/extract-styles";
import {
  GenerateRequestSchema,
  type GenerateStreamEvent,
  type ProgressStepId,
} from "@/lib/generate-protocol";
import { getModel, LlmSetupError, streamDesignSpec } from "@/lib/llm";
import {
  buildDesignMdSystemPrompt,
  buildImageUserPrompt,
  buildUrlUserPrompt,
} from "@/lib/prompts/design-md";
import { applyDeterministicQuickStart } from "@/lib/quickstart";
import { getClientIp, getRateLimiter } from "@/lib/rate-limit";
import { safeFetchText, SsrfError } from "@/lib/ssrf";
import { validateDesignMd } from "@/lib/validate-md";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/i;

function decodeImageByteLength(dataUrl: string): {
  valid: boolean;
  bytes: number;
} {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) return { valid: false, bytes: 0 };
  const base64 = match[2].replace(/\s+/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  return { valid: true, bytes };
}

function ensureEstimatedColorsHeader(markdown: string): string {
  if (/estimated/i.test(markdown.slice(0, 600))) {
    return markdown;
  }
  const lines = markdown.split(/\r?\n/);
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  const note =
    "> Note: Colors and measurements below are **estimated** from the uploaded screenshot.";

  if (h1Index !== -1) {
    lines.splice(h1Index + 1, 0, "", note);
    return lines.join("\n");
  }
  return `${note}\n\n${markdown}`;
}

export async function POST(request: Request) {
  // 1. Per-IP rate limiting
  // TODO(auth): Rate limit per authenticated user when authentication is added.
  const ip = getClientIp(request);
  const rateCheck = await getRateLimiter().check(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        code: "rate-limited",
        message: `Rate limit reached (${rateCheck.limit}/hour). Try again in ${rateCheck.retryAfterSeconds}s.`,
        retryAfter: rateCheck.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.retryAfterSeconds),
        },
      }
    );
  }

  // 2. Parse & validate JSON payload with Zod
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { code: "invalid-json", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = GenerateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        code: "validation-error",
        message: firstIssue?.message ?? "Invalid generation request.",
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // 3. Validate screenshot image format and decoded 5 MB size cap before streaming
  if (input.mode === "image") {
    const imgCheck = decodeImageByteLength(input.imageDataUrl ?? "");
    if (!imgCheck.valid) {
      return NextResponse.json(
        {
          code: "invalid-image",
          message:
            "Unsupported image format. Upload a PNG, JPEG, or WebP screenshot.",
        },
        { status: 400 }
      );
    }
    if (imgCheck.bytes > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          code: "image-too-large",
          message:
            "Screenshot exceeds the 5 MB limit. Try a smaller or compressed image.",
        },
        { status: 413 }
      );
    }
  }

  // 4. Stream NDJSON pipeline
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let currentStep: ProgressStepId =
        input.mode === "url" ? "fetching-page" : "reading-screenshot";

      const send = (event: GenerateStreamEvent) => {
        if (closed || request.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      const setStep = (step: ProgressStepId, model?: string) => {
        currentStep = step;
        send({
          type: "status",
          step,
          ...(model ? { model } : {}),
        });
      };

      // Heartbeat every 10s so proxies keep the streaming connection open
      const heartbeatTimer = setInterval(() => {
        send({ type: "status", step: currentStep, heartbeat: true });
      }, 10_000);

      try {
        // Verify OpenRouter env configuration upfront
        getModel(input.mode === "url" ? "text" : "vision");

        const systemPrompt = buildDesignMdSystemPrompt(input.target, input.mode);
        let userPrompt: string;

        if (input.mode === "url") {
          const rawUrl = input.url ?? "";
          const normalizedUrl = /^https?:\/\//i.test(rawUrl)
            ? rawUrl
            : `https://${rawUrl}`;

          setStep("fetching-page");
          const pageRes = await safeFetchText(normalizedUrl, {
            signal: request.signal,
          });

          setStep("reading-styles");
          const cssUrls = extractStylesheetUrls(
            pageRes.text,
            pageRes.finalUrl,
            5
          );

          const stylesheetResults = await Promise.allSettled(
            cssUrls.map((cssUrl) =>
              safeFetchText(cssUrl, { signal: request.signal })
            )
          );

          const stylesheets = stylesheetResults
            .filter(
              (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof safeFetchText>>> =>
                r.status === "fulfilled" && r.value.contentType === "text/css"
            )
            .map((r) => r.value.text);

          const extracted = extractStyles(pageRes.text, stylesheets);

          if (extracted.isThinExtraction) {
            send({
              type: "notice",
              code: "thin-extraction",
              message:
                "This site renders with JavaScript, so the results may be thin. Upload a screenshot for better results.",
            });
          }

          userPrompt = buildUrlUserPrompt({
            url: pageRes.finalUrl,
            extractedJson: serializeExtractedStylesForPrompt(extracted),
            target: input.target,
            notes: input.notes,
            thinExtraction: extracted.isThinExtraction,
          });
        } else {
          setStep("reading-screenshot");
          userPrompt = buildImageUserPrompt({
            target: input.target,
            notes: input.notes,
          });
        }

        let emittedWriting = false;

        const llmResult = await streamDesignSpec({
          kind: input.mode === "url" ? "text" : "vision",
          systemPrompt,
          userPrompt,
          imageDataUrl: input.mode === "image" ? input.imageDataUrl : undefined,
          signal: request.signal,
          onModelStart: (modelId) => {
            emittedWriting = false;
            setStep("asking-model", modelId);
          },
          onSwitchingModels: () => {
            emittedWriting = false;
            setStep("switching-models");
          },
          onReset: () => {
            emittedWriting = false;
            send({ type: "reset" });
          },
          onDelta: (chunk) => {
            if (!emittedWriting) {
              emittedWriting = true;
              setStep("writing-spec");
            }
            send({ type: "delta", text: chunk });
          },
        });

        setStep("validating");

        let finalMarkdown = applyDeterministicQuickStart(llmResult.markdown);
        if (input.mode === "image") {
          finalMarkdown = ensureEstimatedColorsHeader(finalMarkdown);
        }

        const validation = validateDesignMd(finalMarkdown);

        send({
          type: "done",
          markdown: finalMarkdown,
          missing: validation.missing,
          colorsEstimated: input.mode === "image",
          model: llmResult.modelId,
        });
      } catch (err) {
        if (request.signal.aborted) {
          // Client explicitly stopped the stream
          return;
        }

        if (err instanceof SsrfError) {
          send({
            type: "error",
            code: err.code,
            message: err.message,
            retryable: err.code === "fetch-timeout" || err.code === "fetch-failed",
          });
        } else if (err instanceof LlmSetupError) {
          send({
            type: "error",
            code: err.code,
            message: err.message,
            retryable: false,
          });
        } else {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Something went wrong while generating DESIGN.md.";
          send({
            type: "error",
            code: "generation-failed",
            message,
            retryable: true,
          });
        }
      } finally {
        clearInterval(heartbeatTimer);
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // Stream already closed by client abort
          }
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
