// No imports on purpose: tests load this file directly with Node.

/** Average adult silent-reading speed for non-fiction, in words a minute. */
const WORDS_PER_MINUTE = 200;

/** Words of readable text in an article's HTML (tags, scripts and styles left out). */
export function countWords(html: string): number {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, "");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/** Minutes to read, rounded up, never less than 1. */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.ceil(countWords(html) / WORDS_PER_MINUTE));
}
