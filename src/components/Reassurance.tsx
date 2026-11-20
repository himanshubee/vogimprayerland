import { LockKey, HandsPraying, Heart } from "@phosphor-icons/react/dist/ssr";

export function Reassurance({ dark = false }: { dark?: boolean }) {
  const items = [
    { icon: HandsPraying, text: "Free of charge" },
    { icon: LockKey, text: "Held in confidence" },
    { icon: Heart, text: "Open to everyone" },
  ];
  return (
    <ul className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm sm:justify-start ${dark ? "text-white/85" : "text-slate"}`}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon size={19} weight="duotone" className={dark ? "text-gold" : "text-maroon"} aria-hidden="true" />
          {text}
        </li>
      ))}
    </ul>
  );
}
