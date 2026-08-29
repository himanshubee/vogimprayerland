import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Palette, ShieldCheck, Shirt, Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { StoreGrid } from "@/components/shop/StoreGrid";
import { getMerchTemplates, listPublishedMerch } from "@/lib/merch";
import type { CurrencyCode } from "@/lib/currencies";

export const metadata: Metadata = {
  title: "Store — VOGIM Prayer Land",
  description:
    "T-shirts and caps from VOGIM Prayer Land — choose a design, pick your colour and size, and wear the word.",
};

export const revalidate = 300;

const HOW_IT_WORKS = [
  {
    icon: Palette,
    title: "Choose your colour",
    body: "Every design comes in a range of fabric colours. Turn it round, see it from every angle, and pick the one that is yours.",
  },
  {
    icon: ShieldCheck,
    title: "Pay securely",
    body: "Card, bank transfer and mobile money through Paystack or Flutterwave, or pay with PayPal. Your details never touch this site.",
  },
  {
    icon: Truck,
    title: "Made and delivered",
    body: "Each piece is printed to order and sent to the address you give at checkout. We email you the moment it is dispatched.",
  },
];

export default async function StorePage() {
  const [items, templates] = await Promise.all([listPublishedMerch(), getMerchTemplates()]);

  // Only offer currencies something is actually priced in, so the picker can
  // never leave the whole store reading "not sold in this currency".
  const available = [
    ...new Set(items.flatMap((i) => Object.keys(i.prices) as CurrencyCode[])),
  ];

  return (
    <>
      <PageHeader
        eyebrow="The Store"
        title={
          <>
            Wear the <span className="italic text-gold">word</span>
          </>
        }
        intro="T-shirts and caps carrying the ministry's designs — a quiet witness on the street, and a way to stand with the work. Choose a design, then your colour and size."
        scripture={{
          ref: "Matthew 5:16",
          text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
        }}
        image="https://img.vogimprayerland.org/1780648526061-slider3.webp"
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24">
          {items.length > 0 ? (
            <StoreGrid items={items} available={available} templates={templates} />
          ) : (
            <Reveal>
              <div className="border border-midnight/15 bg-white px-8 py-16 text-center">
                <Shirt className="mx-auto text-gold-deep" size={34} />
                <h2 className="font-display text-3xl text-midnight mt-5">
                  The first designs are on the press
                </h2>
                <p className="mt-4 text-midnight/70 max-w-md mx-auto leading-relaxed">
                  Nothing is on the rails just yet. Come back shortly — or write to us and
                  we will tell you the moment the first design lands.
                </p>
                <Link href="/contact/" className="btn-gold mt-8">
                  Contact the ministry <ArrowUpRight size={16} />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white border-t border-midnight/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-20">
          <div className="grid sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 0.08}>
                  <Icon className="text-gold-deep" size={24} />
                  <h3 className="font-display text-xl text-midnight mt-4">{step.title}</h3>
                  <p className="mt-2 text-sm text-midnight/70 leading-relaxed">{step.body}</p>
                </Reveal>
              );
            })}
          </div>

          <p className="mt-12 text-center text-xs text-midnight/50">
            Looking for the ministry&rsquo;s books?{" "}
            <Link href="/books/" className="text-gold-deep u-link">
              Visit the bookshop
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
