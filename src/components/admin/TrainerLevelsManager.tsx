import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, Check, Coffee, RotateCcw, Save, Sparkles, Stamp, TriangleAlert } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import { useAllCafePlaces, useCafeCategories } from "@/hooks/useCafes";
import { computeAchievements } from "@/utils/cafeAchievements";
import { syncTrainerCardConfig } from "@/utils/supabaseSync";
import {
  DEFAULT_TRAINER_CONFIG,
  TIER_COLORS,
  TIER_COLOR_CLASSES,
  computeTrainerStats,
  validateTrainerConfig,
  type LevelTier,
  type TierColor,
  type TrainerCardConfig,
} from "@/utils/trainerCard";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5";

const WEIGHT_FIELDS: { key: keyof TrainerCardConfig["weights"]; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "badge", label: "Per badge", hint: "café achievement", icon: Award },
  { key: "stamp", label: "Per stamp", hint: "itinerary checkpoint", icon: Stamp },
  { key: "visit", label: "Per visit", hint: "café marked visited", icon: Coffee },
  { key: "rareItem", label: "Per rare item", hint: "rare checkpoint drop", icon: Sparkles },
];

const TrainerLevelsManager = () => {
  const { trainerConfig, setTrainerConfig, itineraryState, profile } = useAdventure();
  const [draft, setDraft] = useState<TrainerCardConfig>(() => structuredClone(trainerConfig));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  // The config arrives from Supabase after mount; adopt it as long as the
  // admin hasn't started editing.
  useEffect(() => {
    if (!touched) setDraft(structuredClone(trainerConfig));
  }, [trainerConfig, touched]);

  // Live preview runs on your own real numbers, so the ladder is judged
  // against actual progress rather than a made-up trainer.
  const categories = useCafeCategories();
  const places = useAllCafePlaces();
  const badges = computeAchievements(categories.data ?? [], places.data ?? []).filter((a) => a.unlocked).length;
  const stamps = itineraryState.filter((i) => i.isPast).length;
  const visits = (places.data ?? []).filter((p) => p.status === "visited").length;
  const rareItems = (profile?.items ?? []).filter((item) => item.rarity === "rare").length;

  const error = validateTrainerConfig(draft);
  const preview = useMemo(
    () => computeTrainerStats(badges, stamps, visits, draft, rareItems),
    [badges, stamps, visits, draft, rareItems],
  );
  const sortedTiers = useMemo(() => [...draft.tiers].sort((a, b) => a.minXp - b.minXp), [draft.tiers]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(trainerConfig);

  const patchTier = (index: number, patch: Partial<LevelTier>) => {
    setSaved(false);
    setTouched(true);
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }));
  };

  const patchWeight = (key: keyof TrainerCardConfig["weights"], value: number) => {
    setSaved(false);
    setTouched(true);
    setDraft((current) => ({ ...current, weights: { ...current.weights, [key]: value } }));
  };

  const handleSave = async () => {
    if (error) return;
    setSaving(true);
    const next: TrainerCardConfig = { weights: draft.weights, tiers: sortedTiers };
    try {
      const ok = await syncTrainerCardConfig(next);
      if (!ok) {
        alert("Could not save to the cloud. Check that sql/2026-08-07-trainer-card-config.sql has been run in Supabase.");
        return;
      }
      setTrainerConfig(next);
      setDraft(structuredClone(next));
      setSaved(true);
    } catch (saveError) {
      console.error("Error saving trainer levels:", saveError);
      alert("Could not save the levels. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progressPct =
    preview.xpForNextLevel === null
      ? 100
      : Math.min(100, Math.round((preview.xpIntoLevel / (preview.xpForNextLevel || 1)) * 100));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Levels &amp; ranks</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tune what earns XP and where each rank starts. Applies to every logged-in trainer.
        </p>
      </div>

      {/* XP weights */}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-3">XP earned</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WEIGHT_FIELDS.map(({ key, label, hint, icon: Icon }) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <label className={labelCls} htmlFor={`weight-${key}`}>
                <span className="inline-flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {label}
                </span>
              </label>
              <input
                id={`weight-${key}`}
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.weights[key]}
                onChange={(e) => patchWeight(key, Number(e.target.value))}
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rank ladder */}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-3">Rank ladder</h3>
        <div className="space-y-3">
          {draft.tiers.map((tier, index) => {
            const colors = TIER_COLOR_CLASSES[tier.color] ?? TIER_COLOR_CLASSES.rose;
            const isCurrent = preview.level === tier.name;
            return (
              <div
                key={index}
                className={`rounded-xl border p-4 transition ${isCurrent ? "border-rose/40 shadow-romantic" : "border-border"}`}
              >
                <div className="grid grid-cols-[4rem_1fr] sm:grid-cols-[4rem_1fr_7rem] gap-3">
                  <div>
                    <label className={labelCls} htmlFor={`tier-icon-${index}`}>Icon</label>
                    <input
                      id={`tier-icon-${index}`}
                      type="text"
                      value={tier.icon}
                      maxLength={2}
                      onChange={(e) => patchTier(index, { icon: e.target.value })}
                      className={`${inputCls} text-center text-lg`}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor={`tier-name-${index}`}>Rank name</label>
                    <input
                      id={`tier-name-${index}`}
                      type="text"
                      value={tier.name}
                      onChange={(e) => patchTier(index, { name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls} htmlFor={`tier-xp-${index}`}>Starts at XP</label>
                    <input
                      id={`tier-xp-${index}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={tier.minXp}
                      onChange={(e) => patchTier(index, { minXp: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={labelCls + " mb-0"}>Colour</span>
                    {TIER_COLORS.map((colorId: TierColor) => (
                      <button
                        key={colorId}
                        type="button"
                        onClick={() => patchTier(index, { color: colorId })}
                        title={TIER_COLOR_CLASSES[colorId].label}
                        aria-label={`${tier.name || "Rank"} colour: ${TIER_COLOR_CLASSES[colorId].label}`}
                        aria-pressed={tier.color === colorId}
                        className={`w-6 h-6 rounded-full ${TIER_COLOR_CLASSES[colorId].bg} transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          tier.color === colorId
                            ? "ring-2 ring-offset-2 ring-offset-card ring-foreground/50"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`font-mono text-[11px] uppercase tracking-wide ${colors.text}`}>
                    {tier.icon} {tier.name || "Unnamed"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live preview against your own progress */}
      <section className="rounded-xl border border-border bg-muted/30 p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Preview — your progress
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {badges} badges · {stamps} stamps · {visits} visits · {rareItems} rare ={" "}
          <span className="text-foreground font-medium">{preview.xp} XP</span>
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className={`font-mono text-[11px] uppercase tracking-wide font-semibold ${(TIER_COLOR_CLASSES[preview.levelColor] ?? TIER_COLOR_CLASSES.rose).text}`}>
            {preview.levelIcon} {preview.level}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {preview.xpForNextLevel === null
              ? "Max rank"
              : `${preview.xpIntoLevel} / ${preview.xpForNextLevel} XP to ${preview.nextLevel}`}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-foreground/10 overflow-hidden">
          <div
            className={`h-full ${(TIER_COLOR_CLASSES[preview.levelColor] ?? TIER_COLOR_CLASSES.rose).bg} transition-all duration-300`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <ul className="mt-4 space-y-1">
          {sortedTiers.map((tier, index) => (
            <li key={index} className="flex items-center justify-between font-mono text-[11px]">
              <span className={preview.level === tier.name ? "text-foreground font-semibold" : "text-muted-foreground"}>
                {tier.icon} {tier.name || "Unnamed"}
              </span>
              <span className="text-muted-foreground">{tier.minXp} XP</span>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          onClick={handleSave}
          disabled={!!error || saving || !dirty}
          className="inline-flex items-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-95 disabled:opacity-60"
          whileTap={{ scale: 0.97 }}
        >
          {saved && !dirty ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save levels"}
        </motion.button>
        <motion.button
          onClick={() => {
            setSaved(false);
            setDraft(structuredClone(DEFAULT_TRAINER_CONFIG));
          }}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-foreground"
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw className="w-4 h-4" />
          Reset to defaults
        </motion.button>
        {dirty && !error && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
};

export default TrainerLevelsManager;
