import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Gift, Check } from "lucide-react";
import type { Coupon } from "./GiftCouponsSection";
import { sparkleBurst } from "../utils/particles";
import { Pill } from "@/components/editorial";
import { cn } from "@/lib/utils";

interface EditorialCouponCardProps {
  coupon: Coupon;
  isRedeemed: boolean;
  isLocked: boolean;
  isProcessing?: boolean;
  completedStamps: number;
  onCardClick: () => void;
}

/** Flat editorial coupon card. Same prop contract as the old 3D card. */
const EditorialCouponCard = ({
  coupon,
  isRedeemed,
  isLocked,
  isProcessing = false,
  completedStamps,
  onCardClick,
}: EditorialCouponCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (isLocked || isRedeemed || isProcessing) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      sparkleBurst({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        particleCount: 20,
      });
    }
    onCardClick();
  }, [isLocked, isRedeemed, isProcessing, onCardClick]);

  const interactive = !isLocked && !isRedeemed && !isProcessing;
  const stampsShown = Math.min(completedStamps, coupon.requiredStamps);

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      whileHover={interactive ? { y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition-all",
        isRedeemed
          ? "border-border"
          : isLocked
          ? "border-border opacity-60"
          : "border-rose/40 shadow-romantic cursor-pointer",
      )}
    >
      {/* Art block — coupon gradient + emoji */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
        <div className={cn("absolute inset-0 bg-gradient-to-br", coupon.color, isLocked && "grayscale")} />
        <span className={cn("absolute inset-0 grid place-items-center text-[3.5rem] drop-shadow-md", isRedeemed && "grayscale opacity-60")}>
          {coupon.emoji}
        </span>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
        {/* Lock badge */}
        {isLocked && (
          <div className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-card/90 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        {coupon.category ? (
          <Pill variant={isLocked ? "tag" : "rose"} className="capitalize">
            {coupon.category}
          </Pill>
        ) : (
          <span />
        )}
        {isRedeemed ? (
          <Pill variant="done" icon={<Check />}>
            Redeemed
          </Pill>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            {stampsShown}/{coupon.requiredStamps} stamps
          </span>
        )}
      </div>

      {/* Title + description */}
      <div className="flex-grow">
        <h3 className="font-serif text-xl font-bold text-foreground">{coupon.title}</h3>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{coupon.description}</p>
      </div>

      {/* Action */}
      {isRedeemed ? (
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 self-start rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-60"
        >
          <Check className="h-4 w-4" /> Already redeemed
        </button>
      ) : isLocked ? (
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 self-start rounded-[10px] border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground opacity-70"
        >
          <Lock className="h-4 w-4" /> {coupon.requiredStamps - stampsShown} stamp
          {coupon.requiredStamps - stampsShown === 1 ? "" : "s"} away
        </button>
      ) : (
        <button className="inline-flex items-center justify-center gap-2 self-start rounded-[10px] border border-rose bg-rose px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-95">
          <Gift className="h-4 w-4" /> Redeem
        </button>
      )}
    </motion.div>
  );
};

export default EditorialCouponCard;
