import type { Metadata } from "next";
import { SimplePage } from "@/components/SimplePage";
import { ServiceTimeList } from "@/components/ServiceTimeList";
import { FaqList } from "@/components/FaqList";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";

export const metadata: Metadata = {
  title: "Online Prophetic Service on Zoom, Mon and Sat | VOGIM",
  description: "Join VOGIM Prayer Land online on Mondays and Saturdays at 10:00 PM WAT. See every weekly service, your local time and calendar links. No Zoom account needed.",
  alternates: { canonical: absoluteUrl("/services/") },
};

const FAQS = [
  { question: "What time is the service in my country?", answer: "Each service card uses your browser's time zone to show your local time beside West Africa Time. WAT does not change with daylight-saving time." },
  { question: "Do I need a Zoom account?", answer: "No. The public Zoom room needs no account or registration. The passcode is built into the join link." },
  { question: "When are the services?", answer: "Online Prophetic Services are Mondays and Saturdays at 10:00 PM WAT. Bible Study is Wednesdays at 7:00 PM WAT. Sunday Worship is 9:00 AM WAT, in person and by livestream." },
  { question: "How do I add a service to my calendar?", answer: "Choose Add to calendar on the relevant service card. Your device will download a recurring calendar file with the WAT start time and weekly repeat." },
];

const events = MINISTRY.services.map((service) => ({
  "@type": "Event",
  name: service.name,
  eventAttendanceMode: service.joinUrl ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/MixedEventAttendanceMode",
  eventSchedule: {
    "@type": "Schedule",
    byDay: service.byDay,
    startTime: service.time,
    scheduleTimezone: "Africa/Lagos",
  },
  location: service.joinUrl
    ? { "@type": "VirtualLocation", url: service.joinUrl }
    : [
        { "@type": "VirtualLocation", url: absoluteUrl("/media/") },
        { "@type": "Place", name: MINISTRY.name, address: { "@type": "PostalAddress", ...MINISTRY.address } },
      ],
  organizer: { "@id": `${absoluteUrl()}#organization` },
}));

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": events }) }} />
      <SimplePage eyebrow="Services and Zoom" title="Online Prophetic Service and weekly gatherings" intro="Join VOGIM Prayer Land from anywhere. See every recurring service in West Africa Time and your own local time, then join on Zoom or add it to your calendar. No Zoom account is needed.">
        <ServiceTimeList />
        <aside className="mt-8 rounded-2xl bg-mist p-6 text-slate"><h2 className="font-display text-2xl text-maroon">Joining with a meeting ID</h2><p className="mt-2">Open Zoom, choose Join a Meeting and enter Meeting ID <strong>{MINISTRY.meetingId}</strong>. The public service passcode is already included in the join links above.</p></aside>
      </SimplePage>
      <FaqList faqs={FAQS} relatedPath="/services/" />
    </>
  );
}
