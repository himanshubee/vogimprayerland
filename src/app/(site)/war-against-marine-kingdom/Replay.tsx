import { ArrowUpRight, Headphones, PlayCircle } from "lucide-react";
import { audioSource, videoSource } from "@/lib/embed";

/**
 * The recordings, once they exist.
 *
 * Every piece here is driven by a URL typed into /admin/pages — nothing is
 * hardcoded and nothing renders until a URL is saved, so the page carries the
 * crusade before it happens and the crusade itself afterwards, without a
 * deploy in between. No client JavaScript: iframes and the browser's own
 * <video>/<audio> controls do the work.
 */

/** A 16:9 player for one video URL — embed, file, or a link out. */
export function VideoFrame({ url, title }: { url: string; title: string }) {
  const source = videoSource(url);
  if (!source) return null;

  if (source.kind === "link") {
    return (
      <a
        href={source.href}
        target="_blank"
        rel="noopener"
        className="btn-ghost text-ivory border-ivory/40 mt-5"
      >
        <PlayCircle size={16} /> Watch on {source.host} <ArrowUpRight size={14} />
      </a>
    );
  }

  return (
    <div className="mt-6 relative aspect-video w-full overflow-hidden border border-ivory/15 bg-black">
      {source.kind === "embed" ? (
        <iframe
          src={source.src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <video
          src={source.src}
          controls
          preload="none"
          playsInline
          className="absolute inset-0 h-full w-full [color-scheme:dark]"
        />
      )}
    </div>
  );
}

/** A slim audio row for one audio URL. */
export function AudioBar({ url, label }: { url: string; label: string }) {
  const source = audioSource(url);
  if (!source) return null;

  if (source.kind === "link") {
    return (
      <a
        href={source.href}
        target="_blank"
        rel="noopener"
        className="mt-4 inline-flex items-center gap-2 text-sm text-gold u-link"
      >
        <Headphones size={15} /> Listen on {source.host}
      </a>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-3 border border-ivory/15 bg-white/5 px-4 py-3">
      <Headphones size={16} className="shrink-0 text-gold" />
      <audio
        src={source.src}
        controls
        preload="none"
        aria-label={label}
        className="w-full [color-scheme:dark]"
      />
    </div>
  );
}

export type ReplayNight = {
  num: string;
  title: string;
  date: string;
  iso: string;
  video: string;
  audio: string;
};

/** One night of the crusade: whatever of it was recorded. */
export function NightReplay({ night }: { night: ReplayNight }) {
  const label = `Night ${night.num} — ${night.title}`;
  return (
    <article className="border-t border-ivory/15 pt-8">
      <p className="text-[11px] tracking-[0.24em] uppercase text-gold">
        Night {night.num}
        <span className="text-ivory/40"> · </span>
        <time dateTime={night.iso} className="text-ivory/55">
          {night.date}
        </time>
      </p>
      <h3 className="font-display text-2xl md:text-3xl mt-2 leading-tight">
        {night.title}
      </h3>
      <VideoFrame url={night.video} title={label} />
      <AudioBar url={night.audio} label={`${label} — audio`} />
    </article>
  );
}
