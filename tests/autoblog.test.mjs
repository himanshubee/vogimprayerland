// Run with: npm test  (Node's built-in runner; Node strips the TypeScript types.)
import { test } from "node:test";
import assert from "node:assert/strict";

const { sanitiseArticleHtml } = await import("../src/lib/autoblog/sanitize.ts");
const { cleanPostContent, extractFaq } = await import("../src/lib/clean-content.ts");

const allowed = new Set(["/prayer-request/", "/signs-of-monitoring-spirits/"]);

test("model HTML loses scripts, styles, attributes and unknown tags", () => {
  const out = sanitiseArticleHtml(
    '<h1>Title</h1><script>alert(1)</script><p class="x" style="color:red" onclick="evil()">Hi <img src=x onerror=alert(1)><span>there</span></p><iframe src="//x"></iframe>',
    allowed
  );
  assert.equal(out, "<h2>Title</h2><p>Hi there</p>");
});

test("only links to known pages survive; others become plain text", () => {
  const out = sanitiseArticleHtml(
    '<p><a href="https://www.vogimprayerland.org/prayer-request">pray</a> <a href="/made-up-page/">fake</a> <a href="https://spam.example/">spam</a> <a href="/signs-of-monitoring-spirits/#x" target="_blank">signs</a></p>',
    allowed
  );
  assert.equal(out, '<p><a href="/prayer-request/">pray</a> fake spam <a href="/signs-of-monitoring-spirits/">signs</a></p>');
});

test("heading ids are kept only when safe", () => {
  assert.equal(sanitiseArticleHtml('<h2 id="faq">Q</h2><h3 id="bad id!">x</h3>', allowed), '<h2 id="faq">Q</h2><h3>x</h3>');
});

test("SEO and prompt residue is stripped from post HTML", () => {
  const html =
    '<p>Real teaching.</p><p>The focus keyword “prayers against spirit husbands” will appear 30 times, as requested.</p>' +
    '<details><summary><a href="https://facebook.com/x">Follow Us</a></summary><p>Targets "x" 1.9k/mo. Table format wins featured snippet.</p></details>' +
    '<table><tr><td>Google Rank</td><td>E-E-A-T high</td></tr><tr><td>Aftercare</td><td>Free</td></tr></table>[vc_row][vc_column]<!-- AI SEO -->';
  const out = cleanPostContent(html);
  assert.ok(out.includes("Real teaching."));
  assert.ok(out.includes("Aftercare"));
  assert.ok(out.includes("Follow Us"));
  for (const bad of ["focus keyword", "1.9k/mo", "E-E-A-T", "[vc_", "AI SEO"]) assert.ok(!out.includes(bad), bad);
});

test("an SEO accordion goes, a ministry note in the same markup stays", () => {
  const seo = '<section class="seo-transparency"><details><summary>How We Optimize This Ministry for Search</summary><p>We use schema.</p></details></section>';
  const note = '<section class="seo-transparency"><details><summary>VOGIM 3AM Prayer Watch Note</summary><p>We watch at 3AM.</p></details></section>';
  assert.equal(cleanPostContent(seo + note), note);
});

test("FAQ pairs are read from the faq section only", () => {
  const html =
    '<h2>Intro</h2><h3>Not a FAQ</h3><p>skip</p>' +
    '<h2 id="faq">Questions people ask</h2><h3>What is it?</h3><p>It is <strong>this</strong>.</p><h3>Is it free?</h3><p>Yes &amp; always.</p>' +
    '<h2>Related</h2><h3>Later</h3><p>skip</p>';
  assert.deepEqual(extractFaq(html), [
    { q: "What is it?", a: "It is this ." },
    { q: "Is it free?", a: "Yes & always." },
  ]);
});

const fixes = await import("../src/lib/autoblog/seo-fixes.ts");

test("first scripture reference in body text links to the KJV on Bible Gateway", () => {
  const html = '<h2>Psalm 91:1 in a heading</h2><p>See <a href="/x/">John 3:16</a> and Psalm 121:8 and 1 John 1:9.</p>';
  assert.equal(
    fixes.linkFirstScripture(html),
    '<h2>Psalm 91:1 in a heading</h2><p>See <a href="/x/">John 3:16</a> and <a href="https://www.biblegateway.com/passage/?search=Psalm%20121%3A8&version=KJV" rel="noopener" target="_blank">Psalm 121:8</a> and 1 John 1:9.</p>'
  );
  const already = '<p><a href="https://example.org/">x</a> Psalm 1:1</p>';
  assert.equal(fixes.linkFirstScripture(already), already);
});

test("featured figure goes after the first paragraph and is replaced, not duplicated", () => {
  const img = { src: "https://img.example/a.webp", alt: 'Soul ties: "open" Bible', width: 1600, height: 819 };
  const once = fixes.insertFigure("<p>Answer.</p><h2>Next</h2>", img);
  assert.equal(
    once,
    '<p>Answer.</p>\n<figure data-featured><img src="https://img.example/a.webp" alt="Soul ties: &quot;open&quot; Bible" width="1600" height="819" loading="lazy" decoding="async" /></figure>\n<h2>Next</h2>'
  );
  assert.equal(fixes.insertFigure(once, img).match(/<figure/g).length, 1);
});

test("alt text names the keyword without repeating it", () => {
  assert.equal(fixes.altWithKeyword("Open Bible at dawn.", "how to break soul ties"), "How to break soul ties: open Bible at dawn");
  assert.equal(fixes.altWithKeyword("A prayer for travelling mercies scene", "prayer for travelling mercies"), "A prayer for travelling mercies scene");
});

test("keyword uses are counted case-insensitively across tags", () => {
  assert.deepEqual(fixes.keywordUses("<p>Soul <strong>ties</strong> matter. SOUL TIES break.</p>", "soul ties"), { uses: 2, words: 6 });
});
