import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Eyebrow, DisplayHeading, StatBlock } from "@/components/editorial";
import AchievementCard from "@/components/cafes/AchievementCard";
import MedalDetailOverlay from "@/components/cafes/MedalDetailOverlay";
import { useCafeCategories, useAllCafePlaces } from "@/hooks/useCafes";
import { computeAchievements, type AchievementTierProgress } from "@/utils/cafeAchievements";
import { burstConfetti } from "@/utils/particles";
import { playStampSound } from "@/utils/sound";
import { getSeenAchievementIds, markAchievementIdsSeen } from "@/utils/achievementUnlockStorage";

/** Groups the flat 21-entry list back into tracks, preserving computeAchievements' order. */
const groupByTrack = (achievements: AchievementTierProgress[]): AchievementTierProgress[][] => {
  const byTrack = new Map<string, AchievementTierProgress[]>();
  for (const achievement of achievements) {
    const list = byTrack.get(achievement.trackId) ?? [];
    list.push(achievement);
    byTrack.set(achievement.trackId, list);
  }
  return [...byTrack.values()];
};

/** Within a track, the active tier is the first not-yet-unlocked one. All unlocked = none active. */
const activeIdForTrack = (track: AchievementTierProgress[]): string | null =>
  track.find((tier) => !tier.unlocked)?.id ?? null;

const CafeAchievementsPage = () => {
  const categories = useCafeCategories();
  const places = useAllCafePlaces();

  const isPending = categories.isPending || places.isPending;
  const error = (categories.error ?? places.error) as Error | null;
  const achievements = computeAchievements(categories.data ?? [], places.data ?? []);
  const tracks = groupByTrack(achievements);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<Set<string>>(new Set());
  /** Index into the flat `achievements` list, so the overlay can swipe the whole set. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isPending || error) return;
    const seen = getSeenAchievementIds();
    const fresh = achievements.filter((a) => a.unlocked && !seen.has(a.id));
    if (fresh.length === 0) return;

    setNewlyUnlockedIds(new Set(fresh.map((a) => a.id)));
    playStampSound();
    fresh.forEach((achievement, index) => {
      setTimeout(() => {
        burstConfetti();
        toast.success(`🏆 Badge unlocked — ${achievement.title}`);
      }, index * 400);
    });
    markAchievementIdsSeen(fresh.map((a) => a.id));
    // Runs once achievements finish loading; achievements is recomputed every
    // render from stable query data, so it isn't a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, error]);

  return (
    <>
      <Helmet>
        <title>Achievements · Your Special Day</title>
      </Helmet>

      <main className="min-h-screen bg-background px-4 pb-24 pt-28 sm:px-6 md:px-8 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <Link
            to="/cafes"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to the hunt
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 mt-6 md:mb-14"
          >
            <Eyebrow no="Nº 07">Achievements</Eyebrow>
            <DisplayHeading className="mt-4">
              Every visit, <em>a badge</em> earned<span className="dot-accent">.</span>
            </DisplayHeading>
          </motion.header>

          {isPending && (
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Tallying up…
            </p>
          )}

          {error && <p className="font-sans text-sm text-destructive">{error.message}</p>}

          {!isPending && !error && (
            <>
              <StatBlock
                value={unlockedCount}
                unit={`/ ${achievements.length}`}
                label="badges unlocked so far."
              />

              <div className="mt-10 space-y-8">
                {tracks.map((track) => {
                  const activeId = activeIdForTrack(track);
                  return (
                    <div key={track[0].trackId}>
                      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                        {track[0].title.replace(/ (I|II|III)$/, "")}
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                        {track.map((tier) => (
                          <AchievementCard
                            key={tier.id}
                            achievement={tier}
                            isActive={tier.id === activeId}
                            justUnlocked={newlyUnlockedIds.has(tier.id)}
                            // The grid is grouped by track, so each card carries its
                            // position in the flat list rather than its position here.
                            onOpen={() => setOpenIndex(achievements.findIndex((a) => a.id === tier.id))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <MedalDetailOverlay
                achievements={achievements}
                openIndex={openIndex}
                onClose={() => setOpenIndex(null)}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default CafeAchievementsPage;
