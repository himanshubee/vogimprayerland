import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

export const metadata = {
  title: "Contact — VOGIM Prayer Land",
  description:
    "Reach VOGIM Deliverance Ministries — Lagos, Nigeria. Online and in person.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        image="/images/slider1.jpg"
        eyebrow="Contact Us"
        title={
          <>
            Let&apos;s talk —
            <br />
            <span className="italic text-gold">we&apos;re ready to listen.</span>
          </>
        }
        intro="Send a note, drop by the church, or join us online for prophetic service. We respond to every message personally."
      />

      <section className="bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.3fr] gap-14">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Reach the ministry
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-midnight mt-4 leading-tight">
              In Lagos. <span className="italic">Online everywhere.</span>
            </h2>

            <ul className="mt-10 space-y-7">
              <li className="flex gap-4">
                <MapPin className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="eyebrow text-midnight/60 mb-1">Visit</p>
                  <p className="font-display text-xl text-midnight leading-snug">
                    18 Association Avenue,<br />
                    Owutu-Agric, Ikorodu,<br />
                    Lagos State, Nigeria
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="eyebrow text-midnight/60 mb-1">Email</p>
                  <a
                    href="mailto:hello@vogimprayerland.org"
                    className="font-display text-xl text-midnight u-link"
                  >
                    hello@vogimprayerland.org
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="eyebrow text-midnight/60 mb-1">WhatsApp</p>
                  <a
                    href="https://wa.me/2348150743998"
                    target="_blank"
                    rel="noreferrer"
                    className="font-display text-xl text-midnight u-link"
                  >
                    +234 815 074 3998
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Clock className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="eyebrow text-midnight/60 mb-1">Online Prophetic Service</p>
                  <p className="font-display text-xl text-midnight">
                    Monday &amp; Saturday — 10:00 PM WAT
                  </p>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <RequestForm
              intent="General Enquiry"
              submitLabel="Send Message"
              fields={[
                { name: "name", label: "Full Name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "subject", label: "Subject" },
                {
                  name: "message",
                  label: "Your message",
                  type: "textarea",
                  required: true,
                  rows: 6,
                },
              ]}
            />
          </Reveal>
        </div>
      </section>

      {/* MAP-LIKE STRIP */}
      <section className="bg-midnight text-ivory">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-3 gap-px bg-ivory/10">
          {[
            ["Worship", "Sundays · 9am WAT", "In person & livestream"],
            ["Bible Study", "Wednesdays · 7pm WAT", "Online via Zoom"],
            ["Prophetic Service", "Mon & Sat · 10pm WAT", "Online — global audience"],
          ].map(([title, when, mode]) => (
            <div key={title} className="bg-midnight p-8 md:p-10">
              <p className="eyebrow text-gold">{title}</p>
              <p className="font-display text-2xl mt-3">{when}</p>
              <p className="text-ivory/60 mt-1 text-sm">{mode}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
