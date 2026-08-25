import { useEffect, useState } from "react";
import { AlertCircle, Coins, IdCard, Lock, RotateCcw, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useAdventure } from "@/contexts/AdventureContext";
import { syncCouponAchievements, syncStampsProgress } from "@/utils/supabaseSync";
import { getAllCustomStamps, getAdminSettings, updateAdminSettings } from "@/utils/adminStorage";
import { initialItinerary, type ItineraryItem } from "@/components/TimelineSection";
import * as photoStorage from "@/utils/photoStorage";
import { grantCoins as grantCoinsToTarget, loadCouple } from "@/utils/couples";
import PartnerLink from "@/components/admin/PartnerLink";
import TeamControl from "@/components/admin/TeamControl";

const ACHIEVEMENT_STORAGE_KEY = "coupon-achievements";
const STORAGE_KEY = "birthday-adventure-progress";

const AdminSettings = () => {
  const {
    setItineraryState,
    refreshPhotos,
    user,
    trainerCardEnabled,
    setTrainerCardEnabled,
    siteLockEnabled,
    setSiteLockEnabled,
    profile,
  } = useAdventure();
  const [savingTrainerCard, setSavingTrainerCard] = useState(false);
  const [savingSiteLock, setSavingSiteLock] = useState(false);
  const [coinAmount, setCoinAmount] = useState("50");
  const [grantingCoins, setGrantingCoins] = useState(false);
  const [grantTarget, setGrantTarget] = useState<"me" | "partner">("me");
  const [hasPartner, setHasPartner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCouple().then((couple) => {
      if (!cancelled) setHasPartner(Boolean(couple?.partnerId));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasPartner) setGrantTarget("me");
  }, [hasPartner]);

  const handleToggleTrainerCard = async () => {
    const next = !trainerCardEnabled;
    setSavingTrainerCard(true);
    setTrainerCardEnabled(next); // optimistic — revert on failure
    try {
      await updateAdminSettings({ trainerCardEnabled: next });
    } catch (error) {
      console.error("Error saving trainer card setting:", error);
      setTrainerCardEnabled(!next);
      alert("Could not save that setting. Please try again.");
    } finally {
      setSavingTrainerCard(false);
    }
  };

  const handleToggleSiteLock = async () => {
    const next = !siteLockEnabled;
    setSavingSiteLock(true);
    setSiteLockEnabled(next); // optimistic — revert on failure
    try {
      await updateAdminSettings({ siteLockEnabled: next });
    } catch (error) {
      console.error("Error saving site lock setting:", error);
      setSiteLockEnabled(!next);
      alert("Could not save that setting. Please try again.");
    } finally {
      setSavingSiteLock(false);
    }
  };

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

  const handleGrantCoins = async () => {
    const amount = parseInt(coinAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a coin amount greater than 0.");
      return;
    }
    if (amount > 500) {
      alert("A single grant is capped at 500 coins.");
      return;
    }
    if (!profile) {
      alert("No trainer profile is signed in to grant coins to.");
      return;
    }
    if (
      !window.confirm(
        `Grant ${amount} coins? This cannot be undone from the UI.`
      )
    ) {
      return;
    }

    setGrantingCoins(true);
    try {
      const granted = await grantCoinsToTarget(amount, grantTarget);
      if (!granted.ok) {
        alert(granted.message);
      }
    } catch (error) {
      console.error("Error granting coins:", error);
      alert("Could not grant coins. Please try again.");
    } finally {
      setGrantingCoins(false);
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

      {/* Feature toggles */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <IdCard className={`w-4 h-4 mt-0.5 flex-shrink-0 ${trainerCardEnabled ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <p className="text-sm font-medium text-foreground">Trainer card setup</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              When on, logged-in users are asked to set up a trainer card on first login and get the
              Profile page. When off, the setup is skipped and the page is hidden for everyone.
            </p>
          </div>
        </div>
        <Switch
          checked={trainerCardEnabled}
          onCheckedChange={handleToggleTrainerCard}
          disabled={savingTrainerCard}
          aria-label="Enable trainer card setup for logged-in users"
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <Lock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${siteLockEnabled ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <p className="text-sm font-medium text-foreground">Site password lock</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              When on, visitors hit the password lockscreen before seeing the site. When off, the
              site is public for everyone — the /cafes pages stay public either way.
            </p>
          </div>
        </div>
        <Switch
          checked={siteLockEnabled}
          onCheckedChange={handleToggleSiteLock}
          disabled={savingSiteLock}
          aria-label="Require the site-wide password lockscreen"
        />
      </div>

      {/* Partner link */}
      <PartnerLink />

      {/* Teams — the only place a team changes after onboarding */}
      <TeamControl />

      {/* Coin grant escape hatch */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Coins className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose" />
          <div>
            <p className="text-sm font-medium text-foreground">Grant coins</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              The shop budget is deliberately tight. Use this if a rare-item roll or a tight day
              locked her out of something that matters — one grant, up to 500 coins at a time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-[10px] border border-border overflow-hidden" role="group" aria-label="Grant coins to">
            <button
              type="button"
              onClick={() => setGrantTarget("me")}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                grantTarget === "me" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <User className="w-4 h-4" />
              Me
            </button>
            <button
              type="button"
              onClick={() => hasPartner && setGrantTarget("partner")}
              disabled={!hasPartner}
              title={hasPartner ? undefined : "No linked partner yet — link one in Partner link above."}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-l border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                grantTarget === "partner" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <Users className="w-4 h-4" />
              Partner
            </button>
          </div>
        </div>
        {!hasPartner && (
          <p className="text-xs text-muted-foreground">
            Partner isn't linked yet, so coins can only be granted to yourself.
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={500}
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value)}
            className="w-28 rounded-[10px] border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Coin amount to grant"
          />
          <motion.button
            onClick={handleGrantCoins}
            disabled={grantingCoins || !profile}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] border border-primary bg-primary text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            <Coins className="w-4 h-4" />
            <span>{grantingCoins ? "Granting…" : "Grant coins"}</span>
          </motion.button>
        </div>
        {!profile && (
          <p className="text-xs text-muted-foreground">No trainer profile is signed in right now.</p>
        )}
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




