/**
 * Server-side Playwright screenshot capture is intentionally excluded from v1.
 * Enable via ENABLE_SCREENSHOT=true once a Playwright capture provider is wired in.
 */
export async function captureScreenshot(_url: string): Promise<string> {
  if (process.env.ENABLE_SCREENSHOT === "true") {
    throw new Error("not implemented");
  }
  throw new Error(
    "Screenshot capture is disabled (set ENABLE_SCREENSHOT=true once implemented)."
  );
}
