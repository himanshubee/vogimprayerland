import topicFile from "../../../content/autoblog-topics.json";
import { MINISTRY } from "@/lib/ministry";
import { AUTHOR } from "@/lib/authors";
import { analyzeSeo } from "@/lib/seo-analysis";
import { cleanPostContent } from "@/lib/clean-content";
import { createPost, findSimilarPosts, getPostBySlug, slugify, type SimilarPost } from "@/lib/posts";
import { revalidatePostCaches } from "@/lib/revalidate";
import { REDIRECTED_SLUGS } from "@/lib/legacy-redirects";
import { sanitiseArticleHtml } from "./sanitize";
import { completeJson, generateImage } from "./openrouter";

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
  | { status: "draft" | "published"; topic: string; postId: string; slug: string; title: string; image: boolean; seoScore: number; model: string }
  | { status: "skipped"; topic: string; reason: string; similar?: string };

export type DryRunResult = { topic: Topic; draft: Draft; model: string; imageBytes: number | null; imageSource: string | null; seoScore: number; links: string[] };

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

LINKS
- Include 3-6 internal links, only to URLs from the list you are given, with descriptive anchor text (never "click here"). Link where it genuinely helps.
- No external links.

HTML
- Use only: p, h2, h3, ul, ol, li, strong, em, blockquote, a, table, thead, tbody, tr, th, td. Give each h2 a short kebab-case id. No h1 (the page supplies it), no inline styles, no classes, no images.

OUTPUT: a single JSON object with exactly these string fields:
"title" (the H1, 50-65 characters, contains the focus keyword),
"seoTitle" (at most 60 characters, contains the focus keyword, no site name),
"metaDescription" (140-155 characters, contains the focus keyword, says what the reader gets),
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

async function uploadImage(bytes: Buffer, type: string, slug: string): Promise<string | null> {
  const key = process.env.S3_UPLOAD_KEY;
  if (!key) return null;
  const ext = type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(bytes)], { type }), `${slug}.${ext}`);
  const res = await fetch(UPLOAD_URL, { method: "POST", headers: { "x-api-key": key }, body: fd, signal: AbortSignal.timeout(60_000) });
  const data = (await res.json().catch(() => ({}))) as { webpUrl?: string; publicUrl?: string };
  if (!res.ok) return null;
  return data.webpUrl || data.publicUrl || null;
}

/* ---------------- Pipeline ---------------- */

async function writeDraft(topic: Topic) {
  const similar = await findSimilarPosts(`${topic.topic} ${topic.focusKeyword}`, { limit: 12 });
  const links = [...similar.map((p) => ({ href: `/${p.slug}/`, label: p.title })), ...SERVICE_PAGES];
  const allowed = new Set(links.map((l) => l.href));

  const { data: draft, model } = await completeJson<Draft>([
    { role: "system", content: systemPrompt() },
    { role: "user", content: userPrompt(topic, links) },
  ]);
  for (const k of ["title", "seoTitle", "metaDescription", "slug", "html"] as const) {
    if (typeof draft[k] !== "string" || !draft[k].trim()) throw new Error(`The writing model left out "${k}"`);
  }

  draft.html = cleanPostContent(sanitiseArticleHtml(draft.html, allowed));
  draft.slug = slugify(draft.slug || draft.title).split("-").slice(0, 8).join("-");
  draft.seoTitle = draft.seoTitle.slice(0, 70);
  draft.metaDescription = draft.metaDescription.slice(0, 160);
  draft.excerpt = String(draft.excerpt || draft.metaDescription).slice(0, 200);
  draft.focusKeyword = String(draft.focusKeyword || topic.focusKeyword);

  const words = draft.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 900) throw new Error(`The article came back too short (${words} words)`);

  const usedLinks = [...draft.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  return { draft, usedLinks, model };
}

/** Write one article and return it without saving anything. For checking output before switching the schedule on. */
export async function dryRun(topic: Topic): Promise<DryRunResult> {
  const { draft, usedLinks, model } = await writeDraft(topic);
  const image = await generateImage(draft.imagePrompt).catch((err) => {
    console.warn("[autoblog] image failed:", err);
    return null;
  });
  const seoScore = analyzeSeo({
    focusKeyword: draft.focusKeyword,
    seoTitle: draft.seoTitle,
    metaDescription: draft.metaDescription,
    slug: draft.slug,
    contentHtml: draft.html,
    hasImage: Boolean(image),
  }).score;
  return { topic, draft, model, imageBytes: image ? image.bytes.length : null, imageSource: image?.source ?? null, seoScore, links: usedLinks };
}

/** Write, illustrate and save one article for `topic`. */
export async function generateArticle(topic: Topic, publish: boolean): Promise<GenerateResult> {
  const covered = await existingCoverage(topic);
  if (covered) return { status: "skipped", topic: topic.id, reason: "The site already has an article on this", similar: covered.slug };

  const { draft, model } = await writeDraft(topic);

  // The model may still pick a slug that is taken or redirected; createPost
  // would then append "-2", which is how the old duplicates were born.
  if (REDIRECTED_SLUGS.has(draft.slug) || (await getPostBySlug(draft.slug))) {
    return { status: "skipped", topic: topic.id, reason: `An article already exists at /${draft.slug}/`, similar: draft.slug };
  }

  let featuredImage: string | null = null;
  let imageSource = "none";
  try {
    const image = await generateImage(draft.imagePrompt);
    if (image) {
      featuredImage = await uploadImage(image.bytes, image.type, draft.slug);
      if (featuredImage) imageSource = image.source;
    }
  } catch (err) {
    console.error("[autoblog] image failed:", err);
  }

  const seo = {
    focusKeyword: draft.focusKeyword,
    keywords: String(draft.keywords || ""),
    title: draft.seoTitle,
    description: draft.metaDescription,
    ogTitle: draft.seoTitle,
    ogDescription: draft.metaDescription,
    ogImage: featuredImage,
    score: 0,
  };
  seo.score = analyzeSeo({
    focusKeyword: seo.focusKeyword,
    seoTitle: seo.title,
    metaDescription: seo.description,
    slug: draft.slug,
    contentHtml: draft.html,
    hasImage: Boolean(featuredImage),
  }).score;

  const post = await createPost({
    type: "post",
    slug: draft.slug,
    title: draft.title,
    content: draft.html,
    excerpt: draft.excerpt,
    status: publish ? "publish" : "draft",
    categories: [topic.category],
    featuredImage,
    seo,
  });
  if (publish) revalidatePostCaches(post.slug);

  console.log(`[autoblog] ${publish ? "published" : "drafted"} /${post.slug}/ (text ${model}, image ${imageSource}) by ${AUTHOR.name}`);
  return {
    status: publish ? "published" : "draft",
    topic: topic.id,
    postId: post.id,
    slug: post.slug,
    title: post.title,
    image: Boolean(featuredImage),
    seoScore: seo.score,
    model,
  };
}
