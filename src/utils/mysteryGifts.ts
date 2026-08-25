/**
 * Mystery Gift — a printed QR card that grants one coupon on first scan.
 *
 * The whole security story lives in sql/2026-08-23-mystery-gifts.sql: the
 * claim is a single atomic UPDATE server-side, so a photographed card cannot
 * be redeemed twice. Nothing in this file is a gate; it generates codes,
 * normalises them, and calls the RPCs.
 *
 * See docs/superpowers/specs/2026-08-23-mystery-gift-design.md
 */

import { supabase } from "@/utils/supabaseClient";
import { convertCouponId } from "@/utils/redeemCoupon";
import { giftKey, normalizeGiftCode } from "@/utils/mysteryGiftCode";

/** What the card is worth: the coupon it becomes. */
export type MysteryGiftPayload = {
  title: string;
  description: string;
  emoji: string;
  /** Tailwind gradient classes, same vocabulary as CustomCoupon.color. */
  color: string;
};

export type MysteryGift = {
  id: string;
  code: string;
  payload: MysteryGiftPayload;
  note: string | null;
  createdAt: number;
  claimedAt: number | null;
  isClaimed: boolean;
  /** The photo and the mark printed on this gift's card, if any have been
   *  uploaded. See src/utils/giftPrintImages.ts — the card DESIGN is not
   *  stored alongside them, it is chosen on /print/gifts each time. */
  printHero: string | null;
  printMark: string | null;
};

export type ClaimedGift = {
  id: string;
  payload: MysteryGiftPayload;
  claimedAt: number | null;
};

export type ClaimResult =
  | { status: "claimed"; id: string; payload: MysteryGiftPayload }
  | { status: "already" }
  | { status: "invalid" }
  | { status: "unauthenticated" }
  | { status: "error" };

export {
  CODE_LENGTH,
  generateGiftCode,
  normalizeGiftCode,
  formatGiftCode,
  giftQRValue,
  extractGiftCode,
} from "@/utils/mysteryGiftCode";

/**
 * The coupon id a claimed gift takes in the coupon list.
 *
 * `convertCouponId` already hashes string ids into the 10000+ range so custom
 * coupons cannot collide with the numeric defaults (1-3). Reusing it means a
 * gift coupon redeems through `redeemCoupon` and lands in `redeemedCouponIds`
 * with no change to that file at all. The `gift:` prefix keeps gift ids clear
 * of the custom-coupon uuids running through the same hash.
 */
export const giftCouponId = (giftId: string): number =>
  convertCouponId(giftKey(giftId));

/**
 * A claimed gift as the coupon list wants it: unlocked outright. No stamp
 * requirement and no price — it was already paid for with a printed card.
 */
export const giftToCoupon = (gift: ClaimedGift) => ({
  id: giftCouponId(gift.id),
  title: gift.payload.title,
  description: gift.payload.description,
  emoji: gift.payload.emoji,
  color: gift.payload.color,
  requiredStamps: 0,
  category: "mystery-gift",
});

/** Burn a code and take the coupon. The one call that matters. */
export const claimMysteryGift = async (code: string): Promise<ClaimResult> => {
  if (!supabase) return { status: "error" };

  try {
    const { data, error } = await supabase.rpc("claim_mystery_gift", {
      p_code: normalizeGiftCode(code),
    });

    if (error) {
      console.error("Error claiming mystery gift:", error);
      return { status: "error" };
    }

    const status = (data as { status?: string } | null)?.status;
    if (status === "claimed") {
      const row = data as { id: string; payload: MysteryGiftPayload };
      return { status: "claimed", id: row.id, payload: row.payload };
    }
    if (status === "already" || status === "invalid" || status === "unauthenticated") {
      return { status };
    }
    return { status: "error" };
  } catch (e) {
    console.error("Error claiming mystery gift:", e);
    return { status: "error" };
  }
};

/** Every gift this account has claimed, oldest first. Feeds the coupon list. */
export const loadClaimedGifts = async (): Promise<ClaimedGift[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("my_claimed_mystery_gifts");
    if (error) {
      console.error("Error loading claimed gifts:", error);
      return [];
    }
    return ((data as any[]) ?? []).map((row) => ({
      id: row.id as string,
      payload: row.payload as MysteryGiftPayload,
      claimedAt: row.claimed_at ? new Date(row.claimed_at).getTime() : null,
    }));
  } catch (e) {
    console.error("Error loading claimed gifts:", e);
    return [];
  }
};

/** Author a gift. Returns its id, or null if the insert was refused. */
export const createMysteryGift = async (
  code: string,
  payload: MysteryGiftPayload,
  note?: string
): Promise<string | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("create_mystery_gift", {
      p_code: normalizeGiftCode(code),
      p_payload: payload,
      p_note: note ?? "",
    });
    if (error) {
      console.error("Error creating mystery gift:", error);
      return null;
    }
    return (data as string) ?? null;
  } catch (e) {
    console.error("Error creating mystery gift:", e);
    return null;
  }
};

/** Everything this account authored, newest first. */
export const listMyMysteryGifts = async (): Promise<MysteryGift[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("list_my_mystery_gifts");
    if (error) {
      console.error("Error listing mystery gifts:", error);
      return [];
    }
    return ((data as any[]) ?? []).map((row) => ({
      id: row.id as string,
      code: row.code as string,
      payload: row.payload as MysteryGiftPayload,
      note: (row.note as string) ?? null,
      createdAt: new Date(row.created_at).getTime(),
      claimedAt: row.claimed_at ? new Date(row.claimed_at).getTime() : null,
      isClaimed: !!row.is_claimed,
      printHero: (row.print_hero as string) ?? null,
      printMark: (row.print_mark as string) ?? null,
    }));
  } catch (e) {
    console.error("Error listing mystery gifts:", e);
    return [];
  }
};

/** Delete an unclaimed gift. Refused server-side once someone has opened it. */
export const deleteMysteryGift = async (id: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("delete_mystery_gift", { p_id: id });
    if (error) {
      console.error("Error deleting mystery gift:", error);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("Error deleting mystery gift:", e);
    return false;
  }
};
