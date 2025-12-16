import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Check } from "lucide-react";

interface Coupon {
  id: number;
  title: string;
  description: string;
  emoji: string;
  color: string;
}

const coupons: Coupon[] = [
  {
    id: 1,
    title: "Free Massage",
    description: "One hour of relaxation whenever you want",
    emoji: "💆",
    color: "from-pink-400 to-rose-500",
  },
  {
    id: 2,
    title: "Dinner Choice",
    description: "Pick any restaurant, my treat!",
    emoji: "🍽️",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: 3,
    title: "Movie Pick",
    description: "You choose the movie, no complaints!",
    emoji: "🎬",
    color: "from-purple-400 to-indigo-500",
  },
];

const GiftCouponsSection = () => {
  const [redeemedCoupons, setRedeemedCoupons] = useState<number[]>([]);

  const handleRedeem = (id: number) => {
    if (!redeemedCoupons.includes(id)) {
      setRedeemedCoupons([...redeemedCoupons, id]);
    }
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-romantic">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Gift className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-gradient-romantic">Gift Coupons</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Redeem these special coupons anytime you want!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {coupons.map((coupon, index) => {
            const isRedeemed = redeemedCoupons.includes(coupon.id);
            
            return (
              <motion.div
                key={coupon.id}
                className="perspective-1000"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <motion.div
                  className={`relative cursor-pointer ${isRedeemed ? "pointer-events-none" : ""}`}
                  onClick={() => handleRedeem(coupon.id)}
                  whileHover={!isRedeemed ? { scale: 1.05, rotateY: 5 } : {}}
                  whileTap={!isRedeemed ? { scale: 0.98 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {!isRedeemed ? (
                      <motion.div
                        key="front"
                        className={`relative bg-gradient-to-br ${coupon.color} rounded-3xl p-8 text-center shadow-xl overflow-hidden`}
                        initial={{ rotateY: 0 }}
                        exit={{ rotateY: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Decorative elements */}
                        <div className="absolute top-4 right-4">
                          <Sparkles className="text-white/30" size={24} />
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <Sparkles className="text-white/20" size={20} />
                        </div>
                        
                        <div className="text-6xl mb-4">{coupon.emoji}</div>
                        <h3 className="font-serif text-2xl font-bold text-white mb-2">
                          {coupon.title}
                        </h3>
                        <p className="text-white/80 mb-6">{coupon.description}</p>
                        
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                          <Gift size={18} />
                          Tap to Redeem
                        </div>
                        
                        {/* Perforated edge */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="back"
                        className="relative bg-muted rounded-3xl p-8 text-center shadow-lg overflow-hidden"
                        initial={{ rotateY: -90 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-6xl mb-4 grayscale opacity-50">{coupon.emoji}</div>
                        <h3 className="font-serif text-2xl font-bold text-muted-foreground mb-2">
                          {coupon.title}
                        </h3>
                        <p className="text-muted-foreground/60 mb-6">{coupon.description}</p>
                        
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full text-primary font-medium">
                          <Check size={18} />
                          Redeemed!
                        </div>
                        
                        {/* Perforated edge */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          className="text-center text-muted-foreground mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          * Coupons have no expiration date and can be used anytime! 💕
        </motion.p>
      </div>
    </section>
  );
};

export default GiftCouponsSection;