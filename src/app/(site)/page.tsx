import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Door, HandHeart, Handshake, HandsPraying, Heartbeat, Moon, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { MINISTRY, absoluteUrl } from "@/lib/ministry";
import { NextServiceCard } from "@/components/NextServiceCard";
import { Reassurance } from "@/components/Reassurance";
import { ClosingBand } from "@/components/ClosingBand";
import { FaqList } from "@/components/FaqList";
import { TESTIMONIES } from "@/lib/testimonies";
import { TestimonyList } from "@/components/TestimonyList";

export const metadata: Metadata = {
  title: "VOGIM Prayer Land | Online Deliverance Ministry, Lagos",
  description: "VOGIM Prayer Land in Ikorodu, Lagos offers free online prayer, deliverance, healing prayer, marital guidance and dream interpretation. Send a private request.",
  alternates: { canonical: absoluteUrl() },
};

const MINISTRIES = [
  { icon: Door, title: "Online Deliverance", body: "Request a private, one-to-one online session and receive clear next steps from the team.", href: "/online-deliverance/" },
  { icon: Handshake, title: "Marital Settlement", body: "Ask for prayer and guidance for your marriage, relationship or family.", href: "/marital-settlement/" },
  { icon: Heartbeat, title: "Healing", body: "Send a healing prayer request and share only the details you choose.", href: "/healing/" },
  { icon: Moon, title: "Dream Interpretation", body: "Send your dream privately to the ministry team for interpretation.", href: "/dream-interpretation/" },
];

const FAQS = [
  { question: "What is VOGIM Prayer Land?", answer: "VOGIM Prayer Land is an online deliverance and prayer ministry rooted in Ikorodu, Lagos, Nigeria. It is led by Prophet Olaofe Oladele and is open to people anywhere." },
  { question: "Is it free to request prayer?", answer: "Yes. Prayer, deliverance and counselling are free. Giving is voluntary and is never required before you can receive prayer." },
  { question: "Who can send a request?", answer: "Anyone can ask for prayer from anywhere. The request forms are for adults. If you are under 18, please ask a parent or guardian to send the request for you." },
  { question: "When are the online services?", answer: "Online Prophetic Services are on Mondays and Saturdays at 10:00 PM WAT. Bible Study is on Wednesdays at 7:00 PM WAT. Sunday Worship is at 9:00 AM WAT, in person and by livestream." },
  { question: "How do I join on Zoom?", answer: "Open the Services page and choose Join on Zoom. The public service room needs no Zoom account or registration, and the passcode is built into the join link." },
  { question: "Is my request private?", answer: "Requests are treated with confidentiality and reverence. You can share as much or as little as you like. Health, family and marriage details are optional." },
];

const HOME_UPDATED = "2026-11-20";

const AT_A_GLANCE: [string, string][] = [
  ["Name", `${MINISTRY.name} (${MINISTRY.alternateName})`],
  ["Based in", `${MINISTRY.address.streetAddress}, ${MINISTRY.address.addressLocality}, ${MINISTRY.address.addressRegion}, Nigeria`],
  ["Founded", "May 2021"],
  ["Led by", `${MINISTRY.founder.name}, ${MINISTRY.founder.role}`],
  ["Ministries", "Online deliverance, healing prayer, marital settlement, dream interpretation"],
  ["Cost", "Prayer, deliverance and counselling are free"],
  ["Online services", "Mondays and Saturdays, 10:00 PM WAT, on Zoom (no account needed)"],
  ["Bible study", "Wednesdays, 7:00 PM WAT, on Zoom"],
  ["Sunday worship", "9:00 AM WAT, in person and by livestream"],
  ["Contact", `${MINISTRY.phone} (phone and WhatsApp)`],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-midnight-dark text-white">
        <div className="absolute inset-0">
          <Image src="https://img.vogimprayerland.org/1780648526061-slider3.webp" alt="" fill priority fetchPriority="high" sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 hero-tint" />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 py-16 text-center sm:px-6 sm:py-24">
          <p className="eyebrow text-gold">Voice of God International Ministry · Est. 2021</p>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-[2.625rem] leading-[1.1] sm:text-6xl md:text-[4rem]"><span className="mb-3 block font-sans text-sm font-semibold uppercase tracking-[0.2em] text-gold">Online deliverance ministry</span>Where the captive walks free in Jesus&apos; name.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-white/85">A place at the altar for you, wherever you are. Free online prayer, deliverance and pastoral care from Ikorodu, Lagos.</p>
          <div data-hero-cta className="mx-auto mt-8 flex max-w-xl flex-col justify-center gap-3 sm:flex-row">
            <Link href="/prayer-request/" className="btn-gold justify-center" data-cta-id="hero-prayer"><HandsPraying size={23} weight="duotone" />Request prayer<ArrowRight size={19} /></Link>
            <Link href="/services/" className="btn-ghost justify-center border-gold text-gold hover:bg-gold hover:text-ink" data-cta-id="hero-service"><VideoCamera size={23} weight="duotone" />Join the next service</Link>
          </div>
          <div className="mt-7 flex justify-center"><Reassurance dark /></div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": `${absoluteUrl()}#webpage`,
            url: absoluteUrl(),
            name: "VOGIM Prayer Land | Online Deliverance Ministry, Lagos",
            isPartOf: { "@id": `${absoluteUrl()}#website` },
            about: { "@id": `${absoluteUrl()}#organization` },
            dateModified: HOME_UPDATED,
            inLanguage: "en-NG",
          }),
        }}
      />
      {/* Answer-first block: a summary, one self-contained passage and a facts table, all from the Facts Register. */}
      <section className="bg-white px-5 py-12 sm:px-6" aria-labelledby="what-is-vogim">
        <div className="mx-auto max-w-3xl">
          <p className="rounded-2xl border-l-4 border-gold bg-cream p-5 text-ink"><strong>In short:</strong> VOGIM Prayer Land is a Christian prayer and deliverance ministry in Ikorodu, Lagos, Nigeria. Prayer, deliverance and counselling are free, for anyone, anywhere.</p>
          <h2 id="what-is-vogim" className="mt-10 font-display text-3xl text-maroon sm:text-4xl">What is VOGIM Prayer Land?</h2>
          <p className="mt-4 text-slate">VOGIM Prayer Land is a Christian prayer and deliverance ministry based at {MINISTRY.address.streetAddress}, <a href="https://en.wikipedia.org/wiki/Ikorodu" target="_blank" rel="noreferrer" className="text-maroon underline underline-offset-4">Ikorodu</a>, Lagos State, Nigeria. Also known as {MINISTRY.alternateName}, it began in May 2021 as village evangelism in Porto Novo and is led by {MINISTRY.founder.name}, {MINISTRY.founder.role}. The ministry&apos;s work has three parts: deliverance, healing and restoration. It holds an Online Prophetic Service on Zoom every Monday and Saturday at 10:00 PM <a href="https://en.wikipedia.org/wiki/West_Africa_Time" target="_blank" rel="noreferrer" className="text-maroon underline underline-offset-4">West Africa Time (WAT)</a>, Bible study on Wednesdays at 7:00 PM WAT, and Sunday worship at 9:00 AM WAT, in person and by livestream. Anyone can send a request for prayer, healing prayer, an online deliverance session, marital guidance or dream interpretation through this website or on WhatsApp at {MINISTRY.phone}. Prayer, deliverance and counselling are free, and giving is voluntary and separate from every request.</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-soft">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">VOGIM Prayer Land at a glance</caption>
              <tbody>
                {AT_A_GLANCE.map(([label, value]) => (
                  <tr key={label} className="border-b border-soft last:border-0">
                    <th scope="row" className="w-40 bg-mist px-4 py-3 align-top font-semibold text-maroon">{label}</th>
                    <td className="px-4 py-3 text-ink">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate">Last updated <time dateTime={HOME_UPDATED}>{new Date(HOME_UPDATED).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time></p>
        </div>
        <div className="mt-10"><NextServiceCard /></div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="text-center"><p className="eyebrow text-gold-deep">How we can stand with you</p><h2 className="mt-3 font-display text-4xl text-maroon sm:text-5xl">What ministries does VOGIM Prayer Land offer?</h2></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MINISTRIES.map(({ icon: Icon, title, body, href }) => (
              <Link key={title} href={href} className="card group flex min-h-64 flex-col p-6 text-center hover:border-gold">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cream text-maroon"><Icon size={27} weight="duotone" /></span>
                <h3 className="mt-5 font-display text-2xl text-maroon">{title}</h3>
                <p className="mt-3 text-sm text-slate">{body}</p>
                <span className="mt-auto inline-flex items-center justify-center gap-2 pt-5 text-sm font-semibold text-maroon">Learn more<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="text-center"><p className="eyebrow text-gold-deep">Your request, step by step</p><h2 className="mt-3 font-display text-4xl text-maroon sm:text-5xl">What happens when you ask for prayer?</h2></div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {["Send only what you choose. Your request goes privately to the prayer team.", "For a deliverance request, the team confirms it and proposes a session time.", "Intercessors pray over requests each morning. Aftercare may include scripture, a prayer plan and follow-up."].map((text, index) => (
              <li key={text} className="rounded-2xl bg-mist p-6"><span className="font-display text-4xl text-gold-deep">0{index + 1}</span><p className="mt-3 text-slate">{text}</p></li>
            ))}
          </ol>
          <div className="mt-8 text-center"><Link href="/how-requests-work/" className="inline-flex min-h-12 items-center gap-2 text-maroon underline underline-offset-4">How requests work<ArrowRight size={18} /></Link></div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-20 md:grid-cols-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl">
            <Image src="/past.jpeg" alt={MINISTRY.founder.name} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
          </div>
          <div><p className="eyebrow text-gold-deep">Our story</p><h2 className="mt-3 font-display text-4xl text-maroon sm:text-5xl">How did VOGIM Prayer Land begin?</h2><p className="mt-5 text-slate">VOGIM Prayer Land began in May 2021 as village evangelism in Porto Novo and the communities around it. Today it is based in Ikorodu, Lagos, and meets people online.</p><p className="mt-4 text-slate">It is led by {MINISTRY.founder.name}, {MINISTRY.founder.role}. Its work has three parts: deliverance, healing and restoration.</p><Link href="/about/" className="btn-ghost mt-7">Read our story<ArrowRight size={18} /></Link></div>
        </div>
      </section>

      {TESTIMONIES.length > 0 && (
        <section aria-labelledby="testimonies-heading" className="bg-cream">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
            <h2 id="testimonies-heading" className="text-center font-display text-3xl text-maroon sm:text-4xl">Personal accounts</h2>
            <div className="mt-8"><TestimonyList limit={2} /></div>
            <div className="mt-8 text-center"><Link href="/prayer-request/" className="btn-gold" data-cta-id="testimonies-request">Send your request</Link><p className="mt-3 text-sm text-slate">Personal accounts, not promises</p></div>
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:px-6 sm:py-20 md:grid-cols-2">
          <article className="rounded-2xl bg-mist p-7"><h2 className="font-display text-3xl text-maroon">Where is the church in Ikorodu?</h2><p className="mt-4 text-slate">{MINISTRY.address.streetAddress}, {MINISTRY.address.addressLocality}, {MINISTRY.address.addressRegion}, Nigeria.</p><p className="mt-3 text-slate">Sunday Worship · 9:00 AM WAT · In person and livestream.</p><Link href="/visit/" className="btn-ghost mt-6">Plan your visit<ArrowRight size={18} /></Link></article>
          <article className="rounded-2xl bg-mist p-7"><h2 className="font-display text-3xl text-maroon">How can I watch and join online?</h2><p className="mt-4 text-slate">Follow the ministry&apos;s official Facebook and YouTube channels, or join the public Zoom service.</p><div className="mt-6 flex flex-wrap gap-3"><a href={MINISTRY.social.youtube} target="_blank" rel="noreferrer" className="btn-ghost">YouTube</a><a href={MINISTRY.social.facebook} target="_blank" rel="noreferrer" className="btn-ghost">Facebook</a></div></article>
        </div>
      </section>

      <section className="border-y border-soft bg-cream px-5 py-8 text-center"><p className="mx-auto text-slate">If you choose to support the work, giving is voluntary and separate from every request.</p><Link href="/give/" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-maroon underline underline-offset-4"><HandHeart size={20} weight="duotone" />Visit the official giving page</Link></section>
      <FaqList faqs={FAQS} relatedPath="/about/" />
      <ClosingBand />
    </>
  );
}
