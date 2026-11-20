"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { Cookie, SlidersHorizontal, X } from "@phosphor-icons/react";
import { CONSENT_POLICY_VERSION } from "@/lib/ministry";
import { COOKIE_SETTINGS_EVENT, readConsent, saveConsent, type ConsentRecord } from "@/lib/consent";
import { track, updateGoogleConsent } from "@/lib/tracking";
import { WebVitals } from "./WebVitals";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-LQF04TNC6V";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function ConsentManager() {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const existing = readConsent();
      setConsent(existing);
      setAnalytics(existing?.analytics ?? false);
      setFunctional(existing?.functional ?? false);
      setVisible(!existing);
      setReady(true);
      if (existing) updateGoogleConsent(existing);
    });
    const reopen = () => {
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
    };
  }, []);

  function choose(choices: { analytics: boolean; functional: boolean }) {
    const record = saveConsent({ ...choices, advertising: false });
    setConsent(record);
    setVisible(false);
    setManage(false);
    updateGoogleConsent(record);
    track("consent_update", {
      analytics: record.analytics,
      advertising: false,
      functional: record.functional,
      policy_version: CONSENT_POLICY_VERSION,
    });
  }

  const analyticsAllowed = Boolean(consent?.analytics && process.env.NODE_ENV === "production");

  return (
    <>
      {consent?.analytics && <WebVitals />}
      {analyticsAllowed && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-consented-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${GA_ID}',{allow_google_signals:false});`}
          </Script>
        </>
      )}
      {analyticsAllowed && GTM_ID && (
        <Script id="gtm-consented-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {ready && visible && (
        <section
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-soft bg-white p-5 shadow-soft sm:p-6"
        >
          <div className="flex items-start gap-3">
            <Cookie size={26} weight="duotone" className="mt-1 shrink-0 text-maroon" aria-hidden="true" />
            <div>
              <h2 className="font-display text-2xl text-ink">Your privacy, your choice</h2>
              <p className="mt-2 text-sm leading-6 text-slate">
                We use necessary storage to keep the site working. With your permission, we also use analytics and live chat. We do not show advertising.
                Read our <Link href="/cookie-policy/" className="text-maroon underline">Cookie Policy</Link>.
              </p>
            </div>
            {readConsent() && (
              <button type="button" onClick={() => setVisible(false)} className="icon-button" aria-label="Close cookie settings">
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>

          {manage && (
            <div className="mt-5 space-y-3 border-t border-soft pt-4">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-mist p-3">
                <div><strong className="text-sm">Strictly necessary</strong><p className="text-xs text-slate">Security, consent and form protection.</p></div>
                <span className="text-xs font-semibold text-slate">Always on</span>
              </div>
              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-input p-3">
                <span><strong className="text-sm">Analytics</strong><span className="block text-xs text-slate">Anonymous page and performance measurement.</span></span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5 accent-maroon" />
              </label>
              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-input p-3">
                <span><strong className="text-sm">Functional</strong><span className="block text-xs text-slate">Live chat loaded only when you tap it.</span></span>
                <input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} className="h-5 w-5 accent-maroon" />
              </label>
            </div>
          )}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => choose({ analytics: true, functional: true })} className="btn-gold justify-center !min-h-12 !px-3 !text-sm">Accept all</button>
            <button type="button" onClick={() => choose({ analytics: false, functional: false })} className="btn-ghost justify-center !min-h-12 !px-3 !text-sm">Reject all</button>
            {manage ? (
              <button type="button" onClick={() => choose({ analytics, functional })} className="btn-ghost justify-center !min-h-12 !px-3 !text-sm">Save choices</button>
            ) : (
              <button type="button" onClick={() => setManage(true)} className="btn-ghost justify-center !min-h-12 !px-3 !text-sm"><SlidersHorizontal size={18} aria-hidden="true" />Manage choices</button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
