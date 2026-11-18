import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  extractHexAlpha,
  isDarkColor,
  isNearBlackOrWhite,
  isValidHex,
  luminance,
  normalizeHex,
  pickAccent,
  saturation,
  type Swatch,
} from "./color";

describe("lib/color", () => {
  it("validates #rgb, #rrggbb, and #rrggbbaa while rejecting malformed hexes", () => {
    expect(isValidHex("#fff")).toBe(true);
    expect(isValidHex("#0A0A09")).toBe(true);
    expect(isValidHex("#40372e80")).toBe(true);

    expect(isValidHex("#40372")).toBe(false);
    expect(isValidHex("#1234")).toBe(false);
    expect(isValidHex("#zzzzzz")).toBe(false);
    expect(isValidHex("40372e")).toBe(false);
    expect(isValidHex("")).toBe(false);
  });

  it("normalizes hex values to lowercase 6-digit hex and extracts alpha", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("#C8F23D")).toBe("#c8f23d");
    expect(normalizeHex("#0075EBCC")).toBe("#0075eb");
    expect(normalizeHex("#40372")).toBeNull();

    expect(extractHexAlpha("#0075ebff")).toBe(1);
    expect(extractHexAlpha("#0075eb80")).toBe(0.5);
    expect(extractHexAlpha("#0075eb")).toBeUndefined();
  });

  it("computes luminance, saturation, dark checks, and contrast ratios", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
    expect(isDarkColor("#0e0d0b")).toBe(true);
    expect(isDarkColor("#f8f7f4")).toBe(false);
    expect(isNearBlackOrWhite("#050505")).toBe(true);
    expect(isNearBlackOrWhite("#fafafa")).toBe(true);
    expect(isNearBlackOrWhite("#0075eb")).toBe(false);
    expect(saturation("#808080")).toBe(0);
    expect(saturation("#ff3b1f")).toBeGreaterThan(0.9);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 3);
  });

  it("picks the most saturated mid-luminance swatch as accent with fallbacks", () => {
    const swatches: Swatch[] = [
      { name: "Canvas", hex: "#0d0d0d" },
      { name: "Surface", hex: "#1b1b1b" },
      { name: "Accent", hex: "#ff5e7e" },
      { name: "Muted", hex: "#9c978f" },
      { name: "White", hex: "#ffffff" },
    ];
    expect(pickAccent(swatches)?.hex).toBe("#ff5e7e");

    // All neutral fallback -> second swatch
    const monochrome: Swatch[] = [
      { name: "Black", hex: "#000000" },
      { name: "Gray", hex: "#808080" },
      { name: "White", hex: "#ffffff" },
    ];
    expect(pickAccent(monochrome)?.hex).toBe("#808080");
    expect(pickAccent([])).toBeUndefined();
  });
});
