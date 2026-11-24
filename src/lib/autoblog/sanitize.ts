// No imports on purpose: tests load this file directly with Node.

const ALLOWED_TAGS = new Set(["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "blockquote", "a", "table", "thead", "tbody", "tr", "th", "td", "br"]);

/**
 * Keep only the allowed tags and attributes, and only links to pages that
 * exist. Model output is untrusted HTML that ends up on the public site.
 */
export function sanitiseArticleHtml(html: string, allowedHrefs: Set<string>): string {
  let out = html.replace(/<(script|style|iframe|object|embed|form|svg|math)[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (name === "h1") return tag.startsWith("</") ? "</h2>" : "<h2>";
    if (!ALLOWED_TAGS.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name === "a") {
      const href = attrs.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
      const path = href.replace(/^https?:\/\/(www\.)?vogimprayerland\.org/i, "").replace(/#.*$/, "");
      const norm = path.endsWith("/") ? path : `${path}/`;
      return allowedHrefs.has(norm) ? `<a href="${norm}">` : "<a>";
    }
    if (name === "h2" || name === "h3") {
      const id = attrs.match(/id\s*=\s*["']([a-z0-9-]{1,60})["']/i)?.[1];
      return id ? `<${name} id="${id.toLowerCase()}">` : `<${name}>`;
    }
    return `<${name}>`;
  });
  // Unwrap links whose target was refused.
  out = out.replace(/<a>([\s\S]*?)<\/a>/gi, "$1");
  return out.trim();
}
