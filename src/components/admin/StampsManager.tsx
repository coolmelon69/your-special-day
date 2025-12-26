import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, MapPin, EyeOff } from "lucide-react";
import type { CustomStamp } from "@/types/admin";
import {
  getAllCustomStamps,
  addCustomStamp,
  updateCustomStamp,
  deleteCustomStamp,
  getAdminSettings,
  updateAdminSettings,
} from "@/utils/adminStorage";
import { sprites, initialItinerary } from "@/components/TimelineSection";
import type { ItineraryItem } from "@/components/TimelineSection";
import { loadCustomStamps, loadAdminSettings, loadGlobalAdminSettings } from "@/utils/supabaseSync";
import { saveCustomStampsToIndexedDB } from "@/utils/adminStorage";
import { getCurrentUser } from "@/utils/auth";

const AVAILABLE_SPRITES = Object.keys(sprites);

const StampsManager = () => {
  const [stamps, setStamps] = useState<CustomStamp[]>([]);
  const [disabledDefaultStamps, setDisabledDefaultStamps] = useState<string[]>([]);
  const [editingStamp, setEditingStamp] = useState<CustomStamp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSpriteDropdownOpen, setIsSpriteDropdownOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    time: "",
    title: "",
    description: "",
    sprite: "coffee",
    latitude: "",
    longitude: "",
    radius: "100",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load from IndexedDB first (fast, local)
      const [loadedStamps, settings] = await Promise.all([
        getAllCustomStamps(),
        getAdminSettings(),
      ]);
      
      // Update UI immediately with local data
      setStamps(loadedStamps);
      setDisabledDefaultStamps(settings.disabledDefaultStamps || []);
      setIsLoading(false);
      
      // Background sync from Supabase (non-blocking)
      // This will update the UI if there's newer data, but won't block initial render
      const user = await getCurrentUser();
      if (user) {
        try {
          const supabaseStamps = await loadCustomStamps();
          if (supabaseStamps.length > 0) {
            // Only update if we got data from Supabase
            await saveCustomStampsToIndexedDB(supabaseStamps);
            setStamps(supabaseStamps);
          }
          
          // Also refresh global visibility settings in background
          // Global settings apply to all users, not per-user
          const globalSettings = await loadGlobalAdminSettings();
          if (globalSettings) {
            setDisabledDefaultStamps(globalSettings.disabledDefaultStamps || []);
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
            setDisabledDefaultStamps(globalSettings.disabledDefaultStamps || []);
          }
        } catch (syncError) {
          // Silently fail - we already have local data displayed
          console.warn("Background sync of global settings failed (using local data):", syncError);
        }
      }
    } catch (error) {
      console.error("Error loading stamps data:", error);
      setIsLoading(false);
    }
  };

  const handleToggleDefaultStamp = async (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const settings = await getAdminSettings();
      const currentDisabled = settings.disabledDefaultStamps || [];
      const isCurrentlyDisabled = currentDisabled.includes(title);
      const newDisabled = isCurrentlyDisabled
        ? currentDisabled.filter((t) => t !== title)
        : [...currentDisabled, title];
      
      console.log("Toggling stamp:", title, "Current disabled:", currentDisabled, "New disabled:", newDisabled);
      
      // Update local state immediately for responsive UI
      setDisabledDefaultStamps(newDisabled);
      
      // Save to IndexedDB and sync to Supabase global table
      await updateAdminSettings({ disabledDefaultStamps: newDisabled });
      
      // Reload global settings from Supabase to get the authoritative state
      // This ensures we have the latest from the database, not just local cache
      try {
        const globalSettings = await loadGlobalAdminSettings();
        if (globalSettings) {
          setDisabledDefaultStamps(globalSettings.disabledDefaultStamps || []);
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
      console.error("Error toggling default stamp:", error);
      alert("Failed to update stamp visibility. Please try again.");
      // Reload settings on error to restore correct state
      try {
        const globalSettings = await loadGlobalAdminSettings();
        if (globalSettings) {
          setDisabledDefaultStamps(globalSettings.disabledDefaultStamps || []);
        } else {
          const settings = await getAdminSettings();
          setDisabledDefaultStamps(settings.disabledDefaultStamps || []);
        }
      } catch (reloadError) {
        console.error("Error reloading settings after error:", reloadError);
      }
    }
  };


  const handleAddNew = () => {
    setEditingStamp(null);
    setIsSpriteDropdownOpen(false);
    setFormData({
      time: "",
      title: "",
      description: "",
      sprite: "coffee",
      latitude: "",
      longitude: "",
      radius: "100",
    });
    setShowForm(true);
  };

  const handleEdit = (stamp: CustomStamp) => {
    setEditingStamp(stamp);
    setIsSpriteDropdownOpen(false);
    setFormData({
      time: stamp.time,
      title: stamp.title,
      description: stamp.description,
      sprite: stamp.sprite,
      latitude: stamp.location?.latitude.toString() || "",
      longitude: stamp.location?.longitude.toString() || "",
      radius: stamp.location?.radius.toString() || "100",
    });
    setShowForm(true);
  };

  const handleDelete = async (stampId: string) => {
    if (!window.confirm("Are you sure you want to delete this stamp?")) {
      return;
    }

    try {
      await deleteCustomStamp(stampId);
      await loadData();
    } catch (error) {
      console.error("Error deleting stamp:", error);
      alert("Failed to delete stamp. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.time || !formData.title || !formData.description) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const stampData: Omit<CustomStamp, "id" | "createdAt" | "updatedAt"> = {
        time: formData.time,
        title: formData.title,
        description: formData.description,
        sprite: formData.sprite,
        isActive: editingStamp?.isActive || false,
        isPast: editingStamp?.isPast || false,
        location:
          formData.latitude && formData.longitude && formData.radius
            ? {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radius: parseInt(formData.radius),
              }
            : undefined,
      };

      if (editingStamp) {
        await updateCustomStamp({
          ...editingStamp,
          ...stampData,
        });
      } else {
        await addCustomStamp(stampData);
      }

      setShowForm(false);
      setEditingStamp(null);
      setIsSpriteDropdownOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error saving stamp:", error);
      alert("Failed to save stamp. Please try again.");
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
          Custom Stamps ({stamps.length})
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
        Custom stamps are shown together with default stamps. You can hide default stamps below.
      </p>

      {/* Default Stamps Section */}
      <div className="mb-6">
        <h3
          className="font-pixel text-base text-[hsl(15_70%_40%)] mb-3"
          style={{
            textRendering: "optimizeSpeed",
            WebkitFontSmoothing: "none",
            MozOsxFontSmoothing: "unset",
            fontSmooth: "never",
            letterSpacing: "0.05em",
          }}
        >
          Default Stamps ({initialItinerary.length})
        </h3>
        <div className="space-y-2">
          {initialItinerary.map((stamp) => {
            const SpriteComponent = sprites[stamp.sprite];
            const isDisabled = disabledDefaultStamps.includes(stamp.title);
            return (
              <motion.div
                key={stamp.title}
                className={`bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] p-3 rounded-lg flex items-center gap-3 ${
                  isDisabled ? "opacity-50" : ""
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-10 h-10 flex-shrink-0">
                  {SpriteComponent ? (
                    <SpriteComponent isActive={stamp.isActive} isPast={stamp.isPast} />
                  ) : (
                    <div className="w-full h-full bg-[hsl(30_40%_60%)] flex items-center justify-center">
                      <span className="font-pixel text-xs">?</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="font-pixel text-[10px] bg-[hsl(var(--primary))] px-2 py-0.5 text-[hsl(var(--primary-foreground))] rounded"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      {stamp.time}
                    </span>
                    <h4
                      className="font-pixel text-xs text-[hsl(15_70%_40%)] truncate"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      {stamp.title}
                    </h4>
                    <span
                      className="font-pixel text-[8px] bg-[hsl(200_60%_55%)] px-1.5 py-0.5 text-white rounded"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      DEFAULT
                    </span>
                  </div>
                  <p
                    className="font-pixel text-[9px] text-[hsl(15_60%_35%)] line-clamp-1"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    {stamp.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleToggleDefaultStamp(e, stamp.title)}
                  className={`w-8 h-8 flex items-center justify-center border-2 transition-colors rounded flex-shrink-0 ${
                    isDisabled
                      ? "bg-[hsl(0_60%_50%)] border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)]"
                      : "bg-[hsl(200_60%_55%)] border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)]"
                  }`}
                  title={isDisabled ? "Show stamp" : "Hide stamp"}
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Custom Stamps Section */}
      <div className="mb-6">
        <h3
          className="font-pixel text-base text-[hsl(15_70%_40%)] mb-3"
          style={{
            textRendering: "optimizeSpeed",
            WebkitFontSmoothing: "none",
            MozOsxFontSmoothing: "unset",
            fontSmooth: "never",
            letterSpacing: "0.05em",
          }}
        >
          Custom Stamps ({stamps.length})
        </h3>
        {stamps.length === 0 && !showForm ? (
          <div className="text-center py-4 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] rounded-lg">
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
              No custom stamps yet. Click "Add New" to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stamps.map((stamp) => {
            const SpriteComponent = sprites[stamp.sprite];
            return (
              <motion.div
                key={stamp.id}
                className="bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] p-3 rounded-lg flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-10 h-10 flex-shrink-0">
                  {SpriteComponent ? (
                    <SpriteComponent isActive={stamp.isActive} isPast={stamp.isPast} />
                  ) : (
                    <div className="w-full h-full bg-[hsl(30_40%_60%)] flex items-center justify-center">
                      <span className="font-pixel text-xs">?</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-pixel text-xs bg-[hsl(var(--primary))] px-2 py-0.5 text-[hsl(var(--primary-foreground))]"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      {stamp.time}
                    </span>
                    <h4
                      className="font-pixel text-xs text-[hsl(15_70%_40%)] truncate"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      {stamp.title}
                    </h4>
                    <span
                      className="font-pixel text-[8px] bg-[hsl(142_60%_55%)] px-1.5 py-0.5 text-white"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      CUSTOM
                    </span>
                  </div>
                  <p
                    className="font-pixel text-[9px] text-[hsl(15_60%_35%)] line-clamp-1"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    {stamp.description}
                  </p>
                  {stamp.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-[hsl(15_60%_35%)]" />
                      <span
                        className="font-pixel text-[8px] text-[hsl(15_60%_35%)]"
                        style={{ textRendering: "optimizeSpeed" }}
                      >
                        {stamp.location.latitude.toFixed(4)}, {stamp.location.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(stamp)}
                    className="w-8 h-8 flex items-center justify-center bg-[hsl(200_60%_55%)] border-2 border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)] transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(stamp.id)}
                    className="w-8 h-8 flex items-center justify-center bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] text-white hover:bg-[hsl(0_70%_60%)] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
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
                    {editingStamp ? "Edit Stamp" : "New Stamp"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingStamp(null);
                      setIsSpriteDropdownOpen(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Time */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Time *
                    </label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="9:00 AM"
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      required
                    />
                  </div>

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
                      placeholder="Breakfast Quest"
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
                      placeholder="Wake up to your favorite breakfast..."
                      rows={3}
                      className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)] resize-none"
                      required
                    />
                  </div>

                  {/* Sprite */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Sprite *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsSpriteDropdownOpen(!isSpriteDropdownOpen)}
                        className="w-full px-3 py-2 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)] flex items-center gap-2"
                        style={{ textRendering: "optimizeSpeed" }}
                      >
                        <div className="w-6 h-6 flex-shrink-0">
                          {sprites[formData.sprite] && (
                            <div className="w-full h-full">
                              {(() => {
                                const SpriteComponent = sprites[formData.sprite];
                                return <SpriteComponent isActive={false} isPast={false} />;
                              })()}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-left">
                          {formData.sprite.charAt(0).toUpperCase() + formData.sprite.slice(1)}
                        </span>
                        <span className="text-[hsl(15_60%_35%)]">▼</span>
                      </button>
                      <AnimatePresence>
                        {isSpriteDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsSpriteDropdownOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-1 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] rounded max-h-60 overflow-y-auto"
                              style={{ imageRendering: "pixelated" }}
                            >
                              {AVAILABLE_SPRITES.map((sprite) => {
                                const SpriteComponent = sprites[sprite];
                                return (
                                  <button
                                    key={sprite}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, sprite });
                                      setIsSpriteDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 font-pixel text-sm text-[hsl(15_60%_35%)] hover:bg-[hsl(35_40%_90%)] transition-colors flex items-center gap-2 ${
                                      formData.sprite === sprite ? "bg-[hsl(15_70%_55%)] text-white" : ""
                                    }`}
                                    style={{ textRendering: "optimizeSpeed" }}
                                  >
                                    <div className="w-6 h-6 flex-shrink-0">
                                      {SpriteComponent && (
                                        <div className="w-full h-full">
                                          <SpriteComponent isActive={false} isPast={false} />
                                        </div>
                                      )}
                                    </div>
                                    <span className="flex-1 text-left">
                                      {sprite.charAt(0).toUpperCase() + sprite.slice(1)}
                                    </span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Location (optional) */}
                  <div>
                    <label
                      className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-1"
                      style={{ textRendering: "optimizeSpeed" }}
                    >
                      Location (Optional)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          placeholder="Latitude"
                          className="w-full px-2 py-2 font-pixel text-xs bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          placeholder="Longitude"
                          className="w-full px-2 py-2 font-pixel text-xs bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.radius}
                          onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                          placeholder="Radius (m)"
                          className="w-full px-2 py-2 font-pixel text-xs bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    className="w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="w-4 h-4" />
                    {editingStamp ? "Update Stamp" : "Create Stamp"}
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

export default StampsManager;





