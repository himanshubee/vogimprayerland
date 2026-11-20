"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/tracking";

export function AnalyticsEvents() {
  const pathname = usePathname();
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cta-id]") : null;
      if (!target) return;
      const page_type = pathname === "/" ? "home" : pathname.includes("request") ? "request" : pathname.split("/").filter(Boolean)[0] || "other";
      track("cta_click", {
        cta_id: target.dataset.ctaId,
        cta_text: target.textContent?.trim().slice(0, 80) || "",
        cta_location: target.dataset.ctaLocation || (target.closest("[data-hero-cta]") ? "hero" : "section"),
        page_type,
      });
    };
    // FAQ accordions report only the fixed question id when opened.
    const onToggle = (event: Event) => {
      const details = event.target instanceof HTMLDetailsElement ? event.target : null;
      if (details?.open && details.dataset.faqId) track("faq_expand", { question_id: details.dataset.faqId, page_type: "faq" });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, [pathname]);
  return null;
}
