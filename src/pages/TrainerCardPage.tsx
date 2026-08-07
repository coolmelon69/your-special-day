import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import Footer from "@/components/Footer";
import TrainerCard, { type BadgeSlot, type FavouritePlace } from "@/components/TrainerCard";
import { useAdventure } from "@/contexts/AdventureContext";
import { useAllCafePlaces, useCafeCategories } from "@/hooks/useCafes";
import { computeAchievements, type AchievementTier } from "@/utils/cafeAchievements";
import { uploadTrainerPhoto } from "@/utils/profile";
import { computeTrainerStats, teamFor, trainerIdFor } from "@/utils/trainerCard";

const TIER_RANK: Record<AchievementTier, number> = { bronze: 1, silver: 2, gold: 3 };

/** Track names, keyed by the lucide icon each track carries. Kept here rather than
 *  exported from the achievement engine, which is deliberately data-only. */
const TRACK_NAMES: Record<string, string> = {
  Compass: "Explorer",
  Map: "Cartographer",
  Star: "Critics' Circle",
  PenLine: "Storytellers",
  Camera: "Shutterbugs",
  Heart: "Keepers",
  Sparkles: "Perfect Dates",
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const TrainerCardPage = () => {
  const { profile, itineraryState, trainerCardEnabled, trainerConfig, updateProfile, user } = useAdventure();
  const categories = useCafeCategories();
  const places = useAllCafePlaces();
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const achievements = useMemo(
    () => computeAchievements(categories.data ?? [], places.data ?? []),
    [categories.data, places.data]
  );

  // One slot per track, struck at the best tier earned — the case a trainer actually carries.
  const badgeSlots = useMemo<BadgeSlot[]>(() => {
    const slots = new Map<string, BadgeSlot>();
    for (const a of achievements) {
      const existing = slots.get(a.trackId);
      if (!existing) {
        slots.set(a.trackId, {
          trackId: a.trackId,
          name: TRACK_NAMES[a.icon] ?? a.title,
          icon: a.icon,
          tier: a.unlocked ? a.tier : null,
        });
        continue;
      }
      if (a.unlocked && (existing.tier === null || TIER_RANK[a.tier] > TIER_RANK[existing.tier])) {
        existing.tier = a.tier;
      }
    }
    return [...slots.values()];
  }, [achievements]);

  const favourites = useMemo<FavouritePlace[]>(
    () =>
      (places.data ?? [])
        .filter(
          (p) =>
            p.status === "visited" &&
            p.rating_him !== null &&
            p.rating_her !== null &&
            p.rating_him >= 4.5 &&
            p.rating_her >= 4.5
        )
        .map((p) => ({
          id: p.id,
          name: p.name,
          area: p.area,
          rating: ((p.rating_him as number) + (p.rating_her as number)) / 2,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4),
    [places.data]
  );

  const log = useMemo(() => {
    const stamped = itineraryState.filter((i) => i.isPast);
    const latest = stamped[stamped.length - 1] ?? null;
    const next = itineraryState.find((i) => !i.isPast) ?? null;
    const joinedAt = profile?.createdAt ? new Date(profile.createdAt) : null;
    return {
      joined: joinedAt ? formatDate(joinedAt) : null,
      dayCount: joinedAt
        ? Math.max(1, Math.floor((Date.now() - joinedAt.getTime()) / 86_400_000) + 1)
        : null,
      latestStamp: latest ? `${latest.title} · ${latest.time}` : null,
      nextStop: next ? `${next.title} · ${next.time}` : null,
    };
  }, [itineraryState, profile?.createdAt]);

  // Admin turned the feature off — the page shouldn't be reachable by URL either.
  if (!trainerCardEnabled) return <Navigate to="/" replace />;

  const badges = achievements.filter((a) => a.unlocked).length;
  const stamps = itineraryState.filter((i) => i.isPast).length;
  const visits = (places.data ?? []).filter((p) => p.status === "visited").length;
  const stats = computeTrainerStats(badges, stamps, visits, trainerConfig);
  const team = teamFor(profile?.teamId);

  const handlePhoto = async (dataUrl: string) => {
    setIsSavingPhoto(true);
    try {
      const url = await uploadTrainerPhoto(dataUrl);
      if (url) await updateProfile({ photoUrl: url });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Trainer Card - Your Special Day</title>
        <meta name="description" content="Your trainer profile and adventure stats" />
      </Helmet>

      <main className="overflow-x-hidden pt-16 md:pt-20">
        <section className="py-14 md:py-24">
          <div className="container mx-auto max-w-2xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Eyebrow no="Nº 07">Trainer Card</Eyebrow>
              <DisplayHeading className="mt-4">
                Your <em>adventure</em>, in one card<span className="dot-accent">.</span>
              </DisplayHeading>
            </motion.div>

            <motion.div
              className="mx-auto mt-10 max-w-[420px]"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {profile ? (
                <TrainerCard
                  profile={profile}
                  team={team}
                  stats={stats}
                  trainerId={trainerIdFor(user?.id)}
                  badges={badgeSlots}
                  log={log}
                  favourites={favourites}
                  onPhotoSelected={handlePhoto}
                  onTeamChange={(teamId) => updateProfile({ teamId })}
                  isSaving={isSavingPhoto}
                />
              ) : (
                <div className="rounded-[26px] border border-dashed border-border bg-card p-8 text-center">
                  <p className="font-serif text-2xl font-bold text-foreground">No card yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in and set up your trainer profile — the card builds itself from there.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default TrainerCardPage;
