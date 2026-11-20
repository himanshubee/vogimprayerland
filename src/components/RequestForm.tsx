"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { track } from "@/lib/tracking";
import { WhatsAppLink } from "./WhatsAppLink";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  rows?: number;
  options?: string[];
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
};

type Props = {
  intent: string;
  fields: Field[];
  submitLabel?: string;
  preferredContact?: boolean;
  timezone?: boolean;
  purpose?: "prayer" | "response";
};

const EVENTS: Record<string, string> = {
  "Prayer Request": "prayer_request_submit",
  "Healing Request": "healing_request_submit",
  "Deliverance Request": "deliverance_request_submit",
  "Dream Interpretation": "dream_request_submit",
  "General Enquiry": "contact_submit",
  "Partner Form": "partner_form_submit",
  "Refund Request": "refund_request",
};

const DEFAULT_FIELDS: Field[] = [
  { name: "name", label: "Name", required: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", inputMode: "email" },
  { name: "phone", label: "Phone or WhatsApp (optional)", type: "tel", autoComplete: "tel", inputMode: "tel" },
  { name: "country", label: "City and country (optional)", autoComplete: "country-name" },
];

export function RequestForm({ intent, fields = DEFAULT_FIELDS, submitLabel = "Send my request", preferredContact = false, timezone = false, purpose = "prayer" }: Props) {
  const prayerFlow = purpose === "prayer";
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const startedTracking = useRef(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const draftKey = `vogim_form_draft_${intent.toLowerCase().replace(/\s+/g, "_")}`;
  const draftEnabled = process.env.NEXT_PUBLIC_CARE_REFRESH_V1 === "true";

  useEffect(() => {
    if (!draftEnabled || !formRef.current) return;
    const frame = requestAnimationFrame(() => {
      try {
        const draft = JSON.parse(localStorage.getItem(draftKey) || "null") as Record<string, string> | null;
        if (!draft || !formRef.current) return;
        for (const [name, value] of Object.entries(draft)) {
          const field = formRef.current.elements.namedItem(name);
          if (field instanceof HTMLInputElement && field.type === "checkbox") field.checked = value === "true";
          else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) field.value = value;
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, [draftEnabled, draftKey]);

  // Start the bot-timing clock when the form appears, not when it is sent.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!timezone || !formRef.current) return;
    const frame = requestAnimationFrame(() => {
      const field = formRef.current?.elements.namedItem("timezone");
      if (field instanceof HTMLInputElement && !field.value) field.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    });
    return () => cancelAnimationFrame(frame);
  }, [timezone]);

  function saveDraft() {
    if (!startedTracking.current) {
      startedTracking.current = true;
      if (intent === "Prayer Request") track("prayer_request_start", { page_type: "request" });
    }
    if (!draftEnabled || !formRef.current) return;
    const data = new FormData(formRef.current);
    const draft: Record<string, string> = {};
    data.forEach((value, key) => {
      if (!["website", "formElapsedMs"].includes(key)) draft[key] = String(value);
    });
    try { localStorage.setItem(draftKey, JSON.stringify(draft)); } catch {}
  }

  function validate(form: HTMLFormElement) {
    const errors: Record<string, string> = {};
    for (const field of Array.from(form.elements)) {
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        if (!field.validity.valid && field.name) errors[field.name] = field.validationMessage;
      }
    }
    setFieldErrors(errors);
    const first = Object.keys(errors)[0];
    if (first) form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)?.focus();
    return Object.keys(errors).length === 0;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate(event.currentTarget)) return;
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => { payload[key] = String(value); });
    // Elapsed time, not a timestamp, so a phone clock that is wrong cannot make a real request look like a bot.
    payload.formElapsedMs = String(startedAt.current ? Date.now() - startedAt.current : 0);

    try {
      const res = await fetch("/api/submissions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, fields: payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "We could not send your request. Please try again.");
      }
      setSent(true);
      try { localStorage.removeItem(draftKey); } catch {}
      if (EVENTS[intent]) track(EVENTS[intent], { page_type: "request" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not send your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-7 sm:p-10" role="status">
        <CheckCircle size={42} weight="duotone" className="text-leaf" aria-hidden="true" />
        <h2 className="mt-4 font-display text-4xl text-maroon">We have received your request.</h2>
        <p className="mt-3 text-slate">The team will review it and arrange any follow-up that is needed.</p>
        <ol className="mt-6 list-decimal space-y-2 pl-6 text-slate">{prayerFlow ? <><li>Your request goes privately to the prayer team.</li><li>Intercessors pray over requests each morning.</li><li>A pastor may contact you for follow-up or to arrange a session.</li></> : <><li>Your request goes to the responsible team.</li><li>The team reviews the details you supplied.</li><li>A team member contacts you about the next steps.</li></>}</ol>
        <div className="mt-7"><WhatsAppLink className="btn-ghost" /></div>
      </div>
    );
  }

  const allFields = [...fields];
  if (preferredContact) allFields.push({ name: "preferredContact", label: "Preferred contact channel (optional)", type: "select", options: ["Email", "WhatsApp", "Phone"] });
  if (timezone) allFields.push({ name: "timezone", label: "Your time zone (editable)", required: true, placeholder: "For example, Africa/Lagos" });

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={saveDraft} onInvalid={(event) => {
      const field = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (field.name) setFieldErrors((errors) => ({ ...errors, [field.name]: field.validationMessage }));
    }} noValidate className="card bg-white p-6 sm:p-8" aria-label={intent}>
      <h2 className="font-display text-4xl text-maroon">{intent}</h2>
      <p className="mt-2 text-sm text-slate">You can share as much or as little as you like. Health, family and marriage details are optional.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {allFields.map((field) => {
          const id = `${intent.toLowerCase().replace(/\s+/g, "-")}-${field.name}`;
          const errorId = `${id}-error`;
          const wide = field.type === "textarea" || field.name === "timezone";
          return (
            <div key={field.name} className={wide ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">{field.label}{field.required && <span className="ml-1 text-coral" aria-label="required">*</span>}</label>
              {field.type === "textarea" ? (
                <textarea id={id} name={field.name} required={field.required} rows={field.rows ?? 5} placeholder={field.placeholder} className="input-line" aria-invalid={Boolean(fieldErrors[field.name])} aria-describedby={fieldErrors[field.name] ? errorId : undefined} autoComplete={field.autoComplete} />
              ) : field.type === "select" ? (
                <select id={id} name={field.name} required={field.required} className="input-line" defaultValue="" aria-invalid={Boolean(fieldErrors[field.name])} aria-describedby={fieldErrors[field.name] ? errorId : undefined}>
                  <option value="" disabled>Choose one</option>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input id={id} name={field.name} type={field.type ?? "text"} required={field.required} placeholder={field.placeholder} className="input-line" autoComplete={field.autoComplete} inputMode={field.inputMode} aria-invalid={Boolean(fieldErrors[field.name])} aria-describedby={fieldErrors[field.name] ? errorId : undefined} />
              )}
              {fieldErrors[field.name] && <p id={errorId} className="mt-2 text-sm text-coral" role="alert">{fieldErrors[field.name]}</p>}
            </div>
          );
        })}
      </div>

      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor={`${intent}-website`}>Leave this field empty</label><input id={`${intent}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" /></div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate">
        <input type="checkbox" name="sensitiveConsent" value="true" required className="mt-1 h-5 w-5 shrink-0 accent-maroon" />
        <span>I consent to VOGIM using the details I choose to share to {prayerFlow ? "pray for me" : "review this request"} and reply. <span className="text-coral" aria-label="required">*</span></span>
      </label>
      {fieldErrors.sensitiveConsent && <p className="mt-2 text-sm text-coral" role="alert">{fieldErrors.sensitiveConsent}</p>}

      <p className="mt-5 text-sm text-slate">If you are under 18, please ask a parent or guardian to send the request.</p>
      {error && <p className="mt-5 rounded-xl border border-coral bg-white p-4 text-sm text-coral" role="alert">{error}</p>}
      <button type="submit" disabled={loading} className="btn-gold mt-6 w-full justify-center">{loading ? "Sending…" : submitLabel}<ArrowRight size={19} aria-hidden="true" /></button>
      <p className="mt-4 text-center text-xs leading-5 text-slate">We will use this to {prayerFlow ? "pray for you" : "review your request"} and reply. We keep requests private. See our <Link href="/privacy-policy/" className="text-maroon underline">Privacy Policy</Link>{prayerFlow && <> and <Link href="/how-requests-work/" className="text-maroon underline">how requests work</Link></>}.</p>
      <p className="sr-only" aria-live="polite">{loading ? "Sending your request" : ""}</p>
    </form>
  );
}
