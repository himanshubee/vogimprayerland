import Link from "next/link";
import { Mockup } from "./Mockup";
import { BookPrice } from "./BookPrice";
import { CATEGORIES, colorByKey, type CategoryTemplates, type MerchItem } from "@/lib/merch-shared";

const SWATCHES_SHOWN = 6;

/** One design in the store grid, drawn on its garment in the default colour. */
export function MerchCard({
  item,
  templates,
}: {
  item: MerchItem;
  /** Photos for this design's category, when the ministry has uploaded them. */
  templates?: CategoryTemplates;
}) {
  const info = CATEGORIES[item.category];
  const color = colorByKey(item.defaultColor);
  const href = `/store/${item.slug}/`;

  return (
    <article className="group flex flex-col border border-midnight/12 bg-white transition-colors hover:border-gold/60">
      <Link href={href} className="relative block aspect-[5/6] overflow-hidden bg-ivory-dark">
        <Mockup
          templates={templates}
          category={item.category}
          view="front"
          color={color.hex}
          design={item.design}
          print={item.print}
          quality="lite"
          title={`${item.title} — ${info.label} in ${color.label}`}
          className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute top-0 right-0 bg-gold text-midnight text-[10px] tracking-[0.2em] uppercase px-2.5 py-1">
          {info.label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-tight text-midnight">
          <Link href={href} className="hover:text-gold-deep transition-colors">
            {item.title}
          </Link>
        </h3>

        {/* The colours it comes in, as dots — enough to say "this one comes in
            navy" from the grid without a click. */}
        <ul className="mt-3 flex items-center gap-1.5" aria-label="Available colours">
          {item.colors.slice(0, SWATCHES_SHOWN).map((key) => {
            const c = colorByKey(key);
            return (
              <li
                key={key}
                title={c.label}
                className="h-3.5 w-3.5 rounded-full border border-midnight/20"
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
          {item.colors.length > SWATCHES_SHOWN && (
            <li className="text-[10px] tracking-wider text-midnight/50">
              +{item.colors.length - SWATCHES_SHOWN}
            </li>
          )}
        </ul>

        {/* mt-auto pins the price and button to the bottom so cards of
            different text lengths still line up across the grid. */}
        <div className="mt-auto pt-5">
          <p className="font-display text-2xl text-midnight mb-4">
            <BookPrice prices={item.prices} />
          </p>
          <Link href={href} className="btn-gold w-full justify-center !px-4 !py-2.5 !text-[11px]">
            Choose colour &amp; size
          </Link>
        </div>
      </div>
    </article>
  );
}
