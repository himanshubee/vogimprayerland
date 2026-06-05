import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Prayer Request — VOGIM",
  description:
    "Send your prayer request to VOGIM. Our intercessors will stand with you.",
};

export default function PrayerRequestPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526009-slider2.webp"
        eyebrow="Prayer Request"
        title={
          <>
            We would love
            <br />
            to <span className="italic text-gold">pray for you.</span>
          </>
        }
        intro="Wherever you are, whatever the burden — write it down and we will stand with you before the throne of grace."
        scripture={{
          ref: "Matthew 18:19",
          text: "If two of you shall agree on earth as touching any thing that they shall ask, it shall be done for them.",
        }}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              How we pray
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-midnight mt-4 leading-tight">
              Every request is read.
              <br />
              <span className="italic">Every name is prayed.</span>
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              Our intercessors gather every morning to lift up requests
              submitted through this page. Urgent matters receive immediate
              attention from the prayer team and, where needed, a personal
              call from a pastor.
            </p>
            <ul className="mt-8 space-y-3 text-midnight/80 text-sm">
              <li>· Confidentiality is sacred to us.</li>
              <li>· You will hear back within 24 hours.</li>
              <li>· Need urgent help? Use WhatsApp on the contact page.</li>
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <RequestForm
              intent="Prayer Request"
              fields={[
                { name: "name", label: "Full Name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "phone", label: "Phone / WhatsApp", type: "tel" },
                { name: "country", label: "City & Country" },
                {
                  name: "request",
                  label: "Your prayer request",
                  type: "textarea",
                  required: true,
                  rows: 6,
                  placeholder: "Share what is on your heart…",
                },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
