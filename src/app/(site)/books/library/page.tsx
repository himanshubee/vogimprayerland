import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { TOKEN_TTL_DAYS } from "@/lib/book-tokens";
import { LibraryClient } from "./LibraryClient";

export const metadata: Metadata = {
  title: "Retrieve your books — VOGIM Prayer Land",
  description:
    "Lost your download link? Enter your order reference and email to have fresh links issued.",
  robots: { index: false, follow: true },
};

export default function LibraryPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Bookshop"
        title={
          <>
            Retrieve your <span className="italic text-gold">books</span>
          </>
        }
        intro={`Download links stay active for ${TOKEN_TTL_DAYS} days. If yours has expired — or the email never arrived — enter your order reference and email below and fresh links will be issued at once.`}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-2xl px-5 sm:px-6 py-16 sm:py-24">
          <LibraryClient />

          <p className="mt-8 text-center text-xs text-midnight/50 leading-relaxed">
            Cannot find your reference?{" "}
            <Link href="/contact/" className="text-gold-deep u-link">
              Write to us
            </Link>{" "}
            with the email address you paid from and we will find the order for you.
          </p>
        </div>
      </section>
    </>
  );
}
