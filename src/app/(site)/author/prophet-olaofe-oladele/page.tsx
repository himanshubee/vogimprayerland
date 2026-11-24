import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ClosingBand } from "@/components/ClosingBand";
import { AUTHOR, FOUNDER_ID } from "@/lib/authors";
import { MINISTRY, SITE_URL, absoluteUrl } from "@/lib/ministry";
import { getPublishedPosts, countPublishedPosts, type Post } from "@/lib/posts";

export const revalidate = 3600;

const DESCRIPTION = `${AUTHOR.name} is the ${AUTHOR.role} of VOGIM Prayer Land in Ikorodu, Lagos. Read his articles on deliverance, prayer, spiritual warfare and dreams.`;

export const metadata: Metadata = {
  title: `${AUTHOR.name}, ${AUTHOR.role} | VOGIM Prayer Land`,
  description: DESCRIPTION,
  alternates: { canonical: AUTHOR.url },
  openGraph: {
    type: "profile",
    title: AUTHOR.name,
    description: DESCRIPTION,
    url: AUTHOR.url,
    images: [{ url: absoluteUrl(AUTHOR.image).replace(/\/$/, "") }],
  },
};

// The subjects most of the ministry's articles return to, each pointing at the
// strongest article on it, so the profile shows what he teaches on.
const TOPICS: { label: string; href: string }[] = [
  { label: "Deliverance from the power of darkness", href: "/bible-verses-on-deliverance-from-the-power-of-darkness/" },
  { label: "Spirit husband and spirit wife", href: "/spiritual-husband-and-spiritual-wife/" },
  { label: "Deliverance from spirit spouse", href: "/deliverance-from-spirit-spouse/" },
  { label: "Monitoring spirits", href: "/signs-of-monitoring-spirits/" },
  { label: "Marine spirits", href: "/how-to-deal-with-marine-spirit/" },
  { label: "Warfare prayers for marital settlement", href: "/warfare-prayers-for-marital-settlement/" },
  { label: "Prayer points for breakthrough", href: "/prayer-points-for-breakthrough/" },
  { label: "Midnight prayer", href: "/why-midnight-prayer-is-important/" },
  { label: "Dream meanings", href: "/dream-of-someone-giving-you-money/" },
];

const founded = new Date(`${MINISTRY.foundingDate}-01T00:00:00Z`).toLocaleDateString("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function AuthorPage() {
  let posts: Post[] = [];
  let total = 0;
  try {
    [posts, total] = await Promise.all([getPublishedPosts({ limit: 9 }), countPublishedPosts("post")]);
  } catch {
    // Database unreachable: the profile still renders without the list.
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${AUTHOR.url}#profile`,
    url: AUTHOR.url,
    name: `${AUTHOR.name} | VOGIM Prayer Land`,
    description: DESCRIPTION,
    mainEntity: {
      "@type": "Person",
      "@id": FOUNDER_ID,
      name: AUTHOR.name,
      jobTitle: AUTHOR.role,
      url: AUTHOR.url,
      image: absoluteUrl(AUTHOR.image).replace(/\/$/, ""),
      worksFor: { "@id": `${SITE_URL}/#organization` },
      knowsAbout: ["Christian deliverance ministry", "Prayer", "Spiritual warfare", "Dream interpretation", "Bible"],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader eyebrow="Author" title={AUTHOR.name} intro={`${AUTHOR.role}, VOGIM Prayer Land`} />

      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 sm:py-20">
        <article className="card grid overflow-hidden md:grid-cols-[2fr_3fr]">
          <div className="relative aspect-[4/5]">
            <Image src={AUTHOR.image} alt={AUTHOR.name} fill priority sizes="(max-width: 768px) 100vw, 340px" className="object-cover" />
          </div>
          <div className="p-7">
            <h2 className="font-display text-3xl text-maroon">About {AUTHOR.name}</h2>
            <p className="mt-2 font-semibold text-gold-deep">{AUTHOR.role}</p>
            <p className="mt-5 text-slate">
              {AUTHOR.name} founded VOGIM Prayer Land (Voice of God International Ministry) in {founded}. The ministry began as
              village evangelism in Porto Novo and the surrounding communities, and is now based at {MINISTRY.address.streetAddress},{" "}
              {MINISTRY.address.addressLocality}, {MINISTRY.address.addressRegion}, Nigeria.
            </p>
            <p className="mt-4 text-slate">
              The articles on this site are published under his ministry. They teach on deliverance, prayer, spiritual warfare and
              the meaning of dreams, with the Bible as their foundation, and they point readers to prayer alongside, never instead
              of, medical care.
            </p>
            <p className="mt-4 text-slate">
              The ministry meets online on Zoom for prophetic services and Bible study through the week, and in person for Sunday
              worship in Ikorodu. <Link href="/services/" className="text-maroon underline">See service times</Link>.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <li><Link href="/about/" className="text-maroon underline">About the ministry</Link></li>
              <li><Link href="/leaders/" className="text-maroon underline">Leadership</Link></li>
              <li><a href={MINISTRY.social.youtube} rel="noopener" className="text-maroon underline">YouTube</a></li>
              <li><a href={MINISTRY.social.facebook} rel="noopener" className="text-maroon underline">Facebook</a></li>
            </ul>
          </div>
        </article>

        <section className="mt-14">
          <h2 className="font-display text-3xl text-maroon">Topics he writes on</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center justify-between gap-3 border border-midnight/10 bg-white px-4 py-3 text-midnight hover:border-gold/60">
                  {t.label}
                  <ArrowUpRight size={16} className="shrink-0 text-gold-deep" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {posts.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-3xl text-maroon">Latest articles</h2>
            <ul className="mt-6 divide-y divide-midnight/10 border-y border-midnight/10">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/${p.slug}/`} className="block py-4 hover:text-maroon">
                    <span className="font-display text-xl text-midnight">{p.title}</span>
                    {p.excerpt && <span className="mt-1 block text-sm text-midnight/60 line-clamp-2">{p.excerpt}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              <Link href="/blog/" className="btn-gold">
                All {total > 0 ? `${total} ` : ""}articles
              </Link>
            </p>
          </section>
        )}
      </div>
      <ClosingBand />
    </>
  );
}
