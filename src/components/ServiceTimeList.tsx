"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, VideoCamera } from "@phosphor-icons/react";
import { MINISTRY, type Service } from "@/lib/ministry";
import { calendarHref, getNextOccurrence, localServiceTime } from "@/lib/services";

function ServiceRow({ service }: { service: Service }) {
  const [local, setLocal] = useState("");
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLocal(localServiceTime(getNextOccurrence(service).occurrence)));
    return () => cancelAnimationFrame(frame);
  }, [service]);
  return (
    <article className="card p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-3xl text-maroon">{service.name}</h2>
          <p className="mt-2 font-semibold text-ink">{service.day} · {service.displayTime}</p>
          <p className="mt-1 text-slate">{service.mode}</p>
          <p className="mt-2 min-h-7 text-sm text-slate">{local && `Your local time: ${local}`}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          {service.joinUrl && <a href={service.joinUrl} target="_blank" rel="noreferrer" className="btn-gold justify-center"><VideoCamera size={22} weight="duotone" />Join on Zoom</a>}
          <a href={calendarHref(service)} className="btn-ghost justify-center"><CalendarPlus size={22} weight="duotone" />Add to calendar</a>
        </div>
      </div>
    </article>
  );
}

export function ServiceTimeList() {
  return <div className="space-y-5">{MINISTRY.services.map((service) => <ServiceRow key={service.id} service={service} />)}</div>;
}
