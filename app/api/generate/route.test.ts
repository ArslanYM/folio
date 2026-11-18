import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateStreamEvent } from "@/lib/generate-protocol";

const mockStreamText = vi.fn();
const mockSafeFetchText = vi.fn();

vi.mock("ai", () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => (modelId: string) => ({ modelId }),
}));

vi.mock("@/lib/ssrf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ssrf")>();
  return {
    ...actual,
    validatePublicUrl: async (url: string) => ({
      safe: true,
      url: new URL(url),
    }),
    safeFetchText: (...args: unknown[]) => mockSafeFetchText(...args),
  };
});

async function readNdjsonEvents(response: Response): Promise<GenerateStreamEvent[]> {
  const text = await response.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GenerateStreamEvent);
}

const VALID_MODEL_SPEC = `# Acme Docs — Calm technical system

## Overview
### Essentials
- Crisp dark canvas

## Colors
### Accent
| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Sky | \`#38bdf8\` | \`--color-accent\` | Primary CTA | Buttons |
| Broken | \`#40372\` | \`--color-broken\` | Invalid | Skip me |

### Neutral
| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Slate | \`#0f172a\` | \`--color-canvas\` | Background | Root |

## Typography
- **Inter** — Body

## Layout
12 columns.

## Corner radius
8px cards.

## Surfaces and depth
Hairline borders.

## Components
Buttons.

## Imagery and graphics
Diagrams.

## Section recipes
First screen hero.

## Page flow
1. Hero

## Writing
Clear and direct.

## Do's and Don'ts
Keep contrast >= 4.5:1.

## Motion and responsive
Observed / Transfer / Unknown.

## Quick Start
\`\`\`css
:root { --color-accent: #99999; }
\`\`\`

## How to use this guide
Paste into Cursor.
`;

describe("POST /api/generate", () => {
  const originalEnv = { ...process.env };
  let ipCounter = 1;

  function nextIp() {
    ipCounter += 1;
    return `198.51.100.${ipCounter}`;
  }

  beforeEach(() => {
    vi.resetModules();
    mockStreamText.mockReset();
    mockSafeFetchText.mockReset();
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: "test-key",
      OPENROUTER_MODEL_TEXT: "test/primary-text",
      OPENROUTER_MODEL_VISION: "test/primary-vision",
      OPENROUTER_FALLBACK_MODEL: "test/fallback-model",
      RATE_LIMIT_PER_HOUR: "20",
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects images over 5 MB with HTTP 413", async () => {
    const { POST } = await import("./route");
    const bigBase64 = "A".repeat(7_200_000); // > 5 MB decoded
    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": nextIp(),
      },
      body: JSON.stringify({
        mode: "image",
        imageDataUrl: `data:image/jpeg;base64,${bigBase64}`,
        target: "landing-page",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it("switches to OPENROUTER_FALLBACK_MODEL when primary fails and applies deterministic Quick Start", async () => {
    const { POST } = await import("./route");

    mockSafeFetchText.mockResolvedValueOnce({
      finalUrl: "https://docs.example.com/",
      contentType: "text/html",
      text: `<html><head><style>body{background:#0f172a;color:#f8fafc;font-family:Inter,sans-serif}.a{color:#38bdf8;border-color:#1e293b}</style></head><body>Hi</body></html>`,
    });

    // Primary fails twice (initial + 1 retry), fallback succeeds
    let callCount = 0;
    mockStreamText.mockImplementation(() => {
      callCount += 1;
      if (callCount <= 2) {
        return {
          textStream: (async function* () {
            throw new Error("429 Too Many Requests");
          })(),
        };
      }
      return {
        textStream: (async function* () {
          yield VALID_MODEL_SPEC;
        })(),
      };
    });

    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": nextIp(),
      },
      body: JSON.stringify({
        mode: "url",
        url: "https://docs.example.com",
        target: "landing-page",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const events = await readNdjsonEvents(res);

    expect(
      events.some(
        (e) => e.type === "status" && e.step === "switching-models"
      )
    ).toBe(true);

    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === "done") {
      expect(doneEvent.colorsEstimated).toBe(false);
      expect(doneEvent.missing).toEqual([]);
      // Deterministic Quick Start replaced the hallucinated #99999 and skipped #40372
      const quickStartSlice = doneEvent.markdown.slice(
        doneEvent.markdown.indexOf("## Quick Start")
      );
      expect(quickStartSlice).toContain("--color-accent: #38bdf8;");
      expect(quickStartSlice).not.toContain("#40372");
      expect(quickStartSlice).not.toContain("--color-broken");
      expect(quickStartSlice).not.toContain("#99999");
      expect(quickStartSlice).toContain("@theme {");
    }
  });

  it("emits thin-extraction notice for JS-heavy SPAs and reports missing sections without hiding output", async () => {
    const { POST } = await import("./route");

    mockSafeFetchText.mockResolvedValueOnce({
      finalUrl: "https://spa.example.com/",
      contentType: "text/html",
      text: `<html><head><title>SPA</title></head><body><div id="root"></div></body></html>`,
    });

    // Simulate model omitting Writing section
    const missingWritingSpec = VALID_MODEL_SPEC.replace(
      "## Writing\nClear and direct.\n",
      ""
    );

    mockStreamText.mockReturnValue({
      textStream: (async function* () {
        yield missingWritingSpec;
      })(),
    });

    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": nextIp(),
      },
      body: JSON.stringify({
        mode: "url",
        url: "https://spa.example.com",
        target: "desktop-web",
      }),
    });

    const res = await POST(req);
    const events = await readNdjsonEvents(res);

    expect(
      events.some(
        (e) => e.type === "notice" && e.code === "thin-extraction"
      )
    ).toBe(true);

    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === "done") {
      expect(doneEvent.missing).toContain("Writing");
      expect(doneEvent.markdown).toContain("# Acme Docs");
    }
  });

  it("sets colorsEstimated=true and ensures estimated header note in image mode", async () => {
    const { POST } = await import("./route");

    mockStreamText.mockReturnValue({
      textStream: (async function* () {
        yield VALID_MODEL_SPEC;
      })(),
    });

    const tinyPngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const req = new Request("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": nextIp(),
      },
      body: JSON.stringify({
        mode: "image",
        imageDataUrl: `data:image/png;base64,${tinyPngBase64}`,
        target: "ios",
      }),
    });

    const res = await POST(req);
    const events = await readNdjsonEvents(res);

    expect(
      events.some(
        (e) => e.type === "status" && e.step === "reading-screenshot"
      )
    ).toBe(true);

    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    if (doneEvent?.type === "done") {
      expect(doneEvent.colorsEstimated).toBe(true);
      expect(doneEvent.markdown.toLowerCase()).toContain("estimated");
    }
  });

  it("returns 429 with Retry-After when per-IP rate limit is exceeded", async () => {
    process.env.RATE_LIMIT_PER_HOUR = "1";
    const { POST } = await import("./route");
    const ip = nextIp();

    mockStreamText.mockReturnValue({
      textStream: (async function* () {
        yield VALID_MODEL_SPEC;
      })(),
    });

    const tinyPngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const makeReq = () =>
      new Request("http://localhost:3000/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          mode: "image",
          imageDataUrl: `data:image/png;base64,${tinyPngBase64}`,
          target: "landing-page",
        }),
      });

    const first = await POST(makeReq());
    expect(first.status).toBe(200);

    const second = await POST(makeReq());
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBeTruthy();
  });
});
