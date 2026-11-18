import { describe, expect, it } from "vitest";
import { extractStyles, extractStylesheetUrls } from "./extract-styles";

describe("lib/extract-styles", () => {
  it("extracts CSS custom properties, normalized colors, fonts, radii, breakpoints, and motion", () => {
    const html = `<!doctype html>
      <html lang="en">
        <head>
          <title>Acme Docs</title>
          <meta name="description" content="Developer documentation">
          <meta name="theme-color" content="#0f172a">
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&display=swap">
          <link rel="stylesheet" href="/assets/main.css">
          <style>
            :root {
              --color-bg: #0f172a;
              --color-accent: #38bdf8;
              --radius-card: 12px;
            }
            body {
              background-color: #0f172a;
              color: #f8fafc;
              font-family: "Space Grotesk", Inter, sans-serif;
            }
            .card {
              background: rgb(30, 41, 59);
              border: 1px solid rgba(56, 189, 248, 0.4);
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
              transition: transform 200ms ease;
            }
            h1 { font-size: 48px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
            @media (min-width: 768px) { .card { padding: 32px; } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          </style>
        </head>
        <body><h1>Hello</h1></body>
      </html>`;

    const links = extractStylesheetUrls(html, "https://docs.acme.dev/");
    expect(links).toContain("https://docs.acme.dev/assets/main.css");

    const styles = extractStyles(html, [
      `.badge { color: hsl(142, 71%, 45%); border-radius: 999px; }`,
    ]);

    expect(styles.meta.title).toBe("Acme Docs");
    expect(styles.meta.lang).toBe("en");
    expect(styles.meta.themeColor).toBe("#0f172a");
    expect(styles.bodyStyle.background).toBe("#0f172a");
    expect(styles.cssVariables.some((v) => v.name === "--color-accent")).toBe(
      true
    );

    const hexes = styles.colors.map((c) => c.hex);
    expect(hexes).toContain("#0f172a");
    expect(hexes).toContain("#38bdf8");
    expect(hexes).toContain("#1e293b");
    expect(hexes).toContain("#21c45d"); // hsl(142, 71%, 45%)

    expect(styles.fonts.googleFonts).toContain("Space Grotesk");
    expect(styles.fonts.googleFonts).toContain("Inter");
    expect(styles.breakpoints).toContain("768px");
    expect(styles.motion.keyframes).toContain("fadeIn");
    expect(styles.motion.durations).toContain("200ms");
    expect(styles.isThinExtraction).toBe(false);
  });

  it("flags JS-heavy empty SPA shells as thin extraction", () => {
    const spaHtml = `<!doctype html><html><head><title>SPA</title></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`;
    const styles = extractStyles(spaHtml);
    expect(styles.isThinExtraction).toBe(true);
  });
});
