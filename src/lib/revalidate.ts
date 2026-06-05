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
