import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import type { CustomCoupon } from "@/types/admin";
import {
  getAllCustomCoupons,
  addCustomCoupon,
  updateCustomCoupon,
  deleteCustomCoupon,
  getAdminSettings,
  updateAdminSettings,
  saveCustomCouponsToIndexedDB,
} from "@/utils/adminStorage";
import { loadCustomCouponsResult, loadGlobalAdminSettings } from "@/utils/supabaseSync";
import { getCurrentUser } from "@/utils/auth";

const DEFAULT_COUPONS = [
  {
    id: 1,
    title: "Free Zoo Negara Entry",
    description: "A fun day exploring the zoo together!",
    emoji: "🦁",
    color: "from-pink-400 to-rose-500",
    requiredStamps: 1,
    category: "adventure",
  },
  {
    id: 2,
    title: "Dinner Choice",
    description: "Pick any restaurant, my treat!",
    emoji: "🍽️",
    color: "from-amber-400 to-orange-500",
    requiredStamps: 2,
    category: "romantic",
  },
  {
    id: 3,
    title: "Movie Pick",
    description: "You choose the movie, no complaints!",
    emoji: "🎬",
    color: "from-purple-400 to-indigo-500",
    requiredStamps: 3,
    category: "romantic",
  },
];

const COLOR_PRESETS = [
  { label: "Pink to Rose", value: "from-pink-400 to-rose-500" },
  { label: "Amber to Orange", value: "from-amber-400 to-orange-500" },
  { label: "Purple to Indigo", value: "from-purple-400 to-indigo-500" },
  { label: "Blue to Cyan", value: "from-blue-400 to-cyan-500" },
  { label: "Green to Emerald", value: "from-green-400 to-emerald-500" },
  { label: "Red to Pink", value: "from-red-400 to-pink-500" },
  { label: "Yellow to Amber", value: "from-yellow-400 to-amber-500" },
  { label: "Indigo to Purple", value: "from-indigo-400 to-purple-500" },
];

const CATEGORIES = ["adventure", "romantic", "fun", "special"];

const CouponsManager = () => {
  const [coupons, setCoupons] = useState<CustomCoupon[]>([]);
  const [disabledDefaultCoupons, setDisabledDefaultCoupons] = useState<number[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<CustomCoupon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    emoji: "🎁",
    color: "from-pink-400 to-rose-500",
    requiredStamps: "1",
    category: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load from IndexedDB first (fast, local)
      const [loadedCoupons, settings] = await Promise.all([
        getAllCustomCoupons(),
        getAdminSettings(),
      ]);
      
      // Update UI immediately with local data
      setCoupons(loadedCoupons);
      setDisabledDefaultCoupons(settings.disabledDefaultCoupons || []);
      setIsLoading(false);
      
      // Background sync from Supabase (non-blocking)
      // This will update the UI if there's newer data, but won't block initial render
      const user = await getCurrentUser();
      if (user) {
        try {
          const couponsResult = await loadCustomCouponsResult();
          if (couponsResult.ok) {
            // Supabase is authoritative (even if empty) -> clear stale cache
            await saveCustomCouponsToIndexedDB(couponsResult.data);
            setCoupons(couponsResult.data);
          }
          
          // Also refresh global visibility settings in background
          // Global settings apply to all users, not per-user
          const globalSettings = await loadGlobalAdminSettings();
          if (globalSettings) {
            setDisabledDefaultCoupons(globalSettings.disabledDefaultCoupons || []);
          }
        } catch (syncError) {
          // Silently fail - we already have local data displayed
          console.warn("Background sync failed (using local data):", syncError);
        }
      } else {
        // Even if user is not logged in, try to load global settings
        // (they're public and don't require auth)
        try {
          const globalSettings = await loadGlobalAdminSettings();
          if (globalSettings) {
            setDisabledDefaultCoupons(globalSettings.disabledDefaultCoupons || []);
          }
        } catch (syncError) {
          // Silently fail - we already have local data displayed
          console.warn("Background sync of global settings failed (using local data):", syncError);
        }
      }
    } catch (error) {
      console.error("Error loading coupons data:", error);
      setIsLoading(false);
    }
  };

  const handleToggleDefaultCoupon = async (e: React.MouseEvent, couponId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const settings = await getAdminSettings();
      const currentDisabled = settings.disabledDefaultCoupons || [];
      const isCurrentlyDisabled = currentDisabled.includes(couponId);
      const newDisabled = isCurrentlyDisabled
        ? currentDisabled.filter((id) => id !== couponId)
        : [...currentDisabled, couponId];
      
      console.log("Toggling coupon:", couponId, "Current disabled:", currentDisabled, "New disabled:", newDisabled);
      
      // Update local state immediately for responsive UI
      setDisabledDefaultCoupons(newDisabled);
      
      // Save to IndexedDB and sync to Supabase global table
      await updateAdminSettings({ disabledDefaultCoupons: newDisabled });
      
      // Reload global settings from Supabase to get the authoritative state
      // This ensures we have the latest from the database, not just local cache
      try {
        const globalSettings = await loadGlobalAdminSettings();
        if (globalSettings) {
          setDisabledDefaultCoupons(globalSettings.disabledDefaultCoupons || []);
          console.log("Updated settings from global:", globalSettings);
        } else {
          // If global settings don't exist yet, use what we just set
          console.log("Global settings not found, using local update");
        }
      } catch (verifyError) {
        console.warn("Could not reload global settings after update:", verifyError);
        // Keep the local state we set
      }
    } catch (error) {
      console.error("Error toggling default coupon:", error);
      alert("Failed to update coupon visibility. Please try again.");
      // Reload settings on error to restore correct state
      try {
        const globalSettings = await loadGlobalAdminSettings();
        if (globalSettings) {
          setDisabledDefaultCoupons(globalSettings.disabledDefaultCoupons || []);
        } else {
          const settings = await getAdminSettings();
          setDisabledDefaultCoupons(settings.disabledDefaultCoupons || []);
        }
      } catch (reloadError) {
        console.error("Error reloading settings after error:", reloadError);
      }
    }
  };

  const handleAddNew = () => {
    setEditingCoupon(null);
    setFormData({
      title: "",
      description: "",
      emoji: "🎁",
      color: "from-pink-400 to-rose-500",
      requiredStamps: "1",
      category: "",
    });
    setShowForm(true);
  };

  const handleEdit = (coupon: CustomCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description,
      emoji: coupon.emoji,
      color: coupon.color,
      requiredStamps: coupon.requiredStamps.toString(),
      category: coupon.category || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      await deleteCustomCoupon(couponId);
      await loadData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("Failed to delete coupon. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.emoji) {
      alert("Please fill in all required fields.");
      return;
    }

    const requiredStamps = parseInt(formData.requiredStamps);
    if (isNaN(requiredStamps) || requiredStamps < 1) {
      alert("Required stamps must be a number greater than 0.");
      return;
    }

    try {
      const couponData: Omit<CustomCoupon, "id" | "createdAt" | "updatedAt"> = {
        title: formData.title,
        description: formData.description,
        emoji: formData.emoji,
        color: formData.color,
        requiredStamps,
        category: formData.category || undefined,
      };

      if (editingCoupon) {
        await updateCustomCoupon({
          ...editingCoupon,
          ...couponData,
        });
      } else {
        await addCustomCoupon(couponData);
      }

      setShowForm(false);
      setEditingCoupon(null);
      // Reset form data after successful submission
      setFormData({
        title: "",
        description: "",
        emoji: "🎁",
        color: "from-pink-400 to-rose-500",
        requiredStamps: "1",
        category: "",
      });
      await loadData();
    } catch (error) {
      console.error("Error saving coupon:", error);
      alert("Failed to save coupon. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p
          className="font-pixel text-sm text-[hsl(15_60%_35%)]"
          style={{ textRendering: "optimizeSpeed" }}
        >
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
          Coupons ({DEFAULT_COUPONS.filter(c => !disabledDefaultCoupons.includes(c.id)).length + coupons.length})
        </h2>
        <motion.button
          onClick={handleAddNew}
          className="px-4 py-2 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Add New
        </motion.button>
      </div>
      <p
        className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-4 opacity-75"
        style={{ textRendering: "optimizeSpeed" }}
      >
        Manage all coupons. Default coupons can be hidden, custom coupons can be edited or deleted.
      </p>

      {/* All Coupons Section - Merged */}
      <div className="mb-6">
        {DEFAULT_COUPONS.filter(c => !disabledDefaultCoupons.includes(c.id)).length === 0 && coupons.length === 0 && !showForm ? (
          <div className="text-center py-4 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] rounded-lg">
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
              No coupons available. Click "Add New" to create a custom coupon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Default Coupons */}
            {DEFAULT_COUPONS.filter(c => !disabledDefaultCoupons.includes(c.id)).map((coupon) => {
              const isDisabled = disabledDefaultCoupons.includes(coupon.id);
              return (
                <motion.div
                  key={coupon.id}
                  className={`bg-gradient-to-br ${coupon.color} rounded-lg p-4 text-white relative ${
                    isDisabled ? "opacity-50" : ""
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{coupon.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="font-pixel text-sm md:text-base font-bold mb-1.5 truncate"
                          style={{ textRendering: "optimizeSpeed" }}
                        >
                          {coupon.title}
                        </h4>
                        {coupon.category && (
                          <span
                            className="font-pixel text-[8px] uppercase tracking-wider bg-white/25 backdrop-blur-sm px-2 py-1 rounded inline-block"
                            style={{ textRendering: "optimizeSpeed" }}
                          >
                            {coupon.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="font-pixel text-[7px] bg-white/30 backdrop-blur-sm px-1.5 py-0.5 rounded"
                        style={{ textRendering: "optimizeSpeed" }}
                      >
                        DEFAULT
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleDefaultCoupon(e, coupon.id)}
                        className="w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded"
                        title="Hide coupon"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p
                    className="font-pixel text-[10px] md:text-[11px] mb-3 opacity-95 line-clamp-2 leading-relaxed"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    {coupon.description}
                  </p>
                  <div
                    className="font-pixel text-[9px] md:text-[10px] font-semibold bg-white/20 backdrop-blur-sm px-2 py-1 rounded inline-block"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    Requires {coupon.requiredStamps} stamp{coupon.requiredStamps !== 1 ? "s" : ""}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Custom Coupons */}
            {coupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                className={`bg-gradient-to-br ${coupon.color} rounded-lg p-4 text-white relative`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{coupon.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h4
                        className="font-pixel text-sm md:text-base font-bold mb-1.5 truncate"
                        style={{ textRendering: "optimizeSpeed" }}
                      >
                        {coupon.title}
                      </h4>
                      {coupon.category && (
                        <span
                          className="font-pixel text-[8px] uppercase tracking-wider bg-white/25 backdrop-blur-sm px-2 py-1 rounded inline-block"
                          style={{ textRendering: "optimizeSpeed" }}
                        >
                          {coupon.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="font-pixel text-[7px] bg-white/30 backdrop-blur-sm px-1.5 py-0.5 rounded"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      CUSTOM
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <p
                  className="font-pixel text-[10px] md:text-[11px] mb-3 opacity-95 line-clamp-2 leading-relaxed"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  {coupon.description}
                </p>
                <div
                  className="font-pixel text-[9px] md:text-[10px] font-semibold bg-white/20 backdrop-blur-sm px-2 py-1 rounded inline-block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Requires {coupon.requiredStamps} stamp{coupon.requiredStamps !== 1 ? "s" : ""}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[hsl(0_0%_0%)] bg-opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="border-2 border-[hsl(30_50%_60%)] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="font-pixel text-base md:text-lg text-[hsl(15_70%_40%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {editingCoupon ? "Edit Coupon" : "New Coupon"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingCoupon(null);
                      // Reset form data when closing
                      setFormData({
                        title: "",
                        description: "",
                        emoji: "🎁",
                        color: "from-pink-400 to-rose-500",
                        requiredStamps: "1",
                        category: "",
                      });
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Free Zoo Entry"
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A fun day exploring together!"
                      rows={3}
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)] resize-none"
                      required
                    />
                  </div>

                  {/* Emoji */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Emoji *
                    </label>
                    <input
                      type="text"
                      value={formData.emoji || ""}
                      onChange={(e) => {
                        // Always update with the actual input value, allowing empty strings to clear
                        setFormData({ ...formData, emoji: e.target.value });
                      }}
                      placeholder="🎁"
                      maxLength={2}
                      className="w-full px-3 py-2 font-pixel text-2xl bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-center focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      required
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Color Gradient *
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      required
                    >
                      {COLOR_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    {/* Color preview */}
                    <div className={`mt-2 h-8 rounded border-2 border-[hsl(30_40%_60%)] bg-gradient-to-r ${formData.color}`} />
                  </div>

                  {/* Required Stamps */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Required Stamps *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.requiredStamps}
                      onChange={(e) => setFormData({ ...formData, requiredStamps: e.target.value })}
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Category (Optional)
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    >
                      <option value="">None</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    className="w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="w-4 h-4" />
                    {editingCoupon ? "Update Coupon" : "Create Coupon"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponsManager;





