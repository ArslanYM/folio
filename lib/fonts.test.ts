import { describe, expect, it } from "vitest";
import { buildGoogleFontsHref, isGenericFont, resolveFont } from "./fonts";

describe("lib/fonts", () => {
  it("maps known fonts and marks substitutes accurately", () => {
    expect(resolveFont("Instrument Sans")).toEqual({
      name: "Instrument Sans",
      substitute: "Instrument Sans",
      displayWeight: undefined,
      isSubstituted: false,
    });

    expect(resolveFont("Inter")).toEqual({
      name: "Inter",
      substitute: "Inter",
      displayWeight: undefined,
      isSubstituted: false,
    });

    expect(resolveFont("Aeonik Pro")).toEqual({
      name: "Aeonik Pro",
      substitute: "DM Sans",
      displayWeight: undefined,
      isSubstituted: true,
    });

    expect(resolveFont("AK Monument Grotesk")).toEqual({
      name: "AK Monument Grotesk",
      substitute: "Inter",
      displayWeight: 800,
      isSubstituted: true,
    });

    expect(resolveFont("halyard-display-variable")).toEqual({
      name: "halyard-display-variable",
      substitute: "Inter",
      displayWeight: undefined,
      isSubstituted: true,
    });

    expect(resolveFont("Unknown Boutique Display")).toEqual({
      name: "Unknown Boutique Display",
      substitute: "Inter",
      displayWeight: undefined,
      isSubstituted: true,
    });
  });

  it("identifies generic font names", () => {
    expect(isGenericFont("Arial")).toBe(true);
    expect(isGenericFont("system-ui")).toBe(true);
    expect(isGenericFont("sans-serif")).toBe(true);
    expect(isGenericFont("Inter")).toBe(false);
  });

  it("builds a deduplicated Google Fonts stylesheet URL", () => {
    const href = buildGoogleFontsHref([
      resolveFont("AK Monument Grotesk"),
      resolveFont("Inter"),
      resolveFont("Aeonik Pro"),
    ]);

    expect(href).toBe(
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap"
    );
    expect(buildGoogleFontsHref([])).toBeNull();
  });
});
