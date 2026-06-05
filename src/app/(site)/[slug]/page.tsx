import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { getPostBySlug } from "@/lib/posts";

export const dynamicParams = true; // generate posts on-demand, then cache (ISR)
export const revalidate = 300;

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
  return {
    title: `${post.title} — VOGIM Prayer Land`,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
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

  return (
    <article className="bg-white">
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
