import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import GiftCouponsSection from "@/components/GiftCouponsSection";
import Footer from "@/components/Footer";
import { useAdventure } from "@/contexts/AdventureContext";

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";

const CouponsPage = () => {
  const { itineraryState, resetProgress } = useAdventure();

  const handleResetAllProgress = () => {
    if (window.confirm("Are you sure you want to reset all progress? This will reset both your adventure stamps and coupon redemptions. This cannot be undone.")) {
      // Reset adventure progress
      resetProgress();
      
      // Reset coupon achievements
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
          // Reload the page to refresh coupon state
          window.location.reload();
        }
      } catch (error) {
        console.error("Error resetting coupon achievements:", error);
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Gift Coupons - Your Special Day</title>
        <meta name="description" content="Redeem your special gift coupons" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        {/* Page Header */}
        <section className="py-12 md:py-20 bg-gradient-romantic">
          <div className="container px-6">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-gradient-romantic">Gift Coupons</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                Unlock and redeem special coupons as you complete your adventures. Each coupon is a promise for a wonderful experience together!
              </p>
            </motion.div>
          </div>
        </section>

        <GiftCouponsSection itineraryState={itineraryState} />

        {/* Reset Progress Button */}
        <section className="py-12 md:py-20 bg-background">
          <div className="container px-6">
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={handleResetAllProgress}
                className="flex items-center gap-2 px-6 py-3 font-pixel text-xs md:text-sm rounded-lg border-2 transition-all bg-[hsl(0_60%_50%)] border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)] hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ 
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Progress</span>
              </motion.button>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default CouponsPage;
