import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { MerchCard } from "@/components/shop/MerchCard";
import { MerchConfigurator } from "@/components/shop/MerchConfigurator";
import { CATEGORIES, getMerchBySlug, getMerchTemplates, listPublishedMerch } from "@/lib/merch";
import type { CurrencyCode } from "@/lib/currencies";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMerchBySlug(slug);
  if (!item) return { title: "Design not found — VOGIM Prayer Land" };

  const info = CATEGORIES[item.category];
  const description =
    item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) ||
    `${item.title} — a ${info.label.toLowerCase()} from VOGIM Prayer Land, in ${item.colors.length} colours.`;

  return {
    title: `${item.title} ${info.label} — VOGIM Prayer Land`,
    description,
    openGraph: {
      type: "website",
      title: `${item.title} ${info.label}`,
      description,
      images: item.design ? [{ url: item.design }] : undefined,
    },
  };
}

export default async function StoreItemPage({ params }: Params) {
  const { slug } = await params;
  const item = await getMerchBySlug(slug);
  if (!item) notFound();

  const [all, templates] = await Promise.all([listPublishedMerch(), getMerchTemplates()]);
  const more = all.filter((m) => m.id !== item.id).slice(0, 4);
  const available = Object.keys(item.prices) as CurrencyCode[];

  return (
    <>
      <section className="bg-midnight text-white relative overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-6 py-12 sm:py-20">
          <Link
            href="/store/"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase text-gold/80 hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} /> The store
          </Link>

          <div className="mt-8">
            <MerchConfigurator
              item={item}
              available={available}
              templates={templates[item.category]}
            />
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      {item.description && (
        <section className="bg-ivory paper-grain">
          <div className="mx-auto max-w-3xl px-5 sm:px-6 py-16 sm:py-20">
            <Reveal>
              <p className="eyebrow text-gold-deep">
                <span className="gold-rule mr-3" />
                About this design
              </p>
              <div
                className="post-content mt-7"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* MORE */}
      {more.length > 0 && (
        <section className="bg-white border-t border-midnight/10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20">
            <Reveal>
              <h2 className="font-display text-3xl text-midnight leading-tight">
                More from the store
              </h2>
            </Reveal>
            <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
              {more.map((m, i) => (
                <Reveal key={m.id} delay={Math.min(i, 3) * 0.07}>
                  <MerchCard item={m} templates={templates[m.category]} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
