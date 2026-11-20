import data from "../../content/faq.json";

export type FaqCategory = (typeof data.categories)[number];
export type FaqQuestion = (typeof data.questions)[number];

export const FAQ_UPDATED = data.updated;

/** Only answered, ministry-approved entries are public. Owner-supplied entries render once leadership fills them in. */
export const PUBLISHED_QUESTIONS = data.questions.filter((q) => q.short_answer.trim() !== "");

export const FAQ_CATEGORIES = data.categories
  .map((c) => ({ ...c, questions: PUBLISHED_QUESTIONS.filter((q) => q.category === c.slug) }))
  .filter((c) => c.questions.length > 0);

export function getCategory(slug: string) {
  return FAQ_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getQuestion(category: string, slug: string) {
  return PUBLISHED_QUESTIONS.find((q) => q.category === category && q.slug === slug) ?? null;
}

export const faqHref = (q: Pick<FaqQuestion, "category" | "slug">) => `/faq/${q.category}/${q.slug}/`;

/** Same category first, then questions that share a related page. */
export function relatedQuestions(question: FaqQuestion, limit = 5) {
  const others = PUBLISHED_QUESTIONS.filter((q) => q !== question);
  const sameCategory = others.filter((q) => q.category === question.category);
  const sharedPage = others.filter((q) => q.category !== question.category && q.related_pages.some((p) => question.related_pages.includes(p)));
  return [...sameCategory, ...sharedPage].slice(0, limit);
}

export function searchFaq(term: string) {
  const words = term.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return [];
  return PUBLISHED_QUESTIONS.map((q) => {
    const hay = `${q.question} ${q.short_answer} ${q.full_answer.join(" ")}`.toLowerCase();
    return { q, score: words.reduce((n, w) => n + (q.question.toLowerCase().includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0) };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.q);
}

/** Readable labels for the pages FAQ answers link out to. */
export const PAGE_LINK_LABELS: Record<string, string> = {
  "/about/": "About VOGIM Prayer Land",
  "/services/": "Services and Zoom",
  "/zoom/": "Join on Zoom",
  "/visit/": "Plan your visit",
  "/contact/": "Contact the ministry",
  "/how-requests-work/": "How requests work",
  "/online-deliverance/": "Online deliverance ministry",
  "/healing/": "Healing ministry",
  "/marital-settlement/": "Marital settlement ministry",
  "/dream-interpretation/": "Dream interpretation",
  "/notice/": "Official channels and scam notice",
  "/refund-policy/": "Giving and refund policy",
  "/give/": "Give",
  "/partnership/": "Partnership",
  "/store/": "Store",
  "/books/": "Books",
  "/complaints/": "Complaints",
  "/privacy-policy/": "Privacy policy",
  "/privacy-requests/": "Privacy requests",
  "/media/": "Media",
  "/prayer-request/": "Send a prayer request",
  "/healing-request/": "Send a healing request",
  "/deliverance-request/": "Request a deliverance session",
};

export const REQUEST_LABELS: Record<string, string> = {
  "/prayer-request/": "Request prayer",
  "/healing-request/": "Send a healing request",
  "/deliverance-request/": "Request a deliverance session",
  "/dream-interpretation/": "Send your dream",
  "/privacy-requests/": "Make a privacy request",
};

const DESCRIPTION_TAILS = [
  "Prayer, deliverance and counselling are free.",
  "Answers from VOGIM Prayer Land, Ikorodu, Lagos.",
  "Send a free, private request any time.",
  "Free and private.",
];

/** Fits a meta description to 140–160 characters: trims long answers at a word, tops up short ones with fixed, true lines. */
export function metaDescription(text: string) {
  let out = text.trim();
  for (const tail of DESCRIPTION_TAILS) {
    if (out.length >= 140) break;
    if (!out.includes(tail) && out.length + tail.length + 1 <= 160) out = `${out} ${tail}`;
  }
  if (out.length > 160) out = `${out.slice(0, 159).replace(/\s+\S*$/, "").replace(/[,;:]$/, "")}…`;
  return out;
}
