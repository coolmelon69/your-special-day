/**
 * The pure half of the coin-reward system: what kinds of thing pay, what they
 * pay by default, and how a reason key is spelled.
 *
 * Split from `coinRewards.ts` for the same reason `mysteryGiftCode.ts` is split
 * from `mysteryGifts.ts` — that file reaches for the Supabase client at import
 * time, and `economy.check.ts` runs under plain node with no `import.meta.env`
 * to give it. Everything here is importable by anything.
 *
 * Nothing in this file decides a payout. `coin_rewards` holds the real amounts
 * and `award_coins` reads them itself — see sql/2026-08-29-coin-rewards.sql.
 */

/** The kinds of event that pay. One row in `coin_rewards` each. */
export type RewardKind = "level" | "photo";

export const REWARD_KINDS: RewardKind[] = ["level", "photo"];

/** Fallback amounts, matching the migration's seed. Used for display when the
 *  table hasn't been created yet — the database still decides the real payout.
 *  `economy.check.ts` fails if these drift from the seed. */
export const DEFAULT_REWARDS: Record<RewardKind, number> = { level: 10, photo: 3 };

/** Human labels for the admin panel, so the table keys stay short. */
export const REWARD_LABELS: Record<RewardKind, { name: string; blurb: string }> = {
  level: {
    name: "Level up",
    blurb: "Paid once for each level tier reached, from tier 2 up.",
  },
  photo: {
    name: "Checkpoint photo",
    blurb: "Paid once for the first photo taken at each checkpoint.",
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
