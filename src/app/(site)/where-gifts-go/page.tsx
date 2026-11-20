import type { Metadata } from "next";
import { OwnerPage, ownerPageMetadata } from "@/components/OwnerPage";
import { absoluteUrl } from "@/lib/ministry";

// Unpublished until the ministry supplies and approves the text in content/owner-pages.json.
export const metadata: Metadata = ownerPageMetadata("where-gifts-go", absoluteUrl("/where-gifts-go/"));

export default function Page() {
  return <OwnerPage pageKey="where-gifts-go" />;
}
