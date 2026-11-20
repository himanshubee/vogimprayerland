import pages from "../../content/owner-pages.json";
import glossary from "../../content/glossary.json";

export type OwnerPageKey = "what-we-believe" | "safeguarding" | "where-gifts-go" | "accessibility";
export type OwnerSection = { heading: string; body: string[] };
type OwnerPage = Omit<(typeof pages)[OwnerPageKey], "sections"> & { sections: OwnerSection[] };

/** An owner page is public only once someone at the ministry has approved its words. */
export function getOwnerPage(key: OwnerPageKey): OwnerPage | null {
  const page = pages[key] as unknown as OwnerPage;
  return page.approvedBy && page.approvedOn && page.sections.length > 0 ? page : null;
}

export const PUBLISHED_OWNER_PAGES = (Object.keys(pages).filter((k) => !k.startsWith("_")) as OwnerPageKey[]).filter((k) => getOwnerPage(k));

export const GLOSSARY_UPDATED = glossary.updated;
export const GLOSSARY_TERMS = glossary.terms.filter((t) => t.definition.trim() !== "").sort((a, b) => a.term.localeCompare(b.term));
/** Fewer than three terms would be a thin page, so the hub and its terms wait. */
export const GLOSSARY_PUBLISHED = GLOSSARY_TERMS.length >= 3;
