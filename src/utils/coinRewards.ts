/**
 * Reading and writing `coin_rewards` — the payouts away from the checkpoints,
 * and the three rows that tune the checkpoint drops themselves.
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
 * They are display truth only here; `award_coins` and `record_drop` read the
 * same rows themselves inside the transaction that pays.
 *
 * The table also carries `drop_common`, `drop_rare` and `rare_chance`
 * (sql/2026-08-30-drop-tuning.sql). Those are settings, not payouts — see
 * `coinRewardKeys.ts` — and `award_coins` refuses to pay them.
 */
import { supabase } from "@/utils/supabaseClient";
import { type RewardKey } from "@/utils/coinRewardKeys";

// The keys, the defaults, the labels, the drop-tuning helpers and the
// reason-key spelling live in `coinRewardKeys.ts` — importable without a
// Supabase client. Re-exported here so callers have one place to import from.
export {
  PAYABLE_KINDS,
  SETTING_KEYS,
  REWARD_KEYS,
  DEFAULT_REWARDS,
  REWARD_LABELS,
  levelReason,
  photoReason,
  stampReason,
  rareChanceFrom,
  dropCoinsFrom,
  type PayableKind,
  type SettingKey,
  type RewardKey,
} from "@/utils/coinRewardKeys";

/** Missing `coin_rewards` table — Postgrest's "never heard of this relation". */
const NO_TABLE = "PGRST205";
const MIGRATION_HINT =
  "coin_rewards table doesn't exist yet. Run sql/2026-08-29-coin-rewards.sql, then " +
  "sql/2026-08-30-drop-tuning.sql, in Supabase.";

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

/** Why a save didn't happen. `no-row` is the table existing without this key —
 *  a database that ran one coin migration but not the next. */
export type SaveRewardResult = "ok" | "no-table" | "no-row" | "forbidden" | "error";

/** Reprice one kind. Update, never upsert — an unknown key should fail loudly
 *  rather than add a row no caller will ever name. */
export const saveCoinReward = async (
  key: RewardKey,
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

    if (data && data.length > 0) return "ok";

    // Matching no rows means one of two very different things, and the fix for
    // each is nothing like the other: RLS refused the write (the partner half
    // of a pair), or the row was never seeded (a migration behind). Only a
    // second read can tell them apart, and only ever on this failure path.
    const { data: existing } = await supabase
      .from("coin_rewards")
      .select("key")
      .eq("key", key);
    return existing && existing.length > 0 ? "forbidden" : "no-row";
  } catch (error) {
    console.error("Error saving coin reward:", error);
    return "error";
  }
};
