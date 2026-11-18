export interface Swatch {
  name: string;
  hex: string;
  alpha?: number;
  token?: string;
  role?: string;
  use?: string;
  group?: string;
  onlyFor?: string;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const HEX_3_RE = /^#([0-9a-fA-F]{3})$/;
const HEX_6_RE = /^#([0-9a-fA-F]{6})$/;
const HEX_8_RE = /^#([0-9a-fA-F]{8})$/;

/**
 * Validates #rgb, #rrggbb, or #rrggbbaa hex color strings.
 * Rejects malformed lengths such as 5-digit typos (#40372).
 */
export function isValidHex(value: string): boolean {
  const trimmed = value.trim();
  return (
    HEX_3_RE.test(trimmed) ||
    HEX_6_RE.test(trimmed) ||
    HEX_8_RE.test(trimmed)
  );
}

/**
 * Normalizes a valid #rgb, #rrggbb, or #rrggbbaa color into lowercase #rrggbb.
 * Returns null if the input is not a valid hex color.
 */
export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();

  const match3 = HEX_3_RE.exec(trimmed);
  if (match3) {
    const [r, g, b] = match3[1].toLowerCase();
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  const match6 = HEX_6_RE.exec(trimmed);
  if (match6) {
    return `#${match6[1].toLowerCase()}`;
  }

  const match8 = HEX_8_RE.exec(trimmed);
  if (match8) {
    return `#${match8[1].slice(0, 6).toLowerCase()}`;
  }

  return null;
}

/**
 * Extracts alpha (0..1) from an 8-digit #rrggbbaa hex string.
 * Returns undefined for 3-digit or 6-digit hex values.
 */
export function extractHexAlpha(value: string): number | undefined {
  const match8 = HEX_8_RE.exec(value.trim());
  if (!match8) return undefined;
  const alphaByte = Number.parseInt(match8[1].slice(6, 8), 16);
  return Math.round((alphaByte / 255) * 100) / 100;
}

export function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}

function linearizeChannel(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/**
 * Computes WCAG 2.x relative luminance in [0, 1].
 */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const r = linearizeChannel(rgb.r);
  const g = linearizeChannel(rgb.g);
  const b = linearizeChannel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes HSL lightness and saturation in [0, 1].
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, l: 0 };

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return { h: h * 360, s, l };
}

export function saturation(hex: string): number {
  return hexToHsl(hex).s;
}

/**
 * Returns true if the color sits within `threshold` (default 8%) of pure black or white.
 */
export function isNearBlackOrWhite(hex: string, threshold = 0.08): boolean {
  const { l } = hexToHsl(hex);
  return l <= threshold || l >= 1 - threshold;
}

export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.2;
}

/**
 * Computes WCAG contrast ratio between two hex colors (1 to 21).
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks a readable foreground color against `backgroundHex`.
 */
export function pickReadableForeground(
  backgroundHex: string,
  dark = "#0E0D0B",
  light = "#F2EDE2"
): string {
  return contrastRatio(backgroundHex, dark) >=
    contrastRatio(backgroundHex, light)
    ? dark
    : light;
}

/**
 * Picks the representative accent swatch for a template:
 * 1. Most saturated swatch with luminance in [0.08, 0.9] and not within 8% of pure black/white.
 * 2. Fallback to the most saturated swatch overall.
 * 3. Fallback to the second swatch (or first if only one exists).
 */
export function pickAccent(swatches: readonly Swatch[]): Swatch | undefined {
  if (swatches.length === 0) return undefined;

  const eligible = swatches.filter((swatch) => {
    const lum = luminance(swatch.hex);
    return lum >= 0.08 && lum <= 0.9 && !isNearBlackOrWhite(swatch.hex, 0.08);
  });

  if (eligible.length > 0) {
    let best = eligible[0];
    let bestSat = saturation(best.hex);
    for (let i = 1; i < eligible.length; i += 1) {
      const sat = saturation(eligible[i].hex);
      if (sat > bestSat) {
        best = eligible[i];
        bestSat = sat;
      }
    }
    if (bestSat > 0.05) {
      return best;
    }
  }

  let mostSaturated = swatches[0];
  let maxSat = saturation(mostSaturated.hex);
  for (let i = 1; i < swatches.length; i += 1) {
    const sat = saturation(swatches[i].hex);
    if (sat > maxSat) {
      mostSaturated = swatches[i];
      maxSat = sat;
    }
  }

  if (maxSat > 0) {
    return mostSaturated;
  }

  return swatches[1] ?? swatches[0];
}
