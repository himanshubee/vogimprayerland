"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CaretDown, HandsPraying, List, VideoCamera, WhatsappLogo, X } from "@phosphor-icons/react";
import { Logo } from "./Logo";
import { CartBadge } from "./shop/CartBadge";
import { NAV_LINKS } from "@/lib/nav";
import { MINISTRY } from "@/lib/ministry";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-soft bg-white/95 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo tagline={false} />
        <ul className="hidden items-center gap-1 text-sm text-ink xl:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || link.children?.some((child) => pathname === child.href);
            return (
              <li key={link.label} className="relative">
                <details className="nav-group">
                  <summary className={active ? "text-maroon" : ""}>
                    {link.label}<CaretDown size={14} weight="bold" aria-hidden="true" />
                  </summary>
                  <div className="absolute left-0 top-full z-50 min-w-64 rounded-xl border border-soft bg-white p-2 shadow-soft">
                    {link.children?.map((child) => (
                      <Link key={child.href} href={child.href} className="block min-h-11 rounded-lg px-4 py-3 hover:bg-mist focus:bg-mist">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <CartBadge />
          <Link href="/services/" className="btn-ghost hidden !min-h-11 !px-4 !text-sm 2xl:inline-flex">
            <VideoCamera size={20} weight="duotone" aria-hidden="true" />Join service
          </Link>
          <Link href="/prayer-request/" className="btn-gold hidden !min-h-11 !px-4 !text-sm sm:inline-flex">
            <HandsPraying size={20} weight="duotone" aria-hidden="true" />Request prayer
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="icon-button xl:hidden" aria-label="Open menu" aria-expanded={open}>
            <List size={26} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[80] bg-ink/60 xl:hidden" onClick={close}>
          <section role="dialog" aria-modal="true" aria-label="Site menu" className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-3xl">Menu</p>
              <button ref={closeRef} type="button" onClick={close} className="icon-button" aria-label="Close menu"><X size={24} /></button>
            </div>
            <div className="space-y-2">
              {NAV_LINKS.map((link) => (
                <details key={link.label} className="rounded-xl border border-soft">
                  <summary className="min-h-12 px-4 py-3 font-semibold text-maroon">{link.label}</summary>
                  <div className="border-t border-soft p-2">
                    {link.children?.map((child) => (
                      <Link key={child.href} href={child.href} onClick={close} className="block min-h-12 rounded-lg px-3 py-3 hover:bg-mist">{child.label}</Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            <div className="sticky bottom-0 mt-5 space-y-2 bg-white pt-3">
              <Link href="/prayer-request/" onClick={close} className="btn-gold w-full justify-center"><HandsPraying size={22} weight="duotone" />Request prayer</Link>
              <a href={MINISTRY.whatsapp} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 text-maroon underline underline-offset-4"><WhatsappLogo size={22} weight="duotone" />WhatsApp</a>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}
