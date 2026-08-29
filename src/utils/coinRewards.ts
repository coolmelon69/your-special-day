/**
 * Coin payouts for things that aren't checkpoint drops.
 *
 * Levelling up and photographing a checkpoint both pay through one RPC,
 * `award_coins` (sql/2026-08-29-coin-rewards.sql): the caller names what
 * happened, the database decides what that kind of thing is worth and refuses
 * to pay for the same named thing twice.
 *
 * That "refuses twice" is the whole design. Callers here are deliberately
 * speculative — the level effect re-offers every tier every time the trainer
 * card is opened — so nothing in this file tracks what has been paid. Asking
 * again is free and is what makes tiers crossed before this feature existed
 * still get their coins.
 *
 * Amounts live in the `coin_rewards` table and are edited in the admin panel.
 * They are display truth only here; `award_coins` reads the same row itself
 * inside the transaction that pays.
 */
import { supabase } from "@/utils/supabaseClient";
import { type RewardKind } from "@/utils/coinRewardKeys";

// The kinds, the defaults, the labels and the reason-key spelling live in
// `coinRewardKeys.ts` — importable without a Supabase client. Re-exported here
// so callers have one place to import from.
export {
  REWARD_KINDS,
  DEFAULT_REWARDS,
  REWARD_LABELS,
  levelReason,
  photoReason,
  type RewardKind,
} from "@/utils/coinRewardKeys";

/** Missing `coin_rewards` table — Postgrest's "never heard of this relation". */
const NO_TABLE = "PGRST205";
const MIGRATION_HINT =
  "coin_rewards table doesn't exist yet. Run sql/2026-08-29-coin-rewards.sql in Supabase.";

/**
 * Claim a payout. Resolves the number of coins actually paid — 0 for every
 * flavour of "no", including the common one where this reason was already
 * settled. Never throws: callers fire it alongside the thing that earned it
 * and must not have that thing fail because the reward didn't land.
 */
export const awardCoins = async (reason: string): Promise<number> => {
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.rpc("award_coins", { p_reason: reason });
    if (error) {
      // A database without the migration is the expected shape of this error,
      // and it means "this feature isn't turned on here" — not a failure worth
      // shouting about on every photo.
      if (error.code === NO_TABLE || error.code === "42883") console.warn(MIGRATION_HINT);
      else console.error("Error awarding coins:", error);
      return 0;
    }
    return typeof data === "number" ? data : 0;
  } catch (error) {
    console.error("Error awarding coins:", error);
    return 0;
  }
};

/**
 * Every reward amount, keyed by kind.
 *
 * Returns null — not the defaults — when the table isn't there, so the admin
 * panel can say which migration is missing instead of showing numbers that
 * nothing will honour.
 */
export const loadCoinRewards = async (): Promise<Record<string, number> | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from("coin_rewards").select("key, amount");
    if (error) {
      if (error.code === NO_TABLE) console.warn(MIGRATION_HINT);
      else console.error("Error loading coin rewards:", error);
      return null;
    }
    return Object.fromEntries((data ?? []).map((row) => [row.key as string, row.amount as number]));
  } catch (error) {
    console.error("Error loading coin rewards:", error);
    return null;
  }
};

/** Why a save didn't happen. Same three words as `saveItemShopRow`. */
export type SaveRewardResult = "ok" | "no-table" | "forbidden" | "error";

/** Reprice one kind. Update, never upsert — an unknown key should fail loudly
 *  rather than add a row no caller will ever name. */
export const saveCoinReward = async (
  key: RewardKind,
  amount: number,
): Promise<SaveRewardResult> => {
  if (!supabase) return "error";

  try {
    const { data, error } = await supabase
      .from("coin_rewards")
      .update({ amount, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select("key");

    if (error) {
      if (error.code === NO_TABLE) {
        console.warn(MIGRATION_HINT);
        return "no-table";
      }
      console.error("Error saving coin reward:", error);
      return "error";
    }

    // RLS refusing an update matches no rows rather than erroring — that's the
    // partner half of a pair trying to set the payouts.
    return data && data.length > 0 ? "ok" : "forbidden";
  } catch (error) {
    console.error("Error saving coin reward:", error);
    return "error";
  }
};
