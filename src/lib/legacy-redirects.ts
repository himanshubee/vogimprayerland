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
 * (1,160). Neither survived the import and neither is in the WordPress backup
 * under scripts/, so they are pointed at the nearest live article; if the
 * original copy is ever recovered, republish it at its own slug and delete the
 * pair here rather than leaving the redirect in place.
 */
export const LEGACY_REDIRECTS: [from: string, to: string][] = [
  ["bible-verses-on-deliverance-from-the-power-of-darkness", "deliverance-bible-verses"], // 1417
  ["bible-verse-for-deliverance-from-spiritual-husband", "bible-verse-against-spiritual-husband"], // 1160
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
  ["bible-verses-on-deliverance-from-the-power-of-darkness-2", "deliverance-bible-verses"], // 5
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
  ["donation", "donation-confirmation"], // 0
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
