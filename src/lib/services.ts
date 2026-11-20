import { MINISTRY, type Service } from "@/lib/ministry";

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function watParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: DAY_INDEX[value("weekday")],
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

export function getNextOccurrence(service: Service, now = new Date()) {
  const current = watParts(now);
  const [hour, minute] = service.time.split(":").map(Number);
  const serviceDay = DAY_INDEX[service.day];
  const dayDelta = (serviceDay - current.day + 7) % 7;
  let deltaMinutes = dayDelta * 1440 + hour * 60 + minute - current.minutes;
  if (deltaMinutes <= -service.durationMinutes) {
    deltaMinutes += 7 * 1440;
  }
  return {
    service,
    occurrence: new Date(now.getTime() + deltaMinutes * 60_000),
    deltaMinutes,
  };
}

export function getNextService(now = new Date()) {
  let best: ReturnType<typeof getNextOccurrence> | null = null;
  for (const service of MINISTRY.services) {
    const next = getNextOccurrence(service, now);
    if (!best || next.deltaMinutes < best.deltaMinutes) best = next;
  }
  return best;
}

export function localServiceTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function serviceIsSoon(deltaMinutes: number, duration: number) {
  return deltaMinutes <= 60 && deltaMinutes >= -duration;
}

export function calendarHref(service: Service) {
  return `/services/${service.id}/calendar/`;
}
