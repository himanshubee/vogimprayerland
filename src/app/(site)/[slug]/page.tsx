import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/ministry";
import { AUTHOR, articleAuthor } from "@/lib/authors";

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
    keywords: seo.keywords
      ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined,
    alternates: { canonical },
    authors: AUTHOR.bylineApproved ? [{ name: AUTHOR.name, url: AUTHOR.url }] : [{ name: SITE_NAME }],
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
      authors: AUTHOR.bylineApproved ? [AUTHOR.url] : undefined,
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
  const isArticle = post.type === "post";
  const related = isArticle ? await getRelatedPosts(post) : [];
  const wordCount = post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  // The sitewide <Breadcrumbs> already emits the BreadcrumbList for this URL;
  // a second, different one here made the two disagree.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.seo.title || post.title,
        description: post.seo.description || post.excerpt || undefined,
        image: post.seo.ogImage || post.featuredImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`,
        datePublished: post.date,
        dateModified: post.modified,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        articleSection: post.categories.length ? post.categories : undefined,
        author: articleAuthor(),
        wordCount,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-NG",
      }
    ],
  };

  return (
    <article className="bg-white">
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
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-white/75 text-sm">
            <Calendar size={15} className="text-gold" aria-hidden="true" />
            {AUTHOR.bylineApproved ? (
              <span>
                By{" "}
                <Link href={AUTHOR.path} rel="author" className="text-gold hover:underline">
                  {AUTHOR.name}
                </Link>
              </span>
            ) : (
              <span>By {SITE_NAME}</span>
            )}
            <span aria-hidden="true">·</span>
            <span>Published <time dateTime={new Date(post.date).toISOString()}>{fmtDate(post.date)}</time></span>
            {post.modified && fmtDate(post.modified) !== fmtDate(post.date) && (
              <>
                <span aria-hidden="true">·</span>
                <span>Updated <time dateTime={new Date(post.modified).toISOString()}>{fmtDate(post.modified)}</time></span>
              </>
            )}
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

        {isArticle && AUTHOR.bylineApproved && (
          <aside aria-label="About the author" className="mt-14 flex gap-5 border border-midnight/10 bg-ivory p-5 sm:p-6">
            <Image
              src={AUTHOR.image}
              alt={AUTHOR.name}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
            />
            <div>
              <p className="text-[11px] tracking-[0.24em] uppercase text-gold-deep">Written by</p>
              <p className="font-display text-xl text-midnight mt-1">
                <Link href={AUTHOR.path} rel="author" className="hover:underline">
                  {AUTHOR.name}
                </Link>
              </p>
              <p className="mt-1 text-sm text-midnight/70">
                {AUTHOR.role} of {SITE_NAME}, a prayer and deliverance ministry based in Ikorodu, Lagos.{" "}
                <Link href={AUTHOR.path} className="text-maroon underline">
                  More about him
                </Link>
              </p>
            </div>
          </aside>
        )}

        {related.length > 0 && (
          <nav aria-labelledby="related-heading" className="mt-14">
            <h2 id="related-heading" className="font-display text-2xl sm:text-3xl text-midnight">
              Related articles
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/${r.slug}/`}
                    className="block h-full border border-midnight/10 bg-white p-4 hover:border-gold/60 transition-colors"
                  >
                    <span className="font-display text-lg text-midnight leading-snug line-clamp-2">{r.title}</span>
                    {r.excerpt && <span className="mt-1 block text-sm text-midnight/60 line-clamp-2">{r.excerpt}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

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
