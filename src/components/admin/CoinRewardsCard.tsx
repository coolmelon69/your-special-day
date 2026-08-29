/**
 * The dials on the coin economy: what she earns, and how often the good stuff
 * turns up.
 *
 * Sits on the Shop screen because it is the other half of the same sum: the
 * shelf below sets what things cost, this sets what she has to spend on them.
 *
 * Two groups, because the rows behave differently rather than to decorate the
 * card. The payouts are one-per-thing bounties `award_coins` settles; the drops
 * are what a checkpoint hands over, and the rare chance isn't money at all — it
 * is the odds the client rolls against. All six are rows in `coin_rewards`,
 * saved one at a time.
 *
 * Self-contained on purpose — it loads and saves its own rows rather than
 * threading state through ShopManager. Six numbers that share nothing with the
 * thirty-six item rows don't need to share their state either.
 */
import { useEffect, useState } from "react";
import { Check, Coins, Dices, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import PokeCoin from "@/components/PokeCoin";
import {
  DEFAULT_REWARDS,
  PAYABLE_KINDS,
  REWARD_LABELS,
  loadCoinRewards,
  saveCoinReward,
  type RewardKey,
} from "@/utils/coinRewards";

const inputCls =
  "w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

const saveBtnCls =
  "inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:brightness-95 disabled:opacity-40";

/** The two rows `record_drop` reads. Split out of the settings so the odds row,
 *  which is a percent and needs a slider, isn't forced through a coin input. */
const DROP_PAYOUT_KEYS: RewardKey[] = ["drop_common", "drop_rare"];

/**
 * The odds in the words an admin actually thinks in. "15%" is the number being
 * saved; "about 1 stop in 7" is the thing they were trying to decide.
 */
const oddsBlurb = (percent: number): string => {
  if (percent <= 0) return "Never — only the last checkpoint comes up rare.";
  if (percent >= 100) return "Every checkpoint comes up rare.";
  return `About 1 checkpoint in ${Math.round(100 / percent)} comes up rare.`;
};

const CoinRewardsCard = () => {
  /** null means the table isn't there — see `loadCoinRewards`. */
  const [amounts, setAmounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  /** Raw field text, so a field can sit empty mid-edit without snapping to 0. */
  const [drafts, setDrafts] = useState<Partial<Record<RewardKey, string>>>({});
  const [savingKey, setSavingKey] = useState<RewardKey | null>(null);
  const [savedKey, setSavedKey] = useState<RewardKey | null>(null);

  useEffect(() => {
    loadCoinRewards().then((rows) => {
      setAmounts(rows);
      setLoading(false);
    });
  }, []);

  const valueOf = (key: RewardKey): number => amounts?.[key] ?? DEFAULT_REWARDS[key];
  const draftValue = (key: RewardKey): number => {
    const draft = drafts[key];
    return draft === undefined || draft === "" ? valueOf(key) : Number(draft);
  };
  const isDirty = (key: RewardKey): boolean => {
    const draft = drafts[key];
    return draft !== undefined && Number(draft) !== valueOf(key);
  };

  const handleSave = async (key: RewardKey) => {
    const raw = drafts[key];
    if (raw === undefined) return;
    const amount = Number(raw);
    // The column carries the same check. Refusing here keeps a typo from
    // becoming a round trip that fails with a constraint name in the console.
    if (!Number.isInteger(amount) || amount < 0 || amount > 100) {
      alert(
        REWARD_LABELS[key].unit === "percent"
          ? "The rare chance has to be a whole percent between 0 and 100."
          : "A reward has to be a whole number between 0 and 100.",
      );
      return;
    }

    setSavingKey(key);
    try {
      const result = await saveCoinReward(key, amount);
      if (result === "ok") {
        setAmounts((current) => ({ ...(current ?? {}), [key]: amount }));
        setDrafts((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        setSavedKey(key);
        window.setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2400);
      } else if (result === "no-table") {
        setAmounts(null);
        alert("The coin_rewards table isn't there yet. Run sql/2026-08-29-coin-rewards.sql in Supabase.");
      } else if (result === "no-row") {
        alert(
          `"${REWARD_LABELS[key].name}" has no row in coin_rewards yet. Run ` +
            "sql/2026-08-30-drop-tuning.sql in Supabase, then try again.",
        );
      } else if (result === "forbidden") {
        alert("Only the pair owner can change the payouts. Sign in as the account that created the invite.");
      } else {
        alert("Could not save that payout. Please try again.");
      }
    } finally {
      setSavingKey(null);
    }
  };

  /** Save button — same in all seven rows, so it lives in one place. */
  const saveButton = (key: RewardKey) => (
    <button
      type="button"
      onClick={() => handleSave(key)}
      disabled={!isDirty(key) || savingKey === key}
      className={saveBtnCls}
    >
      {savingKey === key ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : savedKey === key ? (
        <Check className="h-3.5 w-3.5" />
      ) : null}
      {savingKey === key ? "Saving" : savedKey === key ? "Saved" : "Save"}
    </button>
  );

  /** A whole-number coin row: label, blurb, number field, save. */
  const coinRow = (key: RewardKey) => (
    <div key={key} className="flex items-center gap-3 rounded-lg bg-muted/25 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{REWARD_LABELS[key].name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{REWARD_LABELS[key].blurb}</p>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        aria-label={`${REWARD_LABELS[key].name} payout in coins`}
        value={drafts[key] ?? String(valueOf(key))}
        onChange={(e) => setDrafts((current) => ({ ...current, [key]: e.target.value }))}
        className={inputCls}
      />
      {saveButton(key)}
    </div>
  );

  const rareChance = draftValue("rare_chance");

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <PokeCoin size={16} className="mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">Coin rewards</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What the day is worth, in coins. The payouts below pay once per thing
            — one per level tier, one per checkpoint photographed, one per stamp
            — so raising a number doesn't re-pay what's already been earned. Set
            any payout to 0 to switch it off.
          </p>
        </div>
      </div>

      {!loading && !amounts && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-xs text-foreground">
            Couldn't read the payouts, so these are the defaults and nothing saved
            here will stick. Run{" "}
            <code className="font-mono text-[11px]">sql/2026-08-29-coin-rewards.sql</code> and{" "}
            <code className="font-mono text-[11px]">sql/2026-08-30-drop-tuning.sql</code> in
            Supabase.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Coins className="h-4 w-4" />
          Payouts
        </p>
        {PAYABLE_KINDS.map(coinRow)}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-rose" />
          Checkpoint drops
        </p>
        <p className="text-xs text-muted-foreground">
          What a stamp with a place to travel to hands over when she checks in
          there. The database pays these; the odds below are rolled in her
          browser and take effect on her next page load.
        </p>
        {DROP_PAYOUT_KEYS.map(coinRow)}

        <div className="space-y-3 rounded-lg bg-muted/25 p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Dices className="h-4 w-4 text-muted-foreground" />
                {REWARD_LABELS.rare_chance.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {REWARD_LABELS.rare_chance.blurb}
              </p>
            </div>
            <span className="w-12 text-right font-mono text-sm tabular-nums text-foreground">
              {rareChance}%
            </span>
            {saveButton("rare_chance")}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={rareChance}
            aria-label="Rare drop chance, percent"
            aria-describedby="rare-chance-odds"
            onChange={(e) => setDrafts((current) => ({ ...current, rare_chance: e.target.value }))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-rose"
          />
          <p id="rare-chance-odds" className="text-xs text-muted-foreground">
            {oddsBlurb(rareChance)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoinRewardsCard;
