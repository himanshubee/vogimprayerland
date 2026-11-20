"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HandsPraying, VideoCamera } from "@phosphor-icons/react";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";
import { getNextService, serviceIsSoon } from "@/lib/services";
import { track } from "@/lib/tracking";

const HIDDEN = ["request", "contact", "give", "checkout", "policy", "terms-and-conditions", "privacy-requests"];

export function StickyPrayerBar() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [focused, setFocused] = useState(false);
  const [closing, setClosing] = useState(false);
  const next = getNextService();
  const showService = next ? serviceIsSoon(next.deltaMinutes, next.service.durationMinutes) : false;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAllowed(Boolean(readConsent())));
    const update = () => setAllowed(Boolean(readConsent()));
    window.addEventListener(CONSENT_EVENT, update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(CONSENT_EVENT, update);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector("[data-hero-cta]");
      setPastHero(hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 480);
      const band = document.querySelector("[data-closing-band]");
      setClosing(Boolean(band && band.getBoundingClientRect().top < window.innerHeight));
    };
    const onFocus = (event: FocusEvent) => {
      setFocused(event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
    };
    const onBlur = () => setFocused(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, [pathname]);

  if (!allowed || !pastHero || focused || closing || HIDDEN.some((part) => pathname.includes(part))) return null;

  return (
    <aside className="sticky-prayer md:hidden" aria-label="Prayer shortcuts">
      <div className="flex gap-2">
        <Link href="/prayer-request/" className="btn-gold min-h-14 flex-1 justify-center" onClick={() => track("sticky_cta_click", { cta_id: "sticky-prayer", cta_location: "sticky" })}>
          <HandsPraying size={22} weight="duotone" aria-hidden="true" />Request prayer
        </Link>
        {showService && next?.service.joinUrl && (
          <a href={next.service.joinUrl} target="_blank" rel="noreferrer" className="btn-ghost min-h-14 justify-center !px-3" aria-label="Join service on Zoom">
            <VideoCamera size={22} weight="duotone" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Join service</span>
          </a>
        )}
      </div>
    </aside>
  );
}
