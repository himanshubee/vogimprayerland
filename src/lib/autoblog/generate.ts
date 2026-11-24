import topicFile from "../../../content/autoblog-topics.json";
import { MINISTRY } from "@/lib/ministry";
import { AUTHOR } from "@/lib/authors";
import { analyzeSeo } from "@/lib/seo-analysis";
import { cleanPostContent } from "@/lib/clean-content";
import { createPost, findSimilarPosts, getPostById, getPostBySlug, slugify, updatePost, type Post, type SimilarPost } from "@/lib/posts";
import { revalidatePostCaches } from "@/lib/revalidate";
import { REDIRECTED_SLUGS } from "@/lib/legacy-redirects";
import { sanitiseArticleHtml } from "./sanitize";
import { completeJson, generateImage } from "./openrouter";
import { altWithKeyword, insertFigure, keywordUses, linkFirstScripture } from "./seo-fixes";

export type Topic = { id: string; topic: string; focusKeyword: string; angle: string; category: string };

export const BUILT_IN_TOPICS: Topic[] = topicFile.topics;

/**
 * A topic is refused when an existing article already covers most of its
 * subject words. Writing it anyway would put two pages up for one search,
 * which is the cannibalisation the November 2026 clean-up just removed.
 */
const DUPLICATE_COVERAGE = 0.75;

// Pages a generated article may link to besides other articles.
const SERVICE_PAGES = [
  { href: "/prayer-request/", label: "Send a prayer request" },
  { href: "/deliverance-request/", label: "Request deliverance prayer" },
  { href: "/healing-request/", label: "Send a healing request" },
  { href: "/online-deliverance/", label: "Online deliverance services" },
  { href: "/dream-interpretation/", label: "Dream interpretation" },
  { href: "/marital-settlement/", label: "Marital settlement ministry" },
  { href: "/services/", label: "Service times and Zoom details" },
];

type Draft = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  excerpt: string;
  focusKeyword: string;
  keywords: string;
  html: string;
  imagePrompt: string;
  imageAlt: string;
};

export type GenerateResult =
  | { status: "draft" | "published"; topic: string; postId: string; slug: string; title: string; image: boolean; imageNote: string; seoScore: number; failing: string[]; model: string }
  | { status: "skipped"; topic: string; reason: string; similar?: string };

export type DryRunResult = { topic: Topic; draft: Draft; model: string; image: string; seoScore: number; failing: string[]; links: string[] };

/** Turn a free-typed admin topic into the same shape as a built-in one. */
export function topicFromText(text: string): Topic {
  const t = text.trim();
  return { id: `queue:${t}`, topic: t, focusKeyword: t.toLowerCase().replace(/[^a-z0-9' ]/g, "").trim(), angle: "", category: "Prayer" };
}

/** Is there already an article on this subject? */
export async function existingCoverage(topic: Topic): Promise<SimilarPost | null> {
  const [best] = await findSimilarPosts(topic.focusKeyword, { limit: 1 });
  return best && best.coverage >= DUPLICATE_COVERAGE ? best : null;
}

function systemPrompt(): string {
  const services = MINISTRY.services.map((s) => `${s.name}: ${s.day} ${s.displayTime} (${s.mode})`).join("; ");
  return `You write articles for ${MINISTRY.name} (${MINISTRY.alternateName}), ${MINISTRY.description}. Founder: ${MINISTRY.founder.name}, ${MINISTRY.founder.role}. Services: ${services}. Prayer, deliverance and counselling are free.

Audience: Christians, mostly in Nigeria, the UK, the US and across Africa, often searching in a moment of need. Voice: warm, pastoral, confident in Scripture, plain English, never sensational.

WHAT MAKES THE ARTICLE WORTH RANKING
- Answer the reader's real question better than anything else they could find. Every section must teach, explain or help them pray. No filler, no padding, no repeating the same point.
- Write for people, not search engines. Never mention SEO, keywords, Google, rankings, snippets, schema or "this article targets".

STRUCTURE (answer engines and AI search quote pages built like this)
1. First paragraph: a direct 40-60 word answer to the main question, containing the focus keyword naturally.
2. A short "In short" bullet list of 3-5 key takeaways right after it.
3. 4-7 H2 sections. Phrase most H2s as the questions people actually ask. Start each section with a one- or two-sentence direct answer, then expand.
4. Use numbered steps, bullet lists and, where it genuinely helps, one simple table.
5. Define terms explicitly ("A soul tie is ...").
6. A section of prayers the reader can pray aloud, when the topic suits it.
7. A final H2 with id="faq" titled "Questions people ask", containing 4-6 H3 questions, each answered in one 40-80 word paragraph.
8. End with one short paragraph inviting the reader to send a prayer request or join a service, linking to one of the service pages provided.
Length: 1,400-2,200 words.

SCRIPTURE
- Quote only the King James Version, word for word, with the reference (e.g. "Psalm 91:1"). If you are not certain of the exact KJV wording, give the reference and paraphrase without quotation marks. Never invent or merge verses.

TRUTHFULNESS AND CARE
- Do not invent testimonies, people, quotes, statistics, dates, studies, numbers of people helped, or anything about the ministry beyond the facts above.
- Make no promise of guaranteed results, no time-limited promises, and no claims of reply times.
- For health, pregnancy, mental-health, addiction or legal topics, say plainly that prayer goes alongside, never instead of, a doctor, counsellor or lawyer.
- Do not frighten readers or describe demonic activity graphically. Do not condemn other churches or faiths.

SEARCH BASICS (each is checked automatically after you write)
- Use the exact focus keyword phrase, word for word, in: the first sentence; at least one H2; and through the body, about once every 130 words (for 1,500 words, 10-13 times in total). Never more than twice in one paragraph.
- Every use must read as a natural sentence. Build the phrase into sentences ("Many believers ask how to break soul ties after..."), never bolt it onto the front of one ("Break soul ties is...").
- "seoTitle" must contain the exact focus keyword within its first 40 characters, contain a number that is true of the article (for example the number of prayers, steps or verses it gives), and be 40-60 characters.
- "metaDescription" must contain the exact focus keyword and be 130-155 characters.

LINKS
- Include 3-6 internal links, only to URLs from the list you are given, with descriptive anchor text (never "click here"). Link where it genuinely helps.
- No external links (a link to the main Bible verse is added automatically).

HTML
- Use only: p, h2, h3, ul, ol, li, strong, em, blockquote, a, table, thead, tbody, tr, th, td. Give each h2 a short kebab-case id. No h1 (the page supplies it), no inline styles, no classes, no images.

OUTPUT: a single JSON object with exactly these string fields:
"title" (the H1, 50-65 characters, contains the focus keyword),
"seoTitle" (40-60 characters, focus keyword within the first 40 characters, contains a number, no site name),
"metaDescription" (130-155 characters, contains the focus keyword, says what the reader gets),
"slug" (3-6 lowercase words joined by hyphens, contains the focus keyword's main words),
"excerpt" (one sentence, at most 160 characters),
"focusKeyword", "keywords" (5-8 related phrases, comma-separated),
"html" (the article body),
"imagePrompt" (an English prompt for a featured image: reverent, warm natural light, photographic or soft painterly style, 16:9, symbolic of the topic; no text, no letters, no logos, no recognisable real people, no demons, no blood or gore, nothing frightening),
"imageAlt" (8-14 words describing the image for screen readers).`;
}

function userPrompt(topic: Topic, links: { href: string; label: string }[]): string {
  return `Write the article.

Topic: ${topic.topic}
Focus keyword: ${topic.focusKeyword}
${topic.angle ? `What makes it useful: ${topic.angle}\n` : ""}Category: ${topic.category}

Internal links you may use (use only these URLs):
${links.map((l) => `- ${l.href} : ${l.label}`).join("\n")}`;
}

/* ---------------- Image ---------------- */

const UPLOAD_URL = process.env.S3_UPLOAD_URL || "https://s3upload.vogimprayerland.org/upload";

type Uploaded = { url: string; width?: number; height?: number; source: string };

async function dimensions(bytes: Buffer): Promise<{ width?: number; height?: number }> {
  try {
    const sharp = (await import("sharp")).default;
    const { width, height } = await sharp(bytes).metadata();
    return { width, height };
  } catch {
    return {};
  }
}

/**
 * Generate and upload a featured image. Never throws: an article without an
 * image is still worth saving, and the reason is returned for the run log.
 */
async function makeImage(prompt: string, slug: string): Promise<Uploaded | { error: string }> {
  const key = process.env.S3_UPLOAD_KEY;
  if (!key) return { error: "S3_UPLOAD_KEY is not set on the server" };
  let image;
  try {
    image = await generateImage(prompt);
  } catch (err) {
    return { error: `image generation failed: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!image) return { error: "the image service returned no picture" };

  const ext = image.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(image.bytes)], { type: image.type }), `${slug}.${ext}`);
  try {
    const res = await fetch(UPLOAD_URL, { method: "POST", headers: { "x-api-key": key }, body: fd, signal: AbortSignal.timeout(60_000) });
    const data = (await res.json().catch(() => ({}))) as { webpUrl?: string; publicUrl?: string; error?: string };
    const url = data.webpUrl || data.publicUrl;
    if (!res.ok || !url) return { error: `image upload failed: ${data.error || `HTTP ${res.status}`}` };
    return { url, ...(await dimensions(image.bytes)), source: image.source };
  } catch (err) {
    return { error: `image upload failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/* ---------------- SEO pass ---------------- */

type Optimisable = { title: string; seoTitle: string; metaDescription: string; slug: string; focusKeyword: string; html: string };

function report(d: Optimisable, hasImage: boolean) {
  return analyzeSeo({
    focusKeyword: d.focusKeyword,
    seoTitle: d.seoTitle,
    metaDescription: d.metaDescription,
    slug: d.slug,
    contentHtml: d.html,
    hasImage,
  });
}

// Checks the writing model can fix by rewriting; the rest are fixed in code.
const TEXT_CHECKS = new Set(["kw-title", "kw-meta", "kw-intro", "kw-content", "length", "kw-subheading", "density", "kw-title-start", "title-length", "title-number", "meta-length", "has-subheadings", "links-internal"]);

function revisionNotes(d: Optimisable, failing: { id: string; label: string; hint: string }[]): string[] {
  const { uses, words } = keywordUses(d.html, d.focusKeyword);
  const lo = Math.ceil(words * 0.006);
  return failing.map((c) => {
    switch (c.id) {
      case "density": {
        const target = Math.max(lo + 2, Math.round(words * 0.01));
        return uses < lo
          ? `The exact phrase "${d.focusKeyword}" appears only ${uses} times in ${words} words. Add it ${target - uses} more times, word for word, so it appears ${target} times in total: for example in one or two FAQ questions, in a few section opening sentences, and in the closing paragraph. Do not change its wording, and build it into natural sentences rather than starting sentences with the bare phrase.`
          : `The exact phrase "${d.focusKeyword}" appears ${uses} times in ${words} words, which is too often. Reduce it to about ${target} by using natural variations elsewhere.`;
      }
      case "kw-intro":
        return `Put the exact phrase "${d.focusKeyword}" in the first sentence.`;
      case "kw-subheading":
        return `Use the exact phrase "${d.focusKeyword}" in at least one H2.`;
      case "kw-title":
      case "kw-title-start":
        return `seoTitle must contain "${d.focusKeyword}" within its first 40 characters.`;
      case "title-number":
        return "seoTitle must contain a number that is true of the article (how many prayers, steps or verses it gives).";
      case "title-length":
        return `seoTitle is ${d.seoTitle.length} characters; make it 40-60.`;
      case "meta-length":
        return `metaDescription is ${d.metaDescription.length} characters; make it 130-155.`;
      case "kw-meta":
        return `metaDescription must contain "${d.focusKeyword}".`;
      default:
        return `${c.label}: ${c.hint}`;
    }
  });
}

/**
 * Score the article with the same checks as the post editor, fix what code
 * can fix, and send the rest back to the writer once or twice with the exact
 * failing checks. Mutates and returns `d`.
 */
async function optimise(
  d: Optimisable,
  opts: { allowed: Set<string>; image: Uploaded | null; imageAlt: string; slugLocked: boolean; allowRewrite?: boolean }
): Promise<{ score: number; failing: string[] }> {
  const applyCodeFixes = () => {
    d.focusKeyword = d.focusKeyword.toLowerCase().replace(/\s+/g, " ").trim();
    if (!opts.slugLocked) d.slug = slugify(d.focusKeyword).slice(0, 75);
    d.html = linkFirstScripture(d.html);
    if (opts.image) {
      d.html = insertFigure(d.html, {
        src: opts.image.url,
        alt: altWithKeyword(opts.imageAlt, d.focusKeyword),
        width: opts.image.width,
        height: opts.image.height,
      });
    }
  };

  applyCodeFixes();
  for (let round = 0; round < (opts.allowRewrite === false ? 0 : 3); round++) {
    const failing = report(d, Boolean(opts.image)).checks.filter((c) => c.status !== "good" && TEXT_CHECKS.has(c.id));
    if (failing.length === 0) break;
    try {
      const { data } = await completeJson<{ seoTitle: string; metaDescription: string; html: string }>([
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: `Revise this article. Change only what is needed to fix these points, keep everything else (wording, scripture, links, structure) as it is, and keep the same length or longer:\n- ${revisionNotes(d, failing).join("\n- ")}\n\nReturn a JSON object with "seoTitle", "metaDescription" and "html".\n\nCurrent seoTitle: ${d.seoTitle}\nCurrent metaDescription: ${d.metaDescription}\nCurrent html:\n${d.html.replace(/<figure data-featured>[\s\S]*?<\/figure>\s*/i, "")}`,
        },
      ]);
      if (typeof data.html === "string" && data.html.length > d.html.length * 0.8) {
        d.html = cleanPostContent(sanitiseArticleHtml(data.html, opts.allowed));
      }
      if (typeof data.seoTitle === "string" && data.seoTitle.trim()) d.seoTitle = data.seoTitle.trim().slice(0, 70);
      if (typeof data.metaDescription === "string" && data.metaDescription.trim()) d.metaDescription = data.metaDescription.trim().slice(0, 170);
    } catch (err) {
      console.warn("[autoblog] SEO revision failed:", err instanceof Error ? err.message : err);
      break;
    }
    applyCodeFixes();
  }

  const final = report(d, Boolean(opts.image));
  return { score: final.score, failing: final.checks.filter((c) => c.status !== "good").map((c) => c.label) };
}

/* ---------------- Pipeline ---------------- */

async function linkTargets(subject: string, exclude: string[] = []) {
  const similar = await findSimilarPosts(subject, { limit: 12, exclude });
  const links = [...similar.map((p) => ({ href: `/${p.slug}/`, label: p.title })), ...SERVICE_PAGES];
  return { links, allowed: new Set(links.map((l) => l.href)) };
}

async function writeDraft(topic: Topic) {
  const { links, allowed } = await linkTargets(`${topic.topic} ${topic.focusKeyword}`);

  const { data: draft, model } = await completeJson<Draft>([
    { role: "system", content: systemPrompt() },
    { role: "user", content: userPrompt(topic, links) },
  ]);
  for (const k of ["title", "seoTitle", "metaDescription", "html"] as const) {
    if (typeof draft[k] !== "string" || !draft[k].trim()) throw new Error(`The writing model left out "${k}"`);
  }

  draft.html = cleanPostContent(sanitiseArticleHtml(draft.html, allowed));
  // Built-in topics carry a researched keyword; typed topics use the writer's.
  draft.focusKeyword = (topic.id.startsWith("queue:") ? String(draft.focusKeyword || topic.focusKeyword) : topic.focusKeyword).toLowerCase();
  draft.slug = slugify(draft.focusKeyword).slice(0, 75);
  draft.seoTitle = draft.seoTitle.trim().slice(0, 70);
  draft.metaDescription = draft.metaDescription.trim().slice(0, 170);
  draft.excerpt = String(draft.excerpt || draft.metaDescription).slice(0, 200);
  draft.imagePrompt = String(draft.imagePrompt || `A reverent, warmly lit photograph symbolising ${topic.topic}. No text, no people.`);
  draft.imageAlt = String(draft.imageAlt || topic.topic);

  const words = draft.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 900) throw new Error(`The article came back too short (${words} words)`);

  return { draft, model, allowed };
}

/** Write one article and return it without saving anything (no image upload). */
export async function dryRun(topic: Topic): Promise<DryRunResult> {
  const { draft, model, allowed } = await writeDraft(topic);
  const fakeImage: Uploaded = { url: "https://img.vogimprayerland.org/preview.webp", width: 1600, height: 819, source: "preview" };
  const { score, failing } = await optimise(draft, { allowed, image: fakeImage, imageAlt: draft.imageAlt, slugLocked: false });
  const links = [...draft.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  return { topic, draft, model, image: "not generated in a dry run", seoScore: score, failing, links };
}

/** Write, illustrate, optimise and save one article for `topic`. */
export async function generateArticle(topic: Topic, publish: boolean): Promise<GenerateResult> {
  const covered = await existingCoverage(topic);
  if (covered) return { status: "skipped", topic: topic.id, reason: "The site already has an article on this", similar: covered.slug };

  const { draft, model, allowed } = await writeDraft(topic);

  // A slug that is taken or redirected would make createPost append "-2",
  // which is how the old duplicates were born.
  if (REDIRECTED_SLUGS.has(draft.slug) || (await getPostBySlug(draft.slug))) {
    return { status: "skipped", topic: topic.id, reason: `An article already exists at /${draft.slug}/`, similar: draft.slug };
  }

  const made = await makeImage(draft.imagePrompt, draft.slug);
  const image = "url" in made ? made : null;
  const imageNote = "url" in made ? `image: ${made.source}` : `no image (${made.error})`;
  if (!image) console.warn(`[autoblog] ${imageNote}`);

  const { score, failing } = await optimise(draft, { allowed, image, imageAlt: draft.imageAlt, slugLocked: false });

  const post = await createPost({
    type: "post",
    slug: draft.slug,
    title: draft.title,
    content: draft.html,
    excerpt: draft.excerpt,
    status: publish ? "publish" : "draft",
    categories: [topic.category],
    featuredImage: image?.url ?? null,
    seo: {
      focusKeyword: draft.focusKeyword,
      keywords: String(draft.keywords || ""),
      title: draft.seoTitle,
      description: draft.metaDescription,
      ogTitle: draft.seoTitle,
      ogDescription: draft.metaDescription,
      ogImage: image?.url ?? null,
      score,
    },
  });
  if (publish) revalidatePostCaches(post.slug);

  console.log(`[autoblog] ${publish ? "published" : "drafted"} /${post.slug}/ (text ${model}, ${imageNote}, SEO ${score}) by ${AUTHOR.name}`);
  return { status: publish ? "published" : "draft", topic: topic.id, postId: post.id, slug: post.slug, title: post.title, image: Boolean(image), imageNote, seoScore: score, failing, model };
}

export type ImproveResult = { postId: string; slug: string; before: number; after: number; failing: string[]; imageNote: string };

/**
 * Bring an existing post up to the same standard: add a featured image if it
 * has none, put the image in the body with keyword alt text, cite the first
 * scripture, and revise the wording until the SEO checks pass. A published
 * post keeps its URL; a draft may take the keyword slug.
 */
export async function improvePost(id: string): Promise<ImproveResult> {
  const post: Post | null = await getPostById(id);
  if (!post) throw new Error("Post not found");

  const focusKeyword = (post.seo.focusKeyword || post.title).toLowerCase().replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
  const d: Optimisable = {
    title: post.title,
    seoTitle: post.seo.title || post.title,
    metaDescription: post.seo.description || post.excerpt,
    slug: post.slug,
    focusKeyword,
    html: post.content,
  };
  const before = report(d, Boolean(post.featuredImage)).score;

  let image: Uploaded | null = post.featuredImage ? { url: post.featuredImage, source: "existing" } : null;
  let imageNote = image ? "kept existing image" : "";
  if (image) Object.assign(image, await remoteDimensions(image.url));
  if (!image) {
    const made = await makeImage(
      `A reverent, warmly lit photograph or soft painterly image symbolising "${post.title}" for a Christian prayer ministry. 16:9. No text, no letters, no logos, no recognisable people, nothing frightening.`,
      post.slug
    );
    if ("url" in made) {
      image = made;
      imageNote = `image: ${made.source}`;
    } else imageNote = `no image (${made.error})`;
  }

  const { allowed } = await linkTargets(`${post.title} ${focusKeyword}`, [post.slug]);
  // Keep the links the post already has.
  for (const m of post.content.matchAll(/href="(\/[^"#?]*)"/g)) allowed.add(m[1].endsWith("/") ? m[1] : `${m[1]}/`);

  // A rewrite passes the HTML through the article sanitiser, which would strip
  // the images, embeds and formatting of an imported WordPress post. Those
  // get the code fixes only.
  const ownMedia = /<(img|iframe|video|audio|embed)\b/i.test(post.content.replace(/<figure data-featured>[\s\S]*?<\/figure>/i, ""));
  const { score, failing } = await optimise(d, {
    allowed,
    image,
    imageAlt: post.title,
    slugLocked: post.status === "publish",
    allowRewrite: !ownMedia,
  });

  const saved = await updatePost(id, {
    type: post.type,
    slug: d.slug,
    title: post.title,
    content: d.html,
    excerpt: post.excerpt,
    status: post.status,
    categories: post.categories,
    featuredImage: image?.url ?? null,
    seo: {
      ...post.seo,
      focusKeyword: d.focusKeyword,
      title: d.seoTitle,
      description: d.metaDescription,
      ogTitle: d.seoTitle,
      ogDescription: d.metaDescription,
      ogImage: image?.url ?? post.seo.ogImage,
      score,
    },
  });
  if (post.status === "publish" && saved) revalidatePostCaches(saved.slug);
  return { postId: id, slug: saved?.slug ?? d.slug, before, after: score, failing, imageNote };
}

async function remoteDimensions(url: string): Promise<{ width?: number; height?: number }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return {};
    return dimensions(Buffer.from(await res.arrayBuffer()));
  } catch {
    return {};
  }
}
