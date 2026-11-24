import { MINISTRY, SITE_URL } from "@/lib/ministry";

/**
 * The named author behind the articles.
 *
 * Articles used to carry "By VOGIM Prayer Land" only. Search engines and
 * readers weigh who stands behind spiritual and health-adjacent advice, and an
 * organisation byline with no person or profile behind it is a weak signal. The
 * articles are published under the founder's ministry, so they are attributed
 * to him, with a profile page that says who he is.
 *
 * OWNER_INPUTS.md (D2) still lists the approved form of the founder's name as
 * open. The name comes from content/ministry-facts.json, so changing it there
 * changes every byline. Set `bylineApproved` to false to go back to the
 * organisation byline everywhere without touching anything else.
 */
export const AUTHOR = {
  bylineApproved: true,
  slug: "prophet-olaofe-oladele",
  name: MINISTRY.founder.name,
  role: MINISTRY.founder.role,
  image: "/past.jpeg",
  get path() {
    return `/author/${this.slug}/`;
  },
  get url() {
    return `${SITE_URL}/author/${this.slug}/`;
  },
} as const;

export const FOUNDER_ID = `${SITE_URL}/#founder`;

/** Schema.org author reference for an article. */
export function articleAuthor() {
  if (!AUTHOR.bylineApproved) return { "@id": `${SITE_URL}/#organization` };
  return { "@type": "Person", "@id": FOUNDER_ID, name: AUTHOR.name, url: AUTHOR.url };
}
