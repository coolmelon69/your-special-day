import { motion } from "framer-motion";
import { formatDuration } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";

/**
 * A deliberate break from the lavender editorial system, in the same spirit
 * as the ticket book in DESIGN_SYSTEM.md §14: monospace, narrow, paper-like.
 * The novelty is the point.
 */
const ReceiptSlide = ({ stats }: { stats: WrappedStats }) => (
  <div className="flex flex-col h-full justify-center items-center px-6 w-full">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-xs bg-card border border-border rounded-sm shadow-sm px-6 py-7 font-mono text-[12px] text-foreground max-h-[70vh] overflow-y-auto"
    >
      <p className="text-center uppercase tracking-[0.2em] text-[11px] mb-1">Your Special Day</p>
      <p className="text-center text-muted-foreground text-[10px] mb-5">Itemized receipt</p>

      <div className="border-t border-dashed border-border pt-4 space-y-2">
        {stats.receiptItems.map((item, i) => (
          <div key={`${item.time}-${item.title}-${i}`} className="flex justify-between gap-3">
            <span className="truncate">{item.title}</span>
            <span className="text-muted-foreground shrink-0">{item.time}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border mt-4 pt-4 space-y-2 text-muted-foreground">
        <div className="flex justify-between">
          <span>Photos</span>
          <span>{stats.photosTaken}</span>
        </div>
        <div className="flex justify-between">
          <span>Stickers</span>
          <span>{stats.stickersPlaced}</span>
        </div>
        <div className="flex justify-between">
          <span>Distance</span>
          <span>{stats.distanceKm.toFixed(1)} km</span>
        </div>
        <div className="flex justify-between">
          <span>Time out</span>
          <span>{formatDuration(stats.spanMinutes)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border mt-4 pt-4 flex justify-between uppercase tracking-wider">
        <span>Total</span>
        <span className="text-rose">priceless</span>
      </div>

      <p className="text-center text-muted-foreground text-[10px] mt-6">
        Thank you, come again
      </p>
    </motion.div>
  </div>
);

export default ReceiptSlide;
