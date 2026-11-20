"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { absoluteUrl, PAGE_TITLES, SITE_URL } from "@/lib/ministry";

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/admin")) return null;
  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((segment, index) => ({
    name: PAGE_TITLES[segment] || segment.replace(/-/g, " ").replace(/^\w/, (letter) => letter.toUpperCase()).replace(/\bvogim\b/gi, "VOGIM"),
    href: `/${segments.slice(0, index + 1).join("/")}/`,
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      ...items.map((item, index) => ({ "@type": "ListItem", position: index + 2, name: item.name, item: absoluteUrl(item.href) })),
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className="border-b border-soft bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-5 py-3 text-xs text-slate sm:px-6">
        <li><Link href="/" className="min-h-8 py-2 text-maroon hover:underline">Home</Link></li>
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.href} className="text-maroon hover:underline">{item.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
