import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";
import { getPageContent, getPageMeta } from "@/lib/page-content";
import { RichText } from "@/components/RichText";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMeta("dream-interpretation");
}

export const revalidate = 300;

export default async function DreamInterpretationPage() {
  const c = await getPageContent("dream-interpretation");
  return (
    <>
      <PageHeader
        image={c.heroImage}
        eyebrow={c.heroEyebrow}
        title={<RichText text={c.heroTitle} />}
        intro={c.heroIntro}
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
