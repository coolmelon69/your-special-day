import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Award,
  Camera,
  CalendarDays,
  Compass,
  Download,
  Heart,
  Loader2,
  Map,
  MapPin,
  PenLine,
  RotateCw,
  Sparkles,
  Stamp,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import PinBadge, { TIER_LABEL, type Tier } from "@/components/cafes/PinBadge";
import { AVATAR_PRESETS, TEAMS, type Team, type TrainerStats } from "@/utils/trainerCard";
import type { Profile } from "@/utils/profile";
import { cn } from "@/lib/utils";

const TRACK_ICONS: Record<string, LucideIcon> = { Compass, Map, Star, PenLine, Camera, Heart, Sparkles };

/** One slot in the card's badge case: a track, and the best tier struck for it so far. */
export interface BadgeSlot {
  trackId: string;
  /** Track name, e.g. "Explorer" — the slot's accessible label. */
  name: string;
  /** Lucide key from the achievement track, e.g. "Compass". */
  icon: string;
  /** Highest unlocked tier, or null if the case still has an empty setting here. */
  tier: Tier | null;
}

export interface AdventureLog {
  joined: string | null;
  dayCount: number | null;
  latestStamp: string | null;
  nextStop: string | null;
}

export interface FavouritePlace {
  id: string;
  name: string;
  area: string | null;
  rating: number;
}

interface TrainerCardProps {
  profile: Profile;
  team: Team;
  stats: TrainerStats;
  trainerId: string;
  badges: BadgeSlot[];
  log: AdventureLog;
  favourites: FavouritePlace[];
  onPhotoSelected: (dataUrl: string) => void;
  onTeamChange: (teamId: string) => void;
  isSaving: boolean;
}

const RING_RADIUS = 26;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const TrainerCard = ({
  profile,
  team,
  stats,
  trainerId,
  badges,
  log,
  favourites,
  onPhotoSelected,
  onTeamChange,
  isSaving,
}: TrainerCardProps) => {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  // Pointer tilt. Mouse only — on touch the same gesture is a scroll, and stealing it
  // to spin a card is the kind of cleverness that gets a page closed.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-9, 9]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), spring);
  const sheenX = useSpring(useTransform(px, [0, 1], [12, 88]), spring);
  const sheenY = useSpring(useTransform(py, [0, 1], [8, 92]), spring);
  const sheen = useMotionTemplate`radial-gradient(120% 90% at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.85), rgba(${team.glow} / 0.28) 38%, rgba(255,255,255,0) 72%)`;
  const holo = useMotionTemplate`linear-gradient(${sheenX}deg, rgba(${team.glow} / 0) 34%, rgba(255,255,255,0.5) 47%, rgba(${team.glow} / 0.45) 54%, rgba(255,255,255,0) 66%)`;

  const tiltActive = !reduceMotion && !capturing;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltActive || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const resetTilt = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const avatar = AVATAR_PRESETS.find((a) => a.id === profile.avatarId) ?? AVATAR_PRESETS[0];
  const isMaxLevel = stats.xpForNextLevel === null;
  const pct = isMaxLevel
    ? 100
    : Math.min(100, Math.round((stats.xpIntoLevel / (stats.xpForNextLevel || 1)) * 100));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file twice still fires
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" && onPhotoSelected(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async () => {
    const node = cardRef.current;
    if (!node) return;
    setFlipped(false);
    setCapturing(true);
    resetTilt();
    // One frame for the reset transform and the hidden chrome to land before the clone.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 260)));
    try {
      // Fonts stay embedded: with `skipFonts` the export falls back to a system serif and
      // the card stops looking like the card. html-to-image logs a SecurityError trying to
      // read the cross-origin Google Fonts sheet — noisy, but the embed still succeeds.
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `trainer-card-${profile.trainerName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Could not save the trainer card as an image:", error);
    } finally {
      setCapturing(false);
    }
  };

  const meta = (label: string, value: string) => (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );

  return (
    <div>
      <div
        className="[perspective:1400px]"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <motion.div
          style={tiltActive ? { rotateX, rotateY, transformStyle: "preserve-3d" } : { transformStyle: "preserve-3d" }}
        >
          <motion.div
            ref={cardRef}
            className="relative rounded-[26px] bg-card"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ---------- front ---------- */}
            <div
              className={cn(
                "overflow-hidden rounded-[26px] border border-border bg-card",
                !capturing && "shadow-[0_18px_44px_-20px_rgba(60,45,90,0.45)]"
              )}
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* header — team wash, one hue at three strengths */}
              <div className="relative px-6 pb-5 pt-5" style={{ background: team.tint }}>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: team.ink }}
                  >
                    Trainer Card
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em]" style={{ color: team.ink }}>
                    ID {trainerId}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div
                      className="grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-card"
                      style={{ boxShadow: `0 0 0 3px ${team.accent}, 0 6px 14px -6px rgba(${team.glow} / 0.7)` }}
                    >
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt=""
                          crossOrigin="anonymous"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[34px] leading-none">{avatar.icon}</span>
                      )}
                    </div>
                    {!capturing && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-card bg-foreground text-card transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label={profile.photoUrl ? "Change your trainer photo" : "Add a trainer photo"}
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[27px] font-bold leading-tight text-foreground">
                      {profile.trainerName}
                    </p>
                    <p
                      className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: team.ink }}
                    >
                      {team.name}
                    </p>
                    <p className="mt-1 truncate font-serif text-[15px] italic" style={{ color: team.ink }}>
                      {team.motto}
                    </p>
                  </div>

                  {/* level ring — the card's one dial, and the only place the tier number lives */}
                  <div className="relative flex-shrink-0">
                    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
                      <circle cx="32" cy="32" r={RING_RADIUS} fill="hsl(var(--card))" />
                      <circle
                        cx="32"
                        cy="32"
                        r={RING_RADIUS}
                        fill="none"
                        stroke="rgba(0,0,0,0.08)"
                        strokeWidth="5"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r={RING_RADIUS}
                        fill="none"
                        stroke={team.accent}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={RING_LENGTH}
                        transform="rotate(-90 32 32)"
                        initial={{ strokeDashoffset: RING_LENGTH }}
                        animate={{ strokeDashoffset: RING_LENGTH * (1 - pct / 100) }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="font-serif text-2xl font-bold leading-none text-foreground">
                        {stats.levelNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* level + xp */}
              <div className="border-t border-border px-6 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="flex items-baseline gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    <span aria-hidden>{stats.levelIcon}</span>
                    {stats.level}
                    {stats.nextLevel && (
                      <span className="font-normal tracking-wide text-muted-foreground">
                        → {stats.nextLevel}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {isMaxLevel ? "Max level" : `${stats.xpIntoLevel} / ${stats.xpForNextLevel} XP`}
                  </span>
                </div>
                <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: team.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* the three counts, divided by hairlines rather than boxed */}
              <div className="grid grid-cols-3 border-t border-border">
                {[
                  { icon: Award, value: stats.badges, label: "Badges" },
                  { icon: Stamp, value: stats.stamps, label: "Stamps" },
                  { icon: MapPin, value: stats.visits, label: "Places" },
                ].map(({ icon: Icon, value, label }, i) => (
                  <div key={label} className={cn("px-4 py-4 text-center", i > 0 && "border-l border-border")}>
                    <p className="font-serif text-[34px] font-bold leading-none text-foreground">{value}</p>
                    <p className="mt-1.5 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3 w-3" aria-hidden />
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* badge case */}
              <div className="border-t border-border px-6 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Badge case
                </p>
                <div className="mt-3 flex items-center justify-between gap-1">
                  {badges.map((slot) => {
                    const Icon = TRACK_ICONS[slot.icon] ?? Star;
                    return (
                      <div
                        key={slot.trackId}
                        title={slot.tier ? `${slot.name} — ${TIER_LABEL[slot.tier]}` : `${slot.name} — not earned yet`}
                      >
                        <PinBadge
                          tier={slot.tier ?? "bronze"}
                          iconKey={slot.icon}
                          Icon={Icon}
                          locked={slot.tier === null}
                          isActive={false}
                          pct={0}
                          justUnlocked={false}
                          size={34}
                        />
                        <span className="sr-only">
                          {slot.tier ? `${slot.name}, ${TIER_LABEL[slot.tier]}` : `${slot.name}, not earned yet`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="flex items-center justify-between border-t border-border px-6 py-3"
                style={{ background: team.tint }}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: team.ink }}>
                  {log.joined ? `Joined ${log.joined}` : "Adventure in progress"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: team.ink }}>
                  {stats.xp} XP
                </span>
              </div>
            </div>

            {/* ---------- back ---------- */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[26px] border border-border bg-card"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              aria-hidden={!flipped}
              hidden={capturing}
            >
              <div className="px-6 py-4" style={{ background: team.tint }}>
                <p
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: team.ink }}
                >
                  Adventure log
                </p>
              </div>

              <div className="divide-y divide-border px-6">
                {meta("Trainer", profile.displayName)}
                {meta("Joined", log.joined ?? "—")}
                {meta("Days in", log.dayCount === null ? "—" : `Day ${log.dayCount}`)}
                {meta("Latest stamp", log.latestStamp ?? "None yet")}
                {meta("Up next", log.nextStop ?? "All done")}
              </div>

              <div className="border-t border-border px-6 py-4">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Heart className="h-3 w-3 text-rose" aria-hidden />
                  Favourite places
                </p>
                {favourites.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nothing here yet — a place lands on this list once you both rate it 4.5 or higher.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border">
                    {favourites.map((place) => (
                      <li key={place.id} className="flex items-baseline justify-between gap-4 py-2">
                        <span className="min-w-0 truncate text-sm text-foreground">
                          {place.name}
                          {place.area && (
                            <span className="text-muted-foreground"> · {place.area}</span>
                          )}
                        </span>
                        <span className="flex-shrink-0 font-mono text-[11px]" style={{ color: team.ink }}>
                          {place.rating.toFixed(1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 pb-5 pt-1">
                <Link
                  to="/cafes/achievements"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <Award className="h-3 w-3" aria-hidden />
                  See the full badge case
                </Link>
              </div>
            </div>

            {/* foil — sits over both faces, moves with the pointer, never intercepts it */}
            {tiltActive && (
              <>
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-[26px] mix-blend-soft-light"
                  style={{ background: sheen, transform: "translateZ(1px)" }}
                  aria-hidden
                />
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-[26px] opacity-60 mix-blend-overlay"
                  style={{ background: holo, transform: "translateZ(1px)" }}
                  aria-hidden
                />
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* controls live off the card, so the saved image is only ever the card */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-pressed={flipped}
        >
          <RotateCw className="h-4 w-4 text-muted-foreground" aria-hidden />
          {flipped ? "Show front" : "Adventure log"}
        </button>

        <button
          type="button"
          onClick={handleSaveImage}
          disabled={capturing}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {capturing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
          )}
          {capturing ? "Saving…" : "Save as image"}
        </button>

        <button
          type="button"
          onClick={() => setTeamOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-expanded={teamOpen}
        >
          <span className="h-3 w-3 rounded-full" style={{ background: team.accent }} aria-hidden />
          Change team
        </button>
      </div>

      {teamOpen && (
        <motion.div
          className="mt-3 grid gap-2 sm:grid-cols-3"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {TEAMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onTeamChange(t.id);
                setTeamOpen(false);
              }}
              className={cn(
                "rounded-[14px] border p-3 text-left transition-colors",
                t.id === team.id ? "border-transparent" : "border-border bg-card hover:border-foreground"
              )}
              style={t.id === team.id ? { background: t.tint, boxShadow: `inset 0 0 0 1.5px ${t.accent}` } : undefined}
              aria-pressed={t.id === team.id}
            >
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: t.accent }} aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: t.ink }}>
                  {t.name}
                </span>
              </span>
              <span className="mt-1 block font-serif text-[15px] italic text-foreground">{t.motto}</span>
            </button>
          ))}
        </motion.div>
      )}

      <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        <CalendarDays className="h-3 w-3" aria-hidden />
        Card updates itself as you collect
      </p>
    </div>
  );
};

export default TrainerCard;
