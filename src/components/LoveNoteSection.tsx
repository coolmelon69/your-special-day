import { motion } from "framer-motion";
import { Heart, CheckSquare, Gift, ArrowRight, QrCode, Lock } from "lucide-react";
import { NavLink } from "./NavLink";
import { useAdventure } from "@/contexts/AdventureContext";
import { Eyebrow, DisplayHeading, Pill, StatBlock } from "@/components/editorial";
import { cn } from "@/lib/utils";

const LoveNoteSection = () => {
  const { itineraryState, coupons } = useAdventure();
  const completedStamps = itineraryState.filter((i) => i.isPast).length;
  const totalStamps = itineraryState.length;
  const unlockedCoupons = coupons.filter((c) => completedStamps >= c.requiredStamps).length;
  const totalCoupons = coupons.length;

  const stampsDone = totalStamps > 0 && completedStamps === totalStamps;
  const couponsDone = totalCoupons > 0 && unlockedCoupons === totalCoupons;

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
            THESIS — three doors, not a SaaS shelf. The cards read as index
            entries in the site's own editorial system (Eyebrow/StatBlock),
            not a gradient-card tile like the ones the /coupons ticket book
            already refuses. Nº serials + a stat replace decorative Sparkles;
            rose/shadow-romantic mark a fully-done card, primary marks the
            in-progress default — the same states StampCollectionSection uses. */}
        <motion.div
          className="text-center mb-10 max-w-[42ch] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Eyebrow className="justify-center">Three ways in</Eyebrow>
          <DisplayHeading as="h2" className="mt-4 text-3xl md:text-4xl">
            Explore <em>more</em><span className="dot-accent">.</span>
          </DisplayHeading>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* Stamps Navigation Card */}
          <NavLink to="/stamps" className="h-full">
            <motion.div
              className={cn(
                "group relative h-full flex flex-col rounded-3xl border bg-card p-7 md:p-8 transition-colors",
                stampsDone ? "border-rose/40 shadow-romantic" : "border-primary/40"
              )}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full border",
                    stampsDone ? "bg-rose/10 border-rose/30 text-rose" : "bg-primary/10 border-primary/30 text-primary"
                  )}
                >
                  <CheckSquare className="w-5 h-5" />
                </span>
                <Pill variant={stampsDone ? "rose" : "accent"}>Nº 01</Pill>
              </div>

              <h4 className="font-serif text-2xl font-bold mt-5 mb-2">Stamp Collection</h4>
              <p className="text-muted-foreground mb-6 flex-grow">
                Every adventure stop you've checked off, kept in one book.
              </p>

              <StatBlock
                value={completedStamps}
                unit={`/ ${totalStamps}`}
                label={stampsDone ? "all stamps collected" : "stamps collected so far"}
              />

              <div className="inline-flex items-center gap-2 mt-6 font-medium text-primary group-hover:gap-3 transition-all">
                View Stamps
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </NavLink>

          {/* Coupons Navigation Card */}
          <NavLink to="/coupons" className="h-full">
            <motion.div
              className={cn(
                "group relative h-full flex flex-col rounded-3xl border bg-card p-7 md:p-8 transition-colors",
                couponsDone ? "border-rose/40 shadow-romantic" : "border-primary/40"
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full border",
                    couponsDone ? "bg-rose/10 border-rose/30 text-rose" : "bg-primary/10 border-primary/30 text-primary"
                  )}
                >
                  <Gift className="w-5 h-5" />
                </span>
                <Pill variant={couponsDone ? "rose" : "accent"}>Nº 02</Pill>
              </div>

              <h4 className="font-serif text-2xl font-bold mt-5 mb-2">Gift Coupons</h4>
              <p className="text-muted-foreground mb-6 flex-grow">
                Special promises, unlocked one stamp at a time.
              </p>

              {totalCoupons > 0 ? (
                <StatBlock
                  value={unlockedCoupons}
                  unit={`/ ${totalCoupons}`}
                  label={couponsDone ? "all coupons unlocked" : "coupons unlocked"}
                />
              ) : (
                <Pill variant="tag" className="w-fit">
                  Check back soon
                </Pill>
              )}

              <div className="inline-flex items-center gap-2 mt-6 font-medium text-primary group-hover:gap-3 transition-all">
                View Coupons
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </NavLink>

          {/* QR Scanner Navigation Card — pure action, no fabricated stat */}
          <NavLink to="/scan-qr" className="h-full">
            <motion.div
              className="group relative h-full flex flex-col rounded-3xl border border-secondary/40 bg-card p-7 md:p-8 transition-colors"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-secondary/10 border-secondary/30 text-secondary">
                  <QrCode className="w-5 h-5" />
                </span>
                <Pill variant="tag">Nº 03</Pill>
              </div>

              <h4 className="font-serif text-2xl font-bold mt-5 mb-2">Scan QR Code</h4>
              <p className="text-muted-foreground mb-6 flex-grow">
                Redeeming a ticket in person? Scan its code here.
              </p>

              <Pill variant="accent" icon={<QrCode />} className="w-fit">
                Ready to scan
              </Pill>

              <div className="inline-flex items-center gap-2 mt-6 font-medium text-primary group-hover:gap-3 transition-all">
                Scan Now
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </NavLink>
        </div>

        {/* Wrapped teaser now lives in its own editorial component, rendered on HomePage */}
      </div>
    </section>
  );
};

export default LoveNoteSection;