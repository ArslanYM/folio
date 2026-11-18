import { z } from "zod";

export const GenerateRequestSchema = z
  .object({
    mode: z.enum(["url", "image"]),
    url: z.string().trim().optional(),
    imageDataUrl: z.string().trim().optional(),
    target: z.enum([
      "desktop-web",
      "mobile-web",
      "ios",
      "android",
      "landing-page",
      "dashboard",
    ]),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "url" && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "A website URL is required in URL mode.",
      });
    }
    if (data.mode === "image" && !data.imageDataUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageDataUrl"],
        message: "A screenshot image is required in image mode.",
      });
    }
  });

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export type ProgressStepId =
  | "fetching-page"
  | "reading-styles"
  | "reading-screenshot"
  | "asking-model"
  | "switching-models"
  | "writing-spec"
  | "validating";

export type GenerateStreamEvent =
  | {
      type: "status";
      step: ProgressStepId;
      model?: string;
      heartbeat?: boolean;
    }
  | {
      type: "notice";
      code: string;
      message: string;
    }
  | {
      type: "reset";
    }
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "done";
      markdown: string;
      missing: string[];
      colorsEstimated: boolean;
      model?: string;
    }
  | {
      type: "error";
      code: string;
      message: string;
      retryable: boolean;
      retryAfter?: number;
    };
