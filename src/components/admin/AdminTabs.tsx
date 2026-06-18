"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Submissions" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="hidden sm:flex items-center gap-1 ml-2">
      {TABS.map((t) => {
        const active =
          t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return active ? (
          <span
            key={t.href}
            className="text-[11px] tracking-[0.18em] uppercase text-gold border-b-2 border-gold px-3 py-2"
          >
            {t.label}
          </span>
        ) : (
          <Link
            key={t.href}
            href={t.href}
            className="text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-gold px-3 py-2 transition-colors"
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
