"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  placeholder?: string;
  rows?: number;
};

type Props = {
  intent: string;
  fields?: Field[];
  submitLabel?: string;
};

const DEFAULT_FIELDS: Field[] = [
  { name: "name", label: "Full Name", required: true, placeholder: "How shall we address you?" },
  { name: "email", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
  { name: "phone", label: "Phone or WhatsApp", type: "tel", placeholder: "+234 …" },
  { name: "country", label: "City & Country", placeholder: "e.g. Lagos, Nigeria" },
];

export function RequestForm({
  intent,
  fields = DEFAULT_FIELDS,
  submitLabel = "Submit Request",
}: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, fields: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-gold/40 bg-ivory-dark p-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center border border-gold text-gold">
          <Check />
        </div>
        <h3 className="font-display text-3xl text-midnight">Received in the Spirit</h3>
        <p className="mt-3 text-midnight/70 max-w-md mx-auto">
          Thank you for trusting us with your {intent.toLowerCase()}. Our
          intercessors will lift you up in prayer. You may also reach us
          directly on WhatsApp for an immediate response.
        </p>
        <p className="mt-6 text-xs tracking-[0.3em] uppercase text-gold-deep">
          “The prayer of a righteous person has great power.” — James 5:16
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-midnight/10 bg-ivory p-8 md:p-10 paper-grain"
    >
      <p className="eyebrow text-gold-deep">
        <span className="gold-rule mr-3" />
        {intent}
      </p>
      <h3 className="font-display text-3xl md:text-4xl text-midnight mt-3">
        Send your request
      </h3>
      <p className="mt-2 text-midnight/70 text-sm max-w-md">
        We treat every request with confidentiality and reverence. Expect a
        response within 24 hours.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {fields.map((f) => {
          const wide = f.type === "textarea";
          return (
            <label
              key={f.name}
              className={`block ${wide ? "md:col-span-2" : ""}`}
            >
              <span className="block text-[11px] tracking-[0.28em] uppercase text-midnight/60 mb-1">
                {f.label}
                {f.required && <span className="text-gold-deep ml-1">*</span>}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  name={f.name}
                  required={f.required}
                  rows={f.rows ?? 5}
                  placeholder={f.placeholder}
                  className="input-line resize-none"
                />
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="input-line"
                />
              )}
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 border-l-2 border-midnight-soft bg-midnight-soft/5 px-4 py-3 text-sm text-midnight">
          {error}
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-6">
        <p className="text-xs text-midnight/50 max-w-xs">
          By submitting, you agree to be contacted by VOGIM regarding your
          request.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn-gold disabled:opacity-60"
        >
          {loading ? "Sending…" : submitLabel}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
