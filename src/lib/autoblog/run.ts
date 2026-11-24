import { BUILT_IN_TOPICS, generateArticle, topicFromText, type GenerateResult, type Topic } from "./generate";
import { getAutoblogSettings, isDue, markRun, recordRun, usedTopics } from "./settings";

export type RunOutcome = { ran: false; reason: string } | { ran: true; results: GenerateResult[] };

// A run gives up after this many skipped or failed topics, so a bad list
// cannot burn through API credit.
const MAX_ATTEMPTS = 6;

/** The next topics to try: the admin's queue first, then built-in ones not yet used. */
async function nextTopics(queue: string[]): Promise<Topic[]> {
  const used = await usedTopics();
  return [
    ...queue.map(topicFromText),
    ...BUILT_IN_TOPICS.filter((t) => !used.has(t.id)),
  ];
}

let running = false;

/**
 * One scheduled tick. The cron calls this every day; it only writes when the
 * chosen frequency says a run is due, so one daily cron serves every setting
 * from daily to monthly. `force` runs now regardless (the admin's button).
 */
export async function runAutoblog({ force = false } = {}): Promise<RunOutcome> {
  const settings = await getAutoblogSettings();
  if (!force && !settings.enabled) return { ran: false, reason: "Auto-blog is switched off" };
  if (!force && !isDue(settings)) return { ran: false, reason: "Not due yet" };
  if (running) return { ran: false, reason: "A run is already in progress" };

  running = true;
  const startedAt = new Date();
  const results: GenerateResult[] = [];
  const consumed: string[] = [];
  try {
    const topics = await nextTopics(settings.topicQueue);
    if (topics.length === 0) return { ran: false, reason: "No topics left: add some in Admin > Auto-blog" };

    let produced = 0;
    let attempts = 0;
    for (const topic of topics) {
      if (produced >= settings.postsPerRun || attempts >= MAX_ATTEMPTS) break;
      attempts++;
      if (topic.id.startsWith("queue:")) consumed.push(topic.topic);
      try {
        const result = await generateArticle(topic, settings.autoPublish);
        results.push(result);
        await recordRun({
          at: new Date().toISOString(),
          topic: topic.id,
          status: result.status,
          postId: result.status === "skipped" ? null : result.postId,
          slug: result.status === "skipped" ? result.similar ?? null : result.slug,
          title: result.status === "skipped" ? topic.topic : result.title,
          detail:
            result.status === "skipped"
              ? result.reason
              : [`SEO ${result.seoScore}%`, result.model, result.imageNote, result.failing.length ? `still failing: ${result.failing.join("; ")}` : ""]
                  .filter(Boolean)
                  .join(" · "),
        });
        if (result.status !== "skipped") produced++;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error(`[autoblog] ${topic.id} failed:`, detail);
        await recordRun({ at: new Date().toISOString(), topic: topic.id, status: "failed", postId: null, slug: null, title: topic.topic, detail });
      }
    }
    return { ran: true, results };
  } finally {
    await markRun(startedAt, consumed).catch(() => undefined);
    running = false;
  }
}
