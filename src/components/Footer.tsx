import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { FacebookIcon, YoutubeIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";

export function Footer() {
  return (
    <footer className="relative mt-24 bg-midnight text-ivory overflow-hidden">
      <div className="absolute inset-0 starfield opacity-40 pointer-events-none" />
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="grid gap-14 md:grid-cols-[1.6fr_1fr_1fr_1.1fr]">
          <div>
            <Logo light />
            <p className="mt-6 max-w-sm text-ivory/70 font-display text-lg italic leading-relaxed">
              &ldquo;The Spirit of the Lord is upon me, because he hath anointed
              me to preach the gospel to the poor; he hath sent me to heal the
              brokenhearted, to preach deliverance to the captives.&rdquo;
            </p>
            <p className="mt-3 text-xs tracking-[0.32em] uppercase text-gold">
              Luke 4:18
            </p>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">Ministries</h4>
            <ul className="space-y-3 text-sm text-ivory/80">
              <li><Link href="/online-deliverance" className="hover:text-gold">Online Deliverance</Link></li>
              <li><Link href="/marital-settlement" className="hover:text-gold">Marital Settlement</Link></li>
              <li><Link href="/healing-request" className="hover:text-gold">Healing</Link></li>
              <li><Link href="/dream-interpretation" className="hover:text-gold">Dream Interpretation</Link></li>
              <li><Link href="/prayer-request" className="hover:text-gold">Prayer Request</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">Visit</h4>
            <ul className="space-y-3 text-sm text-ivory/80">
              <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-gold">Blog &amp; Articles</Link></li>
              <li><Link href="/media" className="hover:text-gold">Media Gallery</Link></li>
              <li><Link href="/give" className="hover:text-gold">Give</Link></li>
              <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow text-gold mb-5">Reach Us</h4>
            <ul className="space-y-4 text-sm text-ivory/80">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-0.5 text-gold shrink-0" />
                <span>
                  18 Association Avenue,<br />
                  Owutu-Agric, Ikorodu,<br />
                  Lagos State, Nigeria
                </span>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="mt-0.5 text-gold shrink-0" />
                <a href="mailto:hello@vogimprayerland.org" className="hover:text-gold">
                  hello@vogimprayerland.org
                </a>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="mt-0.5 text-gold shrink-0" />
                <span>+234 815 074 3998</span>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-3">
              <a aria-label="Facebook" href="#" className="p-2 border border-ivory/20 hover:border-gold hover:text-gold transition-colors">
                <FacebookIcon size={16} />
              </a>
              <a aria-label="YouTube" href="#" className="p-2 border border-ivory/20 hover:border-gold hover:text-gold transition-colors">
                <YoutubeIcon size={16} />
              </a>
              <a aria-label="Instagram" href="#" className="p-2 border border-ivory/20 hover:border-gold hover:text-gold transition-colors">
                <InstagramIcon size={16} />
              </a>
              <a aria-label="WhatsApp" href="https://wa.me/2348150743998" className="p-2 border border-ivory/20 hover:border-gold hover:text-gold transition-colors">
                <WhatsAppIcon size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-ivory/10 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] tracking-[0.28em] uppercase text-ivory/50">
          <span>© {new Date().getFullYear()} Vogim Deliverance Ministries Church</span>
          <span className="text-gold/70">Loving God · Loving Others · In the World</span>
        </div>
      </div>
    </footer>
  );
}
