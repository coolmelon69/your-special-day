import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Eyebrow, DisplayHeading, EditorialFigure } from "@/components/editorial";
import { sideConfetti } from "@/utils/particles";

const EASE = [0.22, 1, 0.36, 1] as const;

const HeroSection = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  // The one authored moment on this page: a small burst on arrival, then it's quiet.
  useEffect(() => {
    if (reduceMotion) return;
    sideConfetti({ duration: 3000, particleCount: 3 });
  }, [reduceMotion]);

  const startTheDay = () =>
    document.getElementById("gallery")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });

  /** The cover prints in: each block lands a beat after the one above it. */
  const printIn = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <section className="bg-gradient-hero py-14 md:py-24 lg:flex lg:min-h-[calc(100svh-5rem)] lg:items-center">
      <div className="container grid items-center gap-14 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
        {/* ── The cover story ── */}
        <div>
          <motion.div {...printIn(0)}>
            <Eyebrow no="Nº 01">Today's issue</Eyebrow>
          </motion.div>

          <motion.div {...printIn(0.08)}>
            <DisplayHeading className="mt-5">
              Happy birthday, <em>Mochi</em>. One <strong>whole day</strong>, kept in
              one place<span className="dot-accent">.</span>
            </DisplayHeading>
          </motion.div>

          <motion.p
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-muted-foreground"
            {...printIn(0.16)}
          >
            Every stop we're making, every photo we take, every coupon you get to cash
            in. It all lives on this page, so start at the top and work your way down
            the day.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3"
            {...printIn(0.24)}
          >
            <button
              onClick={startTheDay}
              className="inline-flex items-center gap-2 rounded-[10px] border border-primary bg-primary px-5 py-3 font-sans font-medium text-primary-foreground transition-gentle hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start the day
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate("/memory-book")}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border px-5 py-3 font-sans font-medium text-foreground transition-gentle hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Memory book
            </button>
          </motion.div>
        </div>

        {/* ── Exhibit A ── */}
        <motion.figure
          /* Capped near the GIF's native size — blown up any further it goes soft. */
          className="m-0 w-full max-w-[460px] justify-self-center lg:justify-self-end"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
        >
          <EditorialFigure
            src="/images/gallery/heart-anime.gif"
            alt="Roy Mustang holding a phone with a heart, captioned I love you"
            dotGrid="br"
            aspectClassName="aspect-square"
            annotate={
              <>
                this is me,
                <br />
                every day,
                <br />
                about you.
              </>
            }
          >
            {/* The one cat that survived — stuck on like a sticker, on purpose. */}
            <motion.span
              className="sticker -left-5 -top-6 w-20 md:w-24"
              aria-hidden="true"
              initial={reduceMotion ? false : { opacity: 0, y: -12, rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: -8 }}
              transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
            >
              <img
                src="/images/gallery/mmm_cat.png"
                alt=""
                className="block w-full rounded-[0.55rem]"
              />
            </motion.span>
          </EditorialFigure>

          <figcaption className="figure-cap">Exhibit A — the general feeling</figcaption>
        </motion.figure>
      </div>
    </section>
  );
};

export default HeroSection;
