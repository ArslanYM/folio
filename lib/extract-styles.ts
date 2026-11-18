import * as cheerio from "cheerio";
import { extractHexAlpha, isValidHex, normalizeHex } from "./color";

export interface ExtractedColor {
  hex: string;
  count: number;
  alphas?: number[];
}

export interface FrequencyItem {
  value: string;
  count: number;
}

export interface ExtractedStyles {
  meta: {
    title?: string;
    description?: string;
    themeColor?: string;
    lang?: string;
  };
  bodyStyle: {
    background?: string;
    color?: string;
  };
  cssVariables: Array<{ name: string; value: string }>;
  colors: ExtractedColor[];
  fonts: {
    stacks: string[];
    googleFonts: string[];
    fontFaces: string[];
    adobeTypekit: boolean;
  };
  fontSizes: FrequencyItem[];
  fontWeights: FrequencyItem[];
  lineHeights: FrequencyItem[];
  letterSpacings: FrequencyItem[];
  borderRadii: FrequencyItem[];
  spacings: FrequencyItem[];
  boxShadows: FrequencyItem[];
  breakpoints: string[];
  motion: {
    keyframes: string[];
    durations: string[];
  };
  isThinExtraction: boolean;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToHex(h: number, sPct: number, lPct: number): string {
  const s = Math.max(0, Math.min(100, sPct)) / 100;
  const l = Math.max(0, Math.min(100, lPct)) / 100;
  const hNorm = ((h % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hNorm < 60) [r1, g1, b1] = [c, x, 0];
  else if (hNorm < 120) [r1, g1, b1] = [x, c, 0];
  else if (hNorm < 180) [r1, g1, b1] = [0, c, x];
  else if (hNorm < 240) [r1, g1, b1] = [0, x, c];
  else if (hNorm < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

function parseAlpha(raw?: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.endsWith("%")) {
    const pct = Number.parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(pct)) return undefined;
    return Math.round(Math.max(0, Math.min(1, pct / 100)) * 100) / 100;
  }
  const num = Number.parseFloat(trimmed);
  if (Number.isNaN(num)) return undefined;
  return Math.round(Math.max(0, Math.min(1, num)) * 100) / 100;
}

function recordColor(
  map: Map<string, { count: number; alphas: Set<number> }>,
  hex: string,
  alpha?: number
) {
  const entry = map.get(hex) ?? { count: 0, alphas: new Set<number>() };
  entry.count += 1;
  if (alpha !== undefined && alpha < 1) {
    entry.alphas.add(alpha);
  }
  map.set(hex, entry);
}

function extractSingleColorToHex(value: string): string | undefined {
  const hexMatch = /#([0-9a-fA-F]{3,8})\b/.exec(value);
  if (hexMatch && isValidHex(hexMatch[0])) {
    return normalizeHex(hexMatch[0]) ?? undefined;
  }
  const rgbMatch =
    /rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/i.exec(value);
  if (rgbMatch) {
    return rgbToHex(
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3])
    );
  }
  return undefined;
}

function bumpFreq(map: Map<string, number>, value: string) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean || clean === "inherit" || clean === "initial" || clean === "unset") {
    return;
  }
  map.set(clean, (map.get(clean) ?? 0) + 1);
}

function topFrequencies(
  map: Map<string, number>,
  limit: number
): FrequencyItem[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

/**
 * Extracts up to `limit` linked stylesheet URLs from an HTML document,
 * resolved against `baseUrl`.
 */
export function extractStylesheetUrls(
  html: string,
  baseUrl: string,
  limit = 5
): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  $('link[rel~="stylesheet"][href]').each((_, el) => {
    if (urls.length >= limit) return;
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    try {
      const resolved = new URL(href, baseUrl).toString();
      if (!seen.has(resolved)) {
        seen.add(resolved);
        urls.push(resolved);
      }
    } catch {
      // Ignore malformed stylesheet URLs
    }
  });

  return urls;
}

/**
 * Extracts structured design tokens deterministically from HTML and CSS strings.
 */
export function extractStyles(
  html: string,
  stylesheets: readonly string[] = []
): ExtractedStyles {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || undefined;
  const description =
    $('meta[name="description"]').attr("content")?.trim() || undefined;
  const rawThemeColor =
    $('meta[name="theme-color"]').attr("content")?.trim() || undefined;
  const themeColor = rawThemeColor
    ? extractSingleColorToHex(rawThemeColor) ?? rawThemeColor
    : undefined;
  const lang = $("html").attr("lang")?.trim() || undefined;

  // Google Fonts & Adobe/Typekit hints
  const googleFontsSet = new Set<string>();
  let adobeTypekit = false;

  $("link[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/fonts\.googleapis\.com/i.test(href)) {
      const matches = href.matchAll(/family=([^&:]+)/gi);
      for (const m of matches) {
        const family = decodeURIComponent(m[1]).replace(/\+/g, " ").trim();
        if (family) googleFontsSet.add(family);
      }
    }
    if (/use\.typekit\.net|fonts\.adobe\.com/i.test(href)) {
      adobeTypekit = true;
    }
  });

  // Collect inline <style> blocks + inline style attributes + external CSS
  const inlineStyles: string[] = [];
  $("style").each((_, el) => {
    const text = $(el).text();
    if (text) inlineStyles.push(text);
  });

  const inlineAttrStyles: string[] = [];
  $("[style]").each((_, el) => {
    const attr = $(el).attr("style");
    if (attr) inlineAttrStyles.push(attr);
  });

  const allCss = [...stylesheets, ...inlineStyles].join("\n");
  const fullStyleCorpus = `${allCss}\n${inlineAttrStyles.join(";\n")}`;

  // Strip CSS comments for cleaner parsing
  const cssNoComments = fullStyleCorpus.replace(/\/\*[\s\S]*?\*\//g, "");

  // Body background & color from inline body style or CSS body rule
  const bodyStyle: { background?: string; color?: string } = {};
  const bodyInline = $("body").attr("style") ?? "";
  const bodyRuleMatch = /(?:^|[}\s])body\s*\{([^}]+)\}/i.exec(allCss);
  const bodyDecls = `${bodyRuleMatch?.[1] ?? ""};${bodyInline}`;

  const bodyBgMatch = /background(?:-color)?\s*:\s*([^;]+)/i.exec(bodyDecls);
  if (bodyBgMatch) {
    bodyStyle.background =
      extractSingleColorToHex(bodyBgMatch[1]) ?? bodyBgMatch[1].trim();
  }
  const bodyColorMatch = /(?:^|;|\s)color\s*:\s*([^;]+)/i.exec(bodyDecls);
  if (bodyColorMatch) {
    bodyStyle.color =
      extractSingleColorToHex(bodyColorMatch[1]) ?? bodyColorMatch[1].trim();
  }

  // 1. CSS custom properties (--x: value)
  const cssVariablesMap = new Map<string, string>();
  const varMatches = cssNoComments.matchAll(
    /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g
  );
  for (const m of varMatches) {
    const name = m[1].trim();
    const value = m[2].trim().replace(/\s+/g, " ");
    if (!cssVariablesMap.has(name) && value.length <= 140) {
      cssVariablesMap.set(name, value);
    }
  }
  const cssVariables = Array.from(cssVariablesMap.entries())
    .slice(0, 60)
    .map(([name, value]) => ({ name, value }));

  // 2. Colors (hex, rgb/rgba, hsl/hsla)
  const colorMap = new Map<string, { count: number; alphas: Set<number> }>();

  for (const m of cssNoComments.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const raw = m[0];
    if (!isValidHex(raw)) continue;
    const norm = normalizeHex(raw);
    if (!norm) continue;
    recordColor(colorMap, norm, extractHexAlpha(raw));
  }

  for (const m of cssNoComments.matchAll(
    /rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*[,/]\s*([0-9.]+%?))?\s*\)/gi
  )) {
    const hex = rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]));
    recordColor(colorMap, hex, parseAlpha(m[4]));
  }

  for (const m of cssNoComments.matchAll(
    /hsla?\(\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%\s*[,\s]\s*(\d+(?:\.\d+)?)%(?:\s*[,/]\s*([0-9.]+%?))?\s*\)/gi
  )) {
    const hex = hslToHex(Number(m[1]), Number(m[2]), Number(m[3]));
    recordColor(colorMap, hex, parseAlpha(m[4]));
  }

  if (themeColor && isValidHex(themeColor)) {
    const norm = normalizeHex(themeColor);
    if (norm) recordColor(colorMap, norm);
  }

  const canvasHex = bodyStyle.background
    ? normalizeHex(bodyStyle.background)
    : null;

  const sortedColors = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      count: data.count,
      alphas: data.alphas.size > 0 ? Array.from(data.alphas) : undefined,
    }))
    .sort((a, b) => b.count - a.count);

  // Filter out pure #fff/#000 noise if there are richer colors and they are not the actual canvas
  const nonBWColors = sortedColors.filter(
    (c) => c.hex !== "#ffffff" && c.hex !== "#000000"
  );
  const filteredColors = sortedColors.filter((c) => {
    if (c.hex !== "#ffffff" && c.hex !== "#000000") return true;
    if (canvasHex === c.hex) return true;
    // Keep pure white/black if we have very few other colors
    return nonBWColors.length < 4;
  });

  const colors = filteredColors.slice(0, 12);

  // 3. Fonts (font-family stacks, @font-face families)
  const fontStackSet = new Set<string>();
  for (const m of cssNoComments.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) {
    const stack = m[1].trim().replace(/\s+/g, " ");
    if (stack && !stack.startsWith("var(") && stack.length <= 160) {
      fontStackSet.add(stack);
    }
  }

  const fontFaceSet = new Set<string>();
  for (const m of cssNoComments.matchAll(/@font-face\s*\{([^}]+)\}/gi)) {
    const familyMatch = /font-family\s*:\s*["']?([^;"']+)["']?/i.exec(m[1]);
    if (familyMatch?.[1]) {
      fontFaceSet.add(familyMatch[1].trim());
    }
  }

  if (/use\.typekit\.net|fonts\.adobe\.com/i.test(cssNoComments)) {
    adobeTypekit = true;
  }

  // 4. Type scale, radii, spacing, shadows
  const fontSizeMap = new Map<string, number>();
  const fontWeightMap = new Map<string, number>();
  const lineHeightMap = new Map<string, number>();
  const letterSpacingMap = new Map<string, number>();
  const radiusMap = new Map<string, number>();
  const spacingMap = new Map<string, number>();
  const shadowMap = new Map<string, number>();

  for (const m of cssNoComments.matchAll(/font-size\s*:\s*([^;{}]+)/gi)) {
    bumpFreq(fontSizeMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(/font-weight\s*:\s*([^;{}]+)/gi)) {
    bumpFreq(fontWeightMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(/line-height\s*:\s*([^;{}]+)/gi)) {
    bumpFreq(lineHeightMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(/letter-spacing\s*:\s*([^;{}]+)/gi)) {
    bumpFreq(letterSpacingMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)) {
    bumpFreq(radiusMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(
    /(?:margin|padding|gap)(?:-(?:top|right|bottom|left|inline|block))?\s*:\s*([^;{}]+)/gi
  )) {
    bumpFreq(spacingMap, m[1]);
  }
  for (const m of cssNoComments.matchAll(/box-shadow\s*:\s*([^;{}]+)/gi)) {
    if (m[1].trim() !== "none") {
      bumpFreq(shadowMap, m[1]);
    }
  }

  // 5. Breakpoints from @media min/max-width
  const breakpointSet = new Set<string>();
  for (const m of cssNoComments.matchAll(
    /@media[^{]*\((?:min|max)-width\s*:\s*([0-9.]+(?:px|em|rem))\)/gi
  )) {
    breakpointSet.add(m[1].trim());
  }

  // 6. Motion (keyframes + transition durations)
  const keyframeSet = new Set<string>();
  for (const m of cssNoComments.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/gi)) {
    keyframeSet.add(m[1].trim());
  }
  const durationSet = new Set<string>();
  for (const m of cssNoComments.matchAll(
    /(?:transition(?:-duration)?|animation-duration)\s*:\s*([^;{}]+)/gi
  )) {
    for (const d of m[1].matchAll(/\b\d+(?:\.\d+)?m?s\b/g)) {
      durationSet.add(d[0]);
    }
  }

  const stacks = Array.from(fontStackSet).slice(0, 12);
  const googleFonts = Array.from(googleFontsSet).slice(0, 12);
  const fontFaces = Array.from(fontFaceSet).slice(0, 12);

  const hasAnyFont =
    stacks.length > 0 || googleFonts.length > 0 || fontFaces.length > 0;
  const isThinExtraction = colors.length < 3 || !hasAnyFont;

  return {
    meta: { title, description, themeColor, lang },
    bodyStyle,
    cssVariables,
    colors,
    fonts: {
      stacks,
      googleFonts,
      fontFaces,
      adobeTypekit,
    },
    fontSizes: topFrequencies(fontSizeMap, 12),
    fontWeights: topFrequencies(fontWeightMap, 8),
    lineHeights: topFrequencies(lineHeightMap, 8),
    letterSpacings: topFrequencies(letterSpacingMap, 8),
    borderRadii: topFrequencies(radiusMap, 10),
    spacings: topFrequencies(spacingMap, 14),
    boxShadows: topFrequencies(shadowMap, 8),
    breakpoints: Array.from(breakpointSet).slice(0, 10),
    motion: {
      keyframes: Array.from(keyframeSet).slice(0, 12),
      durations: Array.from(durationSet).slice(0, 10),
    },
    isThinExtraction,
  };
}

/**
 * Serializes extracted styles within a safe token budget for LLM prompts.
 */
export function serializeExtractedStylesForPrompt(
  extracted: ExtractedStyles,
  maxChars = 8000
): string {
  const json = JSON.stringify(extracted, null, 2);
  if (json.length <= maxChars) return json;

  const trimmed: ExtractedStyles = {
    ...extracted,
    cssVariables: extracted.cssVariables.slice(0, 25),
    spacings: extracted.spacings.slice(0, 8),
    boxShadows: extracted.boxShadows.slice(0, 4),
    fonts: {
      ...extracted.fonts,
      stacks: extracted.fonts.stacks.slice(0, 6),
    },
  };

  return JSON.stringify(trimmed, null, 2).slice(0, maxChars);
}
