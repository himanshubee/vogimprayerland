import { PageHeader } from "@/components/PageHeader";
import { ClosingBand } from "@/components/ClosingBand";

export function SimplePage({
  eyebrow,
  title,
  intro,
  children,
  closing = true,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  closing?: boolean;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} intro={intro} />
      <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 sm:py-20">{children}</div>
      {closing && <ClosingBand />}
    </>
  );
}
