export interface ValidationResult {
  valid: boolean;
  missing: string[];
  present: string[];
}

interface RequiredSectionCheck {
  label: string;
  pattern: RegExp;
}

const REQUIRED_SECTIONS: readonly RequiredSectionCheck[] = [
  { label: "Title (H1)", pattern: /^#\s+.+/m },
  { label: "Overview", pattern: /^##\s+overview\b/im },
  { label: "Colors", pattern: /^##\s+(?:tokens\s+[—-]\s+)?colors?\b/im },
  {
    label: "Typography",
    pattern: /^##\s+(?:tokens\s+[—-]\s+)?typography\b/im,
  },
  { label: "Layout", pattern: /^##\s+layout\b/im },
  {
    label: "Corner radius",
    pattern: /^##\s+(?:corner|border)\s+radi(?:us|i)\b/im,
  },
  {
    label: "Surfaces and depth",
    pattern: /^##\s+(?:surfaces(?:\s+and\s+depth)?|elevation)\b/im,
  },
  { label: "Components", pattern: /^##\s+components?\b/im },
  {
    label: "Imagery and graphics",
    pattern: /^##\s+imagery(?:\s+and\s+graphics)?\b/im,
  },
  {
    label: "Section / Screen recipes",
    pattern: /^##\s+(?:section|screen)\s+recipes?\b/im,
  },
  {
    label: "Page flow",
    pattern: /^##\s+(?:page|screen|user)\s+flow\b/im,
  },
  {
    label: "Writing",
    pattern: /^##\s+(?:writing|copy|typography\s+voice|voice)\b/im,
  },
  {
    label: "Do's and Don'ts",
    pattern: /^##\s+do['’]?s\s+and\s+don['’]?ts\b/im,
  },
  {
    label: "Motion and responsive",
    pattern: /^##\s+(?:motion(?:\s+and\s+responsive)?|responsive(?:\s+and\s+motion)?)\b/im,
  },
  { label: "Quick Start", pattern: /^##\s+quick\s*start\b/im },
  {
    label: "How to use this guide",
    pattern: /^##\s+how\s+to\s+use\b/im,
  },
];

/**
 * Strips fenced code blocks before checking headings so `#` comments inside code
 * do not produce false positives.
 */
function stripCodeFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

export function validateDesignMd(markdown: string): ValidationResult {
  const cleaned = stripCodeFences(markdown);
  const missing: string[] = [];
  const present: string[] = [];

  for (const check of REQUIRED_SECTIONS) {
    if (check.pattern.test(cleaned)) {
      present.push(check.label);
    } else {
      missing.push(check.label);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}
