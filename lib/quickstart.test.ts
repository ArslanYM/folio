import { describe, expect, it } from "vitest";
import {
  applyDeterministicQuickStart,
  buildDeterministicQuickStart,
} from "./quickstart";

describe("lib/quickstart", () => {
  it("skips broken hex codes and replaces the model's Quick Start deterministically", () => {
    const modelOutput = `# Demo System — Crisp dark dashboard

## Colors

### Accent
| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Chartreuse | \`#C8F23D\` | \`--color-accent\` | Primary CTA | Buttons |
| Broken Typo | \`#40372\` | \`--color-broken\` | Broken | Should be skipped |
| Bad Hex | \`#gggggg\` | \`--color-bad\` | Invalid | Should be skipped |

### Neutral
| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Canvas | \`#0e0d0b\` | \`--color-canvas\` | Background | Root |

## Typography

- **Bricolage Grotesque** — Display headings
- **Inter** — UI copy

## Corner radius
- Cards: 12px
- Pills: 999px

## Quick Start
\`\`\`css
/* Hallucinated model quickstart */
:root { --color-accent: #12345; }
\`\`\`

## How to use this guide
Paste into Cursor.
`;

    const built = buildDeterministicQuickStart(modelOutput);
    expect(built.colors.map((c) => c.hex)).toEqual(["#c8f23d", "#0e0d0b"]);
    expect(built.cssBlock).toContain("--color-accent: #c8f23d;");
    expect(built.cssBlock).not.toContain("#40372");
    expect(built.cssBlock).not.toContain("#gggggg");
    expect(built.tailwindBlock).toContain("@theme {");
    expect(built.tailwindBlock).toContain("--color-canvas: #0e0d0b;");

    const finalMd = applyDeterministicQuickStart(modelOutput);
    expect(finalMd).not.toContain("Hallucinated model quickstart");
    expect(finalMd).toContain("Tailwind v4 `@theme`");
    expect(finalMd).toContain("## How to use this guide");
  });
});
