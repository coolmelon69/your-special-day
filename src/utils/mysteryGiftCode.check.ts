/**
 * Self-check for Mystery Gift codes. No test framework:
 *   node src/utils/mysteryGiftCode.check.ts
 *
 * The burn — one code, one claim, ever — is enforced by `claim_mystery_gift`
 * in sql/2026-08-23-mystery-gifts.sql, not by anything here, and it is
 * verified by claiming a real code twice against Supabase. What this file
 * covers is the half that lives in TypeScript: that a printed code cannot be
 * misread, that a code typed back in by hand still resolves, and that the
 * scanner only claims scans that are actually ours.
 */
import assert from "node:assert/strict";
import {
  CODE_LENGTH,
  generateGiftCode,
  normalizeGiftCode,
  formatGiftCode,
  giftQRValue,
  extractGiftCode,
  giftKey,
} from "./mysteryGiftCode.ts";

// ---- generation ----

const SAMPLE = 20000;
const codes = Array.from({ length: SAMPLE }, generateGiftCode);

for (const code of codes.slice(0, 200)) {
  assert.equal(code.length, CODE_LENGTH, "codes are a fixed length");
}

// The whole point of Crockford base32: nothing a printed card can smudge into
// another character.
assert.ok(
  codes.every((c) => /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/.test(c)),
  "codes avoid I, L, O and U so a printed card cannot be misread",
);

// A duplicate would mean two cards claiming the same gift — the unique index
// would reject the second at creation, but silently, and the card is by then
// printed.
assert.equal(new Set(codes).size, SAMPLE, "codes do not repeat");

// Every symbol is reachable; a broken modulo would quietly shrink the space.
const used = new Set(codes.join("").split(""));
assert.equal(used.size, 32, "the whole alphabet is in play");

// ---- normalisation ----

const code = "0123456789ABCDEF";
assert.equal(normalizeGiftCode(code), code, "a clean code passes through");
assert.equal(normalizeGiftCode("0123-4567-89ab-cdef"), code, "dashes come out");
assert.equal(normalizeGiftCode("0123 4567 89AB CDEF"), code, "spaces come out");
assert.equal(normalizeGiftCode("0123456789abcdef"), code, "lowercase is lifted");
assert.equal(normalizeGiftCode(""), "", "empty stays empty");
assert.equal(normalizeGiftCode(null as unknown as string), "", "null does not throw");

// The printed grouping has to survive a round trip, or a hand-typed code fails.
assert.equal(formatGiftCode(code), "0123-4567-89AB-CDEF", "printed in fours");
assert.equal(normalizeGiftCode(formatGiftCode(code)), code, "printing round-trips");
for (const c of codes.slice(0, 500)) {
  assert.equal(normalizeGiftCode(formatGiftCode(c)), c, "every code round-trips");
}

// ---- what the QR carries ----

assert.deepEqual(JSON.parse(giftQRValue(code)), { gift: code }, "QR carries the code");
assert.equal(extractGiftCode(giftQRValue(code)), code, "our own QR reads back");

// ---- extraction: what the scanner accepts ----

assert.equal(extractGiftCode(formatGiftCode(code)), code, "a bare dashed code works");
assert.equal(extractGiftCode(`  ${code}  `), code, "surrounding whitespace is fine");
assert.equal(extractGiftCode(code.toLowerCase()), code, "lowercase is fine");

// A coupon QR must fall through untouched — ScanQRPage still owns that path,
// and swallowing it here would break redemption.
assert.equal(
  extractGiftCode(JSON.stringify({ couponId: 2, title: "Dinner Choice" })),
  null,
  "a coupon QR is not a gift",
);
assert.equal(extractGiftCode(JSON.stringify({ gift: 42 })), null, "gift must be a string");
assert.equal(extractGiftCode(JSON.stringify({ gift: "SHORT" })), null, "a short code is not one of ours");
assert.equal(extractGiftCode("SHORTCODE"), null, "a short bare code is rejected");
assert.equal(extractGiftCode("https://example.com/some-qr-code-here"), null, "a URL is not a code");
assert.equal(extractGiftCode(""), null, "empty is not a code");
assert.equal(extractGiftCode("   "), null, "whitespace is not a code");

// ---- coupon keys ----

// Distinct gifts must key distinctly, or two gifts would share one coupon id
// and redeeming one would redeem the other.
const ids = codes.slice(0, 5000).map((c) => giftKey(c));
assert.equal(new Set(ids).size, ids.length, "distinct gifts key distinctly");
assert.ok(giftKey("abc").startsWith("gift:"), "gift keys stay clear of custom-coupon uuids");

console.log("mysteryGiftCode.check.ts: all assertions passed");
