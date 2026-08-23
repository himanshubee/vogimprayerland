"use client";

import { useState } from "react";
import { Download, Loader2, Search } from "lucide-react";

type Link = { title: string; url: string };

const labelCls =
  "block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1";

/**
 * Recover the download links for an order already paid for.
 *
 * The buyer proves ownership with the pair (order reference + the email on the
 * order). On success the server emails fresh links; if SMTP is not configured
 * it hands them back here instead, so a lost link is never a lost book.
 */
export function LibraryClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLinks([]);
    setLoading(true);

    const data = new FormData(e.currentTarget);

    try {
      // Trailing slash: next.config sets trailingSlash, so the slash-less path
      // answers with a 308 rather than reaching the handler.
      const res = await fetch("/api/shop/resend/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: data.get("reference"),
          email: data.get("email"),
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload.error || "We could not look that up. Please try again.");
      }

      setMessage(payload.message ?? null);
      if (Array.isArray(payload.links)) setLinks(payload.links);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-midnight/15 bg-white p-8 sm:p-10">
      <form onSubmit={onSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>
              Order reference <span className="text-gold-deep">*</span>
            </span>
            <input
              name="reference"
              required
              className="input-line font-mono text-sm"
              placeholder="VOGIM-BOOK-…"
            />
            <span className="mt-2 block text-xs text-midnight/45">
              It appears on your receipt page and in the email we sent you.
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className={labelCls}>
              Email on the order <span className="text-gold-deep">*</span>
            </span>
            <input
              name="email"
              type="email"
              required
              className="input-line"
              placeholder="your@email.com"
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-7 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-7 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm text-midnight"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold mt-8 w-full sm:w-auto justify-center disabled:opacity-60"
        >
          {loading ? (
            <>
              Looking it up <Loader2 size={16} className="animate-spin" />
            </>
          ) : (
            <>
              Retrieve my books <Search size={15} />
            </>
          )}
        </button>
      </form>

      {links.length > 0 && (
        <div className="mt-9 border-t border-midnight/12 pt-7">
          <p className="eyebrow text-gold-deep mb-4">Your downloads</p>
          <ul className="divide-y divide-midnight/10">
            {links.map((link) => (
              <li
                key={link.url}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <span className="font-display text-xl text-midnight">
                  {link.title}
                </span>
                <a
                  href={link.url}
                  className="btn-gold !py-2.5 !px-5 !text-[11px]"
                  rel="nofollow noreferrer"
                >
                  <Download size={14} /> Download PDF
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
