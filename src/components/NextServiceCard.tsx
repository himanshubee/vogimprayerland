"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, VideoCamera } from "@phosphor-icons/react";
import { calendarHref, getNextService, localServiceTime } from "@/lib/services";
import { track } from "@/lib/tracking";

export function NextServiceCard() {
  const [next] = useState(() => getNextService());
  const [local, setLocal] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (next) setLocal(localServiceTime(next.occurrence));
    });
    return () => cancelAnimationFrame(frame);
  }, [next]);

  if (!next) return null;
  const { service } = next;
  return (
    <article className="card mx-auto flex max-w-4xl flex-col items-center gap-6 p-6 text-center sm:p-8 md:flex-row md:text-left">
      <div className="flex-1">
        <p className="eyebrow text-gold-deep">Next service</p>
        <h2 className="mt-2 font-display text-3xl text-maroon">{service.name}</h2>
        <p className="mt-2 text-slate">{service.day} · {service.displayTime} · {service.mode}</p>
        <p className="mt-1 min-h-7 text-sm text-slate">{local ? `Your local time: ${local}` : "Your local time is shown after the page loads."}</p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto">
        {service.joinUrl && (
          <a href={service.joinUrl} target="_blank" rel="noreferrer" className="btn-gold justify-center" onClick={() => track("join_service_click", { service: service.day.toLowerCase(), cta_id: "next-service" })}>
            <VideoCamera size={22} weight="duotone" />Join on Zoom
          </a>
        )}
        <a href={calendarHref(service)} className="btn-ghost justify-center" onClick={() => track("add_to_calendar", { service: service.day.toLowerCase() })}>
          <CalendarPlus size={22} weight="duotone" />Add to calendar
        </a>
      </div>
    </article>
  );
}
