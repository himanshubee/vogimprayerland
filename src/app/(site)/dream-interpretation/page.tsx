import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Dream Interpretation — VOGIM",
  description:
    "Submit your dream for Spirit-led interpretation by Prophet Olaofe and the VOGIM team.",
};

export default function DreamInterpretationPage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648525834-main-height.jpg"
        eyebrow="Dream Interpretation"
        title={
          <>
            God still speaks
            <br />
            in <span className="italic text-gold">the night.</span>
          </>
        }
        intro="From Joseph to Daniel, God has revealed mysteries through dreams. Submit your dream and our team will seek the mind of the Spirit on your behalf."
        scripture={{
          ref: "Job 33:14–15",
          text: "For God speaketh once, yea twice, yet man perceiveth it not. In a dream, in a vision of the night…",
        }}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Before you send
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-midnight mt-4 leading-tight">
              Be honest.
              <br />
              <span className="italic">Be detailed.</span>
            </h2>
            <ul className="mt-6 space-y-3 text-midnight/80">
              <li>· Note the date and time of the dream if you can.</li>
              <li>· Describe colors, objects, people, locations and emotions.</li>
              <li>· Mention any recurring elements from previous dreams.</li>
              <li>· Don&apos;t self-interpret — leave room for the Spirit.</li>
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <RequestForm
              intent="Dream Interpretation"
              fields={[
                { name: "name", label: "Full Name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "phone", label: "Phone / WhatsApp", type: "tel" },
                { name: "dateOfDream", label: "Date of the dream" },
                {
                  name: "dream",
                  label: "Describe the dream in detail",
                  type: "textarea",
                  required: true,
                  rows: 8,
                  placeholder: "Tell us everything you remember…",
                },
                {
                  name: "context",
                  label: "Anything happening in your life right now?",
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
