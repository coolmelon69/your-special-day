import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Gift } from "lucide-react";
import type { Coupon } from "./GiftCouponsSection";
import { sparkleBurst } from "../utils/particles";

interface ProgressBarProps {
  completed: number;
  required: number;
  color: string;
}

const ProgressBar = ({ completed, required, color }: ProgressBarProps) => {
  const percentage = Math.min((completed / required) * 100, 100);
  
  return (
    <div className="mt-2 sm:mt-3 md:mt-4 space-y-1 sm:space-y-2">
      <div className="relative h-3 sm:h-4 bg-white/20 rounded-full overflow-hidden border-2 border-white/30" style={{ imageRendering: "pixelated" }}>
        <motion.div
          className={`h-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] sm:text-xs text-white/90 font-pixel text-center">
        {completed}/{required} stamps collected
      </p>
    </div>
  );
};

interface ThreeDCouponCardProps {
  coupon: Coupon;
  isRedeemed: boolean;
  isLocked: boolean;
  completedStamps: number;
  onCardClick: () => void;
}

const ThreeDCouponCard = ({
  coupon,
  isRedeemed,
  isLocked,
  completedStamps,
  onCardClick,
}: ThreeDCouponCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFloating, setIsFloating] = useState(true);

  // Calculate rotation based on mouse position relative to card center
  const calculateRotation = useCallback((x: number, y: number, rect: DOMRect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const relativeX = (x - centerX) / rect.width;
    const relativeY = (y - centerY) / rect.height;
    
    // Cap rotation to ±15 degrees
    const rotateY = Math.max(-15, Math.min(15, relativeX * 15));
    const rotateX = Math.max(-15, Math.min(15, -relativeY * 15));
    
    return { rotateX, rotateY };
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isRedeemed || isLocked) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const { rotateX, rotateY } = calculateRotation(e.clientX, e.clientY, rect);
    
    setMousePosition({ x: rotateX, y: rotateY });
  }, [isRedeemed, isLocked, calculateRotation]);

  // Handle card click with sparkle effect
  const handleCardClick = useCallback(() => {
    if (isLocked || isRedeemed) return;
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      sparkleBurst({
        x: centerX,
        y: centerY,
        particleCount: 20,
      });
    }
    
    onCardClick();
  }, [isLocked, isRedeemed, onCardClick]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || isRedeemed || isLocked) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const { rotateX, rotateY } = calculateRotation(touch.clientX, touch.clientY, rect);
    
    setMousePosition({ x: rotateX, y: rotateY });
  }, [isRedeemed, isLocked, calculateRotation]);

  // Reset rotation when mouse/touch leaves
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  }, []);

  // Handle hover with subtle sparkle effect
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    
    if (!isLocked && !isRedeemed && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Subtle sparkle on hover
      setTimeout(() => {
        sparkleBurst({
          x: centerX,
          y: centerY,
          particleCount: 8,
        });
      }, 300);
    }
  }, [isLocked, isRedeemed]);

  // Floating animation
  const [floatingY, setFloatingY] = useState(0);
  
  useEffect(() => {
    if (isHovered || isRedeemed || isLocked) {
      setFloatingY(0);
      return;
    }
    
    let animationFrame: number;
    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % 2000) / 2000; // 2 second cycle
      const y = Math.sin(progress * Math.PI * 2) * 5; // ±5px movement
      setFloatingY(y);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isHovered, isRedeemed, isLocked]);

  return (
    <div
      ref={cardRef}
      className="perspective-1000 w-full h-full min-h-[280px] sm:min-h-[320px] md:min-h-[400px]"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{
          rotateX: mousePosition.x,
          rotateY: mousePosition.y,
          scale: isHovered && !isRedeemed && !isLocked ? 1.05 : 1,
          y: floatingY,
        }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 14,
        }}
        style={{
          transformStyle: "preserve-3d",
          transformPerspective: 1000,
          willChange: "transform",
        }}
        className="relative w-full h-full"
      >
        <AnimatePresence mode="wait">
          {!isRedeemed ? (
            <motion.div
              key="front"
              className={`relative bg-gradient-to-br ${coupon.color} rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-center shadow-xl overflow-hidden cursor-pointer min-h-[280px] sm:min-h-[320px] md:min-h-[400px] flex flex-col justify-between ${
                isLocked ? "opacity-60" : ""
              }`}
              initial={{ rotateX: 0 }}
              animate={{ rotateX: 0 }}
              exit={{ rotateX: 90 }}
              transition={{ duration: 0.3 }}
              onClick={handleCardClick}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
            >
              {/* Lock overlay for locked coupons */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/20 rounded-2xl sm:rounded-3xl flex items-center justify-center z-10">
                  <div className="bg-white/90 rounded-full p-2 sm:p-3 md:p-4">
                    <Lock className="text-[hsl(15_70%_40%)] w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>
              )}

              {/* Decorative elements */}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <Sparkles className="text-white/30 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
                <Sparkles className="text-white/20 w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3 md:mb-4">{coupon.emoji}</div>
              <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                {coupon.title}
              </h3>
              <p className="text-white/80 text-sm sm:text-base mb-3 sm:mb-4 md:mb-6">{coupon.description}</p>
              
              {isLocked ? (
                <ProgressBar
                  completed={completedStamps}
                  required={coupon.requiredStamps}
                  color={coupon.color}
                />
              ) : (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-xs sm:text-sm">
                  <Gift className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Tap to View</span>
                  <span className="sm:hidden">View</span>
                </div>
              )}
              
              {/* Perforated edge */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
            </motion.div>
          ) : (
            <motion.div
              key="back"
              className="relative bg-muted rounded-3xl p-8 text-center shadow-lg overflow-hidden min-h-[400px] flex flex-col justify-between"
              initial={{ rotateX: -90 }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-6xl mb-4 grayscale opacity-50">{coupon.emoji}</div>
              <h3 className="font-serif text-2xl font-bold text-muted-foreground mb-2">
                {coupon.title}
              </h3>
              <p className="text-muted-foreground/60 mb-6">{coupon.description}</p>
              
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full text-primary font-medium">
                <Gift size={18} />
                Redeemed!
              </div>
              
              {/* Perforated edge */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ThreeDCouponCard;
