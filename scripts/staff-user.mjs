#!/usr/bin/env node
// Creates one ADMIN_USERS entry with a scrypt password hash and a TOTP secret.
// Usage: node scripts/staff-user.mjs <username> <intercessor|pastor|finance|admin>
// The password is read from the STAFF_PASSWORD environment variable so it never
// lands in shell history. Add the printed JSON object to the ADMIN_USERS array
// in the server's protected environment, and give the otpauth URL to the
// staff member to scan into their authenticator app.
import { randomBytes, scryptSync } from "crypto";

const [username, role] = process.argv.slice(2);
const roles = ["intercessor", "pastor", "finance", "admin"];
const password = process.env.STAFF_PASSWORD || "";
if (!username || !roles.includes(role) || password.length < 12) {
  console.error("Usage: STAFF_PASSWORD='<12+ chars>' node scripts/staff-user.mjs <username> <" + roles.join("|") + ">");
  process.exit(1);
}

const salt = randomBytes(16);
const passwordHash = `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 64).toString("hex")}`;

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const totpSecret = Array.from(randomBytes(20), (b) => alphabet[b % 32]).join("");

console.log(JSON.stringify({ username, role, passwordHash, totpSecret }));
console.log(`\notpauth://totp/VOGIM%20Admin:${encodeURIComponent(username)}?secret=${totpSecret}&issuer=VOGIM%20Admin`);
