/* ─── The Us Gallery — the album leaf ──────────────────────────────────────
   THESIS: this section is one leaf of a real photo album — prints held by
   gummed corners on board stock — and the one thing it owns is turning a
   print over. It refuses the rotated-polaroid masonry grid.
   OWN-WORLD: slate-lilac board with fibre tooth, punched binder margin,
   gummed corners, torn matte tape, lab prints with an amber date imprint,
   kraft print-backs. Type is the album's own collision: Martian Mono as the
   label-maker / lab-stamp voice against Shantell Sans as the hand that wrote
   on the page. Section-local — the editorial stack is untouched elsewhere.
   STORY: these are her frames, shot on the disposable camera, developed and
   pasted in; the backs carry where and when.
   FIRST VIEWPORT: label tape, the roll title set in label-maker caps, a
   handwritten aside, then the leaf.
   FORM: album spread / ephemera — user-pinned, ranked 3rd of 3 offered.
   ───────────────────────────────────────────────────────────────────────── */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAdventure } from "@/contexts/AdventureContext";
import { checkpointKey } from "@/utils/memoryBookGenerator";
import { cn } from "@/lib/utils";

type Leaf = {
  id: string;
  src: string;
  caption: string;
  place?: string;
  time?: string;
  taken?: number;
  developed: boolean;
};

/* Scaffolding for the signed-out page. Replaced by her own frames on sign-in.
   Dates are illustrative — one made-up day, so the imprint has something to burn. */
const sampleDay = (hour: number, minute = 0) => new Date(2026, 7, 1, hour, minute).getTime();

const sampleLeaves: Leaf[] = [
  {
    id: "sample-1",
    src: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=900&h=720&fit=crop",
    caption: "our first adventure together",
    place: "Breakfast Quest",
    time: "9:00 AM",
    taken: sampleDay(9, 12),
    developed: true,
  },
  {
    id: "sample-2",
    src: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=1000&fit=crop",
    caption: "that magical sunset walk",
    place: "Flower Gathering",
    time: "11:00 AM",
    taken: sampleDay(11, 41),
    developed: true,
  },
  {
    id: "sample-3",
    src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=800&fit=crop",
    caption: "coffee dates are our thing",
    place: "Kopi Break",
    time: "1:00 PM",
    taken: sampleDay(13, 8),
    developed: true,
  },
  {
    id: "sample-4",
    src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&h=680&fit=crop",
    caption: "our first gig hangout",
    place: "The Gig",
    time: "4:00 PM",
    taken: sampleDay(16, 27),
    developed: true,
  },
  {
    id: "sample-5",
    src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&h=1000&fit=crop",
    caption: "your beautiful smile",
    place: "Golden Hour",
    time: "6:30 PM",
    taken: sampleDay(18, 34),
    developed: true,
  },
  {
    id: "sample-6",
    src: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=900&h=720&fit=crop",
    caption: "best road trip ever",
    place: "The Long Way Home",
    time: "8:00 PM",
    taken: sampleDay(20, 3),
    developed: true,
  },
];

/* Paste-up slots. Not random — a fixed, deliberate rhythm that repeats down
   the leaf, so a long roll still reads as one hand laying prints out. */
const slots = [
  { span: "sm:col-span-7 lg:col-span-5", aspect: "aspect-[5/4]", rotate: -1.3, tape: "tl", offset: "" },
  { span: "sm:col-span-5 lg:col-span-4", aspect: "aspect-[4/5]", rotate: 1.5, tape: null, offset: "sm:mt-10" },
  { span: "sm:col-span-5 lg:col-span-3", aspect: "aspect-square", rotate: 0.9, tape: "tr", offset: "lg:mt-4" },
  { span: "sm:col-span-7 lg:col-span-5", aspect: "aspect-[4/3]", rotate: -0.8, tape: null, offset: "sm:mt-8" },
  { span: "sm:col-span-6 lg:col-span-4", aspect: "aspect-[4/5]", rotate: 1.2, tape: null, offset: "" },
  { span: "sm:col-span-6 lg:col-span-3", aspect: "aspect-[5/4]", rotate: -1.6, tape: "tl", offset: "sm:mt-12" },
] as const;

const tapePos: Record<"tl" | "tr", string> = {
  tl: "-top-3 -left-5 w-24 h-7 -rotate-[24deg]",
  tr: "-top-3 -right-5 w-24 h-7 rotate-[19deg]",
};

const frameNo = (i: number) => String(i + 1).padStart(2, "0");

/** Camera-style in-frame date imprint: '26 08 01 */
const imprintDate = (ms?: number) => {
  if (!ms) return null;
  const d = new Date(ms);
  return `'${String(d.getFullYear()).slice(2)} ${String(d.getMonth() + 1).padStart(2, "0")} ${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const backDate = (ms?: number) =>
  ms
    ? new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

const Print = ({
  leaf,
  index,
  flipped,
  onFlip,
  still,
}: {
  leaf: Leaf;
  index: number;
  flipped: boolean;
  onFlip: () => void;
  still: boolean;
}) => {
  const slot = slots[index % slots.length];
  const no = frameNo(index);
  const imprint = imprintDate(leaf.taken);

  return (
    <motion.div
      className={cn("relative", slot.span, slot.offset)}
      initial={still ? false : { opacity: 0, y: 26, rotate: slot.rotate * 2.8, scale: 1.04 }}
      whileInView={{ opacity: 1, y: 0, rotate: slot.rotate, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: (index % slots.length) * 0.055, ease: [0.16, 1, 0.3, 1] }}
      style={still ? { rotate: slot.rotate } : undefined}
    >
      <div className="group relative [perspective:1400px]">
        <button
          type="button"
          onClick={onFlip}
          aria-pressed={flipped}
          aria-label={
            flipped
              ? `Turn frame ${no} back over, ${leaf.caption}`
              : `Turn frame ${no} over to read the back, ${leaf.caption}`
          }
          className="block w-full rounded-[3px] transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-primary"
        >
          <motion.div
            className="relative w-full [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={still ? { duration: 0 } : { duration: 0.72, ease: [0.22, 1, 0.28, 1] }}
          >
            {/* front — the lab print */}
            <div className="album-print p-[7px] pb-[9px] [backface-visibility:hidden] transition-shadow duration-300 group-hover:shadow-[0_2px_2px_hsl(264_30%_24%/0.18),0_22px_38px_-18px_hsl(264_34%_26%/0.6)]">
              <div className={cn("relative overflow-hidden bg-muted", slot.aspect)}>
                <img
                  src={leaf.src}
                  alt={leaf.caption}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "h-full w-full object-cover",
                    !leaf.developed && "blur-[3px] saturate-[0.45] opacity-70"
                  )}
                />
                {!leaf.developed && (
                  <span className="album-label album-label--rose absolute bottom-2 left-2">
                    Latent
                  </span>
                )}
                {leaf.developed && imprint && (
                  <span aria-hidden className="album-imprint absolute bottom-[7px] right-[9px]">{imprint}</span>
                )}
              </div>
            </div>

            {/* back — kraft, and whatever got written on it */}
            <div className="album-back absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div>
                <div
                  className="font-label text-[0.5625rem] font-medium uppercase tracking-[0.2em]"
                  style={{ color: "hsl(var(--kraft-ink) / 0.66)" }}
                >
                  Frame {no}
                </div>
                <p className="album-hand mt-3 text-lg sm:text-xl" style={{ color: "hsl(var(--kraft-ink))" }}>
                  {leaf.caption}
                </p>
              </div>

              <span
                aria-hidden
                className="album-stamp absolute right-5 top-1/2 -translate-y-1/2 rotate-[-9deg]"
              >
                {leaf.developed ? (
                  <>
                    Developed
                    <br />
                    {leaf.time ?? "—"}
                  </>
                ) : (
                  <>
                    Not
                    <br />
                    developed
                  </>
                )}
              </span>

              <dl
                className="font-label text-[0.5625rem] leading-[1.9] uppercase tracking-[0.09em]"
                style={{ color: "hsl(var(--kraft-ink) / 0.78)" }}
              >
                {leaf.place && (
                  <div className="flex gap-2">
                    <dt className="w-14 shrink-0 opacity-60">Where</dt>
                    <dd>{leaf.place}</dd>
                  </div>
                )}
                {leaf.time && (
                  <div className="flex gap-2">
                    <dt className="w-14 shrink-0 opacity-60">When</dt>
                    <dd>{leaf.time}</dd>
                  </div>
                )}
                {backDate(leaf.taken) && (
                  <div className="flex gap-2">
                    <dt className="w-14 shrink-0 opacity-60">Dated</dt>
                    <dd>{backDate(leaf.taken)}</dd>
                  </div>
                )}
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 opacity-60">Stock</dt>
                  <dd>{leaf.developed ? "Disposable 35mm, developed" : "Disposable 35mm, not developed"}</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </button>

        {/* corners let go as the print is lifted out */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-300",
            flipped ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="album-corner album-corner--tl" />
          <span className="album-corner album-corner--tr" />
          <span className="album-corner album-corner--bl" />
          <span className="album-corner album-corner--br" />
          {slot.tape && <span className={cn("album-tape", tapePos[slot.tape])} />}
        </div>
      </div>

      {/* written on the board, not on the print */}
      <p
        aria-hidden={flipped}
        className={cn(
          "album-hand mt-4 max-w-[26ch] text-base transition-opacity duration-300 sm:text-lg",
          index % 2 ? "ml-auto text-right" : "",
          flipped ? "opacity-0" : "opacity-100"
        )}
        style={{ rotate: `${slot.rotate * -0.7}deg` }}
      >
        {leaf.caption}
      </p>
    </motion.div>
  );
};

const GallerySection = () => {
  const { photos, user, itineraryState } = useAdventure();
  const prefersReduced = useReducedMotion();
  const still = !!prefersReduced;
  const [flipped, setFlipped] = useState<string | null>(null);

  const isSample = !user || photos.length === 0;

  const leaves: Leaf[] =
    user && photos.length > 0
      ? photos.map((photo) => {
          // Photos are filed under `time-title`, not the bare title.
          const stop = itineraryState.find((item) => checkpointKey(item) === photo.checkpointId);
          return {
            id: photo.id,
            src: photo.storageUrl || photo.src,
            caption: photo.caption?.trim() || stop?.title || photo.checkpointId,
            place: stop?.title ?? photo.checkpointId,
            time: stop?.time,
            taken: photo.timestamp,
            developed: photo.isDeveloped !== false,
          };
        })
      : sampleLeaves;

  const showLeaves = !(user && photos.length === 0);
  const developedCount = leaves.filter((leaf) => leaf.developed).length;
  const stopCount = new Set(leaves.map((leaf) => leaf.place).filter(Boolean)).size;

  return (
    <section id="gallery" className="album bg-background py-16 md:py-24">
      <div className="container px-6">
        {/* ── the leaf's label ── */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <span className="album-label -rotate-1">
              {isSample ? "Sample roll" : "Roll 01"} · The Us Gallery
            </span>
            <h2 className="album-display mt-7 text-[clamp(2rem,7.2vw,3.6rem)]">
              Everything
              <br />
              we kept
            </h2>
            <p className="album-hand mt-6 max-w-[30ch] text-lg sm:text-xl" style={{ rotate: "-0.8deg" }}>
              {isSample
                ? "a sample page, until you sign in and paste your own in."
                : "shot on the disposable, developed, pasted in."}
            </p>
          </div>

          <div className="shrink-0 md:pb-2 md:text-right">
            {showLeaves && (
              <span className="album-label album-label--kraft rotate-1">Turn a print over</span>
            )}
            <p
              className="font-label mt-5 text-[0.625rem] uppercase leading-[2] tracking-[0.14em]"
              style={{ color: "hsl(var(--ink-soft))" }}
            >
              {leaves.length} frames · {developedCount} developed
              {stopCount > 0 && ` · ${stopCount} stops`}
            </p>
          </div>
        </motion.div>

        {/* ── the leaf ── */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="album-board relative mx-auto mt-12 max-w-6xl rounded-[4px] px-6 py-12 sm:px-10 sm:py-14 md:pl-24 md:pr-14"
        >
          {/* binder margin */}
          <div aria-hidden className="hidden md:block">
            <span className="album-rule left-[4.5rem]" />
            <span className="album-punch left-[2.1rem] top-[12%]" />
            <span className="album-punch left-[2.1rem] top-1/2 -translate-y-1/2" />
            <span className="album-punch left-[2.1rem] bottom-[12%]" />
          </div>

          {showLeaves ? (
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-12">
              {leaves.map((leaf, index) => (
                <Print
                  key={leaf.id}
                  leaf={leaf}
                  index={index}
                  flipped={flipped === leaf.id}
                  onFlip={() => setFlipped((current) => (current === leaf.id ? null : leaf.id))}
                  still={still}
                />
              ))}
            </div>
          ) : (
            /* signed in, nothing pasted in yet — the corners are already waiting */
            <div className="mx-auto max-w-[34rem] py-6 text-center">
              <div className="flex items-end justify-center gap-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="relative h-24 w-20 sm:h-28 sm:w-24"
                    style={{ rotate: `${(i - 1) * 1.6}deg` }}
                  >
                    <span className="album-corner album-corner--tl" />
                    <span className="album-corner album-corner--tr" />
                    <span className="album-corner album-corner--bl" />
                    <span className="album-corner album-corner--br" />
                  </div>
                ))}
              </div>
              <p className="album-hand mt-10 text-xl sm:text-2xl" style={{ rotate: "-1deg" }}>
                nothing pasted in yet.
              </p>
              <p
                className="font-label mx-auto mt-5 max-w-[38ch] text-[0.625rem] uppercase leading-[2.1] tracking-[0.12em]"
                style={{ color: "hsl(var(--ink-soft))" }}
              >
                Shoot a frame at any stop and it lands on this page.
              </p>
              <Link
                to="/camera"
                className="album-label mt-8 transition-transform duration-200 hover:-translate-y-px"
              >
                Load the camera
              </Link>
            </div>
          )}
        </motion.div>

        {/* ── the lab envelope this roll came back in ── */}
        <motion.div
          initial={still ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="album-back mx-auto mt-14 max-w-6xl px-7 py-9 sm:px-12 sm:py-11"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
            <span
              className="font-label text-[0.5625rem] font-medium uppercase tracking-[0.2em]"
              style={{ color: "hsl(var(--kraft-ink))" }}
            >
              Photo finishing · Order 01
            </span>
            <span
              className="font-label text-[0.625rem] uppercase tracking-[0.14em]"
              style={{ color: "hsl(var(--kraft-ink) / 0.7)" }}
            >
              {leaves.length} exp · {developedCount} printed
            </span>
          </div>

          <div
            aria-hidden
            className="my-7 h-px w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, hsl(var(--kraft-ink) / 0.35) 0 5px, transparent 5px 11px)",
            }}
          />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <p className="album-hand max-w-[24ch] text-xl" style={{ color: "hsl(var(--kraft-ink))" }}>
              {showLeaves ? "there's room on the next page." : "the roll is still empty."}
            </p>
            <Link
              to="/camera"
              className="tap-44 album-label album-label--kraft border transition-transform duration-200 hover:-translate-y-px"
              style={{ borderColor: "hsl(var(--kraft-ink) / 0.35)" }}
            >
              Shoot another frame
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GallerySection;
