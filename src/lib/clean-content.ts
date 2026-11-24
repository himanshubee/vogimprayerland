/**
 * Strip writing-process residue out of imported post HTML before it is served.
 *
 * Several WordPress posts were drafted with AI tools and published with the
 * brief still in them: "The focus keyword ... will appear 30 times, as
 * requested", "Targets 'deliverance from spirit spouse' 1.9k/mo. Table format
 * wins featured snippet", whole "How We Optimize This Ministry for Search"
 * accordions, "Google E-E-A-T: this outranks GotQuestions". Readers see it, and
 * so does Google: text written about ranking rather than for the reader is
 * exactly what its helpful-content and spam systems look for, and it counts
 * against the whole site, not just the page.
 *
 * Cleaning at render time fixes every post at once, including any re-import,
 * without touching what is stored. Patterns are deliberately narrow: each one
 * matches SEO/prompt vocabulary that never belongs in a sermon or prayer.
 */

// Words that only ever appear in notes about search ranking or prompt briefs.
const SEO_NOTE =
  /focus keyword|featured snippet|E-E-A-T|RankMath|Rank Math|Yoast|\b\d+(?:\.\d+)?k\/mo\b|keyword (?:mission|density|strategy)|search intent|as requested\.|Bing \+ Google rank|outranks GotQuestions/i;

const SEO_SECTION = /optimi[sz]e|\bsearch(?:es)?\b|Google|schema|AI Overviews|\bPAA\b/i;

const BLOCK_TAGS = "p|li|tr|h[1-6]";

export function cleanPostContent(html: string): string {
  if (!html) return html;
  let out = html;

  // 1. The "seo-transparency" accordions. Some hold a genuine ministry note
  //    (the 3AM watch, a testimony), so a section goes only when it talks
  //    about search itself: optimising, Google, schema, AI Overviews.
  out = out.replace(
    /<section[^>]*class="[^"]*seo-transparency[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
    (section) => (SEO_SECTION.test(section.replace(/<[^>]+>/g, " ")) ? "" : section)
  );

  // 2. HTML comments left by page builders and prompt templates
  //    ("<!-- HOW TO SUBMIT SECTION WITH H2 FOR FEATURED SNIPPET -->").
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  // 3. Any single paragraph, list item, table row or heading whose text is an
  //    SEO note. Matched element by element so surrounding content is kept.
  out = out.replace(
    new RegExp(`<(${BLOCK_TAGS})\\b[^>]*>((?:(?!<\\/?\\1\\b)[\\s\\S])*?)<\\/\\1>`, "gi"),
    (whole, _tag, inner: string) => (SEO_NOTE.test(inner.replace(/<[^>]+>/g, " ")) ? "" : whole)
  );

  //    One note was split across two paragraphs; drop its orphaned tail.
  out = out.replace(/<p[^>]*>God(?:&rsquo;|’|')s Word for their healing\.<\/p>/gi, "");

  // 4. A <details> whose only remaining job was to hide such a note.
  out = out.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<\/details>/gi, "<p>$1</p>");

  // 5. Leftover WPBakery shortcodes ([vc_row], [/vc_column_text] ...).
  out = out.replace(/\[\/?vc_[a-z_]+[^\]]*\]/gi, "");

  // 6. Paragraphs emptied by the steps above.
  out = out.replace(/<p[^>]*>(?:\s|&nbsp;)*<\/p>/gi, "");

  return out;
}
