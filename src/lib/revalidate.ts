import { revalidatePath } from "next/cache";

/**
 * Refresh every cached route that lists or renders posts after a content
 * change, so a newly published/edited/deleted post shows up immediately
 * instead of waiting for its ISR window (e.g. the hourly sitemap).
 */
export function revalidatePostCaches(slug?: string) {
  revalidatePath("/sitemap.xml"); // search-engine sitemap
  revalidatePath("/blog"); // blog listing
  revalidatePath("/"); // homepage (latest posts)
  if (slug) revalidatePath(`/${slug}/`); // the post page itself
}

/**
 * The store listing and product pages are cached (ISR) — refresh them when a
 * design, its price, or the exchange rates change.
 *
 * /cart and /checkout are absent on purpose: both are force-dynamic, because
 * the total a shopper is shown must always match what checkout re-prices from
 * the database.
 */
export function revalidateStore(slug?: string) {
  revalidatePath("/store");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/store/${slug}`);
}
