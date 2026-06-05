import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ArrowUpRight, HandHeart, Sprout, HomeIcon } from "lucide-react";

export const metadata = {
  alternates: { canonical: "/give/" },
  title: "Give — VOGIM Prayer Land",
  description:
    "Partner with VOGIM. Give to support the work of deliverance, healing, and care for widows and orphans.",
};

const AMOUNTS = [10, 25, 50, 100, 250];

const AREAS = [
  {
    icon: HandHeart,
    title: "Deliverance Ministry",
    body: "Resource the online sessions, prophetic services, and pastoral care for those reaching out from around the world.",
  },
  {
    icon: Sprout,
    title: "Widows & Orphans",
    body: "Support our ongoing care for widows, orphans, and orphanage homes — financially, physically, and spiritually.",
  },
  {
    icon: HomeIcon,
    title: "Building the Sanctuary",
    body: "Help us expand the Ikorodu sanctuary so more souls can be welcomed, taught, and discipled.",
  },
];

export default function GivePage() {
  return (
    <>
      <PageHeader
        image="https://img.vogimprayerland.org/1780648526688-worship.jpg"
        eyebrow="Give"
        title={
          <>
            Sow into the
            <br />
            work of the <span className="italic text-gold">Lord.</span>
          </>
        }
        intro="Every gift becomes a meal, a Bible, a deliverance session, a roof over a widow's head. Thank you for partnering with us."
        scripture={{
          ref: "2 Corinthians 9:7",
          text: "God loveth a cheerful giver.",
        }}
      />

      {/* GIVE CARD */}
      <section className="bg-ivory paper-grain">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-start">
          <Reveal>
            <p className="eyebrow text-gold-deep">
              <span className="gold-rule mr-3" />
              Online Giving
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-midnight mt-4 leading-tight">
              The only authorized giving channel for <span className="italic">VOGIM Prayer Land.</span>
            </h2>
            <p className="mt-6 text-midnight/75 leading-relaxed">
              Please give securely through our official partner — your gift
              goes directly to the work of the ministry, the support of the
              vulnerable, and the spread of the gospel.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 items-center">
              {AMOUNTS.map((a) => (
                <span
                  key={a}
                  className="px-5 py-3 border border-midnight/20 font-display text-xl text-midnight hover:bg-midnight hover:text-gold transition-colors cursor-pointer"
                >
                  ${a}
                </span>
              ))}
              <span className="px-5 py-3 border border-midnight/20 font-display text-xl italic text-midnight/70">
                Other
              </span>
            </div>

            <Link
              href="https://give.vogimprayerland.org/"
              className="btn-gold mt-10"
              target="_blank"
              rel="noreferrer"
            >
              Give Now
              <ArrowUpRight size={16} />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-midnight/15 bg-ivory p-8">
              <p className="eyebrow text-gold-deep">Pledge</p>
              <h3 className="font-display text-3xl text-midnight mt-3 leading-tight">
                Where every gift goes.
              </h3>
              <ul className="mt-6 space-y-5">
                {AREAS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.title} className="flex gap-4">
                      <Icon className="text-gold-deep shrink-0 mt-1" size={22} />
                      <div>
                        <p className="font-display text-xl text-midnight">{a.title}</p>
                        <p className="text-midnight/70 text-sm leading-relaxed mt-1">
                          {a.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* THANK YOU STRIP */}
      <section className="relative bg-midnight text-ivory overflow-hidden">
        <div className="absolute inset-0 starfield opacity-40" />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-display italic text-3xl md:text-4xl leading-snug">
            &ldquo;Bring ye all the tithes into the storehouse… and prove me
            now herewith, saith the Lord of hosts, if I will not open you the
            windows of heaven.&rdquo;
          </p>
          <p className="mt-4 text-[11px] tracking-[0.32em] uppercase text-gold">
            Malachi 3:10
          </p>
        </div>
      </section>
    </>
  );
}
