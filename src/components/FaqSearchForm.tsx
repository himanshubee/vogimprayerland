import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

/** Plain GET form so search works without JavaScript; results render on the server. */
export function FaqSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/faq/search/" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="faq-search" className="sr-only">Search the FAQs</label>
      <input id="faq-search" name="q" type="search" defaultValue={defaultValue} placeholder="Search, for example: Zoom, free, refund" className="min-h-12 flex-1 rounded-xl border border-input bg-white px-4" />
      <button type="submit" className="btn-gold justify-center"><MagnifyingGlass size={20} aria-hidden="true" />Search</button>
    </form>
  );
}
