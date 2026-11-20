"use client";

import { readConsent } from "@/lib/consent";

export type ConsentChoices = {
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (event !== "consent_update" && !readConsent()?.analytics) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...parameters });
}

export function updateGoogleConsent(choices: ConsentChoices) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer.push(args));
  window.gtag("consent", "update", {
    analytics_storage: choices.analytics ? "granted" : "denied",
    ad_storage: choices.advertising ? "granted" : "denied",
    ad_user_data: choices.advertising ? "granted" : "denied",
    ad_personalization: choices.advertising ? "granted" : "denied",
  });
}
