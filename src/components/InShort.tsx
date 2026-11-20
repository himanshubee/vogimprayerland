/** Answer-first summary under a page header: one or two plain, factual sentences that search and AI tools can quote. */
export function InShort({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label="In short" className="bg-white px-5 pt-10 sm:px-6">
      <p className="mx-auto max-w-3xl rounded-2xl border-l-4 border-gold bg-cream p-5 text-ink">
        <strong>In short:</strong> {children}
      </p>
    </section>
  );
}
