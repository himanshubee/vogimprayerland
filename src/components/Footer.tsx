import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { FacebookIcon, YoutubeIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

export function Footer({ settings = DEFAULT_SETTINGS }: { settings?: SiteSettings }) {
  const { social } = settings;
  const socialLinks = [
    { label: "Facebook", href: social.facebook, Icon: FacebookIcon },
    { label: "YouTube", href: social.youtube, Icon: YoutubeIcon },
    { label: "Instagram", href: social.instagram, Icon: InstagramIcon },
    { label: "WhatsApp", href: social.whatsapp, Icon: WhatsAppIcon },
  ].filter((s) => s.href);

  return (
    <footer className="relative mt-24 bg-midnight text-ivory overflow-hidden">
      <div className="absolute inset-0 starfield opacity-40 pointer-events-none" />
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-14 md:grid-cols-[1.6fr_1fr_1fr_1.1fr]">
          <div>
            <Logo light />
            <p className="mt-6 max-w-sm text-ivory/70 font-display text-lg italic leading-relaxed">
              &ldquo;{settings.footerQuote}&rdquo;
            </p>
            <p className="mt-3 text-xs tracking-[0.32em] uppercase text-gold">
              {settings.footerQuoteRef}
            </p>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">{settings.footerCol1Title}</h4>
            <ul className="space-y-3 text-sm text-ivory/80">
              {settings.footerCol1.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-gold">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">{settings.footerCol2Title}</h4>
            <ul className="space-y-3 text-sm text-ivory/80">
              {settings.footerCol2.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="hover:text-gold">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">Reach Us</h4>
            <ul className="space-y-4 text-sm text-ivory/80">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-0.5 text-gold shrink-0" />
                <span>
                  {settings.address.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < settings.address.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="mt-0.5 text-gold shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-gold">
                  {settings.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="mt-0.5 text-gold shrink-0" />
                <span>{settings.phone}</span>
              </li>
            </ul>
            {socialLinks.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    aria-label={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-ivory/20 hover:border-gold hover:text-gold transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-ivory/10 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-ivory/50">
          <span>© {new Date().getFullYear()} {settings.copyrightName}</span>
          <span className="text-gold/70">{settings.footerTagline}</span>
        </div>
      </div>
    </footer>
  );
}
