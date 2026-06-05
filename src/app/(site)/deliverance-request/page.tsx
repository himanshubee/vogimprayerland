import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";
import { ShieldCheck, Lock, Clock } from "lucide-react";

export const metadata = {
  alternates: { canonical: "/deliverance-request/" },
  title: "Deliverance Request — VOGIM",
  description:
    "Submit your deliverance request to VOGIM. Schedule a one-on-one online session with Prophet Olaofe Emmanuel.",
};

export default function DeliveranceRequestPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648546756-deliverance.webp"
        eyebrow="Deliverance Request"
        title={
          <>
            Schedule your
            <br />
            <span className="italic text-gold">deliverance session.</span>
          </>
        }
        intro="One form, one click — and a Spirit-led prophet steps into the gap for you. Sessions are conducted online, privately, and powerfully."
        scripture={{
          ref: "John 8:36",
          text: "If the Son therefore shall make you free, ye shall be free indeed.",
        }}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              What happens next
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-midnight mt-4 leading-tight">
              From form to <span className="italic">freedom.</span>
            </h2>
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <Clock className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-display text-xl text-midnight">Within 24 hours</p>
                  <p className="text-sm text-midnight/70">
                    Our team confirms your request and proposes a session slot.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <ShieldCheck className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-display text-xl text-midnight">Pastoral preparation</p>
                  <p className="text-sm text-midnight/70">
                    You receive scripture to read and pray ahead of the session.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Lock className="text-gold-deep shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-display text-xl text-midnight">Held in confidence</p>
                  <p className="text-sm text-midnight/70">
                    Your story is held with discretion, reverence, and grace.
                  </p>
                </div>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <RequestForm
              intent="Deliverance Request"
              submitLabel="Send Deliverance Request"
              fields={[
                { name: "name", label: "Full Name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "phone", label: "Phone / WhatsApp", type: "tel", required: true },
                { name: "country", label: "City & Country" },
                {
                  name: "concerns",
                  label: "What are you walking through?",
                  type: "textarea",
                  required: true,
                  rows: 6,
                  placeholder: "Describe the oppression, attack, or stronghold…",
                },
                {
                  name: "expectations",
                  label: "What are you believing God for?",
                  type: "textarea",
                  rows: 4,
                },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
