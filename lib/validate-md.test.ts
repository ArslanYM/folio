import { describe, expect, it } from "vitest";
import { validateDesignMd } from "./validate-md";

const COMPLETE_SPEC = `# Example — Minimal spec

## Overview
### Essentials
- One

## Colors
| Name | Value | Token | Roles | Use |
| --- | --- | --- | --- | --- |
| Bg | \`#0e0d0b\` | \`--color-bg\` | Canvas | Root |

## Typography
- **Inter** — Body

## Layout
Grid details.

## Corner radius
8px cards.

## Surfaces and depth
Flat surfaces.

## Components
Buttons.

## Imagery and graphics
Clean photography.

## Screen recipes
First screen.

## Page flow
1. Hero

## Writing
Clear voice.

## Do's and Don'ts
Do keep contrast high.

## Motion and responsive
Observed / Transfer / Unknown.

## Quick Start
\`\`\`css
:root {}
\`\`\`

## How to use this guide
Paste it in.
`;

describe("lib/validate-md", () => {
  it("validates a complete spec including Screen recipes for mobile targets", () => {
    const res = validateDesignMd(COMPLETE_SPEC);
    expect(res.valid).toBe(true);
    expect(res.missing).toEqual([]);
  });

  it("reports missing sections when a heading is deleted", () => {
    const broken = COMPLETE_SPEC.replace("## Writing\nClear voice.\n", "").replace(
      "## Page flow\n1. Hero\n",
      ""
    );
    const res = validateDesignMd(broken);
    expect(res.valid).toBe(false);
    expect(res.missing).toContain("Writing");
    expect(res.missing).toContain("Page flow");
  });
});
