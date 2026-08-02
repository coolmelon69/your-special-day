import { motion } from "framer-motion";
import { Heart, CheckSquare, Gift, ArrowRight, QrCode, Lock, Images } from "lucide-react";
import { NavLink } from "./NavLink";
import { useAdventure } from "@/contexts/AdventureContext";
import { Eyebrow, DisplayHeading } from "@/components/editorial";
import { cn } from "@/lib/utils";

/* A door is a window onto its destination, then a caption. The window shows the
   real thing behind the door — the stamp sheet, the ticket, the prints — so the
   card is evidence, not an icon standing in for one. */
type DoorTone = "rose" | "primary" | "muted" | "ink";

const toneCard: Record<DoorTone, string> = {
  rose: "border-rose/40 shadow-romantic",
  primary: "border-primary/40",
  muted: "border-border",
  ink: "border-foreground/25",
};

const toneMeta: Record<DoorTone, string> = {
  rose: "text-rose",
  primary: "text-primary",
  muted: "text-muted-foreground",
  ink: "text-foreground",
};

/* A 21×21 module map — the size of a real version-1 code. Finder squares and
   timing rows are laid out correctly so the plate reads as a code at a glance;
   the data modules are a fixed pattern, not a live encoding. */
const QR_SIZE = 21;
const QR_CELLS: boolean[] = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => {
  const x = i % QR_SIZE;
  const y = Math.floor(i / QR_SIZE);

  for (const [ox, oy] of [[0, 0], [QR_SIZE - 7, 0], [0, QR_SIZE - 7]]) {
    const dx = x - ox;
    const dy = y - oy;
    if (dx >= 0 && dy >= 0 && dx < 7 && dy < 7) {
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      return ring === 3 || ring <= 1;
    }
  }
  // Separator quiet zone around each finder.
  if ((x < 8 && y < 8) || (x > QR_SIZE - 9 && y < 8) || (x < 8 && y > QR_SIZE - 9)) return false;
  // Timing patterns — the alternating run a reader locks onto.
  if (x === 6 || y === 6) return (x + y) % 2 === 0;
  return (((x * 3 + y * 7) ^ (x * y)) % 3) === 0;
});

interface DoorProps {
  to: string;
  title: string;
  blurb: string;
  metaIcon: React.ReactNode;
  meta: string;
  action: string;
  tone: DoorTone;
  index: number;
  /** The window: a miniature of what actually lives behind this door. */
  children: React.ReactNode;
}

const Door = ({ to, title, blurb, metaIcon, meta, action, tone, index, children }: DoorProps) => (
  <NavLink
    to={to}
    className="group h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  >
    <motion.article
      className={cn(
        "h-full flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors",
        toneCard[tone]
      )}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative h-36 overflow-hidden border-b border-border">{children}</div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-bold leading-snug">{title}</h3>
        <p className="mt-1.5 flex-grow text-sm leading-relaxed text-muted-foreground">{blurb}</p>

        <div className="mt-5 border-t border-border pt-3">
          <span
            className={cn(
              "flex items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-wide",
              toneMeta[tone]
            )}
          >
            <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{metaIcon}</span>
            {meta}
          </span>
          <span className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-[gap] group-hover:gap-2.5">
            {action}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </motion.article>
  </NavLink>
);

const LoveNoteSection = () => {
  const { itineraryState, coupons, photos } = useAdventure();
  const completedStamps = itineraryState.filter((i) => i.isPast).length;
  const totalStamps = itineraryState.length;
  const unlockedCoupons = coupons.filter((c) => completedStamps >= c.requiredStamps).length;
  const totalCoupons = coupons.length;

  const stampsDone = totalStamps > 0 && completedStamps === totalStamps;
  const couponsDone = totalCoupons > 0 && unlockedCoupons === totalCoupons;

  // The three most recent prints, newest first — the fan in the memory-book window.
  const recentPrints = [...photos].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  const nextStampIndex = itineraryState.findIndex((i) => !i.isPast);
  // Six across at most, then balance the rows so the sheet never ends in a stray square.
  const stampRows = Math.max(1, Math.ceil(totalStamps / 6));
  const stampColumns = Math.max(1, Math.ceil(totalStamps / stampRows));

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heart className="mx-auto mb-4 text-primary" size={36} fill="currentColor" />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            A Letter <span className="text-gradient-romantic">From My Heart</span>
          </h2>
        </motion.div>

        {/* Blurred Secret Letter */}
        <motion.div
          className="max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="relative bg-card rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden shadow-primary/10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23c4b5fd' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
            whileHover={{
              scale: 1.01,
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurred Letter Content */}
            <motion.div
              className="font-serif text-lg md:text-xl leading-relaxed text-foreground/90 space-y-4"
              style={{
                filter: 'blur(15px)',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              animate={{
                x: [0, 2, -2, 0],
                opacity: [0.3, 0.35, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <p>My Dearest Love,</p>
              
              <p>
                On this special day, I want you to know how incredibly lucky I feel to have you in my life. 
                From the moment we met, you've filled my world with so much joy, laughter, and love that 
                I never knew was possible.
              </p>
              
              <p>
                Your smile brightens even my darkest days, your kindness inspires me to be better, 
                and your love gives me strength I never knew I had. Every moment with you is a treasure, 
                and I cherish each one more than words could ever express.
              </p>
              
              <p>
                On your birthday, I wish you all the happiness, success, and dreams come true. 
                But most of all, I wish for us to have countless more adventures, endless laughs, 
                and a lifetime of love together.
              </p>
              
              <p className="font-script text-2xl text-primary pt-4">
                Forever and always yours,
                <br />
                Your Partner 💕
              </p>
            </motion.div>

            {/* Glassmorphism Overlay */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 z-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div
                className="bg-white/20 backdrop-blur-sm rounded-2xl px-12 py-14 md:p-12 border border-white/30 shadow-xl max-w-[80%] text-center min-h-[280px] md:min-h-auto"
                style={{
                  fontFamily: "'Playfair Display', 'Lora', serif",
                }}
              >
                <motion.p
                  className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-6"
                  style={{
                    color: 'hsl(var(--primary))',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Some words are meant to be felt on paper. They're waiting for you at the end of our journey.
                </motion.p>

                {/* Lock Icon and Timestamp */}
                <motion.div
                  className="flex items-center justify-center gap-2 text-sm md:text-base"
                  style={{
                    color: 'hsl(var(--primary))',
                    opacity: 0.7,
                  }}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.7 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-serif">19.11.2025</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Navigation Section
            THESIS — four windows, not a card shelf. Every door shows a
            miniature of the real thing behind it, drawn from live state: the
            stamp sheet with the stops actually checked off, a ticket with the
            promises actually unlocked, the prints actually taken, and the
            scanner's own dark plate. An icon in a tinted disc would have been a
            label for the destination; this is a look at it. Rose/shadow-romantic
            still marks a finished door and primary the one in progress — the
            same states StampCollectionSection uses. */}
        <motion.div
          className="text-center mb-10 max-w-[42ch] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Eyebrow className="justify-center">Four ways in</Eyebrow>
          <DisplayHeading as="h2" className="mt-4 text-3xl md:text-4xl">
            Explore <em>more</em><span className="dot-accent">.</span>
          </DisplayHeading>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto items-stretch">
          {/* Nº 01 — the sheet. One perforated square per stop, inked when stamped. */}
          <Door
            to="/stamps"
            title="Stamp Collection"
            blurb="Every stop we make, checked off and kept in one book."
            metaIcon={<CheckSquare />}
            meta={stampsDone ? "sheet complete" : `${completedStamps} / ${totalStamps} collected`}
            action="View Stamps"
            tone={stampsDone ? "rose" : "primary"}
            index={0}
          >
            <div className="absolute inset-0 bg-accent" />
            <div className="absolute inset-0 grid place-items-center px-4">
              {/* The sheet itself, so the squares read as one perforated block. */}
              <div
                className="grid gap-1.5 rounded-md border border-primary/15 bg-card/45 p-2.5"
                style={{ gridTemplateColumns: `repeat(${stampColumns}, minmax(0, 1fr))` }}
              >
                {itineraryState.map((stop, i) => (
                  <span
                    key={stop.title}
                    title={stop.title}
                    className={cn(
                      "h-6 w-6 rounded-[3px] transition-colors duration-300",
                      stop.isPast
                        ? "bg-rose/75 shadow-[0_1px_2px_hsl(var(--rose)/0.35)] ring-1 ring-inset ring-card/50"
                        : "border border-dashed border-primary/25 bg-card/70",
                      // The next stop up sits inked-in-waiting; hovering the door fills it.
                      i === nextStampIndex &&
                        "border-solid border-primary/50 bg-primary/10 group-hover:bg-primary/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </Door>

          {/* Nº 02 — the ticket. Its stub pulls away from the perforation on hover. */}
          <Door
            to="/coupons"
            title="Gift Coupons"
            blurb="Promises to cash in, unlocked one stamp at a time."
            metaIcon={<Gift />}
            meta={
              totalCoupons === 0
                ? "none written yet"
                : couponsDone
                  ? "all unlocked"
                  : `${unlockedCoupons} / ${totalCoupons} unlocked`
            }
            action="View Coupons"
            tone={totalCoupons === 0 ? "muted" : couponsDone ? "rose" : "primary"}
            index={1}
          >
            {/* Rose ground: the ticket book's own ink, carried onto its door. */}
            <div className="absolute inset-0 bg-rose-light/50" />
            {/* The ticket underneath, so the book reads as more than one. */}
            <div className="absolute left-8 right-4 top-9 h-16 rotate-[3deg] rounded-md border border-border bg-card/60" />
            <div className="absolute left-5 right-7 top-7 flex h-16 -rotate-[2deg] overflow-hidden rounded-md border border-border bg-card shadow-sm">
              <div className="flex w-12 shrink-0 items-center justify-center transition-transform duration-300 group-hover:-translate-x-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground [writing-mode:vertical-rl]">
                  Pull
                </span>
              </div>
              <div
                className="w-px shrink-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, hsl(var(--border)) 0 3px, transparent 3px 6px)",
                }}
              />
              <div className="flex flex-1 flex-col justify-center px-3">
                {totalCoupons > 0 ? (
                  <>
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                      Unlocked
                    </span>
                    <span className="font-serif text-2xl font-bold leading-none text-rose">
                      {unlockedCoupons}
                      <span className="ml-0.5 text-sm text-muted-foreground">/ {totalCoupons}</span>
                    </span>
                  </>
                ) : (
                  // A blank ticket: the book exists, nothing is printed in it yet.
                  <span className="space-y-1.5">
                    <span className="block h-1.5 w-3/4 rounded-full bg-border" />
                    <span className="block h-1.5 w-1/2 rounded-full bg-border" />
                  </span>
                )}
              </div>
            </div>
          </Door>

          {/* Nº 03 — the prints, fanned. Real photos when there are any. */}
          <Door
            to="/memory-book"
            title="Memory Book"
            blurb="Every photo taken along the way, bound into pages."
            metaIcon={<Images />}
            meta={
              photos.length === 0
                ? "no prints yet"
                : `${photos.length} ${photos.length === 1 ? "print" : "prints"}`
            }
            action="Open the Book"
            tone={photos.length === 0 ? "muted" : "primary"}
            index={2}
          >
            <div className="absolute inset-0 bg-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              {[-9, 0, 9].map((angle, i) => {
                const print = recentPrints[i];
                return (
                  <div
                    key={angle}
                    /* The fan opens under the cursor — the prints are being spread
                       across the table, which is the whole promise of the door. */
                    className={cn(
                      "absolute h-[76px] w-[60px] rounded-[3px] bg-card p-1 pb-2.5 shadow-md",
                      "transition-transform duration-500 ease-out",
                      "[transform:rotate(var(--r))_translateX(var(--x))]",
                      "group-hover:[transform:rotate(calc(var(--r)*1.7))_translateX(calc(var(--x)*1.5))]",
                      !print && "border border-dashed border-border shadow-none"
                    )}
                    style={
                      {
                        "--r": `${angle}deg`,
                        "--x": `${(i - 1) * 30}px`,
                        zIndex: 3 - Math.abs(i - 1),
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className={cn(
                        "h-full w-full overflow-hidden rounded-[2px]",
                        print ? "bg-foreground/10" : "bg-muted"
                      )}
                    >
                      {print && (
                        <img
                          src={print.storageUrl || print.src}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className={cn(
                            "h-full w-full object-cover",
                            print.isDeveloped === false && "blur-[3px] saturate-50"
                          )}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Door>

          {/* Nº 04 — the scanner's own plate. The one dark window: this door is a camera. */}
          <Door
            to="/scan-qr"
            title="Scan a Ticket"
            blurb="Redeeming a coupon in person? Point the camera at its code."
            metaIcon={<QrCode />}
            meta="Opens the scanner"
            action="Scan Now"
            tone="ink"
            index={3}
          >
            <div className="absolute inset-0 bg-foreground" />
            <div className="absolute inset-0 grid place-items-center">
              <div
                className="grid h-[84px] w-[84px] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                style={{ gridTemplateColumns: `repeat(${QR_SIZE}, 1fr)` }}
                aria-hidden="true"
              >
                {QR_CELLS.map((on, i) => (
                  <span key={i} className={on ? "bg-background" : undefined} />
                ))}
              </div>
              {/* The read: a rose line crosses the plate once the door is hovered. */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-rose opacity-0 shadow-[0_0_10px_2px_hsl(var(--rose)/0.7)] motion-safe:group-hover:animate-door-scan" />
            </div>
          </Door>
        </div>

        {/* Wrapped teaser now lives in its own editorial component, rendered on HomePage */}
      </div>
    </section>
  );
};

export default LoveNoteSection;