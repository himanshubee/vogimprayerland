import { TESTIMONIES, TESTIMONY_LINE, type Testimony } from "@/lib/testimonies";

/** Renders consented testimonies with the standing line. Renders nothing when there are none. No Review markup. */
export function TestimonyList({ items = TESTIMONIES, limit }: { items?: Testimony[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (!shown.length) return null;
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {shown.map((t) => (
        <li key={t.id}>
          <figure className="h-full rounded-2xl border border-soft bg-white p-6">
            <blockquote className="text-left text-ink">{t.text}</blockquote>
            <figcaption className="mt-4 text-left text-sm text-slate">
              <strong className="text-maroon">{t.displayName}</strong>{t.place && `, ${t.place}`} · {new Date(t.receivedOn).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </figcaption>
            <p className="mt-3 text-left text-xs text-slate">{TESTIMONY_LINE}</p>
          </figure>
        </li>
      ))}
    </ul>
  );
}
