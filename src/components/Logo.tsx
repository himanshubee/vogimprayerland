import Link from "next/link";
import Image from "next/image";

export function Logo({ light = false }: { light?: boolean }) {
  const sub = light ? "text-white/70" : "text-midnight/60";
  const main = light ? "text-white" : "text-midnight";
  return (
    <Link
      href="/"
      className="group flex items-center gap-3"
      aria-label="VOGIM Prayer Land — Home"
    >
      <span
        className={`relative inline-flex h-12 w-12 items-center justify-center transition-transform duration-300 group-hover:scale-105`}
      >
        <Image
          src="https://img.vogimprayerland.org/1780648525663-logo.webp"
          alt="VOGIM Deliverance Ministries"
          width={56}
          height={56}
          priority
          className="h-12 w-12 object-contain"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-xl font-medium tracking-tight ${main}`}
        >
          VOGIM <span className="italic font-light">Prayer Land</span>
        </span>
        <span className={`mt-1 text-[10px] tracking-[0.3em] uppercase ${sub}`}>
          Deliverance · Healing · Restoration
        </span>
      </span>
    </Link>
  );
}
