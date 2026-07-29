import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalDoc, legalMetadata } from "@/lib/legal";

export const metadata: Metadata = legalMetadata("privacy-policy");

export const revalidate = 3600;

export default function PrivacyPolicyPage() {
  return <LegalPage doc={getLegalDoc("privacy-policy")} />;
}
