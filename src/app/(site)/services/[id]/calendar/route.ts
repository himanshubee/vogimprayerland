import { MINISTRY } from "@/lib/ministry";
import { getNextOccurrence } from "@/lib/services";

function calendarDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = MINISTRY.services.find((item) => item.id === id);
  if (!service) return new Response("Not found", { status: 404 });
  const start = getNextOccurrence(service).occurrence;
  const end = new Date(start.getTime() + service.durationMinutes * 60_000);
  const location = service.joinUrl || `${MINISTRY.address.streetAddress}, ${MINISTRY.address.addressLocality}, ${MINISTRY.address.addressRegion}, Nigeria`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VOGIM Prayer Land//Services//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${service.id}@vogimprayerland.org`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;TZID=Africa/Lagos:${calendarDate(start)}`,
    `DTEND;TZID=Africa/Lagos:${calendarDate(end)}`,
    "RRULE:FREQ=WEEKLY",
    `SUMMARY:${service.name} — VOGIM Prayer Land`,
    `LOCATION:${location}`,
    service.joinUrl ? `URL:${service.joinUrl}` : `URL:https://www.vogimprayerland.org/visit/`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${service.id}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
