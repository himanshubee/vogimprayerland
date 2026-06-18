import { redirect, notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSchema, getPageContent } from "@/lib/page-content";
import { PageEditor } from "./PageEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit page — VOGIM Admin" };

export default async function EditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { key } = await params;
  const schema = getSchema(key);
  if (!schema) notFound();
  const values = await getPageContent(key);
  return <PageEditor schema={schema} initial={values} />;
}
