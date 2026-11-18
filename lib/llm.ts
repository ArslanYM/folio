import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, type LanguageModel } from "ai";

export type ModelKind = "text" | "vision" | "fallback";

export interface ResolvedModel {
  model: LanguageModel;
  id: string;
  supportsSystem: boolean;
}

export class LlmSetupError extends Error {
  readonly code = "missing-config";

  constructor(message: string) {
    super(message);
    this.name = "LlmSetupError";
  }
}

const NO_SYSTEM_ROLE_PATTERNS = [/gemma/i, /\bo1-mini\b/i, /\bo1-preview\b/i];

function checkSupportsSystem(modelId: string): boolean {
  return !NO_SYSTEM_ROLE_PATTERNS.some((re) => re.test(modelId));
}

function createProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new LlmSetupError(
      "Add OPENROUTER_API_KEY to .env.local to run generations."
    );
  }

  const referer =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  return createOpenRouter({
    apiKey,
    headers: {
      "HTTP-Referer": referer,
      "X-Title": "Swatchbook",
    },
  });
}

export function hasFallbackModel(): boolean {
  return Boolean(process.env.OPENROUTER_FALLBACK_MODEL?.trim());
}

/**
 * Resolves the configured OpenRouter model for text, vision, or fallback usage.
 * Nothing outside `lib/llm.ts` knows about OpenRouter.
 */
export function getModel(kind: ModelKind): ResolvedModel {
  const envVarName =
    kind === "text"
      ? "OPENROUTER_MODEL_TEXT"
      : kind === "vision"
        ? "OPENROUTER_MODEL_VISION"
        : "OPENROUTER_FALLBACK_MODEL";

  const id = process.env[envVarName]?.trim();
  if (!id) {
    throw new LlmSetupError(
      `Add ${envVarName} to .env.local (pick a model ID at https://openrouter.ai/models).`
    );
  }

  const openrouter = createProvider();
  return {
    model: openrouter(id),
    id,
    supportsSystem: checkSupportsSystem(id),
  };
}

export interface StreamDesignSpecOptions {
  kind: "text" | "vision";
  systemPrompt: string;
  userPrompt: string;
  imageDataUrl?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  onModelStart?: (modelId: string, attempt: number) => void;
  onSwitchingModels?: (fallbackModelId: string) => void;
  onReset?: () => void;
  onDelta: (chunk: string) => void;
}

export interface StreamDesignSpecResult {
  markdown: string;
  modelId: string;
  usedFallback: boolean;
}

const DEFAULT_LLM_TIMEOUT_MS = 90_000;

function stripOuterMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

function isAbortError(err: unknown, callerSignal?: AbortSignal): boolean {
  if (callerSignal?.aborted) return true;
  return err instanceof Error && err.name === "AbortError";
}

async function runSingleModelAttempt(
  resolved: ResolvedModel,
  options: StreamDesignSpecOptions
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  const userText = resolved.supportsSystem
    ? options.userPrompt
    : `${options.systemPrompt}\n\n---\n\n${options.userPrompt}`;

  const messages = options.imageDataUrl
    ? [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: userText },
            { type: "image" as const, image: options.imageDataUrl },
          ],
        },
      ]
    : [
        {
          role: "user" as const,
          content: userText,
        },
      ];

  const result = streamText({
    model: resolved.model,
    ...(resolved.supportsSystem ? { system: options.systemPrompt } : {}),
    messages,
    maxOutputTokens: 8000,
    temperature: 0.3,
    abortSignal: combinedSignal,
  });

  let accumulated = "";
  for await (const chunk of result.textStream) {
    if (!chunk) continue;
    accumulated += chunk;
    options.onDelta(chunk);
  }

  if (accumulated.trim().length < 40) {
    throw new Error("Model returned an empty or truncated response.");
  }

  return stripOuterMarkdownFence(accumulated);
}

/**
 * Streams a DESIGN.md spec with 1 automatic retry on the primary model
 * followed by automatic fallback to OPENROUTER_FALLBACK_MODEL if configured.
 */
export async function streamDesignSpec(
  options: StreamDesignSpecOptions
): Promise<StreamDesignSpecResult> {
  const primary = getModel(options.kind);

  let lastError: unknown;

  // Try primary up to 2 times (initial + 1 retry)
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    if (attempt > 1) {
      options.onReset?.();
    }
    options.onModelStart?.(primary.id, attempt);
    try {
      const markdown = await runSingleModelAttempt(primary, options);
      return { markdown, modelId: primary.id, usedFallback: false };
    } catch (err) {
      if (isAbortError(err, options.signal)) throw err;
      lastError = err;
    }
  }

  // Try fallback model if configured and different from primary
  if (hasFallbackModel()) {
    const fallback = getModel("fallback");
    if (fallback.id !== primary.id) {
      options.onReset?.();
      options.onSwitchingModels?.(fallback.id);
      options.onModelStart?.(fallback.id, 1);
      try {
        const markdown = await runSingleModelAttempt(fallback, options);
        return { markdown, modelId: fallback.id, usedFallback: true };
      } catch (err) {
        if (isAbortError(err, options.signal)) throw err;
        lastError = err;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("The model failed to generate a DESIGN.md specification.");
}
