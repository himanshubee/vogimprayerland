"use client";

import { useState } from "react";
import styles from "./crusade.module.css";

/**
 * Crusade registration.
 *
 * Registrations are POSTed to /api/submissions — the same endpoint every other
 * form on the site uses — so a registrant lands in the admin dashboard, is
 * emailed to the ministry inbox, and becomes a CRM contact automatically. The
 * team reads and exports them from /admin, which is password-protected.
 *
 * (The original mockup kept registrations in browser storage behind a passcode
 * written into the page itself. That would have put every registrant's name,
 * email and phone one "view source" away from any visitor.)
 */

const PROGRAM = "War Against Marine Kingdom";
const ZOOM_ID = "788 5810 191";

type Errors = { name?: boolean; email?: boolean; phone?: boolean };

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v: string) => v.replace(/[^0-9]/g, "").length >= 7;

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
            message: `Registered for ${PROGRAM} (3 nights, from 25 Sep 2026)`,
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
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.success}>
        <div className={styles.check} aria-hidden="true">
          ✓
        </div>
        <h2>You&rsquo;re registered</h2>
        <p>
          See you <b>Fri 25 Sep, 7:00 PM WAT</b> — Zoom ID <b>{ZOOM_ID}</b>.
          <br />
          Watch your email and WhatsApp for the join link.
        </p>
        <a
          className={styles.calendarLink}
          href="/war-against-marine-kingdom.ics"
          download="war-against-marine-kingdom.ics"
        >
          Add the three nights to my calendar
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className={`${styles.field} ${errors.name ? styles.invalid : ""}`}>
        <label htmlFor="name">Full name</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="e.g. Grace Adebayo"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <div className={styles.err}>Please enter your name.</div>}
      </div>

      <div className={`${styles.field} ${errors.email ? styles.invalid : ""}`}>
        <label htmlFor="email">Email address</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && (
          <div className={styles.err}>Please enter a valid email.</div>
        )}
      </div>

      <div className={`${styles.field} ${errors.phone ? styles.invalid : ""}`}>
        <label htmlFor="phone">Phone number (WhatsApp preferred)</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="+234 800 000 0000"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
        />
        {errors.phone && (
          <div className={styles.err}>Please enter a valid phone number.</div>
        )}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? "Reserving…" : "Reserve my seat"}
      </button>

      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}

      <p className={styles.fine}>
        You&rsquo;ll receive the Zoom link and WhatsApp group invite. Your details
        are kept for this program only.
      </p>
    </form>
  );
}
