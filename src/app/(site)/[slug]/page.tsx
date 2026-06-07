import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { getPostBySlug } from "@/lib/posts";
import Adsense from "@/components/Adsense";

export const dynamicParams = true; // generate posts on-demand, then cache (ISR)
export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

// Posts are rendered on-demand and cached rather than all prebuilt at deploy
// time — with 500+ posts that keeps builds fast and avoids hammering the DB.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found — VOGIM Prayer Land" };

  const seo = post.seo;
  const metaTitle = seo.title || `${post.title} — VOGIM Prayer Land`;
  const metaDescription = seo.description || post.excerpt || undefined;
  const ogImage = seo.ogImage || post.featuredImage;
  const canonical = seo.canonical || `${SITE_URL}/${post.slug}/`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical },
    robots: {
      index: !seo.noindex,
      follow: !seo.nofollow,
    },
    openGraph: {
      title: seo.ogTitle || seo.title || post.title,
      description: seo.ogDescription || metaDescription,
      type: "article",
      url: canonical,
      siteName: "VOGIM Prayer Land",
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: seo.ogTitle || seo.title || post.title,
      description: seo.ogDescription || metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const canonical = post.seo.canonical || `${SITE_URL}/${post.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.seo.title || post.title,
        description: post.seo.description || post.excerpt || undefined,
        image: post.seo.ogImage || post.featuredImage || undefined,
        datePublished: post.date,
        dateModified: post.modified,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        articleSection: post.categories.length ? post.categories : undefined,
        author: { "@id": `${SITE_URL}/#organization` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <article className="bg-white">
      {post.type === "post" && <Adsense />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* HERO */}
      <header className="relative bg-midnight text-white overflow-hidden">
        {post.featuredImage && (
          <div className="absolute inset-0">
            <Image
              src={post.featuredImage}
              alt=""
              fill
              priority
              className="object-cover opacity-25"
            />
            <div className="absolute inset-0 hero-tint" />
          </div>
        )}
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 py-16 sm:py-24">
          <Link
            href="/blog/"
            className="inline-flex items-center gap-2 text-gold/90 hover:text-gold text-[11px] tracking-[0.28em] uppercase transition-colors"
          >
            <ArrowLeft size={14} /> All articles
          </Link>
          {post.categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.categories.map((c) => (
                <span
                  key={c}
                  className="text-[10px] tracking-[0.28em] uppercase text-midnight bg-gold px-3 py-1"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display mt-5 text-3xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight">
            {post.title}
          </h1>
          <p className="mt-6 flex items-center gap-2 text-white/70 text-sm">
            <Calendar size={15} className="text-gold" />
            {fmtDate(post.date)}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      </header>

      {/* BODY */}
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-12 sm:py-16">
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 border-t border-midnight/10 pt-10 text-center">
          <p className="eyebrow text-gold-deep">
            <span className="gold-rule mr-3" />
            Need prayer?
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-midnight mt-4">
            Let our intercessors stand with you.
          </h2>
          <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/prayer-request/" className="btn-gold justify-center">
              Send a prayer request
            </Link>
            <Link
              href="/deliverance-request/"
              className="btn-ghost text-midnight border-midnight/30 justify-center"
            >
              Request deliverance
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
