"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onCLS, onINP, onLCP } from "web-vitals";
import { track } from "@/lib/tracking";

export function WebVitals() {
  const pathname = usePathname();
  useEffect(() => {
    const page_type = pathname === "/" ? "home" : pathname.includes("request") ? "request" : pathname.split("/").filter(Boolean)[0] || "other";
    const report = ({ name, value, rating }: { name: string; value: number; rating: string }) => {
      track("web_vitals", { metric_name: name, value, rating, page_type });
    };
    onLCP(report);
    onINP(report);
    onCLS(report);
  }, [pathname]);
  return null;
}
