import Link from "next/link";
import { HandsPraying, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <main id="main-content" className="bg-cream"><div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-28">
      <p className="eyebrow text-gold-deep">404 · Page not found</p>
      <h1 className="mt-4 font-display text-5xl text-maroon">We could not find that page</h1>
      <p className="mx-auto mt-5 max-w-xl text-slate">The link may be old or the address may be incomplete. You can browse articles, return home or send a private prayer request.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/prayer-request/" className="btn-gold justify-center"><HandsPraying size={22} weight="duotone" />Request prayer</Link><Link href="/blog/" className="btn-ghost justify-center"><MagnifyingGlass size={22} weight="duotone" />Browse articles</Link></div>
      <Link href="/" className="mt-6 inline-block min-h-11 py-2 text-maroon underline">Return to the home page</Link>
    </div></main>
  );
}
