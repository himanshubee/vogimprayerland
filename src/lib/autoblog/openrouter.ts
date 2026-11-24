import { SITE_NAME, SITE_URL } from "@/lib/ministry";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || "anthropic/claude-sonnet-5.5";
export const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-3.1-flash-image";

export function openrouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

type Message = { role: "system" | "user" | "assistant"; content: string };

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
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`OpenRouter: ${msg}`);
  }
  return data;
}

/** One chat completion that must return a JSON object. */
export async function completeJson<T>(messages: Message[], maxTokens = 8000): Promise<T> {
  const data = await call(
    { model: TEXT_MODEL, messages, max_tokens: maxTokens, temperature: 0.6, response_format: { type: "json_object" } },
    240_000
  );
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  // Some models wrap JSON in a code fence despite response_format.
  const json = text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error("The writing model did not return valid JSON");
  }
}

/** Generate one image; returns its bytes and type, or null if the model gave none. */
export async function generateImage(prompt: string): Promise<{ bytes: Buffer; type: string } | null> {
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
  return { type: m[1].toLowerCase(), bytes: Buffer.from(m[2], "base64") };
}
