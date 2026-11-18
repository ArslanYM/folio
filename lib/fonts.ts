export interface FontResolution {
  /** Original font name from the template or spec */
  name: string;
  /** Google Fonts family to load for display */
  substitute: string;
  /** Optional recommended display weight (e.g. 800 for AK Monument Grotesk) */
  displayWeight?: number;
  /** True when the original font is mapped to a different substitute family */
  isSubstituted: boolean;
}

interface FontMappingEntry {
  substitute: string;
  displayWeight?: number;
  isSubstituted: boolean;
}

const FONT_SUBSTITUTE_MAP: Record<string, FontMappingEntry> = {
  "instrument sans": { substitute: "Instrument Sans", isSubstituted: false },
  inter: { substitute: "Inter", isSubstituted: false },
  "aeonik pro": { substitute: "DM Sans", isSubstituted: true },
  aeonik: { substitute: "DM Sans", isSubstituted: true },
  "ak monument grotesk": {
    substitute: "Inter",
    displayWeight: 800,
    isSubstituted: true,
  },
  "monument grotesk": {
    substitute: "Inter",
    displayWeight: 800,
    isSubstituted: true,
  },
  "halyard-display-variable": { substitute: "Inter", isSubstituted: true },
  "halyard display": { substitute: "Inter", isSubstituted: true },
  "dm sans": { substitute: "DM Sans", isSubstituted: false },
  "space grotesk": { substitute: "Space Grotesk", isSubstituted: false },
  "plus jakarta sans": {
    substitute: "Plus Jakarta Sans",
    isSubstituted: false,
  },
  "jetbrains mono": { substitute: "JetBrains Mono", isSubstituted: false },
  "ibm plex mono": { substitute: "IBM Plex Mono", isSubstituted: false },
  "ibm plex sans": { substitute: "IBM Plex Sans", isSubstituted: false },
  "bricolage grotesque": {
    substitute: "Bricolage Grotesque",
    isSubstituted: false,
  },
  "playfair display": { substitute: "Playfair Display", isSubstituted: false },
  sora: { substitute: "Sora", isSubstituted: false },
  manrope: { substitute: "Manrope", isSubstituted: false },
  outfit: { substitute: "Outfit", isSubstituted: false },
};

const GENERIC_FONT_NAMES = new Set([
  "arial",
  "helvetica",
  "helvetica neue",
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "segoe ui",
  "sans-serif",
  "serif",
  "monospace",
  "cursive",
  "fantasy",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "times new roman",
  "georgia",
]);

function normalizeFontKey(fontName: string): string {
  return fontName
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isGenericFont(fontName: string): boolean {
  return GENERIC_FONT_NAMES.has(normalizeFontKey(fontName));
}

export function resolveFont(fontName: string): FontResolution {
  const cleanName = fontName.trim().replace(/^["'`]+|["'`]+$/g, "");
  const key = normalizeFontKey(cleanName);
  const mapped = FONT_SUBSTITUTE_MAP[key];

  if (mapped) {
    return {
      name: cleanName,
      substitute: mapped.substitute,
      displayWeight: mapped.displayWeight,
      isSubstituted: mapped.isSubstituted,
    };
  }

  return {
    name: cleanName,
    substitute: "Inter",
    isSubstituted: true,
  };
}

/**
 * Builds a Google Fonts stylesheet URL for a list of resolved fonts.
 * Deduplicates families and requests weights 400..800.
 */
export function buildGoogleFontsHref(
  fonts: readonly FontResolution[]
): string | null {
  const uniqueFamilies = Array.from(
    new Set(fonts.map((font) => font.substitute).filter(Boolean))
  );

  if (uniqueFamilies.length === 0) return null;

  const familyParams = uniqueFamilies
    .map(
      (family) =>
        `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700;800`
    )
    .join("&");

  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}
