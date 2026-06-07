"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_LINKS } from "@/lib/nav";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top announcement strip */}
      <div className="hidden md:block bg-midnight text-white/85 text-[11px] tracking-[0.28em] uppercase">
        <div className="mx-auto max-w-7xl flex justify-between items-center px-6 py-2">
          <span>Online Prophetic Service · Mon &amp; Sat · 10pm WAT</span>
          <span className="text-gold">
            18 Association Avenue, Owutu-Agric, Ikorodu · Lagos
          </span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-midnight/10 shadow-sm"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4 lg:py-5">
          <Logo tagline={false} />

          <ul className="hidden lg:flex items-center gap-7 text-[13px] tracking-wide text-midnight/85">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href ||
                link.children?.some((c) => pathname === c.href);
              return (
                <li key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1 py-2 whitespace-nowrap transition-colors hover:text-gold-deep ${
                      active ? "text-midnight font-medium" : ""
                    }`}
                  >
                    {link.label}
                    {link.children && (
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    )}
                    {active && (
                      <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold" />
                    )}
                  </Link>
                  {link.children && (
                    <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="min-w-[220px] bg-white border border-midnight/10 shadow-xl shadow-midnight/10">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-5 py-3 text-sm text-midnight/85 hover:bg-midnight hover:text-gold transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <Link
            href="/deliverance-request"
            className="hidden lg:inline-flex btn-gold"
          >
            Request Prayer
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 text-midnight"
            aria-label="Open menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-midnight/10 bg-white">
            <ul className="px-6 py-6 flex flex-col gap-1 text-midnight">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-3 border-b border-midnight/10 text-sm font-medium tracking-wide"
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <ul className="pl-4 py-1">
                      {link.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="block py-2 text-sm text-midnight/70"
                          >
                            — {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              <li className="pt-4">
                <Link
                  href="/deliverance-request"
                  className="btn-gold w-full justify-center"
                >
                  Request Prayer
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
