import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getPublishedPosts, countPublishedPosts } from "@/lib/posts";

export const revalidate = 300;
export const metadata = {
  alternates: { canonical: "/blog/" },
  title: "Articles & Prayer Points — VOGIM Prayer Land",
  description:
    "Deliverance prayer points, teachings, and faith articles from VOGIM Deliverance Ministries.",
};

const PER_PAGE = 12;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);

  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  let total = 0;
  try {
    [posts, total] = await Promise.all([
      getPublishedPosts({ limit: PER_PAGE, skip: (current - 1) * PER_PAGE }),
      countPublishedPosts("post"),
    ]);
  } catch {
    // DB not reachable at build/render time — render an empty shell.
  }
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader
        eyebrow="Articles"
        title={
          <>
            Prayer points &amp;
            <br />
            <span className="italic text-gold">words of fire.</span>
          </>
        }
        intro="Deliverance prayer points, prophetic teachings, and articles to build your faith and break every yoke."
      />

      <section className="relative bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 sm:py-24">
          {posts.length === 0 ? (
            <p className="text-center text-midnight/60 py-20 font-display text-2xl">
              No articles published yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i * 0.05, 0.4)}>
                  <Link
                    href={`/${p.slug}/`}
                    className="group flex flex-col h-full bg-white border border-midnight/10 hover:border-gold/50 transition-colors overflow-hidden"
                  >
                    <div className="relative aspect-[16/10] bg-midnight overflow-hidden">
                      {p.featuredImage ? (
                        <Image
                          src={p.featuredImage}
                          alt={p.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 starfield opacity-50" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent opacity-60" />
                      {p.categories[0] && (
                        <span className="absolute top-3 left-3 text-[10px] tracking-[0.24em] uppercase text-midnight bg-gold px-2.5 py-1">
                          {p.categories[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                      <p className="flex items-center gap-1.5 text-[11px] text-midnight/45">
                        <Calendar size={12} /> {fmtDate(p.date)}
                      </p>
                      <h2 className="font-display text-xl text-midnight mt-2 leading-snug line-clamp-3 group-hover:text-midnight-soft transition-colors">
                        {p.title}
                      </h2>
                      <p className="mt-2 text-sm text-midnight/60 line-clamp-2 flex-1">
                        {p.excerpt}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] tracking-[0.24em] uppercase text-gold-deep">
                        Read article
                        <ArrowUpRight
                          size={14}
                          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-3">
              {current > 1 && (
                <Link
                  href={`/blog/?page=${current - 1}`}
                  className="btn-ghost text-midnight border-midnight/30 !py-2.5 !px-5"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-midnight/60 tabular-nums px-2">
                Page {current} of {totalPages}
              </span>
              {current < totalPages && (
                <Link
                  href={`/blog/?page=${current + 1}`}
                  className="btn-gold !py-2.5 !px-5"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
