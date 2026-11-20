"use client";

import Link from "next/link";
import { FacebookLogo, MapPin, Phone, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react";
import { Logo } from "./Logo";
import { COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import { MINISTRY } from "@/lib/ministry";
import { PUBLISHED_OWNER_PAGES } from "@/lib/owner-content";

const ifPublished = (key: (typeof PUBLISHED_OWNER_PAGES)[number], label: string) =>
  PUBLISHED_OWNER_PAGES.includes(key) ? ([[label, `/${key}/`]] as const) : [];

const COLUMNS = [
  { title: "Get prayer", links: [["Prayer request", "/prayer-request/"], ["Healing request", "/healing-request/"], ["Deliverance request", "/deliverance-request/"], ["Dream request", "/dream-interpretation/"], ["How requests work", "/how-requests-work/"]] },
  { title: "Ministries", links: [["Online deliverance", "/online-deliverance/"], ["Marital settlement", "/marital-settlement/"], ["Healing", "/healing/"], ["Dream interpretation", "/dream-interpretation/"]] },
  { title: "Watch and join", links: [["Services and Zoom", "/services/"], ["Media", "/media/"], ["Gallery", "/gallery/"], ["Testimonies", "/testimonies/"], ["Outreach", "/outreach/"]] },
  { title: "About", links: [["Our story", "/about/"], ...ifPublished("what-we-believe", "What we believe"), ["Leaders", "/leaders/"], ["Visit", "/visit/"], ["Contact", "/contact/"]] },
  { title: "Give and shop", links: [["Give", "/give/"], ["Partnership", "/partnership/"], ...ifPublished("where-gifts-go", "Where gifts go"), ["Store", "/store/"], ["Books", "/books/"], ["FAQ", "/faq/"]] },
  { title: "Trust and legal", links: [["Privacy policy", "/privacy-policy/"], ["Cookie policy", "/cookie-policy/"], ["Giving and refund policy", "/refund-policy/"], ["Terms", "/terms-and-conditions/"], ...ifPublished("safeguarding", "Safeguarding"), ["Official channels", "/notice/"], ["Complaints", "/complaints/"], ["Privacy requests", "/privacy-requests/"], ...ifPublished("accessibility", "Accessibility")] },
] as const;

export function Footer() {
  return (
    <footer className="mt-0 bg-midnight-dark text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-8 border-b border-white/15 pb-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-5 text-white/75">Loving God · Loving Others · In the World</p>
          </div>
          <address className="not-italic text-sm leading-7 text-white/80">
            <p className="flex gap-3"><MapPin size={20} weight="duotone" className="mt-1 shrink-0 text-gold" />{MINISTRY.address.streetAddress}, {MINISTRY.address.addressLocality}, {MINISTRY.address.addressRegion}, Nigeria</p>
            <a href={`tel:${MINISTRY.phone.replace(/\s/g, "")}`} className="mt-2 flex min-h-11 items-center gap-3 hover:text-gold"><Phone size={20} weight="duotone" className="text-gold" />{MINISTRY.phone}</a>
            <div className="mt-3 flex gap-2">
              <a href={MINISTRY.social.facebook} target="_blank" rel="noreferrer" className="icon-button border border-white/25 text-white" aria-label="Facebook"><FacebookLogo size={22} /></a>
              <a href={MINISTRY.social.youtube} target="_blank" rel="noreferrer" className="icon-button border border-white/25 text-white" aria-label="YouTube"><YoutubeLogo size={22} /></a>
              <a href={MINISTRY.whatsapp} target="_blank" rel="noreferrer" className="icon-button border border-white/25 text-white" aria-label="WhatsApp"><WhatsappLogo size={22} /></a>
            </div>
          </address>
        </div>

        <nav aria-label="Footer" className="grid gap-4 py-10 md:grid-cols-3 xl:grid-cols-6">
          {COLUMNS.map((column) => (
            <details key={column.title} className="footer-group border-b border-white/10 md:border-0">
              <summary>{column.title}</summary>
              <ul className="space-y-1 pb-4 md:mt-4">
                {column.links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-10 items-center text-sm text-white/75 hover:text-gold">{label}</Link></li>)}
              </ul>
            </details>
          ))}
        </nav>
        <div className="flex flex-col gap-4 border-t border-white/15 pt-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {MINISTRY.name}</p>
          <button type="button" className="min-h-11 self-start text-gold underline underline-offset-4 sm:self-auto" onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}>Cookie settings</button>
        </div>
      </div>
    </footer>
  );
}
