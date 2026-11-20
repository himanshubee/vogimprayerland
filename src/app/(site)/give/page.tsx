import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, LockKey, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/PageHeader";
import { GiveForm } from "@/components/GiveForm";
import { getPageContent } from "@/lib/page-content";
import { CURRENCIES, isCurrency, isFlutterwaveConfigured, isTestMode } from "@/lib/flutterwave";
import { isPaystackConfigured, isPaystackTestMode } from "@/lib/paystack";
import { isPaypalConfigured, isPaypalSandbox } from "@/lib/paypal";
import { resolveGatewayCurrencies, type Provider } from "@/lib/gateways";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Give to VOGIM Prayer Land | Official Giving Channel",
  description: "Give voluntarily through VOGIM Prayer Land's official online channel. Prayer, deliverance and counselling are free. Card details stay on the secure checkout.",
  alternates: { canonical: absoluteUrl("/give/") },
};

export const revalidate = 300;
const numbers = (csv: string): number[] => csv.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value > 0).slice(0, 8);
const strings = (csv: string): string[] => csv.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 8);

export default async function GivePage() {
  const c = await getPageContent("give");
  const currencies = strings(c.giveCurrencies).map((code) => code.toUpperCase()).filter(isCurrency).map((code) => ({ code, symbol: CURRENCIES[code].symbol, min: CURRENCIES[code].min }));
  const presets: Record<string, number[]> = { NGN: numbers(c.amountsNgn), USD: numbers(c.amountsUsd), GBP: numbers(c.amountsGbp), EUR: numbers(c.amountsEur), AED: numbers(c.amountsAed) };
  for (const { code } of currencies) if (!presets[code]?.length) presets[code] = presets.USD;
  const configured: Record<Provider, boolean> = { flutterwave: isFlutterwaveConfigured(), paystack: isPaystackConfigured(), paypal: isPaypalConfigured() };
  const sandbox: Record<Provider, boolean> = { flutterwave: isTestMode(), paystack: isPaystackTestMode(), paypal: isPaypalSandbox() };
  const gatewayCurrencies = resolveGatewayCurrencies(process.env);
  const giveEnabled = Object.values(configured).some(Boolean) && currencies.length > 0;

  return (
    <>
      <PageHeader eyebrow="Official online giving" title="Give to VOGIM Prayer Land" intro="Giving is voluntary. Prayer, deliverance and counselling are free. No request, session or follow-up depends on a gift." scripture={{ ref: "2 Corinthians 9:7 · KJV", text: "God loveth a cheerful giver." }} />
      <section className="bg-cream"><div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2 text-sm font-semibold text-maroon"><SealCheck size={22} weight="duotone" />Official giving channel</div>
          <h2 className="mt-5 font-display text-4xl text-maroon">Give securely through the official page</h2>
          <p className="mt-4 text-slate">Choose a currency and amount, then continue to the available payment provider. The page shows any currency conversion before you continue.</p>
          {giveEnabled ? <GiveForm currencies={currencies} presets={presets} funds={strings(c.giveFunds)} submitLabel="Give now" defaultCurrency={(c.defaultCurrency || "NGN").toUpperCase()} configured={configured} sandbox={sandbox} gatewayCurrencies={gatewayCurrencies} fallbackHref={MINISTRY.givingUrl} /> : <a href={MINISTRY.givingUrl} target="_blank" rel="noreferrer" className="btn-gold mt-8">Continue to the official giving page<ArrowUpRight size={18} /></a>}
        </div>
        <aside className="space-y-5">
          <div className="card p-6"><LockKey size={28} weight="duotone" className="text-maroon" /><h2 className="mt-3 font-display text-3xl text-maroon">Your card details stay with the provider</h2><p className="mt-3 text-sm text-slate">Card details are entered on the payment provider&apos;s hosted checkout and never touch this website. Available providers are shown before you continue.</p></div>
          <div className="card p-6"><h2 className="font-display text-3xl text-maroon">Receipts and monthly gifts</h2><p className="mt-3 text-sm text-slate">A receipt includes the amount, currency, date, reference and fund. If it does not arrive, contact <a className="text-maroon underline" href={`mailto:${MINISTRY.email}`}>{MINISTRY.email}</a>.</p><p className="mt-3 text-sm text-slate">To cancel a monthly gift, email the team. Cancellation does not affect prayer or follow-up.</p><Link href="/refund-policy/" className="mt-4 inline-block text-sm font-semibold text-maroon underline">Read the Giving and refund policy</Link></div>
          <div className="card p-6"><h2 className="font-display text-3xl text-maroon">Check before you give</h2><p className="mt-3 text-sm text-slate">Confirm the website, giving domain, WhatsApp number and social channels on our official notice.</p><Link href="/notice/" className="mt-4 inline-block text-sm font-semibold text-maroon underline">Is this really VOGIM?</Link></div>
        </aside>
      </div></section>
      {/* Scripture strip held back until leadership approves giving wording (D6). */}
    </>
  );
}
