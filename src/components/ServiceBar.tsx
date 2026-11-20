"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "@phosphor-icons/react";
import { getNextService, localServiceTime } from "@/lib/services";
import { track } from "@/lib/tracking";

const HIDDEN = ["request", "give", "checkout", "policy", "terms-and-conditions", "privacy-requests"];
const DISMISS_KEY = "vogim_service_bar_dismissed";

export function ServiceBar() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [local, setLocal] = useState("");
  const [next] = useState(() => getNextService());

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setDismissed(until > Date.now());
      if (next) setLocal(localServiceTime(next.occurrence));
    });
    return () => cancelAnimationFrame(frame);
  }, [next]);

  useEffect(() => {
    if (!dismissed && next) track("service_bar_view", { page_type: "services" });
  }, [dismissed, next]);

  if (!next || dismissed || HIDDEN.some((part) => pathname.includes(part))) return null;

  return (
    <aside className="relative flex min-h-12 items-center justify-center bg-midnight-dark px-12 py-2 text-center text-xs text-white sm:text-sm" aria-label="Service announcement">
      <span>
        Next online service: {next.service.day}, {next.service.displayTime}
        {local && ` (${local})`}.{" "}
        {next.service.joinUrl && (
          <a href={next.service.joinUrl} target="_blank" rel="noreferrer" className="font-semibold text-gold underline underline-offset-4" onClick={() => track("service_bar_click", { cta_id: "service-bar", cta_location: "service_bar" })}>
            Join on Zoom <span aria-hidden="true">→</span>
          </a>
        )}
      </span>
      <button type="button" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white" aria-label="Dismiss announcement" onClick={() => {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
        setDismissed(true);
        track("service_bar_dismiss");
      }}>
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
