/**
 * What the two non-drop coin payouts are worth.
 *
 * Sits on the Shop screen because it is the other half of the same sum: the
 * shelf below sets what things cost, this sets what she has to spend on them.
 *
 * Self-contained on purpose — it loads and saves its own two rows rather than
 * threading state through ShopManager. Two numbers that share nothing with the
 * thirty-six item rows don't need to share their state either.
 */
import { useEffect, useState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import PokeCoin from "@/components/PokeCoin";
import {
  DEFAULT_REWARDS,
  REWARD_KINDS,
  REWARD_LABELS,
  loadCoinRewards,
  saveCoinReward,
  type RewardKind,
} from "@/utils/coinRewards";

const inputCls =
  "w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

const CoinRewardsCard = () => {
  /** null means the table isn't there — see `loadCoinRewards`. */
  const [amounts, setAmounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  /** Raw field text, so a field can sit empty mid-edit without snapping to 0. */
  const [drafts, setDrafts] = useState<Partial<Record<RewardKind, string>>>({});
  const [savingKey, setSavingKey] = useState<RewardKind | null>(null);
  const [savedKey, setSavedKey] = useState<RewardKind | null>(null);

  useEffect(() => {
    loadCoinRewards().then((rows) => {
      setAmounts(rows);
      setLoading(false);
    });
  }, []);

  const valueOf = (key: RewardKind): number => amounts?.[key] ?? DEFAULT_REWARDS[key];

  const handleSave = async (key: RewardKind) => {
    const raw = drafts[key];
    if (raw === undefined) return;
    const amount = Number(raw);
    // The column carries the same check. Refusing here keeps a typo from
    // becoming a round trip that fails with a constraint name in the console.
    if (!Number.isInteger(amount) || amount < 0 || amount > 100) {
      alert("A reward has to be a whole number between 0 and 100.");
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
      } else if (result === "forbidden") {
        alert("Only the pair owner can change the payouts. Sign in as the account that created the invite.");
      } else {
        alert("Could not save that payout. Please try again.");
      }
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <PokeCoin size={16} className="mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">Coin rewards</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What she earns away from the checkpoints. Each one pays once per thing
            — one payout per level tier, one per checkpoint photographed — so
            raising a number here doesn't re-pay what's already been earned.
            Set a payout to 0 to switch it off. Checkpoint drops are priced in{" "}
            <code className="font-mono text-[11px]">src/utils/pokeItems.ts</code>.
          </p>
        </div>
      </div>

      {!loading && !amounts && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-xs text-foreground">
            Couldn't read the payouts, so these are the defaults and nothing saved
            here will stick. Run{" "}
            <code className="font-mono text-[11px]">sql/2026-08-29-coin-rewards.sql</code> in
            Supabase.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {REWARD_KINDS.map((key) => {
          const draft = drafts[key];
          const dirty = draft !== undefined && Number(draft) !== valueOf(key);
          return (
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
                value={draft ?? String(valueOf(key))}
                onChange={(e) => setDrafts((current) => ({ ...current, [key]: e.target.value }))}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => handleSave(key)}
                disabled={!dirty || savingKey === key}
                className="inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:brightness-95 disabled:opacity-40"
              >
                {savingKey === key ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : savedKey === key ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {savingKey === key ? "Saving" : savedKey === key ? "Saved" : "Save"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoinRewardsCard;
