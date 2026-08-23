"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus, Check, Loader2 } from "lucide-react";

/**
 * Crusade registration.
 *
 * Registrations are POSTed to /api/submissions — the same endpoint every other
 * form on the site uses — so a registrant lands in the admin dashboard, is
 * emailed to the ministry inbox, and becomes a CRM contact automatically. The
 * team reads and exports them from /admin, which is password-protected.
 */

const PROGRAM = "War Against the Marine Kingdom";
const ZOOM_ID = "788 5810 191";

type Errors = { name?: boolean; email?: boolean; phone?: boolean };

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v: string) => v.replace(/[^0-9]/g, "").length >= 7;

const labelCls =
  "block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1";

export function RegisterForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    const next: Errors = {
      name: !name,
      email: !validEmail(email),
      phone: !validPhone(phone),
    };
    setErrors(next);
    if (next.name || next.email || next.phone) return;

    setLoading(true);
    try {
      // Trailing slash: next.config sets trailingSlash, so the slash-less path
      // answers with a 308 rather than reaching the handler.
      const res = await fetch("/api/submissions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "Crusade Registration",
          fields: {
            name,
            email,
            phone,
            program: PROGRAM,
            message: `Registered for ${PROGRAM} — three nights from 25 Sep 2026, 7PM WAT`,
          },
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload.error || "We could not save your registration. Please try again."
        );
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-gold/50 bg-ivory p-8 sm:p-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gold text-gold">
          <Check size={24} />
        </div>
        <h3 className="font-display text-3xl text-midnight">
          Your seat is <span className="italic text-gold-deep">reserved</span>
        </h3>
        <p className="mt-4 text-midnight/70 max-w-md mx-auto leading-relaxed">
          See you on <strong className="text-midnight">Friday 25 September, 7:00 PM WAT</strong>{" "}
          — Zoom ID <strong className="text-midnight">{ZOOM_ID}</strong>. Watch your
          email and WhatsApp for the join link.
        </p>

        <a
          href="/war-against-marine-kingdom.ics"
          download="war-against-marine-kingdom.ics"
          className="btn-ghost text-midnight border-midnight/30 mt-8 justify-center"
        >
          <CalendarPlus size={15} /> Add all three nights to my calendar
        </a>

        <p className="mt-6 text-xs text-midnight/50">
          Need prayer before the crusade?{" "}
          <Link href="/prayer-request/" className="text-gold-deep u-link">
            Send a prayer request
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="border border-midnight/15 bg-ivory p-8 sm:p-10">
      <p className="eyebrow text-gold-deep">
        <span className="gold-rule mr-3" />
        Register to join live
      </p>
      <h3 className="font-display text-3xl text-midnight mt-4 leading-tight">
        Reserve your seat
      </h3>
      <p className="mt-3 text-sm text-midnight/65 leading-relaxed">
        Entry is free. We will send the Zoom link and the WhatsApp group invite
        to the details below.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelCls}>
            Full name <span className="text-gold-deep">*</span>
          </span>
          <input
            name="name"
            className="input-line"
            placeholder="e.g. Grace Adebayo"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <span className="mt-1.5 block text-xs text-midnight-soft">
              Please enter your name.
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelCls}>
            Email <span className="text-gold-deep">*</span>
          </span>
          <input
            name="email"
            type="email"
            className="input-line"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="mt-1.5 block text-xs text-midnight-soft">
              Please enter a valid email.
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelCls}>
            Phone or WhatsApp <span className="text-gold-deep">*</span>
          </span>
          <input
            name="phone"
            type="tel"
            className="input-line"
            placeholder="+234 800 000 0000"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && (
            <span className="mt-1.5 block text-xs text-midnight-soft">
              Please enter a valid phone number.
            </span>
          )}
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

      <button
        type="submit"
        disabled={loading}
        className="btn-gold mt-8 w-full sm:w-auto justify-center disabled:opacity-60"
      >
        {loading ? (
          <>
            Reserving <Loader2 size={16} className="animate-spin" />
          </>
        ) : (
          <>
            Reserve my seat <ArrowUpRight size={16} />
          </>
        )}
      </button>

      <p className="mt-5 text-xs text-midnight/50 leading-relaxed">
        Your details are kept for this programme only, and are never sold or
        shared. See our{" "}
        <Link href="/privacy-policy/" className="text-gold-deep u-link">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
