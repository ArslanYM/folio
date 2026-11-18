/**
 * Builds the ready-to-paste "build a landing page" prompt from any DESIGN.md.
 * Omits references to Section recipes if the source spec does not contain one (e.g. Format A).
 */
export function buildLandingPagePrompt(
  designMd: string,
  hasSectionRecipes?: boolean
): string {
  const detectedSectionRecipes =
    hasSectionRecipes ??
    /^##\s+(?:section|screen)\s+recipes?\b/im.test(designMd);

  const hasEssentials = /^###?\s+essentials\b/im.test(designMd);
  const hasPageFlow = /^##\s+page\s+flow\b/im.test(designMd);
  const hasWriting = /^##\s+(?:writing|typography\s+voice)\b/im.test(designMd);

  const referencedSections: string[] = [];
  if (hasEssentials) referencedSections.push("Essentials");
  if (detectedSectionRecipes) referencedSections.push("Section recipes");
  if (hasPageFlow) referencedSections.push("Page flow");
  referencedSections.push("Do's and Don'ts");
  if (hasWriting) referencedSections.push("Writing");

  const sectionList =
    referencedSections.length > 1
      ? `${referencedSections.slice(0, -1).join(", ")} and ${referencedSections[referencedSections.length - 1]}`
      : referencedSections[0];

  const instruction = [
    "Build a responsive marketing landing page using the design system above.",
    `Follow the ${sectionList} sections exactly. Use the exact tokens (colors, type scale, radii, spacing).`,
    "Do not copy any brand names, logos, artwork or claims. Write new copy for the",
    "product I describe below. Use [Next.js + Tailwind] unless told otherwise.",
    "Render at desktop and mobile widths and compare against the Don'ts before finishing.",
    "",
    "Product: <ask the user to fill this in>",
  ].join("\n");

  return `${designMd.trim()}\n\n---\n\n${instruction}`;
}
