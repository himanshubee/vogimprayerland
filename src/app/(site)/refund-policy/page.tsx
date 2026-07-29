import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalDoc, legalMetadata } from "@/lib/legal";

export const metadata: Metadata = legalMetadata("refund-policy");

export const revalidate = 3600;

export default function RefundPolicyPage() {
  return <LegalPage doc={getLegalDoc("refund-policy")} />;
}
