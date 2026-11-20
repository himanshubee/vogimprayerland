import { notFound } from "next/navigation";
import { SimplePage } from "@/components/SimplePage";
import { getOwnerPage, type OwnerPageKey } from "@/lib/owner-content";

/** Renders leadership-approved page text exactly as supplied. 404 until approved. */
export function OwnerPage({ pageKey }: { pageKey: OwnerPageKey }) {
  const page = getOwnerPage(pageKey);
  if (!page) notFound();
  return (
    <SimplePage eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
      <div className="space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-3xl text-maroon">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-slate">{section.body.map((p) => <p key={p}>{p}</p>)}</div>
          </section>
        ))}
      </div>
      {page.lastUpdated && <p className="mt-12 text-sm text-slate">Last updated {page.lastUpdated}</p>}
    </SimplePage>
  );
}

export function ownerPageMetadata(pageKey: OwnerPageKey, canonical: string) {
  const page = getOwnerPage(pageKey);
  if (!page) return { robots: { index: false, follow: false } };
  return { title: `${page.title} | VOGIM Prayer Land`, description: page.metaDescription, alternates: { canonical } };
}
