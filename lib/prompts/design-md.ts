export type GenerationTarget =
  | "desktop-web"
  | "mobile-web"
  | "ios"
  | "android"
  | "landing-page"
  | "dashboard";

export const GENERATION_TARGETS: ReadonlyArray<{
  id: GenerationTarget;
  label: string;
  hint: string;
}> = [
  { id: "desktop-web", label: "Desktop web", hint: "1440px grid & nav" },
  { id: "mobile-web", label: "Mobile web", hint: "Touch & thumb zones" },
  { id: "ios", label: "iOS app", hint: "HIG, pt units, sheets" },
  { id: "android", label: "Android app", hint: "Material 3, dp/sp" },
  { id: "landing-page", label: "Landing page", hint: "Hero & conversion flow" },
  { id: "dashboard", label: "Dashboard / SaaS", hint: "Dense tables & status" },
];

const TARGET_ADDONS: Record<GenerationTarget, string> = {
  "desktop-web": `
Target add-on — Desktop Web:
- Use a 1440px desktop baseline with explicit container max-widths, column count, gutters, top navigation geometry, and responsive breakpoints down to 1024px / 768px / 375px.
- Specify hover, focus-visible, and keyboard states for desktop pointer + keyboard interaction.`,

  "mobile-web": `
Target add-on — Mobile Web:
- Prioritize mobile breakpoints (375px–430px primary, scaling up to 768px), minimum 44px touch targets, thumb-zone placement for primary actions, sticky bottom or top bars, and safe-area-inset handling (env(safe-area-inset-*)).
- Avoid hover-only affordances; define active/pressed states explicitly.`,

  ios: `
Target add-on — iOS App (Human Interface Guidelines):
- Follow Apple Human Interface Guidelines conventions: SF Pro / SF Mono (or closest Google Fonts substitute if web previewed), safe areas, tab bar and navigation bar with large titles, 44pt minimum touch targets, continuous corner radii, modal sheets, and brief haptics notes where tactile feedback applies.
- Use \`pt\` units throughout typography, spacing, and radii.
- Name the section recipes heading \`## Screen recipes\` instead of \`## Section recipes\`.`,

  android: `
Target add-on — Android App (Material 3):
- Map colors to Material 3 dynamic color roles (primary, onPrimary, surface, surfaceContainer, outline, etc.), elevation tones and state layers (8% hover, 10% focus/press), navigation bar / navigation rail, and FAB patterns.
- Use \`dp\` for spacing/radii/sizing and \`sp\` for typography.
- Name the section recipes heading \`## Screen recipes\` instead of \`## Section recipes\`.`,

  "landing-page": `
Target add-on — Marketing Landing Page:
- Emphasize hero formula (eyebrow, headline, subhead, primary CTA, visual centerpiece), distinct recurring section recipes (avoid repetitive 3-card rows), clear conversion flow, social proof treatment, and voice/copywriting patterns.`,

  dashboard: `
Target add-on — Dashboard / SaaS Application:
- Emphasize information density, data tables (row height, alignment, tabular-nums, sticky headers), filter bars, empty and loading states, sidebar/topbar chrome, multi-series chart palette, and semantic status colors (success, warning, danger, info).`,
};

export function buildDesignMdSystemPrompt(
  target: GenerationTarget,
  mode: "url" | "image"
): string {
  const recipesHeading =
    target === "ios" || target === "android"
      ? "## Screen recipes"
      : "## Section recipes";

  const colorRule =
    mode === "image"
      ? `- Image mode: colors are **estimated** from the screenshot. Explicitly state right under the H1 (e.g., \`> Note: Colors and measurements are estimated from the uploaded screenshot.\`) that colors are estimated, and give the closest reasonable 6-digit hex codes.`
      : `- URL mode: NEVER invent a hex color that is not supported by the extracted CSS/HTML data. Ground every color, font, radius, and spacing value in the extracted JSON.`;

  return `You are Swatchbook, an expert design-systems architect. Produce a complete, build-ready \`DESIGN.md\` specification in Markdown.

STRICT RULES:
${colorRule}
- Name real fonts when recognizable from the input; otherwise name the closest Google Fonts substitute and explicitly note that it is a substitute.
- Use semantic roles and CSS custom property tokens (\`--color-accent\`, \`--color-canvas\`, etc.), exact measurements, and Markdown tables where supported.
- Describe the visual style and system, NEVER the brand. Do not include trademarked names, logos, slogans, customer counts, or reusable marketing copy. The Writing section describes voice patterns and rules, not copy to paste.
- Keep \`Do's and Don'ts\` specific and measurable (concrete values, ratios, radii, and constraints — not vague adjectives).
- In \`## Motion and responsive\`, structure findings into **Observed**, **Transfer**, and **Unknown**. Never invent motion or responsive details that were not observed; place anything unobserved under **Unknown**.
- Output ONLY valid Markdown. Do not wrap the whole document in a \`\`\`markdown code fence and do not add conversational preamble or postscript.

REQUIRED DOCUMENT STRUCTURE (include EVERY heading in this order):
1. \`# <System Name> — <short style tagline>\`
2. \`## Overview\` (with a concise intro paragraph and \`### Essentials\` containing 5–6 bullets)
3. \`## Colors\` (Markdown tables with columns \`Name | Value | Token | Roles | Use\`, grouped under \`### Accent\` and \`### Neutral\`; add \`### Page-type variants\` with an \`Only for\` column only if multiple page polarities/variants exist)
4. \`## Typography\` (bullet lines \`- **Font Name** — description and substitute note\`; a Markdown recipe table \`Recipe | Font | Weight | Size | Line height | Tracking | Use\`; \`### Notes\`)
5. \`## Layout\` (density, spacing table, containers and grids)
6. \`## Corner radius\`
7. \`## Surfaces and depth\` (surface levels with CSS; shadows or the explicit absence of shadows)
8. \`## Components\` (for each component: Use, CSS, Text style, Observed, States where known)
9. \`## Imagery and graphics\` (include a concrete Build recipe for any signature graphic motif)
10. \`${recipesHeading}\` (First screen, then recurring sections/screens)
11. \`## Page flow\`
12. \`## Writing\` (voice, patterns, words to use/avoid, rules, and an explicit **Do not copy** line)
13. \`## Do's and Don'ts\` (measurable Do and Don't bullets)
14. \`## Motion and responsive\` (Observed / Transfer / Unknown)
15. \`## Quick Start\` (concise placeholder tokens — the application will post-process this deterministically)
16. \`## How to use this guide\`

${TARGET_ADDONS[target].trim()}`;
}

export function buildUrlUserPrompt(params: {
  url: string;
  extractedJson: string;
  target: GenerationTarget;
  notes?: string;
  thinExtraction?: boolean;
}): string {
  const lines = [
    `Generate a complete DESIGN.md for target "${params.target}" based on the extracted styles from: ${params.url}`,
    "",
  ];

  if (params.thinExtraction) {
    lines.push(
      "Note: Extraction was thin (likely a JavaScript-rendered site). Use every extracted token faithfully, mark anything unconfirmed under Unknown, and do not fabricate ungrounded hex values."
    );
    lines.push("");
  }

  if (params.notes?.trim()) {
    lines.push(`User notes / focus: ${params.notes.trim()}`);
    lines.push("");
  }

  lines.push("Extracted style data (JSON):");
  lines.push("```json");
  lines.push(params.extractedJson);
  lines.push("```");

  return lines.join("\n");
}

export function buildImageUserPrompt(params: {
  target: GenerationTarget;
  notes?: string;
}): string {
  const lines = [
    `Analyze the attached UI screenshot and generate a complete DESIGN.md for target "${params.target}".`,
    "Remember: state clearly at the top of the document that colors and pixel values are estimated from the screenshot, identify or substitute fonts clearly, and never copy brand names or trademarked text.",
  ];

  if (params.notes?.trim()) {
    lines.push("");
    lines.push(`User notes / focus: ${params.notes.trim()}`);
  }

  return lines.join("\n");
}
