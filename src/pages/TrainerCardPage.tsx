import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";
import { Backpack, IdCard, Store, type LucideIcon } from "lucide-react";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import Footer from "@/components/Footer";
import PokeCoin from "@/components/PokeCoin";
import TrainerCard, { type BadgeSlot, type FavouritePlace } from "@/components/TrainerCard";
import BagTab from "@/components/BagTab";
import ShopTab from "@/components/ShopTab";
import { useAdventure } from "@/contexts/AdventureContext";
import { useAllCafePlaces, useCafeCategories } from "@/hooks/useCafes";
import { computeAchievements, type AchievementTier } from "@/utils/cafeAchievements";
import { uploadTrainerPhoto } from "@/utils/profile";
import { computeTrainerStats, teamFor, trainerIdFor } from "@/utils/trainerCard";
import { cn } from "@/lib/utils";

/** Ordered tab list — appending an entry here is the whole job for a new tab.
 *  The URL param is the id, so the order here is cosmetic only. */
const TABS: ReadonlyArray<{ id: "card" | "bag" | "shop"; label: string; icon: LucideIcon }> = [
  { id: "card", label: "Card", icon: IdCard },
  { id: "bag", label: "Bag", icon: Backpack },
  { id: "shop", label: "Shop", icon: Store },
];
type TabId = (typeof TABS)[number]["id"];

/** The three panels read as one pocket that swaps its contents, so they cross-fade
 *  in place instead of each mounting its own entrance. Direction comes from the tab
 *  order: moving right slides the new panel in from the right. */
const PANEL_SHIFT = 14;

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
  const { profile, itineraryState, trainerCardEnabled, trainerConfig, updateProfile, purchase, purchaseItem, user } = useAdventure();
  const categories = useCafeCategories();
  const places = useAllCafePlaces();
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Unknown or absent `?tab=` falls back to Card — a stale link never lands on a blank page.
  const requestedTab = searchParams.get("tab");
  const activeTab: TabId = TABS.some((t) => t.id === requestedTab) ? (requestedTab as TabId) : "card";

  // Which way the panel slides. Kept in a ref rather than state: it's read during
  // the same render that changes the tab, and it must never cause one of its own.
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);
  const lastIndexRef = useRef(tabIndex);
  const direction = tabIndex >= lastIndexRef.current ? 1 : -1;
  useEffect(() => {
    lastIndexRef.current = tabIndex;
  }, [tabIndex]);

  const setActiveTab = (tab: TabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "card") next.delete("tab");
        else next.set("tab", tab);
        return next;
      },
      { replace: true },
    );
  };

  /** Arrow keys move between tabs, per the ARIA tabs pattern — the pill is a
   *  roving control, not three unrelated buttons. */
  const handleTabKey = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(tabIndex + step + TABS.length) % TABS.length];
    setActiveTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  // The wallet reacts when it changes: a drop lands as "+3", a purchase as "−12".
  // Purely a receipt for something that already happened elsewhere on the page.
  const coins = profile?.coins ?? 0;
  const [delta, setDelta] = useState<number | null>(null);
  const prevCoinsRef = useRef(coins);
  useEffect(() => {
    const diff = coins - prevCoinsRef.current;
    prevCoinsRef.current = coins;
    if (!diff) return;
    setDelta(diff);
    const timer = window.setTimeout(() => setDelta(null), 1400);
    return () => window.clearTimeout(timer);
  }, [coins]);

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
  const rareItems = (profile?.items ?? []).filter((item) => item.rarity === "rare").length;
  const stats = computeTrainerStats(badges, stamps, visits, trainerConfig, rareItems);
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

            {profile && (
              /* Trainer bar — wallet and pockets. Sticks under the nav so the
                 balance stays readable while she scrolls a long shop shelf, which
                 is exactly when the number matters. */
              <motion.div
                className="sticky top-16 z-30 -mx-6 mt-10 border-y border-border bg-background/85 px-6 py-3 backdrop-blur-md md:top-20"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mx-auto flex max-w-[420px] items-center justify-between gap-3">
                  <p
                    className="relative inline-flex items-baseline gap-2"
                    aria-label={`${coins} coins in your wallet`}
                  >
                    <PokeCoin size={20} className="self-center" />
                    <span className="font-serif text-2xl font-bold leading-none tabular-nums text-foreground">
                      {coins}
                    </span>

                    <AnimatePresence>
                      {delta !== null && (
                        <motion.span
                          key={`${delta}-${coins}`}
                          aria-hidden
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: reduceMotion ? 0 : -12 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "pointer-events-none absolute -top-1 left-full ml-1.5 font-mono text-[11px] font-semibold tabular-nums",
                            delta > 0 ? "text-rose" : "text-muted-foreground",
                          )}
                        >
                          {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </p>

                  <div
                    role="tablist"
                    aria-label="Trainer card sections"
                    onKeyDown={handleTabKey}
                    className="relative inline-flex rounded-full border border-border bg-card p-1"
                  >
                    {TABS.map((tab) => {
                      const active = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          ref={(node) => {
                            tabRefs.current[tab.id] = node;
                          }}
                          type="button"
                          role="tab"
                          id={`trainer-tab-${tab.id}`}
                          aria-selected={active}
                          aria-controls="trainer-panel"
                          tabIndex={active ? 0 : -1}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3.5",
                            active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {/* One pill that travels, rather than three that light up. */}
                          {active && (
                            <motion.span
                              layoutId="trainer-tab-pill"
                              className="absolute inset-0 rounded-full bg-primary"
                              transition={
                                reduceMotion
                                  ? { duration: 0 }
                                  : { type: "spring", stiffness: 420, damping: 34 }
                              }
                              aria-hidden
                            />
                          )}
                          <Icon className="relative h-4 w-4" aria-hidden />
                          <span className="relative">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              className="mx-auto mt-6 max-w-[420px]"
              initial={reduceMotion ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {profile ? (
                <div
                  id="trainer-panel"
                  role="tabpanel"
                  aria-labelledby={`trainer-tab-${activeTab}`}
                  tabIndex={-1}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeTab}
                      initial={reduceMotion ? false : { opacity: 0, x: direction * PANEL_SHIFT }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -PANEL_SHIFT }}
                      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {activeTab === "bag" ? (
                        <BagTab items={profile.items} team={team} />
                      ) : activeTab === "shop" ? (
                        <ShopTab
                          coins={profile.coins}
                          purchases={profile.purchases}
                          purchase={purchase}
                          items={profile.items}
                          purchaseItem={purchaseItem}
                        />
                      ) : (
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
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="rounded-[26px] border border-dashed border-border bg-card p-8 text-center">
                  <IdCard className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
                  <p className="mt-3 font-serif text-2xl font-bold text-foreground">No card yet</p>
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
