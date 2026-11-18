import { describe, expect, it } from "vitest";
import { getTemplate } from "@/lib/templates";
import { buildLandingPagePrompt } from "./landing-page";

describe("lib/prompts/landing-page", () => {
  it("includes Section recipes for Format B templates (orbi)", async () => {
    const orbi = await getTemplate("orbi");
    expect(orbi).not.toBeNull();
    if (!orbi) return;

    const prompt = buildLandingPagePrompt(orbi.rawMarkdown, orbi.hasSectionRecipes);
    expect(prompt.startsWith("# Orbi")).toBe(true);
    expect(prompt).toContain("Section recipes");
    expect(prompt).toContain("Do's and Don'ts");
    expect(prompt).toContain("Product: <ask the user to fill this in>");
  });

  it("omits Section recipes for Format A templates (oryzo-ai)", async () => {
    const oryzo = await getTemplate("oryzo-ai");
    expect(oryzo).not.toBeNull();
    if (!oryzo) return;

    const prompt = buildLandingPagePrompt(
      oryzo.rawMarkdown,
      oryzo.hasSectionRecipes
    );
    expect(prompt.startsWith("# ORYZO AI")).toBe(true);
    expect(prompt).not.toContain("Section recipes");
    expect(prompt).toContain("Do's and Don'ts");
  });
});
