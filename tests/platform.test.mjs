// Run with: npm test  (Node's built-in runner; Node strips the TypeScript types.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, scryptSync } from "node:crypto";

const hash = (pw) => {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 64).toString("hex")}`;
};
const TOTP_SECRET = "JBSWY3DPEHPK3PXP";
process.env.ADMIN_SECRET = "test-secret-test-secret-test-secret";
process.env.ADMIN_USERS = JSON.stringify([
  { username: "grace", role: "intercessor", passwordHash: hash("correct horse battery") },
  { username: "pastor", role: "pastor", passwordHash: hash("another long password"), totpSecret: TOTP_SECRET },
  { username: "ledger", role: "finance", passwordHash: hash("finance password 1") },
]);

const auth = await import("../src/lib/auth-core.ts");
const inbox = await import("../src/lib/inbox-core.ts");
const flags = await import("../src/lib/flags.ts");

function totpNow(secret, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30000)));
  const d = createHmac("sha1", key).update(counter).digest();
  const p = d[d.length - 1] & 0xf;
  return String((d.readUInt32BE(p) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

test("staff login checks the password", () => {
  assert.equal(auth.login("grace", "wrong", "").ok, false);
  const ok = auth.login("Grace", "correct horse battery", "");
  assert.equal(ok.ok, true);
  assert.equal(ok.session.role, "intercessor");
});

test("an account with MFA needs a valid code", () => {
  const noCode = auth.login("pastor", "another long password", "");
  assert.equal(noCode.ok, false);
  assert.equal(noCode.needsCode, true);
  assert.equal(auth.login("pastor", "another long password", "000000").ok, false);
  assert.equal(auth.login("pastor", "another long password", totpNow(TOTP_SECRET)).ok, true);
});

test("TOTP matches the RFC 6238 reference value", () => {
  // RFC 6238 appendix B, SHA-1, T = 59 s, secret "12345678901234567890" -> 94287082 (8 digits) -> 287082
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(auth.verifyTotp(secret, "287082", 59_000), true);
  assert.equal(auth.verifyTotp(secret, "287083", 59_000), false);
});

test("session tokens are signed, expire and follow the account", () => {
  const token = auth.createToken({ username: "grace", role: "intercessor", exp: Date.now() + 60_000 });
  assert.equal(auth.readToken(token)?.username, "grace");
  const [payload] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ username: "grace", role: "admin", exp: Date.now() + 60_000 })).toString("base64url");
  assert.equal(auth.readToken(`${forged}.${token.split(".")[1]}`), null);
  assert.equal(auth.readToken(`${payload}.bad`), null);
  assert.equal(auth.readToken(auth.createToken({ username: "grace", role: "intercessor", exp: Date.now() - 1 })), null);
  // Role in the token no longer matches the account.
  assert.equal(auth.readToken(auth.createToken({ username: "grace", role: "pastor", exp: Date.now() + 60_000 })), null);
});

test("roles only read the request types they need", () => {
  assert.equal(auth.canReadIntent("finance", "Prayer Request"), false);
  assert.equal(auth.canReadIntent("finance", "Refund Request"), true);
  assert.equal(auth.canReadIntent("intercessor", "Refund Request"), false);
  assert.equal(auth.canReadIntent("intercessor", "Healing Request"), true);
  assert.equal(auth.canReadIntent("pastor", "Complaint"), true);
});

test("inbox summaries carry no request text or contact details", () => {
  const row = inbox.toSummary({
    _id: "abc",
    intent: "Healing Request",
    status: "done",
    createdAt: new Date("2026-11-01T10:00:00Z"),
    fields: { name: "Ada Obi", email: "ada@example.org", phone: "0800", request: "private words", condition: "health" },
  });
  assert.equal(row.displayName, "Ada");
  assert.equal(row.status, "closed");
  const text = JSON.stringify(row);
  for (const secret of ["ada@example.org", "0800", "private words", "health", "Obi"]) assert.equal(text.includes(secret), false);
});

test("reply measure counts only requests whose 24 hours have passed", () => {
  const now = Date.parse("2026-11-20T12:00:00Z");
  const h = 3_600_000;
  const mk = (createdAgoH, repliedAfterH) => ({
    createdAt: new Date(now - createdAgoH * h).toISOString(),
    firstRepliedAt: repliedAfterH === null ? null : new Date(now - createdAgoH * h + repliedAfterH * h).toISOString(),
  });
  const stats = inbox.replyStats([mk(30, 2), mk(40, 30), mk(50, null), mk(5, null), mk(10 * 24, 1)], now);
  assert.deepEqual(stats, { due: 3, onTime: 1 });
});

test("care_refresh_v1 stages and rollback", () => {
  process.env.CARE_REFRESH_V1 = "off";
  assert.equal(flags.careRefreshOn({ staff: true }), false);
  delete process.env.CARE_REFRESH_V1;
  assert.equal(flags.careRefreshOn({ staff: true }), false);
  process.env.CARE_REFRESH_V1 = "staff";
  assert.equal(flags.careRefreshOn({ staff: true }), true);
  assert.equal(flags.careRefreshOn({ bucketId: "visitor-1" }), false);
  process.env.CARE_REFRESH_V1 = "100";
  assert.equal(flags.careRefreshOn({ bucketId: "visitor-1" }), true);
  process.env.CARE_REFRESH_V1 = "10";
  const on = Array.from({ length: 2000 }, (_, i) => flags.careRefreshOn({ bucketId: `v${i}` })).filter(Boolean).length;
  assert.ok(on > 120 && on < 280, `about 10% expected, got ${on}`);
});

test("TOTP match reports the time step so a code can be used once", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(auth.matchTotpStep(secret, "287082", 59_000), 1);
  assert.equal(auth.matchTotpStep(secret, "000000", 59_000), null);
});
