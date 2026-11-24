/**
 * Redirects for URLs that ranked on the old WordPress site and no longer
 * exist here.
 *
 * The WordPress → Next.js migration in June 2026 dropped a set of posts. Search
 * Console still lists them as ranking pages, and every one of them was
 * answering 404 — which is the signal that tells Google to drop a URL for
 * good, taking its accumulated links and history with it. Each is sent to the
 * closest surviving article instead, so the equity lands somewhere useful.
 *
 * Pairs are [old slug, surviving slug], ordered by the clicks the old URL
 * earned in the 12 months to 16 Aug 2026. Two of these were top-five pages for
 * the whole site — /bible-verses-on-deliverance-from-the-power-of-darkness
 * (1,417 clicks) and /bible-verse-for-deliverance-from-spiritual-husband
 * (1,160). Neither survived the import, and neither is in the WordPress backup
 * or the Wayback Machine. Both were rewritten in November 2026 and are served
 * again at their original URLs from src/lib/restored-posts, so they are no
 * longer redirected here. Pointing a top-ranking URL at a different article
 * throws away most of what it ranked for; restoring the page keeps it.
 */
export const LEGACY_REDIRECTS: [from: string, to: string][] = [
  ["deliverance-from-spirit-spouse-2", "deliverance-from-spirit-spouse"], // 165
  ["spiritual-meaning-of-receiving-money-in-a-dream", "meaning-of-receiving-money-in-a-dream"], // 153
  ["monitoring-spirit", "what-is-a-monitoring-spirit"], // 97
  ["prayer-against-serpentine-spirit-estonia", "prayer-against-serpentine-spirit"], // 44
  ["urgent-prayer-requests", "urgent-prayer-request"], // 19
  ["prayers-against-eating-in-the-dream", "blog"], // 18
  ["ways-to-overcome-witchcraft-manipulations", "5-ways-to-overcome-witchcraft-manipulations"], // 15
  ["python-spirit-ontario-canada", "python-spirit"], // 14
  ["praying-the-scriptures-for-marital-settlement-vogim", "praying-the-scriptures-for-marital-settlement"], // 12
  ["musical-instruments-donations-to-churches", "donate-musical-instruments-to-churches"], // 11
  ["prayer-against-witchcraft", "prayer-for-protection-against-witchcraft-attacks"], // 10
  ["oppressed-by-a-demon-how-to-find-deliverance", "oppressed-by-a-demon"], // 6
  ["about-us", "about"], // 6
  ["scriptures-on-deliverance-from-strongholds-california-usa", "scriptures-on-deliverance-from-strongholds"], // 5
  ["prayers-request", "prayer-request"], // 5
  ["bible-verses-on-deliverance-from-the-power-of-darkness-2", "bible-verses-on-deliverance-from-the-power-of-darkness"], // 5
  ["breaking-the-spirit-of-backwardness", "breaking-the-spirit-of-backwardness-2"], // 4
  ["instrument-donation-near-me", "instrument-donation-guide"], // 4
  ["where-to-submit-prayer-request-in-nigeria", "where-to-submit-a-prayer-request-in-nigeria"], // 4
  ["10-powerful-healing-prayers-for-the-sick", "healing-prayers-for-sick"], // 3
  ["prayer-for-the-sick-bible-verse", "bible-verse-for-healing-the-sick"], // 3
  ["spiritual-husband-and-wife-in-the-bible-2", "spiritual-husband-and-wife-in-the-bible"], // 3
  ["bible-verse-to-destroy-spirit-husband", "spirit-husband-bible-verse"], // 3
  ["prayer-conference-program-uk", "uk-prayer-conference"], // 3
  ["prayer-for-3am", "3am-prayer-for-deliverance"], // 2
  ["intercessors-in-new-jersey-usa", "intercessors-new-jersey-usa"], // 2
  ["breaking-free-from-the-evil-marital-covenants-of-spiritual-spouse", "spiritual-spouse"], // 2
  ["deliverance-from-spiritual-husband-in-northern-irelandunited-kingdom", "deliverance-from-spiritual-husband-in-northern-ireland-united-kingdom"], // 2
  ["spirit-of-fear", "overcome-the-spirit-of-fear"], // 1
  ["prayer-for-healing-for-a-family-member", "prayer-for-healing-family-member"], // 1
  ["donate-used-musical-instruments-near-me", "donate-used-musical-instruments"], // 1
  ["donations/church-giving", "church-giving"], // 1
  ["prayers-for-healing-the-sick", "healing-prayers-for-sick"], // 0
  ["how-to-help-someone-having-a-epileptic-seizure", "how-to-help-someone-having-an-epileptic-seizure"], // 0
  ["verse-from-bible-for-healing", "bible-verse-for-healing"], // 0
  ["services_group/pictures", "gallery"], // 0
  ["bible-verse-about-the-spirit-of-fear", "bible-verse-on-spirit-of-fear"], // 0
  ["pay-my-tithing-online-now-new-york-usa", "pay-my-tithing-online-now"], // 0
  ["prayers-for-givers-in-the-bible-miami-usa", "prayers-for-givers-in-the-bible"], // 0
  ["services/declaration", "about"], // 0
  ["prayer-points-for-business-owners-utah-usa", "prayer-points-for-business-owners"], // 0
  ["services/mission-statement", "about"], // 0
  ["monitoring-spirits-kenya", "monitoring-spirits-in-kenya"], // 0
  ["donate-church", "how-to-donate-to-church"], // 0
  ["defeating-the-phyton-spirit", "defeating-the-python-spirit"], // 0
  ["deliverance-ministries-near-me", "healing-and-deliverance-ministries-near-me"], // 0
  ["prayer-conference-uk", "uk-prayer-conference"], // 0
  ["services/our-vision", "blog"], // 0
  ["donate-guitar-near-me", "donate-guitar-to-charity"], // 0
  ["donation", "give"], // 0
  ["one-on-one-prayer-for-multi-billionaires-in-the-world", "one-on-one-prayer-for-multi-billionaires"], // 0
  ["about-us/page/11", "blog"], // 0
  ["donation/give", "blog"], // 0
  ["what-does-the-bible-say-about-monitoring-spirit-in-new-yorkusa", "what-does-the-bible-say-about-monitoring-spirit-in-new-york-usa"], // 0
  ["donations", "blog"], // 0
  ["bible-verses-on-deliverance-from-the-power-of-darkness-dublin-uk", "bible-verses-for-breaking-free-from-darkness-uk"], // 0
  ["deliverance-ministries", "face-to-face-deliverance-ministries"], // 0
  ["donations/donation-form", "blog"], // 0
  ["powerful-healing-prayer-for-the-sick", "angel-healing-prayer-for-the-sick"], // 0
];

/**
 * WordPress leftovers and verbatim duplicates, consolidated November 2026.
 *
 * These URLs still serve from the posts collection, but none of them should be
 * in Google's index:
 *
 * - Theme demo pages, plugin pages and empty form stubs the import carried
 *   over: /example-page-title/ (a doorway template with "{service} in {city}"
 *   still in its title), /shortcodes/, /my-account/, donation-plugin screens,
 *   and request pages whose only content was a form that no longer exists.
 *   Several still printed raw [vc_row] WPBakery shortcodes.
 * - Pages whose body is 90% or more the same text as another page on the site
 *   (measured by 5-word shingle overlap). Each points at whichever copy earned
 *   more Search clicks.
 *
 * Thin and duplicate pages drag down how Google rates the whole site, not just
 * themselves. Sending them to the closest real page removes them from the
 * index and keeps any links they earned.
 *
 * The posts stay in the database. To bring one back, improve it in the admin
 * and delete its line here.
 */
export const CONSOLIDATED_REDIRECTS: [from: string, to: string][] = [
  // WordPress theme, plugin and placeholder pages
  ["example-page-title", ""],
  ["shortcodes", ""],
  ["my-account", ""],
  ["manage-profile", ""],
  ["donor-dashboard", "give"],
  ["donation-confirmation", "give"],
  ["donation-failed", "give"],
  ["payments", "partnership"],
  ["partnership-registration", "partnership"],
  ["prayer-warrior-registration", "partnership"],
  ["church-giving-2", "give"],
  ["church-giving", "give"],
  ["blogs", "blog"],
  ["news", "blog"],
  ["sermons", "media"],
  ["audio", "media"],
  ["video", "media"],
  ["contacts", "contact"],
  ["lets-keep-in-touch", "contact"],
  ["deliverance-ministries-find-deliverance-ministry-in-lagos-nigeria", "online-deliverance"],

  // Request stubs: a heading and an empty form
  ["hope-request", "prayer-request"],
  ["strength-request", "prayer-request"],
  ["prosperity-request", "prayer-request"],
  ["relationship-request", "prayer-request"],
  ["children-request", "prayer-request"],

  // Verbatim duplicates -> the copy that earned more clicks
  ["sign-of-monitoring-spirits-2", "signs-of-monitoring-spirits"],
  ["what-is-monitoring-spirits-2", "what-is-monitoring-spirits"],
  ["spiritual-wife-in-dublin-ireland", "spiritual-wife"],
  ["spiritual-wife-in-sydney-australia", "spiritual-wife"],
  ["common-nightmares-that-are-warnings", "dancing-in-the-dream"],
  ["spiritual-husband-wife-bible", "spiritual-husband-and-wife-in-the-bible"],
  ["one-on-one-prayer-for-billionaires-in-texas", "one-on-one-prayer-for-billionaires"],
  ["deliverance-prayer-request-2", "deliverance-prayer-request"],
  ["break-the-spirit-of-backwardness", "breaking-the-spirit-of-backwardness-2"],
  ["prayer-against-serpentine-spirit-2", "prayers-against-serpentine-spirits-comoros"],
  ["spiritual-meaning-of-seeing-yourself-in-your-old-house-2", "spiritual-meaning-of-seeing-yourself-in-your-old-house"],

  // City and country variants of an article the site already has.
  //
  // The same post rewritten with "Texas", "Peckham UK" or "North Dakota USA"
  // in the title is what Google's spam policies call doorway pages, and the
  // December 2025 core update is when the site began to slide. Rule used: a
  // variant goes if it earned fewer than 10 clicks in 16 months of Search
  // Console data and a general article on the same topic exists. Variants
  // that earn real traffic stay (Comoros serpentine prayers 1,297 clicks,
  // marine spirits UK 359, California monitoring spirits 43, Dublin spirit
  // husband 10), as do pages on topics nothing else covers.
  //
  // Monitoring spirits: signs -> the signs article (1,546 clicks) ...
  ["signs-of-monitoring-spirits-in-peckham-uk", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirits-texas", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirits-italy", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirits-england", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirit-in-kingston-jamaica", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirits-in-usa-america", "signs-of-monitoring-spirits"],
  ["signs-of-monitoring-spirit-in-california-usa", "signs-of-monitoring-spirits"],
  // ... meaning and overview -> what is a monitoring spirit ...
  ["complete-guide-to-monitoring-spirits-in-england", "what-is-a-monitoring-spirit"],
  ["monitoring-spirits-in-south-africa", "what-is-a-monitoring-spirit"],
  ["monitoring-spirit-in-peckham-uk", "what-is-a-monitoring-spirit"],
  ["monitoring-spirits-in-kenya", "what-is-a-monitoring-spirit"],
  ["monitoring-spirits-uk", "what-is-a-monitoring-spirit"],
  ["monitoring-spirits-in-the-usa", "what-is-a-monitoring-spirit"],
  ["what-is-a-monitoring-spirit-in-south-east-england-and-north-east-scotland", "what-is-a-monitoring-spirit"],
  ["what-is-a-monitoring-spirit-ireland-dublin", "what-is-a-monitoring-spirit"],
  ["monitoring-spirit-meaning-in-north-dakota-usa", "what-is-a-monitoring-spirit"],
  ["monitoring-spirit-in-california-republic-usa", "what-is-a-monitoring-spirit"],
  ["monitoring-spirit-meaning-india", "what-is-a-monitoring-spirit"],
  // ... and what the Bible says -> the Bible verse article (2,367 clicks).
  ["what-does-the-bible-say-about-monitoring-spirit-in-new-york-usa", "bible-verse-about-monitoring-spirit"],

  // Spirit spouse
  ["spirit-spouse-in-the-bible-london-uk", "spiritual-husband-and-wife-in-the-bible"],
  ["spirit-husband-in-the-bible-europe", "spiritual-husband-and-wife-in-the-bible"],
  ["deliverance-from-spirit-spouse-in-london-uk", "deliverance-from-spirit-spouse"],
  ["deliverance-from-spiritual-husband-in-northern-ireland-united-kingdom", "deliverance-from-spirit-spouse"],

  // Deliverance services: the real service pages
  ["deliverance-request-uk", "deliverance-request"],
  ["online-deliverance-session-uk", "online-deliverance"],
  ["online-deliverance-uk", "online-deliverance"],
  ["get-deliverance-online-uk", "online-deliverance"],
  ["how-to-get-deliverance-usa", "how-to-get-deliverance-from-demons"],

  // Other topics with a general article
  ["python-spirit-london-united-kingdom", "python-spirit"],
  ["prayers-against-witchcraft-uk", "deliverance-from-witchcraft"],
  ["witchcraft-deliverance-near-me-london", "deliverance-from-witchcraft"],
  ["spiritual-warfare-prayers-uk", "spiritual-warfare-prayers"],
  ["deliverance-prayer-points-uk", "deliverance-prayer-points"],
  ["prayer-against-curses-usa", "prayers-that-break-curses-and-spells"],
  ["generational-curse-philadelphia-usa", "generational-curses"],
  ["bible-verses-for-breaking-free-from-darkness-uk", "bible-verses-on-deliverance-from-the-power-of-darkness"],
  ["water-spirit-spiritual-attack-uk", "how-to-deal-with-marine-spirit"],
  ["spirit-of-rejection-in-the-uk", "deliverance-from-the-spirit-of-rejection"],
  ["one-on-one-prayer-for-billionaires-in-america", "one-on-one-prayer-for-billionaires"],
  ["intercessors-new-jersey-usa", "intercessors"],
  ["prayer-conferences-program-uk", "uk-prayer-conference"],
];

/** Every slug that answers with a redirect, so the sitemap can leave it out. */
export const REDIRECTED_SLUGS = new Set(
  [...LEGACY_REDIRECTS, ...CONSOLIDATED_REDIRECTS].map(([from]) => from)
);
