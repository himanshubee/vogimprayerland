// No imports on purpose: tests load this file directly with Node.
//
// Fixes applied in code rather than left to the writing model, because they
// must hold every time: the article image and its alt text, and an
// authoritative outbound link for the scripture it quotes.

const BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "Samuel", "Kings", "Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms?", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "Thessalonians", "Timothy", "Titus", "Philemon", "Hebrews",
  "James", "Peter", "Jude", "Revelation",
].join("|");

const REFERENCE = new RegExp(`\\b((?:[1-3] )?(?:${BOOKS}) \\d{1,3}:\\d{1,3}(?:[-–]\\d{1,3})?)\\b`, "g");

/** Is `index` inside a tag, a link, or a heading of `html`? */
function unsafeSpot(html: string, index: number): boolean {
  const before = html.slice(0, index);
  if (before.lastIndexOf("<") > before.lastIndexOf(">")) return true;
  const openA = before.lastIndexOf("<a");
  if (openA > before.lastIndexOf("</a>")) return true;
  const openH = before.search(/<h[1-6][^>]*>(?![\s\S]*<\/h[1-6]>)/i);
  return openH >= 0;
}

export function bibleGatewayUrl(reference: string): string {
  const ref = reference.replace(/–/g, "-");
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;
}

/**
 * Link the first scripture reference in body text to its KJV text on Bible
 * Gateway. Readers can check the verse, and the article cites its source,
 * which is what search engines and AI answer engines look for.
 * Leaves the HTML alone if it already links out.
 */
export function linkFirstScripture(html: string): string {
  if (/<a\s[^>]*href="https?:\/\//i.test(html)) return html;
  for (const m of html.matchAll(REFERENCE)) {
    const at = m.index ?? 0;
    if (unsafeSpot(html, at)) continue;
    const ref = m[1];
    const link = `<a href="${bibleGatewayUrl(ref)}" rel="noopener" target="_blank">${ref}</a>`;
    return html.slice(0, at) + link + html.slice(at + ref.length);
  }
  return html;
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Alt text that describes the picture and names the subject. */
export function altWithKeyword(alt: string, keyword: string): string {
  const clean = alt.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (clean.toLowerCase().includes(keyword.toLowerCase())) return clean;
  const lead = keyword.charAt(0).toUpperCase() + keyword.slice(1);
  return clean ? `${lead}: ${clean.charAt(0).toLowerCase()}${clean.slice(1)}` : lead;
}

/**
 * Put the featured image in the article body after the opening answer, with
 * descriptive alt text and its dimensions (so it does not shift the layout).
 * Replaces an image this function inserted before; leaves other images alone.
 */
export function insertFigure(html: string, img: { src: string; alt: string; width?: number; height?: number }): string {
  const without = html.replace(/<figure data-featured>[\s\S]*?<\/figure>\s*/i, "");
  const size = img.width && img.height ? ` width="${img.width}" height="${img.height}"` : "";
  const figure = `<figure data-featured><img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}"${size} loading="lazy" decoding="async" /></figure>`;
  const firstP = without.search(/<\/p>/i);
  if (firstP < 0) return figure + without;
  const at = firstP + 4;
  return `${without.slice(0, at)}\n${figure}\n${without.slice(at)}`;
}

/** Count exact, case-insensitive uses of the keyword in the article's text. */
export function keywordUses(html: string, keyword: string): { uses: number; words: number } {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const kw = keyword.toLowerCase().trim();
  const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { uses: kw ? (text.match(new RegExp(esc, "g")) || []).length : 0, words: text ? text.split(" ").length : 0 };
}
