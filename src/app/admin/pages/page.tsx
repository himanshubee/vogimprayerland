import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { PAGE_SCHEMAS } from "@/lib/page-content";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FileText, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pages — VOGIM Admin" };

export default async function AdminPagesPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-ivory-dark text-ink">
      <header className="sticky top-0 z-20 bg-midnight text-white">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-4 flex items-center gap-5">
          <div>
            <p className="eyebrow text-gold leading-none">VOGIM Admin</p>
            <h1 className="font-display text-xl sm:text-2xl mt-1 leading-none">Pages</h1>
          </div>
          <AdminTabs />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-8">
        <p className="text-sm text-midnight/55 mb-5">
          Edit the headings, copy, images, and buttons on the main marketing pages.
          Changes go live within a few minutes.
        </p>
        <div className="bg-white border border-midnight/10 divide-y divide-midnight/8">
          {PAGE_SCHEMAS.map((s) => (
            <Link
              key={s.key}
              href={`/admin/pages/${s.key}`}
              className="flex items-center gap-4 p-4 hover:bg-ivory/60 transition-colors"
            >
              <FileText size={18} className="text-gold-deep shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-midnight">{s.label}</p>
                <p className="text-xs text-midnight/45">
                  {s.path} · {s.fields.length} fields
                </p>
              </div>
              <ChevronRight size={16} className="text-midnight/30" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
