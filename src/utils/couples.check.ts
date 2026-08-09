/**
 * Self-check for invite codes. No test framework:
 *   node src/utils/couples.check.ts
 */
import assert from "node:assert/strict";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateInviteCode,
  formatInviteCode,
  normalizeInviteCode,
  isCodeExpired,
  type Couple,
} from "./couples.ts";

// Length and alphabet — every draw, not just one
for (let i = 0; i < 1000; i++) {
  const code = generateInviteCode();
  assert.equal(code.length, CODE_LENGTH, "code is six characters");
  for (const ch of code) {
    assert.ok(CODE_ALPHABET.includes(ch), `${ch} is in the alphabet`);
  }
}

// No ambiguous glyphs can ever appear
for (const glyph of ["O", "0", "I", "1"]) {
  assert.ok(!CODE_ALPHABET.includes(glyph), `${glyph} excluded from alphabet`);
}
for (let i = 0; i < 1000; i++) {
  const code = generateInviteCode();
  for (const glyph of ["O", "0", "I", "1"]) {
    assert.ok(!code.includes(glyph), `${code} must not contain ${glyph}`);
  }
}

// 10,000 draws with real randomness: no duplicate collisions
const draws = new Set<string>();
for (let i = 0; i < 10_000; i++) {
  draws.add(generateInviteCode(Math.random));
}
assert.equal(draws.size, 10_000, "10,000 draws produced no collisions");

// normalizeInviteCode round-trips through formatInviteCode
for (const raw of ["ABC234", "abc234", "abc-234", "ABC 234", "aBc-234"]) {
  const canonical = normalizeInviteCode(raw);
  assert.equal(canonical, "ABC234", `${raw} normalizes to ABC234`);
}
const sample = generateInviteCode();
assert.equal(
  normalizeInviteCode(formatInviteCode(sample)),
  sample,
  "format then normalize round-trips to the original code",
);
assert.equal(formatInviteCode("ABC234"), "ABC-234", "format inserts the dash at position 3");

// isCodeExpired
const baseCouple: Couple = {
  id: "couple-1",
  ownerId: "owner-1",
  partnerId: null,
  inviteCode: "ABC234",
  codeExpiresAt: "2026-08-10T00:00:00.000Z",
  linkedAt: null,
  createdAt: "2026-08-03T00:00:00.000Z",
};
assert.equal(
  isCodeExpired(baseCouple, new Date("2026-08-11T00:00:00.000Z")),
  true,
  "expired once past code_expires_at",
);
assert.equal(
  isCodeExpired(baseCouple, new Date("2026-08-09T00:00:00.000Z")),
  false,
  "not expired before code_expires_at",
);

console.log("couples.check.ts: all assertions passed");
