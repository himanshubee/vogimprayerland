import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { Reveal } from "@/components/Reveal";

export const metadata = {
  title: "Healing Request — VOGIM",
  description:
    "Submit a healing request to VOGIM. Jesus is still the Healer.",
};

export default function HealingRequestPage() {
  return (
    <>
      <PageHeader
        image="/images/prophet.jpg"
        eyebrow="Healing Request"
        title={
          <>
            Jesus is still
            <br />
            <span className="italic text-gold">the Healer.</span>
          </>
        }
        intro="Body, soul, or spirit — He is touched by your pain. Send your request and join an army of intercessors believing with you for total healing."
        scripture={{
          ref: "Isaiah 53:5",
          text: "And with his stripes we are healed.",
        }}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.4fr] gap-14">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Healing ministry
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-midnight mt-4 leading-tight">
              We believe in the
              <br />
              <span className="italic">Healer over the healing.</span>
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              Whether you are facing a long-term illness, a sudden diagnosis,
              chronic pain, or unseen torment — submit your healing request.
              Our pastoral team will pray, fast, and follow up with you
              personally.
            </p>
            <p className="mt-4 text-midnight/70 text-sm italic">
              If you are continuing under medical care, please continue with
              your doctor while we stand in prayer with you.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <RequestForm
              intent="Healing Request"
              fields={[
                { name: "name", label: "Full Name", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "phone", label: "Phone / WhatsApp", type: "tel" },
                { name: "age", label: "Age" },
                {
                  name: "condition",
                  label: "Condition / area needing healing",
                  type: "textarea",
                  required: true,
                  rows: 5,
                },
                {
                  name: "story",
                  label: "What would you like the team to know?",
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
