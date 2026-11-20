import Link from "next/link";
import { HandsPraying, VideoCamera } from "@phosphor-icons/react/dist/ssr";

export function ClosingBand({
  title = "There is a place at this altar for you.",
  body = "Send a prayer request or join the next online service. Prayer, deliverance and counselling are free.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section data-closing-band className="bg-midnight-dark text-white">
      <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-6 sm:py-20">
        <h2 className="font-display text-3xl leading-tight sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/80">{body}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/prayer-request/" className="btn-gold justify-center" data-cta-id="closing-prayer">
            <HandsPraying size={22} weight="duotone" aria-hidden="true" />
            Request prayer
          </Link>
          <Link href="/services/" className="btn-ghost justify-center border-white text-white hover:text-ink" data-cta-id="closing-service">
            <VideoCamera size={22} weight="duotone" aria-hidden="true" />
            Join the next service
          </Link>
        </div>
      </div>
    </section>
  );
}
