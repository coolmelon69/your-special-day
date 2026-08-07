import { motion, AnimatePresence } from "framer-motion";
import type { ItemDetails } from "@/utils/pokeItems";

interface PokeStopRevealModalProps {
  isOpen: boolean;
  checkpointTitle: string;
  xpAwarded: number;
  /** null while the item fetch is still in flight */
  item: ItemDetails | null;
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

const PokeStopRevealModal = ({ isOpen, checkpointTitle, xpAwarded, item, onContinue }: PokeStopRevealModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80" />
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
            PokéStop Activated!
          </motion.p>
          <p className="text-sm text-muted-foreground">{checkpointTitle}</p>

          <motion.div
            className="mt-4 flex items-center justify-center gap-1 text-primary font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            +{xpAwarded} XP
          </motion.div>

          <motion.div
            className="mt-4 rounded-lg border-2 border-[hsl(210_40%_80%)] bg-[hsl(210_40%_97%)] p-4 min-h-[6rem] flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {item ? (
              <>
                {item.spriteUrl && (
                  <img src={item.spriteUrl} alt={item.name} className="w-12 h-12" style={{ imageRendering: "pixelated" }} />
                )}
                <p className="font-semibold capitalize">Got 1x {item.name.replace(/-/g, " ")}!</p>
                {item.flavorText && <p className="text-xs text-muted-foreground">{item.flavorText}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Registering item...</p>
            )}
          </motion.div>

          <motion.button
            onClick={onContinue}
            disabled={!item}
            className="mt-5 w-full px-6 py-3 rounded-lg bg-[hsl(210_90%_55%)] text-white font-semibold disabled:opacity-50 disabled:cursor-wait hover:bg-[hsl(210_90%_50%)] transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default PokeStopRevealModal;
