/**
 * Turns a URL pasted into the admin into something the page can actually play.
 *
 * The ministry records on whatever is to hand — YouTube one night, a raw mp4
 * on the CDN the next, an mp3 for the audio — so the page has to cope with all
 * of them without anyone touching code. Anything unrecognised degrades to a
 * plain link rather than an empty frame.
 */

export type Playable =
  | { kind: "embed"; src: string } // iframe player (YouTube, Vimeo)
  | { kind: "file"; src: string } // <video>/<audio> the browser plays itself
  | { kind: "link"; href: string; host: string }; // anything else — link out

const VIDEO_FILE = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i;
const AUDIO_FILE = /\.(mp3|m4a|aac|ogg|oga|wav|flac)(\?|#|$)/i;
const YOUTUBE_ID = /^[\w-]{6,20}$/;

const bareHost = (u: URL) => u.hostname.replace(/^www\./, "");

/**
 * Parse and vet a CMS-supplied URL. Only http(s) survives: the value is typed
 * into an admin field and ends up in an href, so a `javascript:` URL would
 * otherwise become executable.
 */
function parse(raw: string): URL | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function youtubeId(u: URL): string | null {
  const host = bareHost(u);
  if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  if (!/^(m\.|music\.)?(youtube\.com|youtube-nocookie\.com)$/.test(host)) return null;
  const v = u.searchParams.get("v");
  if (v) return v;
  // /embed/ID, /live/ID (livestream replays), /shorts/ID, /v/ID
  const m = u.pathname.match(/^\/(?:embed|live|shorts|v)\/([^/?#]+)/);
  return m ? m[1] : null;
}

function vimeoId(u: URL): string | null {
  if (!/(^|\.)vimeo\.com$/.test(bareHost(u))) return null;
  const m = u.pathname.match(/\/(\d{6,})/);
  return m ? m[1] : null;
}

/** How to show a video URL. */
export function videoSource(raw: string): Playable | null {
  const u = parse(raw);
  if (!u) return null;

  const yt = youtubeId(u);
  if (yt && YOUTUBE_ID.test(yt)) {
    return {
      kind: "embed",
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1`,
    };
  }

  const vimeo = vimeoId(u);
  if (vimeo) return { kind: "embed", src: `https://player.vimeo.com/video/${vimeo}` };

  if (VIDEO_FILE.test(u.pathname)) return { kind: "file", src: u.toString() };

  return { kind: "link", href: u.toString(), host: bareHost(u) };
}

/** How to play an audio URL. */
export function audioSource(raw: string): Playable | null {
  const u = parse(raw);
  if (!u) return null;
  if (AUDIO_FILE.test(u.pathname)) return { kind: "file", src: u.toString() };
  return { kind: "link", href: u.toString(), host: bareHost(u) };
}
