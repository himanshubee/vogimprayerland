import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ArrowUpRight, HandHeart, Sprout, HomeIcon } from "lucide-react";
import { getPageContent, getPageMeta } from "@/lib/page-content";
import { RichText } from "@/components/RichText";
import { GiveForm } from "@/components/GiveForm";
import { StablecoinGive } from "@/components/StablecoinGive";
import {
  CURRENCIES,
  isCurrency,
  isFlutterwaveConfigured,
  isTestMode,
} from "@/lib/flutterwave";
import { isPaystackConfigured, isPaystackTestMode } from "@/lib/paystack";
import { isPaypalConfigured, isPaypalSandbox } from "@/lib/paypal";
import { resolveGatewayCurrencies, type Provider } from "@/lib/gateways";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("give");
}

export const revalidate = 300;

/** "2000, 5000 , x, 10000" → [2000, 5000, 10000] */
const numbers = (csv: string): number[] =>
  csv
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 8);

const strings = (csv: string): string[] =>
  csv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 8);

export default async function GivePage() {
  const c = await getPageContent("give");

  const currencies = strings(c.giveCurrencies)
    .map((code) => code.toUpperCase())
    .filter(isCurrency)
    .map((code) => ({
      code,
      symbol: CURRENCIES[code].symbol,
      min: CURRENCIES[code].min,
    }));

  const presets: Record<string, number[]> = {
    NGN: numbers(c.amountsNgn),
    USD: numbers(c.amountsUsd),
    GBP: numbers(c.amountsGbp),
    EUR: numbers(c.amountsEur),
    AED: numbers(c.amountsAed),
  };
  // Any other enabled currency falls back to the USD ladder so the chips are
  // never empty when a new code is added in the admin.
  for (const { code } of currencies) {
    if (!presets[code]?.length) presets[code] = presets.USD;
  }

  const defaultCurrency = (c.defaultCurrency || "NGN").toUpperCase();
  // Which gateways can take a gift, and which are pointed at a sandbox.
  const configured: Record<Provider, boolean> = {
    flutterwave: isFlutterwaveConfigured(),
    paystack: isPaystackConfigured(),
    paypal: isPaypalConfigured(),
  };
  const sandbox: Record<Provider, boolean> = {
    flutterwave: isTestMode(),
    paystack: isPaystackTestMode(),
    paypal: isPaypalSandbox(),
  };
  const gatewayCurrencies = resolveGatewayCurrencies(process.env);

  const giveEnabled =
    Object.values(configured).some(Boolean) && currencies.length > 0;

  // Stablecoins are received directly to the ministry's Treasury wallets —
  // the section only exists once an address has been filled in via the admin.
  const stablecoins = [
    { code: "USDT", address: c.stablecoinUsdtAddress.trim() },
    { code: "USDC", address: c.stablecoinUsdcAddress.trim() },
    { code: "RLUSD", address: c.stablecoinRlusdAddress.trim() },
  ].filter((coin) => coin.address.length > 0);

  if (!giveEnabled) {
    // Loud, because the symptom is silent: the page renders the old external
    // button and on-site giving simply never appears. Check FLW_SECRET_KEY is
    // set in .env.production *on the server*, then rebuild — this page is
    // prerendered, so the decision is baked in at build time.
    console.error(
      `[give] On-site giving is DISABLED — ${
        !Object.values(configured).some(Boolean)
          ? "no payment gateway is configured (FLW_SECRET_KEY / PAYSTACK_SECRET_KEY / PAYPAL_CLIENT_ID+PAYPAL_SECRET)"
          : `no valid currencies in "${c.giveCurrencies}"`
      }. Falling back to ${c.giveButtonHref}`
    );
  }
  const AREAS = [
    {
      icon: HandHeart,
      title: c.area1Title,
      body: c.area1Body,
    },
    {
      icon: Sprout,
      title: c.area2Title,
      body: c.area2Body,
    },
    {
      icon: HomeIcon,
      title: c.area3Title,
      body: c.area3Body,
    },
  ];
  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
        scripture={{
          ref: "2 Corinthians 9:7",
          text: "God loveth a cheerful giver.",
        }}
      />

      {/* GIVE CARD */}
      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              {c.giveEyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              <RichText text={c.giveTitle} accentClass="italic" />
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              {c.giveIntro}
            </p>

            {giveEnabled ? (
              <GiveForm
                currencies={currencies}
                presets={presets}
                funds={strings(c.giveFunds)}
                submitLabel={c.giveButtonLabel}
                defaultCurrency={defaultCurrency}
                configured={configured}
                sandbox={sandbox}
                gatewayCurrencies={gatewayCurrencies}
                fallbackHref={c.giveButtonHref}
              />
            ) : (
              // Flutterwave isn't configured on this server — fall back to the
              // ministry's hosted giving page rather than showing a dead form.
              <Link
                href={c.giveButtonHref}
                className="btn-gold mt-10"
                target="_blank"
                rel="noreferrer"
              >
                {c.giveButtonLabel}
                <ArrowUpRight size={16} />
              </Link>
            )}

            {/* Wallet-address giving works whether or not the card gateway
                is configured, so it lives outside the giveEnabled branch. */}
            <StablecoinGive
              intro={c.stablecoinIntro}
              network={c.stablecoinNetwork.trim()}
              coins={stablecoins}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 bg-ivory p-8">
              <p className="eyebrow text-gold-deep">{c.pledgeEyebrow}</p>
              <h3 className="font-display text-3xl text-midnight mt-3 leading-tight">
                {c.pledgeTitle}
              </h3>
              <ul className="mt-6 space-y-5">
                {AREAS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.title} className="flex gap-4">
                      <Icon className="text-gold-deep shrink-0 mt-1" size={22} />
                      <div>
                        <p className="font-display text-xl text-midnight">{a.title}</p>
                        <p className="text-midnight/70 text-sm leading-relaxed mt-1">
                          {a.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* THANK YOU STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display italic text-3xl md:text-4xl leading-snug">
            {c.thankQuote}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            {c.thankRef}
          </p>
        </div>
      </section>
    </>
  );
}
