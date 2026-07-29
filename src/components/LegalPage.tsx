import { Fragment } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { RichText } from "@/components/RichText";
import {
  GIVE_URL,
  LEGAL_LINKS,
  LEGAL_UPDATED,
  type LegalBlock,
  type LegalDoc,
} from "@/lib/legal";
import { getSettings } from "@/lib/settings";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.vogimprayerland.org"
).replace(/\/$/, "");

const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

type Tokens = {
  ministry: string;
  email: string;
  phone: string;
  address: string;
  waHref: string;
};

/**
 * Substitutes the {token} placeholders used in `lib/legal.ts` with the live
 * site settings, turning contact details into real links along the way.
 */
function fill(text: string, t: Tokens) {
  const parts = text.split(/\{(ministry|email|phone|address|site|giveUrl)\}/g);
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    switch (part) {
      case "email":
        return (
          <a key={i} href={`mailto:${t.email}`} className="text-gold-deep u-link">
            {t.email}
          </a>
        );
      case "phone":
        return (
          <a
            key={i}
            href={t.waHref}
            target="_blank"
            rel="noreferrer"
            className="text-gold-deep u-link"
          >
            {t.phone}
          </a>
        );
      case "giveUrl":
        return (
          <a
            key={i}
            href={GIVE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-gold-deep u-link"
          >
            {host(GIVE_URL)}
          </a>
        );
      case "site":
        return <Fragment key={i}>{host(SITE_URL)}</Fragment>;
      case "ministry":
        return (
          <strong key={i} className="text-midnight font-semibold">
            {t.ministry}
          </strong>
        );
      default:
        return <Fragment key={i}>{t.address}</Fragment>;
    }
  });
}

function Block({ block, t }: { block: LegalBlock; t: Tokens }) {
  if (block.type === "list") {
    return (
      <ul className="mt-4 space-y-3">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-midnight/75 leading-relaxed">
            <span
              aria-hidden
              className="mt-2.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-deep/70"
            />
            <span>{fill(item, t)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "note") {
    return (
      <div className="mt-5 border-l-2 border-gold bg-ivory-dark px-5 py-4 sm:px-6 sm:py-5">
        <p className="text-midnight/85 leading-relaxed text-[0.95rem]">
          {fill(block.text, t)}
        </p>
      </div>
    );
  }

  return (
    <p className="mt-4 text-midnight/75 leading-relaxed">{fill(block.text, t)}</p>
  );
}

export async function LegalPage({ doc }: { doc: LegalDoc }) {
  const settings = await getSettings();
  const t: Tokens = {
    ministry: settings.copyrightName,
    email: settings.email,
    phone: settings.phone,
    address: settings.address.join(" "),
    waHref: settings.social.whatsapp || `https://wa.me/${settings.whatsapp}`,
  };

  const url = `${SITE_URL}/${doc.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: doc.seoTitle,
        description: doc.seoDescription,
        inLanguage: "en-US",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: doc.eyebrow, item: url },
        ],
      },
    ],
  };

  const others = LEGAL_LINKS.filter((l) => l.href !== `/${doc.slug}/`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        image={doc.heroImage}
        eyebrow={doc.eyebrow}
        title={<RichText text={doc.title} />}
        intro={doc.intro}
      />

      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[16rem_1fr] gap-10 lg:gap-16 items-start">
          {/* CONTENTS */}
          <aside className="lg:sticky lg:top-28">
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Contents
            </p>
            <nav className="mt-5 border-l border-midnight/15">
              <ul className="space-y-1">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block border-l-2 border-transparent -ml-px pl-4 py-1.5 text-sm text-midnight/65 hover:border-gold hover:text-midnight transition-colors"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="mt-8 text-[11px] tracking-[0.28em] uppercase text-midnight/45">
              Last updated
            </p>
            <p className="font-display text-xl text-midnight mt-1">{LEGAL_UPDATED}</p>
          </aside>

          {/* BODY */}
          <div className="max-w-3xl">
            {doc.sections.map((s, i) => (
              <Reveal key={s.id} delay={i < 4 ? i * 0.04 : 0}>
                <section
                  id={s.id}
                  className="scroll-mt-28 pt-8 first:pt-0 pb-8 border-b border-midnight/10 last:border-b-0"
                >
                  <h2 className="font-display text-2xl sm:text-3xl text-midnight leading-tight">
                    {s.heading}
                  </h2>
                  {s.blocks.map((b, bi) => (
                    <Block key={bi} block={b} t={t} />
                  ))}
                </section>
              </Reveal>
            ))}

            {/* CROSS-LINKS */}
            <div className="mt-12 flex flex-wrap gap-3">
              {others.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="btn-ghost text-midnight border-midnight/25 text-[0.7rem]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-6 py-16 sm:py-20">
          <div className="flex items-center gap-3 text-gold">
            <ShieldCheck size={20} />
            <p className="eyebrow">Questions about this page?</p>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl mt-4 leading-tight max-w-2xl">
            Ask us plainly — <span className="italic text-gold">we will answer plainly.</span>
          </h2>
          <ul className="mt-8 grid sm:grid-cols-3 gap-6 text-sm">
            <li className="flex gap-3">
              <Mail size={16} className="mt-0.5 text-gold shrink-0" />
              <a href={`mailto:${t.email}`} className="text-ivory/85 hover:text-gold">
                {t.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-0.5 text-gold shrink-0" />
              <a
                href={t.waHref}
                target="_blank"
                rel="noreferrer"
                className="text-ivory/85 hover:text-gold"
              >
                {t.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 text-gold shrink-0" />
              <span className="text-ivory/85">
                {settings.address.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < settings.address.length - 1 && <br />}
                  </span>
                ))}
              </span>
            </li>
          </ul>
          <Link href="/contact/" className="btn-gold mt-10">
            Contact the ministry
          </Link>
        </div>
      </section>
    </>
  );
}
