/**
 * Mystery Gift codes: generation, normalisation, and pulling one back out of
 * a scan.
 *
 * Deliberately import-free. `mysteryGifts.ts` next door talks to Supabase and
 * therefore reaches for the `@/` alias, which `node` cannot resolve — so the
 * half worth checking lives here, where `mysteryGiftCode.check.ts` can run it
 * the same way every other *.check.ts in this folder runs.
 *
 * See docs/superpowers/specs/2026-08-23-mystery-gift-design.md
 */

/**
 * Crockford base32: the alphabet minus I, L, O and U.
 *
 * These codes get printed on cards and read by eye when a scan fails. Without
 * those four letters nothing can be confused with 1 or 0, and no random draw
 * can spell something unfortunate on a gift.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CODE_LENGTH = 16;

/**
 * 16 characters over a 32-symbol alphabet is 80 bits. Guessing one is not a
 * threat worth defending further — the server-side burn covers the real one
 * (a card being photographed and rescanned).
 */
export const generateGiftCode = (): string => {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    /* 256 is a whole multiple of 32, so a plain modulo stays uniform. */
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
};

/**
 * Strip everything non-alphanumeric and uppercase the rest, so a code copied
 * with dashes, spaces, or in lowercase still resolves to the stored form.
 *
 * Mirrors the regexp inside the SQL functions
 * (sql/2026-08-23-mystery-gifts.sql). Change one and the other has to follow.
 */
export const normalizeGiftCode = (raw: string): string =>
  (raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

/** Printed form: four groups of four. Easier to read off a card and retype. */
export const formatGiftCode = (code: string): string =>
  (normalizeGiftCode(code).match(/.{1,4}/g) ?? []).join("-");

/** What the QR encodes. Kept short so the card prints with big, sturdy modules. */
export const giftQRValue = (code: string): string =>
  JSON.stringify({ gift: normalizeGiftCode(code) });

/**
 * Pull a gift code out of whatever the scanner handed us.
 *
 * Two shapes are accepted: the JSON the QR carries, and a bare code — so a
 * card that scans imperfectly, or a code typed in by hand, still works.
 * Anything else returns null and the caller falls through to the existing
 * coupon-redemption path, which owns the other QR format.
 */
export const extractGiftCode = (scanned: string): string | null => {
  const trimmed = (scanned || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.gift === "string") {
      const code = normalizeGiftCode(parsed.gift);
      return code.length >= CODE_LENGTH ? code : null;
    }
    /* Valid JSON, no gift field — that's a coupon QR. Not ours. */
    return null;
  } catch {
    /* Not JSON. Could still be a bare code. */
  }

  if (!/^[A-Za-z0-9\s-]+$/.test(trimmed)) return null;
  const code = normalizeGiftCode(trimmed);
  return code.length >= CODE_LENGTH ? code : null;
};

/**
 * The string a gift hashes through to get its coupon id.
 *
 * The `gift:` prefix keeps gift ids clear of the custom-coupon uuids running
 * through the same hash in `convertCouponId`. The hashing itself stays in
 * `mysteryGifts.ts`, where that function can be imported.
 */
export const giftKey = (giftId: string): string => `gift:${giftId}`;
