import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { MINISTRY } from "@/lib/ministry";

export function WhatsAppLink({ className = "btn-ghost" }: { className?: string }) {
  return (
    <a
      href={`${MINISTRY.whatsapp}?text=${encodeURIComponent("Hello VOGIM Prayer Land")}`}
      target="_blank"
      rel="noreferrer"
      className={className}
      data-cta-id="whatsapp"
    >
      <WhatsappLogo size={22} weight="duotone" aria-hidden="true" />
      Message us on WhatsApp
    </a>
  );
}
