import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import PokeCoin from "@/components/PokeCoin";
import CountUp from "react-countup";
import type { ItemDetails, Rarity } from "@/utils/pokeItems";

interface PokeStopRevealModalProps {
  isOpen: boolean;
  checkpointTitle: string;
  xpAwarded: number;
  /** null while the item fetch is still in flight */
  item: ItemDetails | null;
  /** null until the drop has been rolled and banked */
  rarity: Rarity | null;
  coinsAwarded: number;
  /**
   * `"drop"` is a PokéStop: an item is on its way and the reveal waits for it.
   * `"coins"` is a stamp with nowhere to travel to — there is no item to wait
   * for, so the coins are the whole reveal and Continue is live immediately.
   */
  variant?: "drop" | "coins";
  onContinue: () => void;
}

const PokeBallIcon = () => (
  <svg viewBox="0 0 32 32" className="w-16 h-16 mx-auto">
    <circle cx="16" cy="16" r="14" fill="hsl(0 70% 55%)" />
    <path d="M 2 16 A 14 14 0 0 1 30 16 Z" fill="hsl(0 70% 55%)" />
    <path d="M 2 16 A 14 14 0 0 0 30 16 Z" fill="white" />
    <rect x="2" y="14.5" width="28" height="3" fill="hsl(220 10% 20%)" />
    <circle cx="16" cy="16" r="5" fill="white" stroke="hsl(220 10% 20%)" strokeWidth="2" />
    <circle cx="16" cy="16" r="2" fill="hsl(220 10% 70%)" />
  </svg>
);

const PokeStopRevealModal = ({
  isOpen,
  checkpointTitle,
  xpAwarded,
  item,
  rarity,
  coinsAwarded,
  variant = "drop",
  onContinue,
}: PokeStopRevealModalProps) => {
  const reduceMotion = useReducedMotion();
  const isCoinsOnly = variant === "coins";
  const isRare = rarity === "rare";

  return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Opaque so opacity alone drives darkness — lets the rare path pulse
            the surround dark before the sprite settles, per the reveal spec. */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0.8 }}
          animate={
            isRare
              ? { opacity: reduceMotion ? 0.92 : [0.8, 0.96, 0.96, 0.85] }
              : { opacity: 0.8 }
          }
          transition={
            isRare && !reduceMotion
              ? { duration: 1.3, times: [0, 0.3, 0.7, 1], delay: 0.5 }
              : { duration: 0.3 }
          }
        />
        <motion.div
          className="relative w-full max-w-sm bg-white rounded-2xl border-4 border-[hsl(210_90%_55%)] p-6 text-center"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
        >
          <motion.div
            initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 360, scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <PokeBallIcon />
          </motion.div>

          <motion.p
            className="mt-3 text-lg font-bold text-[hsl(210_90%_40%)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isCoinsOnly ? "Stamp Collected!" : "PokéStop Activated!"}
          </motion.p>
          <p className="text-sm text-muted-foreground">{checkpointTitle}</p>

          <motion.div
            className="mt-4 flex items-center justify-center gap-4 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-primary">+{xpAwarded} XP</span>
            {!isCoinsOnly && coinsAwarded > 0 && (
              <span className="flex items-center gap-2 text-rose">
                <PokeCoin size={16} />+
                {reduceMotion ? (
                  coinsAwarded
                ) : (
                  <CountUp
                    start={0}
                    end={coinsAwarded}
                    duration={isRare ? 1.3 : 0.7}
                    delay={isRare ? 0.5 : 0.3}
                    useEasing
                  />
                )}
              </span>
            )}
          </motion.div>

          {/* The coins-only reveal. No item is coming, so the coin itself is the
              moment — it lands with a spring where the sprite would have been,
              and the count runs under it. */}
          {isCoinsOnly && coinsAwarded > 0 && (
            <motion.div
              className="relative mt-4 overflow-hidden rounded-lg border-2 border-[hsl(45_85%_62%)] bg-[hsl(45_90%_96%)] p-4 min-h-[6rem] flex flex-col items-center justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <motion.div
                initial={reduceMotion ? false : { scale: 0.4, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.7 }}
              >
                <PokeCoin size={44} />
              </motion.div>
              <p className="font-semibold text-[hsl(38_60%_32%)]">
                +
                {reduceMotion ? (
                  coinsAwarded
                ) : (
                  <CountUp start={0} end={coinsAwarded} duration={0.7} delay={0.85} useEasing />
                )}{" "}
                coins banked
              </p>
              <p className="text-xs text-muted-foreground">
                Nothing to catch at this one — coins only.
              </p>
            </motion.div>
          )}

          {!isCoinsOnly && (
          <motion.div
            className={`relative mt-4 overflow-hidden rounded-lg border-2 p-4 min-h-[6rem] flex flex-col items-center justify-center gap-2 ${
              isRare
                ? "border-rose bg-[hsl(330_60%_97%)]"
                : "border-[hsl(210_40%_80%)] bg-[hsl(210_40%_97%)]"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isRare ? (reduceMotion ? 0.3 : 0.55) : 1 }}
          >
            {item ? (
              <>
                {isRare && (
                  <motion.span
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduceMotion ? 0.3 : 0.6 }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Rare find
                  </motion.span>
                )}

                {/* Light sweep: the reward beat rares get and commons don't. */}
                {isRare && !reduceMotion && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    initial={{ x: "-150%" }}
                    animate={{ x: "250%" }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "easeInOut" }}
                  />
                )}

                {item.spriteUrl && (
                  <motion.img
                    src={item.spriteUrl}
                    alt={item.name}
                    className="w-12 h-12"
                    style={{ imageRendering: "pixelated" }}
                    initial={isRare ? { opacity: 0, scale: 0.6 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={isRare ? { delay: reduceMotion ? 0.3 : 1.25, duration: 0.35, ease: "easeOut" } : undefined}
                  />
                )}
                <motion.p
                  className="font-semibold capitalize"
                  initial={isRare ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={isRare ? { delay: reduceMotion ? 0.35 : 1.35 } : undefined}
                >
                  Got 1x {item.name.replace(/-/g, " ")}!
                </motion.p>
                {item.flavorText && (
                  <motion.p
                    className="text-xs text-muted-foreground"
                    initial={isRare ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={isRare ? { delay: reduceMotion ? 0.4 : 1.4 } : undefined}
                  >
                    {item.flavorText}
                  </motion.p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Registering item...</p>
            )}
          </motion.div>
          )}

          <motion.button
            onClick={onContinue}
            disabled={!isCoinsOnly && !item}
            className="mt-5 w-full px-6 py-3 rounded-lg bg-[hsl(210_90%_55%)] text-white font-semibold disabled:opacity-50 disabled:cursor-wait hover:bg-[hsl(210_90%_50%)] transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isCoinsOnly ? 1 : isRare ? (reduceMotion ? 0.5 : 1.55) : 1.2 }}
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

export default PokeStopRevealModal;
