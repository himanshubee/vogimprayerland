import { SITE_NAME, SITE_URL } from "@/lib/ministry";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Writing models, tried in order until one answers. Free (":free") models
 * cost nothing but are rate-limited and come and go, so a list is safer than
 * one id. Set OPENROUTER_TEXT_MODEL (comma-separated) to change it, e.g.
 * "anthropic/claude-sonnet-5.5" for paid, higher-quality writing.
 */
export const TEXT_MODELS = (
  process.env.OPENROUTER_TEXT_MODEL ||
  "nvidia/nemotron-3-ultra-550b-a55b:free,google/gemma-4-31b-it:free,nvidia/nemotron-3.5-super-vl:free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/**
 * Where featured images come from.
 *   "pollinations" (default): free, no key, no account.
 *   "openrouter": OPENROUTER_IMAGE_MODEL, paid; needs $1+ credit on the account.
 *   "none": no images.
 */
export const IMAGE_PROVIDER = (process.env.AUTOBLOG_IMAGE_PROVIDER || "pollinations").toLowerCase();
export const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-3.1-flash-image";

export function openrouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

type Message = { role: "system" | "user" | "assistant"; content: string };

class OpenRouterError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call(body: Record<string, unknown>, timeoutMs: number) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new OpenRouterError(`OpenRouter (${body.model}): ${msg}`, res.ok ? 502 : res.status);
  }
  return data;
}

/** Pull the JSON object out of a reply that may carry reasoning or a code fence. */
function parseJsonReply(text: string): unknown {
  const body = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * One chat completion that must return a JSON object. Tries each model in
 * TEXT_MODELS in turn; a busy free model (429), an outage or an unreadable
 * answer moves on to the next.
 */
export async function completeJson<T>(messages: Message[], maxTokens = 12000): Promise<{ data: T; model: string }> {
  const errors: string[] = [];
  for (const model of TEXT_MODELS) {
    try {
      const body = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.6,
        response_format: { type: "json_object" },
        // Reasoning models otherwise spend the whole budget thinking and
        // return an empty answer (seen with Nemotron: 8,000 reasoning tokens,
        // no content). The prompt is specific enough not to need it.
        reasoning: { enabled: false } as Record<string, unknown>,
      };
      let res;
      try {
        res = await call(body, 300_000);
      } catch (err) {
        // Some models (Claude Sonnet 5.5) refuse to run without reasoning:
        // keep it on but small, so the article still fits the budget.
        if (!(err instanceof Error && /reasoning is mandatory|cannot be disabled/i.test(err.message))) throw err;
        res = await call({ ...body, reasoning: { effort: "low", exclude: true } }, 300_000);
      }
      const choice = res?.choices?.[0];
      const text: string = choice?.message?.content ?? "";
      try {
        return { data: parseJsonReply(text) as T, model };
      } catch (e) {
        const why = e instanceof Error ? e.message : "unreadable reply";
        throw new Error(`${model}: ${why} (finish ${choice?.finish_reason ?? "?"}, ${text.length} chars, usage ${JSON.stringify(res?.usage ?? {})})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[autoblog] ${model} failed: ${msg}`);
      // A key or credit problem will fail the same way on every model.
      if (err instanceof OpenRouterError && (err.status === 401 || err.status === 403)) break;
    }
  }
  throw new Error(errors.join(" | ") || "No writing model configured");
}

export type GeneratedImage = { bytes: Buffer; type: string; source: string };

/** Generate one 16:9 featured image, or null if the provider gave none. */
export async function generateImage(prompt: string): Promise<GeneratedImage | null> {
  if (IMAGE_PROVIDER === "none") return null;
  if (IMAGE_PROVIDER === "openrouter") return openrouterImage(prompt);
  return pollinationsImage(prompt);
}

async function openrouterImage(prompt: string): Promise<GeneratedImage | null> {
  const data = await call(
    {
      model: IMAGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "16:9" },
    },
    180_000
  );
  const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const m = url?.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
  if (!m) return null;
  return { type: m[1].toLowerCase(), bytes: Buffer.from(m[2], "base64"), source: IMAGE_MODEL };
}

/**
 * Pollinations: free text-to-image over a plain GET. Without an account it
 * stamps a small "pollinations.ai" mark in the bottom-right corner, so the
 * bottom strip is cropped off before upload.
 */
async function pollinationsImage(prompt: string): Promise<GeneratedImage | null> {
  const seed = Math.floor(Math.random() * 1_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 900))}?width=1600&height=900&nologo=true&seed=${seed}`;
  const get = () => fetch(url, { signal: AbortSignal.timeout(180_000) });
  const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
  // A failed connection or a 5xx is usually a brief outage (503s seen in
  // production), so try up to three times before going without an image.
  let res: Response | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await get();
    } catch (err) {
      res = null;
      console.warn(`[autoblog] Pollinations request failed (attempt ${attempt}):`, err instanceof Error ? err.message : err);
    }
    // The free tier allows one image per 45 seconds per IP. With 2-3 articles
    // per run the next image can arrive too soon; wait as told and retry.
    if (res && (res.status === 402 || res.status === 429)) {
      const body = await res.text().catch(() => "");
      const wait = Math.min(90, Number(body.match(/Retry after (\d+)s/i)?.[1] ?? 46) + 2);
      console.warn(`[autoblog] Pollinations rate limit, retrying in ${wait}s`);
      await sleep(wait);
      continue;
    }
    if (res && res.status < 500) break;
    if (attempt < 3) {
      console.warn(`[autoblog] Pollinations returned ${res?.status ?? "no response"}, retrying in ${attempt * 15}s`);
      await sleep(attempt * 15);
    }
  }
  if (!res) return null;
  const type = res.headers.get("content-type") || "";
  if (!res.ok) console.warn(`[autoblog] Pollinations returned ${res.status}`);
  if (!res.ok || !type.startsWith("image/")) return null;
  const raw = Buffer.from(await res.arrayBuffer());
  if (raw.length < 10_000) return null; // an error card, not a picture

  try {
    const sharp = (await import("sharp")).default;
    const img = sharp(raw);
    const { width = 0, height = 0 } = await img.metadata();
    if (!width || !height) return null;
    const keep = Math.round(height * 0.91);
    const bytes = await img.extract({ left: 0, top: 0, width, height: keep }).jpeg({ quality: 88 }).toBuffer();
    return { bytes, type: "image/jpeg", source: "pollinations" };
  } catch (err) {
    // Without sharp the mark cannot be removed; a watermarked picture is
    // worse than none on a ministry site.
    console.warn("[autoblog] could not crop the Pollinations image:", err);
    return null;
  }
}
