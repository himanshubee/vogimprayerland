import { PageHeader } from "@/components/PageHeader";
import { RequestForm } from "@/components/RequestForm";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { Reassurance } from "@/components/Reassurance";
import { FaqList, type Faq } from "@/components/FaqList";

const REQUEST_PATHS: Record<string, string> = {
  "Prayer Request": "/prayer-request/",
  "Healing Request": "/healing-request/",
  "Deliverance Request": "/deliverance-request/",
  "Dream Interpretation": "/dream-interpretation/",
};

type Field = Parameters<typeof RequestForm>[0]["fields"][number];

export function RequestExperience({
  eyebrow,
  title,
  intro,
  intent,
  fields,
  submitLabel,
  preferredContact = true,
  timezone = false,
  steps,
  note,
  faqs = [],
}: {
  eyebrow: string;
  title: string;
  intro: string;
  intent: string;
  fields: Field[];
  submitLabel?: string;
  preferredContact?: boolean;
  timezone?: boolean;
  steps: string[];
  note?: string;
  faqs?: Faq[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.35fr]">
          <aside>
            <Reassurance />
            <h2 className="mt-7 font-display text-4xl text-maroon">What happens next</h2>
            <ol className="mt-6 space-y-5">{steps.map((step, index) => <li key={step} className="flex gap-4"><span className="font-display text-3xl text-gold-deep">0{index + 1}</span><p className="text-slate">{step}</p></li>)}</ol>
            {note && <p className="mt-6 rounded-2xl border-l-4 border-gold bg-white p-5 text-sm text-slate">{note}</p>}
            <div className="mt-7"><WhatsAppLink className="btn-ghost" /></div>
          </aside>
          <RequestForm intent={intent} fields={fields} submitLabel={submitLabel} preferredContact={preferredContact} timezone={timezone} />
        </div>
      </section>
      <FaqList faqs={faqs} relatedPath={REQUEST_PATHS[intent]} />
    </>
  );
}
