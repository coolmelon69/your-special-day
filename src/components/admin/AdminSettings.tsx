import { AlertCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useAdventure } from "@/contexts/AdventureContext";
import { syncCouponAchievements, syncStampsProgress } from "@/utils/supabaseSync";
import { getAllCustomStamps, getAdminSettings } from "@/utils/adminStorage";
import { initialItinerary, type ItineraryItem } from "@/components/TimelineSection";
import * as photoStorage from "@/utils/photoStorage";

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";
const STORAGE_KEY = "birthday-adventure-progress";

const AdminSettings = () => {
  const { setItineraryState, refreshPhotos, user } = useAdventure();

  const handleResetAllProgress = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all progress? This will reset both your adventure stamps and coupon redemptions. This cannot be undone."
      )
    ) {
      try {
        // Clear localStorage for stamps
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(STORAGE_KEY);
        }

        // Load settings to get disabled default stamps
        let disabledTitles: string[] = [];
        try {
          const settings = await getAdminSettings();
          disabledTitles = settings.disabledDefaultStamps || [];
        } catch (settingsError) {
          console.warn("Could not load admin settings for reset, using defaults:", settingsError);
        }

        // Reset stamps progress
        try {
          const customStamps = await getAllCustomStamps();
          
          // Filter out disabled default stamps
          const resetDefaults = initialItinerary
            .filter((stamp) => !disabledTitles.includes(stamp.title))
            .map((item, index) => ({
              ...item,
              isActive: index === 0,
              isPast: false,
            }));

          let resetItinerary: ItineraryItem[];
          if (customStamps.length > 0) {
            const convertedCustomStamps: ItineraryItem[] = customStamps.map((stamp) => ({
              time: stamp.time,
              title: stamp.title,
              description: stamp.description,
              sprite: stamp.sprite,
              isActive: false,
              isPast: false,
              location: stamp.location,
            }));
            resetItinerary = [...resetDefaults, ...convertedCustomStamps];
          } else {
            resetItinerary = resetDefaults;
          }

          setItineraryState(resetItinerary);

          // Sync reset state to Supabase
          if (user) {
            try {
              await syncStampsProgress(resetItinerary);
            } catch (error) {
              console.error("Error syncing reset to Supabase:", error);
              // Non-blocking
            }
          }
        } catch (error) {
          console.error("Error resetting stamps:", error);
          // If error loading custom stamps, just reset defaults (filtered by disabled stamps)
          const resetDefaults = initialItinerary
            .filter((stamp) => !disabledTitles.includes(stamp.title))
            .map((item, index) => ({
              ...item,
              isActive: index === 0,
              isPast: false,
            }));
          setItineraryState(resetDefaults);

          // Sync reset state to Supabase
          if (user) {
            syncStampsProgress(resetDefaults).catch((error) => {
              console.error("Error syncing reset to Supabase:", error);
            });
          }
        }

        // Clear photos
        try {
          await photoStorage.clearAllPhotos();
          await refreshPhotos();
        } catch (error) {
          console.error("Error clearing photos:", error);
          // Non-blocking
        }

        // Reset coupon achievements
        // Clear localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(ACHIEVEMENT_STORAGE_KEY);
        }

        // Reset in Supabase
        await syncCouponAchievements({
          redeemedCouponIds: [],
          achievementsUnlocked: [],
          achievementTimestamps: {},
        });

        // Reload the page to refresh all state
        window.location.reload();
      } catch (error) {
        console.error("Error resetting progress:", error);
        alert("Error resetting progress. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2
        className="font-pixel text-lg md:text-xl text-[hsl(15_70%_40%)]"
        style={{
          textRendering: "optimizeSpeed",
          WebkitFontSmoothing: "none",
          MozOsxFontSmoothing: "unset",
          fontSmooth: "never",
          letterSpacing: "0.05em",
        }}
      >
        Settings
      </h2>

      {/* Info */}
      <div className="bg-[hsl(200_60%_55%)] border-2 border-[hsl(200_50%_45%)] p-4 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
        <div>
          <p
            className="font-pixel text-xs text-white mb-1"
            style={{ textRendering: "optimizeSpeed" }}
          >
            <strong>Note:</strong> Custom stamps and coupons are automatically shown together with
            default items. They appear after the default items in the list.
          </p>
        </div>
      </div>

      {/* Reset Progress Button */}
      <div className="flex justify-center">
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
      </div>
    </div>
  );
};

export default AdminSettings;




