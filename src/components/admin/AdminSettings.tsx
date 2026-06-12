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
      <h2 className="font-serif text-2xl font-bold text-foreground">Settings</h2>

      {/* Info */}
      <div className="bg-primary/8 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          <strong className="font-semibold">Note:</strong> Custom stamps and coupons are automatically
          shown together with default items. They appear after the default items in the list.
        </p>
      </div>

      {/* Reset Progress Button */}
      <div className="flex justify-center pt-2">
        <motion.button
          onClick={handleResetAllProgress}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-[10px] border border-destructive bg-destructive text-destructive-foreground transition-all hover:brightness-95"
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset all progress</span>
        </motion.button>
      </div>
    </div>
  );
};

export default AdminSettings;




