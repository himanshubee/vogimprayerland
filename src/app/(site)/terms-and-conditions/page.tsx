import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalDoc, legalMetadata } from "@/lib/legal";

export const metadata: Metadata = legalMetadata("terms-and-conditions");

export const revalidate = 3600;

export default function TermsAndConditionsPage() {
  return <LegalPage doc={getLegalDoc("terms-and-conditions")} />;
}
