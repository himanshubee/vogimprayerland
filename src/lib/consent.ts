import { CONSENT_POLICY_VERSION } from "@/lib/ministry";
import type { ConsentChoices } from "@/lib/tracking";

export const CONSENT_KEY = "vogim_consent_v1";
export const CONSENT_EVENT = "vogim:consent";
export const COOKIE_SETTINGS_EVENT = "vogim:cookie-settings";

export type ConsentRecord = ConsentChoices & {
  timestamp: number;
  policyVersion: string;
};

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null") as ConsentRecord | null;
    if (!value || value.policyVersion !== CONSENT_POLICY_VERSION) return null;
    if (Date.now() - value.timestamp > 365 * 24 * 60 * 60 * 1000) return null;
    return value;
  } catch {
    return null;
  }
}

export function saveConsent(choices: ConsentChoices): ConsentRecord {
  const record = { ...choices, timestamp: Date.now(), policyVersion: CONSENT_POLICY_VERSION };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
  return record;
}
