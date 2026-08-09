import { useEffect, useRef, useState } from "react";
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
  Check,
  Compass,
  Download,
  Gem,
  Heart,
  Loader2,
  Lock,
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
import PokeCoin from "@/components/PokeCoin";
import PokeSprite from "@/components/PokeSprite";
import {
  avatarFor,
  CARD_FRAMES,
  CARD_MATERIALS,
  type CardFrame,
  type CardMaterial,
  type Team,
  type TrainerStats,
} from "@/utils/trainerCard";
import { isOwned, priceOf } from "@/utils/shop";
import { useAdventure } from "@/contexts/AdventureContext";
import type { Profile } from "@/utils/profile";
import { cn } from "@/lib/utils";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** iOS 13+ only: the permission gate in front of `deviceorientation`. Absent
 *  everywhere else, which is exactly how we detect that we're on iOS. */
type GatedOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
};
const orientationEvent = () =>
  (window as unknown as { DeviceOrientationEvent?: GatedOrientationEvent }).DeviceOrientationEvent;

/** Rainbow spectrum for the holo layer. A real holo card needs literal hues no
 *  brand token carries — the one deliberate exception to "tokens only" in this file. */
const HOLO_RAINBOW =
  "linear-gradient(115deg, hsl(340 90% 65%), hsl(20 90% 65%), hsl(50 90% 60%), hsl(140 65% 58%), hsl(200 90% 65%), hsl(265 80% 68%), hsl(340 90% 65%))";
/** Fine diagonal foil sparkle — white stripes, color-dodged over the art. */
const HOLO_FOIL =
  "repeating-linear-gradient(110deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, rgba(255,255,255,0) 3px, rgba(255,255,255,0) 7px)";
/** Holo, whole card — the same spectrum pulled back to pastel. Full saturation is
 *  right over a photo, where it competes with nothing; spread across a card of soft
 *  pinks and dark serif text it just shouts. The art window keeps the loud one. */
const HOLO_RAINBOW_SOFT =
  "linear-gradient(115deg, hsl(340 58% 76%), hsl(20 56% 76%), hsl(50 52% 75%), hsl(140 38% 74%), hsl(200 56% 76%), hsl(265 50% 78%), hsl(340 58% 76%))";
/** Where the holo layers settle when nothing is driving them — pointer gone, drag
 *  released, or `prefers-reduced-motion`. Off-centre on purpose: dead centre reads
 *  as "broken", a slight offset reads as "catching the light". */
const REST_HOLO = { x: 0.32, y: -0.28 };

/** Foil — etched metal. Grooves come in pairs: a lit edge and its shadow, so the
 *  surface reads as cut into rather than printed on. Deliberately neutral: Foil's
 *  whole job is to be the one material that never shifts hue, so it can't be
 *  mistaken for Holo at a glance. */
const FOIL_ETCH =
  "repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, rgba(0,0,0,0.16) 1px, rgba(0,0,0,0.16) 2px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 7px)";
/** Foil — the base metal the etch and the glints read against. The card stock is
 *  near-white, and white specks on white are nothing, so the sheet gets a faint
 *  grey cast first. Multiplied, so it darkens: text contrast goes up, never down. */
const FOIL_WASH =
  "linear-gradient(150deg, rgba(118,118,136,0.42) 0%, rgba(255,255,255,0) 13%, rgba(99,99,118,0.46) 29%, rgba(255,255,255,0) 41%, rgba(128,128,146,0.32) 54%, rgba(255,255,255,0) 67%, rgba(92,92,112,0.48) 81%, rgba(255,255,255,0) 93%)";
/** Foil, whole card — the same grooves as the art window, but darkening only.
 *  Over a body full of text a lightening blend eats contrast; multiply can only
 *  ever push away from the paper, never toward the ink. */
const FOIL_GROOVE =
  "repeating-linear-gradient(115deg, rgba(60,60,72,0.22) 0px, rgba(60,60,72,0.22) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 6px)";
/** Foil — the polish band that sweeps the grooves as the card turns. */
const FOIL_SWEEP =
  "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.75) 46%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.75) 54%, rgba(255,255,255,0) 70%)";
/** Foil — glint specks. Fixed positions, not random, so the export (`toPng`) captures
 *  exactly the card she was looking at. */
const FOIL_SPECKS = [
  "radial-gradient(5px 5px at 12% 18%, rgba(255,255,255,1), rgba(255,255,255,0) 70%)",
  "radial-gradient(3.5px 3.5px at 71% 9%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)",
  "radial-gradient(6px 6px at 88% 34%, rgba(255,255,255,1), rgba(255,255,255,0) 70%)",
  "radial-gradient(4px 4px at 33% 44%, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
  "radial-gradient(3.5px 3.5px at 58% 63%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)",
  "radial-gradient(5.5px 5.5px at 19% 77%, rgba(255,255,255,1), rgba(255,255,255,0) 70%)",
  "radial-gradient(4px 4px at 81% 86%, rgba(255,255,255,0.95), rgba(255,255,255,0) 70%)",
  "radial-gradient(3px 3px at 46% 93%, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
].join(",");
/** Foil — the shadow each glint casts into the metal. Without it a white speck on
 *  near-white card stock is nothing at all; the darker seat is what makes it a glint. */
const FOIL_SPECK_SEATS = [
  "radial-gradient(8.5px 8.5px at 12% 18%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(6.0px 6.0px at 71% 9%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(10.2px 10.2px at 88% 34%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(6.8px 6.8px at 33% 44%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(6.0px 6.0px at 58% 63%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(9.3px 9.3px at 19% 77%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(6.8px 6.8px at 81% 86%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
  "radial-gradient(5.1px 5.1px at 46% 93%, rgba(70,70,88,0.16), rgba(255,255,255,0) 70%)",
].join(",");

/** Starfield frame — a handful of soft dots, drifted slowly via background-position. */
const STARFIELD_DOTS = [
  "radial-gradient(1.6px 1.6px at 15% 20%, rgba(255,255,255,0.9), transparent 60%)",
  "radial-gradient(1.1px 1.1px at 62% 12%, rgba(255,255,255,0.8), transparent 60%)",
  "radial-gradient(1.3px 1.3px at 82% 55%, rgba(255,255,255,0.9), transparent 60%)",
  "radial-gradient(1.1px 1.1px at 28% 72%, rgba(255,255,255,0.7), transparent 60%)",
  "radial-gradient(1.5px 1.5px at 50% 88%, rgba(255,255,255,0.85), transparent 60%)",
  "radial-gradient(1.1px 1.1px at 92% 90%, rgba(255,255,255,0.7), transparent 60%)",
].join(",");

/** Sakura frame — a few petals along the card rim, fixed positions rather than random
 *  so the export (`toPng`) always captures exactly what she saw on screen. */
const SAKURA_PETALS: React.CSSProperties[] = [
  { top: "6px", left: "14px", transform: "rotate(-12deg)" },
  { top: "10px", right: "40px", transform: "rotate(18deg)" },
  { top: "50%", left: "2px", transform: "rotate(70deg)" },
  { top: "38%", right: "4px", transform: "rotate(-50deg)" },
  { bottom: "8px", left: "36px", transform: "rotate(-20deg)" },
  { bottom: "12px", right: "16px", transform: "rotate(24deg)" },
];

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
  isSaving,
}: TrainerCardProps) => {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [capturing, setCapturing] = useState(false);

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
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    px.set(nx);
    py.set(ny);
    if (materialLive) setHoloVars(nx * 2 - 1, ny * 2 - 1);
  };

  const resetTilt = () => {
    px.set(0.5);
    py.set(0.5);
    setHoloVars(REST_HOLO.x, REST_HOLO.y);
  };

  // ---------- cosmetics: material / frame / title ----------
  const { updateProfile } = useAdventure();
  const ownedMaterial = CARD_MATERIALS.find(
    (m) => m.id === profile.cardMaterial && isOwned(profile.purchases, m.unlockSku)
  );
  const ownedFrame = CARD_FRAMES.find(
    (f) => f.id === profile.cardFrame && isOwned(profile.purchases, f.unlockSku)
  );
  const ownsTitleSku = isOwned(profile.purchases, "card.title");
  const isHolo = ownedMaterial?.id === "holo";
  const isFoil = ownedMaterial?.id === "foil";
  const isSakura = ownedFrame?.id === "sakura";
  const isStarfield = ownedFrame?.id === "starfield";

  const [titleDraft, setTitleDraft] = useState(profile.cardTitle ?? "");
  useEffect(() => setTitleDraft(profile.cardTitle ?? ""), [profile.cardTitle]);
  const saveTitle = () => {
    const trimmed = titleDraft.trim().slice(0, 40);
    if (trimmed !== (profile.cardTitle ?? "")) updateProfile({ cardTitle: trimmed || null });
  };

  // ---------- material: one normalised {x, y} input, no React state ----------
  // Written straight to CSS custom properties on the card root — every material
  // layer inherits them, whole-card and art-window alike, so nothing here renders.
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const orientationRequestedRef = useRef(false);
  const orientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  /** A material is on the card. Stays true while capturing: the export bakes the
   *  material in, frozen at `REST_HOLO`, so a saved card still looks like the card. */
  const hasMaterial = isHolo || isFoil;
  /** A material is on the card *and* is listening — the export takes no input. */
  const materialLive = hasMaterial && !capturing;

  const setHoloVars = (x: number, y: number) => {
    cardRef.current?.style.setProperty("--holo-x", String(x));
    cardRef.current?.style.setProperty("--holo-y", String(y));
  };

  const applyOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const nx = clamp(e.gamma / 30, -1, 1);
    const ny = clamp((e.beta - 45) / 30, -1, 1);
    setHoloVars(nx, ny);
    px.set(0.5 + nx * 0.5);
    py.set(0.5 + ny * 0.5);
  };

  // Non-iOS: device tilt needs no permission, so ambient input can start on mount.
  useEffect(() => {
    if (!materialLive || reduceMotion) return;
    const OrientationEvent = orientationEvent();
    if (!OrientationEvent || typeof OrientationEvent.requestPermission === "function") return;
    orientationHandlerRef.current = applyOrientation;
    window.addEventListener("deviceorientation", applyOrientation);
    return () => window.removeEventListener("deviceorientation", applyOrientation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialLive, reduceMotion]);

  // Reduced motion, and every capture: a fixed diagonal sheen, set once, nothing
  // moves after. Also the starting angle when a material is first switched on.
  useEffect(() => {
    if (!hasMaterial) return;
    if (reduceMotion || capturing) setHoloVars(REST_HOLO.x, REST_HOLO.y);
  }, [hasMaterial, reduceMotion, capturing]);

  // iOS 13+ gates DeviceOrientationEvent behind a permission prompt that must be
  // triggered by a user gesture — the first touch anywhere on the card is that
  // gesture. Denied or unsupported falls through to the art-window drag, silently.
  const requestOrientation = async () => {
    if (!materialLive || reduceMotion || orientationRequestedRef.current) return;
    const requestPermission = orientationEvent()?.requestPermission;
    if (typeof requestPermission !== "function") return;
    orientationRequestedRef.current = true;
    try {
      const result = await requestPermission();
      if (result === "granted" && !orientationHandlerRef.current) {
        orientationHandlerRef.current = applyOrientation;
        window.addEventListener("deviceorientation", applyOrientation);
      }
    } catch {
      // Unavailable — drag on the art window already covers this pointer.
    }
  };

  // Drag stays on the art window. The whole card would be a bigger target, but on a
  // phone that same drag is a scroll, and stealing the scroll to spin a card is how
  // you get a page closed. Gyro is the whole-card gesture on touch; this is the fallback.
  const handleArtPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!materialLive || reduceMotion) return;
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handleArtPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!materialLive || !dragStartRef.current) return;
    const nx = clamp((e.clientX - dragStartRef.current.x) / 50, -1, 1);
    const ny = clamp((e.clientY - dragStartRef.current.y) / 50, -1, 1);
    setHoloVars(nx, ny);
    px.set(0.5 + nx * 0.5);
    py.set(0.5 + ny * 0.5);
  };

  const handleArtPointerUp = () => {
    dragStartRef.current = null;
    if (materialLive) setHoloVars(REST_HOLO.x, REST_HOLO.y);
  };

  const avatar = avatarFor(profile.avatarId);
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
        onPointerDown={requestOrientation}
      >
        <motion.div
          style={tiltActive ? { rotateX, rotateY, transformStyle: "preserve-3d" } : { transformStyle: "preserve-3d" }}
        >
          <motion.div
            ref={cardRef}
            className="relative rounded-[26px] bg-card"
            style={
              {
                transformStyle: "preserve-3d",
                ...(hasMaterial ? { "--holo-x": REST_HOLO.x, "--holo-y": REST_HOLO.y } : {}),
              } as React.CSSProperties
            }
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
              {/* sakura frame — petals along the rim, matte, doesn't touch the art window */}
              {isSakura && (
                <div className="pointer-events-none absolute inset-0 z-10 select-none" aria-hidden>
                  {SAKURA_PETALS.map((petal, i) => (
                    <span key={i} className="absolute text-[13px] opacity-75" style={petal}>
                      🌸
                    </span>
                  ))}
                </div>
              )}

              {/* header — team wash, one hue at three strengths */}
              <div className="relative px-6 pb-5 pt-5" style={{ background: team.tint }}>
                <div className="relative flex items-center justify-between">
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

                <div className="relative mt-4 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {/* starfield frame — slow stars behind the portrait, never in front of it */}
                    {isStarfield && (
                      <motion.div
                        className="pointer-events-none absolute -inset-3 rounded-full opacity-80"
                        style={{ backgroundImage: STARFIELD_DOTS, backgroundSize: "160% 160%" }}
                        animate={reduceMotion ? undefined : { backgroundPosition: ["0% 0%", "100% 100%"] }}
                        transition={reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: "linear" }}
                        aria-hidden
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 grid h-[74px] w-[74px] place-items-center overflow-hidden rounded-full bg-card",
                        materialLive && "touch-none"
                      )}
                      style={{
                        boxShadow: `0 0 0 3px ${team.accent}, 0 6px 14px -6px rgba(${team.glow} / 0.7)`,
                      }}
                      onPointerDown={handleArtPointerDown}
                      onPointerMove={handleArtPointerMove}
                      onPointerUp={handleArtPointerUp}
                      onPointerCancel={handleArtPointerUp}
                    >
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt=""
                          crossOrigin="anonymous"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PokeSprite dex={avatar.dex} fallback={avatar.icon} className="h-[52px] w-[52px] text-[34px]" />
                      )}

                      {/* Foil, art window — the same etch as the card body, but the
                          grooves are finer and the polish band is brighter, so the
                          portrait stays the place the eye lands. */}
                      {isFoil && (
                        <>
                          <div
                            className="pointer-events-none absolute inset-0 opacity-70"
                            style={{
                              background: FOIL_ETCH,
                              backgroundSize: "auto",
                              backgroundPosition:
                                "calc(50% + var(--holo-x, 0) * -14%) calc(50% + var(--holo-y, 0) * -14%)",
                              mixBlendMode: "overlay",
                              transition: reduceMotion ? undefined : "background-position 120ms linear",
                            }}
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-0 opacity-80"
                            style={{
                              backgroundImage: FOIL_SWEEP,
                              backgroundSize: "260% 260%",
                              backgroundPosition:
                                "calc(50% + var(--holo-x, 0) * 55%) calc(50% + var(--holo-y, 0) * 55%)",
                              mixBlendMode: "soft-light",
                              transition: reduceMotion ? undefined : "background-position 120ms linear",
                            }}
                            aria-hidden
                          />
                        </>
                      )}

                      {/* holo — the art window runs the full-strength pass; the
                          whole-card layers below are the quieter version of this */}
                      {isHolo && (
                        <>
                          <div
                            className="pointer-events-none absolute inset-0 opacity-70"
                            style={{
                              background: HOLO_FOIL,
                              backgroundPosition:
                                "calc(50% + var(--holo-x, 0) * -20%) calc(50% + var(--holo-y, 0) * -20%)",
                              mixBlendMode: "color-dodge",
                              transition: reduceMotion ? undefined : "background-position 120ms linear",
                            }}
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-0 opacity-85"
                            style={{
                              backgroundImage: HOLO_RAINBOW,
                              backgroundSize: "220% 220%",
                              backgroundPosition:
                                "calc(50% + var(--holo-x, 0) * 45%) calc(50% + var(--holo-y, 0) * 45%)",
                              mixBlendMode: "color-dodge",
                              transition: reduceMotion ? undefined : "background-position 120ms linear",
                            }}
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              background:
                                "radial-gradient(circle at calc(50% + var(--holo-x, 0) * 35%) calc(50% + var(--holo-y, 0) * 35%), rgba(255,255,255,0.95), rgba(255,255,255,0) 55%)",
                              mixBlendMode: "overlay",
                              transition: reduceMotion ? undefined : "background-position 120ms linear",
                            }}
                            aria-hidden
                          />
                        </>
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
                    {ownsTitleSku && profile.cardTitle && (
                      <p className="truncate font-serif text-[13px] italic text-muted-foreground">
                        {profile.cardTitle}
                      </p>
                    )}
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
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
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
                    <p className="font-serif text-[34px] font-bold leading-none tabular-nums text-foreground">{value}</p>
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
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums" style={{ color: team.ink }}>
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

            {/* ---------- material, whole card ----------
                Covers the full face, clipped to the card's own radius, over both
                sides. Every layer reads `--holo-x/y` off the card root, so pointer,
                drag and gyro all drive it through one pair of numbers. Rendered
                during capture too — at rest angle — so the export keeps the material.
                Blend modes are the quiet half of the pair used in the art window:
                nothing here may lift a text background toward its foreground. */}
            {isFoil && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" aria-hidden>
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{
                    backgroundImage: FOIL_WASH,
                    backgroundSize: "200% 200%",
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * 30%) calc(50% + var(--holo-y, 0) * 30%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-60 mix-blend-multiply"
                  style={{
                    background: FOIL_GROOVE,
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * -10%) calc(50% + var(--holo-y, 0) * -10%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                <div
                  className="absolute inset-0 mix-blend-multiply"
                  style={{
                    backgroundImage: FOIL_SPECK_SEATS,
                    backgroundSize: "62% 62%",
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * 12%) calc(50% + var(--holo-y, 0) * 12%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: FOIL_SPECKS,
                    backgroundSize: "62% 62%",
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * 12%) calc(50% + var(--holo-y, 0) * 12%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-50 mix-blend-soft-light"
                  style={{
                    backgroundImage: FOIL_SWEEP,
                    backgroundSize: "230% 230%",
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * 45%) calc(50% + var(--holo-y, 0) * 45%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
              </div>
            )}

            {isHolo && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" aria-hidden>
                {/* One even pass, no band. `soft-light` keeps the card's own
                    lightness doing the work, so the pinks, the level ring and the
                    badge metals all survive underneath.

                    `no-repeat` is load-bearing, not tidiness: a gradient sized under
                    200% tiles, and a 115° gradient meeting its own next tile draws a
                    hard vertical seam straight down the card. At 200% the sheet still
                    covers the full face at either extreme of `--holo-x/y`, so it can
                    travel with the tilt without ever exposing an edge. */}
                <div
                  className="absolute inset-0 opacity-40 mix-blend-soft-light"
                  style={{
                    backgroundImage: HOLO_RAINBOW_SOFT,
                    backgroundSize: "200% 200%",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * 40%) calc(50% + var(--holo-y, 0) * 40%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.18] mix-blend-soft-light"
                  style={{
                    background: HOLO_FOIL,
                    backgroundPosition:
                      "calc(50% + var(--holo-x, 0) * -16%) calc(50% + var(--holo-y, 0) * -16%)",
                    transition: reduceMotion ? undefined : "background-position 120ms linear",
                  }}
                />
                {/* No transition: the centre lives inside the gradient, so it is a
                    repaint rather than a background-position the browser can tween. */}
                <div
                  className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
                  style={{
                    background:
                      "radial-gradient(circle at calc(50% + var(--holo-x, 0) * 30%) calc(50% + var(--holo-y, 0) * 30%), rgba(255,255,255,0.85), rgba(255,255,255,0) 58%)",
                  }}
                />
              </div>
            )}

            {/* baseline sheen — every card gets this, material or not */}
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

        {/* Team is read-only here on purpose — it's changed from the admin panel,
            which is also the only place it can be changed for a partner. */}
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide"
          style={{ background: team.tint, borderColor: team.accent, color: team.ink }}
          title="Your team is set in the admin panel"
        >
          <PokeSprite dex={team.dex} fallback="✨" className="h-5 w-5" />
          {team.name}
        </span>
      </div>

      {/* cosmetics — owned options pick the active look, unowned stay visible but locked */}
      <div className="mt-6 space-y-4 rounded-[18px] border border-border bg-card p-4">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <Gem className="h-4 w-4 text-primary" aria-hidden />
          Card style
        </p>

        <CosmeticRow
          label="Material"
          options={CARD_MATERIALS}
          activeId={ownedMaterial?.id ?? null}
          purchases={profile.purchases}
          onSelect={(id) => updateProfile({ cardMaterial: id })}
        />

        <CosmeticRow
          label="Frame"
          options={CARD_FRAMES}
          activeId={ownedFrame?.id ?? null}
          purchases={profile.purchases}
          onSelect={(id) => updateProfile({ cardFrame: id })}
        />

        {ownsTitleSku && (
          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Title</p>
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                maxLength={40}
                placeholder="A line under your name…"
                className="w-full rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        <CalendarDays className="h-3 w-3" aria-hidden />
        Card updates itself as you collect
      </p>
    </div>
  );
};

/** One row of cosmetic options — "None" plus every catalogue entry. Owned options are
 *  selectable; unowned stay visible with a `Lock` and the shop price, per the spec's
 *  rule that a locked pull has to be legible before she can afford it. */
function CosmeticRow<T extends { id: string; label: string; unlockSku: string }>({
  label,
  options,
  activeId,
  purchases,
  onSelect,
}: {
  label: string;
  options: T[];
  activeId: string | null;
  purchases: string[];
  onSelect: (id: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={activeId === null}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
            activeId === null
              ? "border-primary bg-primary-light text-primary"
              : "border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          {activeId === null && <Check className="h-4 w-4" aria-hidden />}
          None
        </button>

        {options.map((option) => {
          const owned = isOwned(purchases, option.unlockSku);
          const active = activeId === option.id;
          if (!owned) {
            return (
              <span
                key={option.id}
                title={`${option.label} — unlocks in the shop for ${priceOf(option.unlockSku)} coins`}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground opacity-60"
              >
                <Lock className="h-4 w-4" aria-hidden />
                {option.label}
                <span className="inline-flex items-center gap-1 text-[10px] tabular-nums">
                  <PokeCoin size={12} />
                  {priceOf(option.unlockSku)}
                </span>
              </span>
            );
          }
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(active ? null : option.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                active
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border bg-card text-foreground hover:border-foreground"
              )}
            >
              {active && <Check className="h-4 w-4" aria-hidden />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TrainerCard;
