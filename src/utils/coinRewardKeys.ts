/**
 * The pure half of the coin-reward system: what kinds of thing pay, what they
 * pay by default, how the drops are tuned, and how a reason key is spelled.
 *
 * Split from `coinRewards.ts` for the same reason `mysteryGiftCode.ts` is split
 * from `mysteryGifts.ts` — that file reaches for the Supabase client at import
 * time, and `economy.check.ts` runs under plain node with no `import.meta.env`
 * to give it. Everything here is importable by anything.
 *
 * Nothing in this file decides a payout. `coin_rewards` holds the real amounts;
 * `award_coins` and `record_drop` read them inside the transaction that pays —
 * see sql/2026-08-29-coin-rewards.sql and sql/2026-08-30-drop-tuning.sql.
 */

/**
 * Kinds of event that `award_coins` will pay for. One row in `coin_rewards`
 * each, and one word each in that function's allowlist — a kind missing from
 * either side is a reason that silently pays nothing.
 */
export type PayableKind = "level" | "photo" | "stamp";

export const PAYABLE_KINDS: PayableKind[] = ["level", "photo", "stamp"];

/**
 * Rows that tune the checkpoint drops rather than paying anyone.
 *
 * `drop_common` and `drop_rare` are read by `record_drop`; `rare_chance` is a
 * whole percent read by the client, because the roll happens there. They live
 * in `coin_rewards` alongside the payouts — same table, same RLS, same admin
 * card — and are kept out of `award_coins` by its allowlist.
 */
export type SettingKey = "drop_common" | "drop_rare" | "rare_chance";

export const SETTING_KEYS: SettingKey[] = ["drop_common", "drop_rare", "rare_chance"];

/** Every editable row, in the order the admin card shows them. */
export type RewardKey = PayableKind | SettingKey;

export const REWARD_KEYS: RewardKey[] = [...PAYABLE_KINDS, ...SETTING_KEYS];

/** Fallback values, matching the migrations' seeds. Used for display before the
 *  table has been read, and by `record_drop`'s coalesce on the other side.
 *  `economy.check.ts` fails if these drift from the seeds. */
export const DEFAULT_REWARDS: Record<RewardKey, number> = {
  level: 10,
  photo: 3,
  stamp: 10,
  drop_common: 25,
  drop_rare: 55,
  rare_chance: 15,
};

/** Human labels for the admin panel, so the table keys stay short. `unit` is
 *  what the field is measured in — the one percent row is not money and must
 *  not be typed into as though it were. */
export const REWARD_LABELS: Record<RewardKey, { name: string; blurb: string; unit: "coins" | "percent" }> = {
  level: {
    name: "Level up",
    blurb: "Paid once for each level tier reached, from tier 2 up.",
    unit: "coins",
  },
  photo: {
    name: "Checkpoint photo",
    blurb: "Paid once for the first photo taken at each checkpoint.",
    unit: "coins",
  },
  stamp: {
    name: "Stamp with no location",
    blurb: "Paid once for checking in a stamp that has no place to travel to. Those can't drop an item, so coins are all they give.",
    unit: "coins",
  },
  drop_common: {
    name: "Common drop",
    blurb: "Coins alongside an ordinary checkpoint item.",
    unit: "coins",
  },
  drop_rare: {
    name: "Rare drop",
    blurb: "Coins alongside a rare item. The last checkpoint of the journey is always rare.",
    unit: "coins",
  },
  rare_chance: {
    name: "Rare chance",
    blurb: "How often a checkpoint upgrades to a rare. The finale ignores this and is rare regardless.",
    unit: "percent",
  },
};

/**
 * Reason keys — the name of the specific thing being paid for.
 *
 * Both halves matter. The kind before the colon picks the amount; the detail
 * after it is what makes the payout unique, and so what makes it happen once.
 * `award_coins` refuses a reason missing either half, which is what stops a
 * bare "photo" from being claimed once and then blocking every real one behind
 * a key that can never be spent.
 */
export const levelReason = (levelNumber: number): string => `level:${levelNumber}`;
export const photoReason = (checkpointId: string): string => `photo:${checkpointId}`;
export const stampReason = (checkpointId: string): string => `stamp:${checkpointId}`;

/**
 * Rare odds as the fraction `rollDrop` wants, from a loaded `coin_rewards` map.
 *
 * Clamped rather than trusted: the column's own check keeps an admin inside
 * 0–100, but this also runs against `null` (table missing) and against whatever
 * a future migration seeds, and a chance outside 0–1 would quietly mean
 * "always rare" or "never".
 */
export const rareChanceFrom = (amounts: Record<string, number> | null): number => {
  const percent = amounts?.rare_chance ?? DEFAULT_REWARDS.rare_chance;
  return Math.min(100, Math.max(0, percent)) / 100;
};

/** The two drop payouts, shaped like `COINS_BY_RARITY`, from the same map.
 *  Display truth only — `record_drop` reads these rows itself when it pays. */
export const dropCoinsFrom = (
  amounts: Record<string, number> | null,
): { common: number; rare: number } => ({
  common: amounts?.drop_common ?? DEFAULT_REWARDS.drop_common,
  rare: amounts?.drop_rare ?? DEFAULT_REWARDS.drop_rare,
});
