import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, GripVertical, RotateCcw, Coins } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { resetCoupon, resetAllCoupons, convertCouponId } from "@/utils/redeemCoupon";
import { Pill } from "@/components/editorial";

// Shared editorial field styles
const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";
const iconBtnCls =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex-shrink-0";
const iconBtnDanger =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0";

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

type DefaultCoupon = (typeof DEFAULT_COUPONS)[number];

type CouponListItem =
  | { type: "default"; coupon: DefaultCoupon; id: string }
  | { type: "custom"; coupon: CustomCoupon; id: string };

function buildOrderedCouponList(
  visibleDefaults: DefaultCoupon[],
  coupons: CustomCoupon[],
  couponOrder: string[]
): CouponListItem[] {
  const defaultById = new Map(visibleDefaults.map((c) => [String(c.id), c]));
  const customById = new Map(coupons.map((c) => [c.id, c]));
  const result: CouponListItem[] = [];
  const seen = new Set<string>();
  if (couponOrder.length > 0) {
    for (const key of couponOrder) {
      if (key.startsWith("default:")) {
        const idStr = key.slice(8);
        const coupon = defaultById.get(idStr);
        if (coupon) {
          result.push({ type: "default", coupon, id: key });
          seen.add(key);
        }
      } else if (key.startsWith("custom:")) {
        const id = key.slice(7);
        const coupon = customById.get(id);
        if (coupon) {
          result.push({ type: "custom", coupon, id: key });
          seen.add(key);
        }
      }
    }
  }
  for (const c of visibleDefaults) {
    const key = `default:${c.id}`;
    if (!seen.has(key)) {
      result.push({ type: "default", coupon: c, id: key });
      seen.add(key);
    }
  }
  for (const c of coupons) {
    const key = `custom:${c.id}`;
    if (!seen.has(key)) {
      result.push({ type: "custom", coupon: c, id: key });
      seen.add(key);
    }
  }
  return result;
}

function SortableCouponRow({
  item,
  onToggleDefault,
  onEdit,
  onDelete,
  onReset,
}: {
  item: CouponListItem;
  onToggleDefault: (e: React.MouseEvent, id: number) => void;
  onEdit: (coupon: CustomCoupon) => void;
  onDelete: (id: string) => void;
  onReset: (coupon: DefaultCoupon | CustomCoupon) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isDefault = item.type === "default";
  const coupon = item.coupon;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-xl p-3 relative flex items-start gap-3 ${isDragging ? "opacity-90 z-50 shadow-romantic" : ""}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 p-1 mt-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`w-11 h-11 flex-shrink-0 rounded-lg grid place-items-center text-2xl bg-gradient-to-br ${coupon.color}`}>
        {coupon.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{coupon.title}</h4>
            {coupon.category && <Pill variant="rose" className="capitalize">{coupon.category}</Pill>}
            <Pill variant={isDefault ? "accent" : "done"}>{isDefault ? "Default" : "Custom"}</Pill>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onReset(coupon)}
              className={iconBtnCls}
              title="Reset coupon (mark as unused)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {isDefault && (
              <button
                type="button"
                onClick={(e) => onToggleDefault(e, (coupon as DefaultCoupon).id)}
                className={iconBtnDanger}
                title="Hide coupon"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!isDefault && (
              <>
                <button onClick={() => onEdit(coupon as CustomCoupon)} className={iconBtnCls} title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete((coupon as CustomCoupon).id)} className={iconBtnDanger} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
          {coupon.description}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[11px] text-muted-foreground">
            Requires {coupon.requiredStamps} stamp{coupon.requiredStamps !== 1 ? "s" : ""}
          </span>
          {!isDefault && (coupon as CustomCoupon).priceCoins ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary">
              <Coins className="w-4 h-4" />
              {(coupon as CustomCoupon).priceCoins} coins
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

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
  const [couponOrder, setCouponOrder] = useState<string[]>([]);
  const [activeCouponId, setActiveCouponId] = useState<string | null>(null);
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
    priceCoins: "",
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
      setCouponOrder(settings.couponOrder ?? []);
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
      priceCoins: "",
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
      priceCoins: coupon.priceCoins ? coupon.priceCoins.toString() : "",
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

  const handleReset = async (coupon: DefaultCoupon | CustomCoupon) => {
    if (!window.confirm(`Reset "${coupon.title}" so it's marked as never used?`)) {
      return;
    }
    try {
      const result = await resetCoupon(convertCouponId(coupon.id));
      if (result.status === "error") {
        alert("Failed to reset coupon. Please try again.");
      } else if (result.status === "already") {
        alert("This coupon hasn't been used yet.");
      }
    } catch (error) {
      console.error("Error resetting coupon:", error);
      alert("Failed to reset coupon. Please try again.");
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm("Reset all coupons so none of them are marked as used?")) {
      return;
    }
    try {
      const result = await resetAllCoupons();
      if (result.status === "error") {
        alert("Failed to reset coupons. Please try again.");
      } else if (result.status === "already") {
        alert("No coupons have been used yet.");
      }
    } catch (error) {
      console.error("Error resetting all coupons:", error);
      alert("Failed to reset coupons. Please try again.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCouponId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCouponId(null);
    if (!over || active.id === over.id) return;
    const visible = DEFAULT_COUPONS.filter((c) => !disabledDefaultCoupons.includes(c.id));
    const ordered = buildOrderedCouponList(visible, coupons, couponOrder);
    const oldIndex = ordered.findIndex((i) => i.id === active.id);
    const newIndex = ordered.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ordered, oldIndex, newIndex);
    const newCouponOrder = reordered.map((i) => i.id);
    setCouponOrder(newCouponOrder);
    await updateAdminSettings({ couponOrder: newCouponOrder });
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

    let priceCoins: number | undefined;
    if (formData.priceCoins.trim() !== "") {
      const parsedPrice = parseInt(formData.priceCoins);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        alert("Coin price must be a number 0 or greater (leave blank for free).");
        return;
      }
      priceCoins = parsedPrice > 0 ? parsedPrice : undefined;
    }

    try {
      const couponData: Omit<CustomCoupon, "id" | "createdAt" | "updatedAt"> = {
        title: formData.title,
        description: formData.description,
        emoji: formData.emoji,
        color: formData.color,
        requiredStamps,
        category: formData.category || undefined,
        priceCoins,
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
        priceCoins: "",
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
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const visibleDefaults = DEFAULT_COUPONS.filter((c) => !disabledDefaultCoupons.includes(c.id));
  const orderedItems = buildOrderedCouponList(visibleDefaults, coupons, couponOrder);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Coupons <span className="text-muted-foreground">({DEFAULT_COUPONS.filter(c => !disabledDefaultCoupons.includes(c.id)).length + coupons.length})</span>
        </h2>
        <motion.button
          onClick={handleAddNew}
          className="px-4 py-2 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center gap-2"
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="w-4 h-4" />
          Add new
        </motion.button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Manage all coupons. Default coupons can be hidden, custom coupons can be edited or deleted.
      </p>

      {/* All Coupons Section - Merged */}
      <div className="mb-6">
        {DEFAULT_COUPONS.filter(c => !disabledDefaultCoupons.includes(c.id)).length === 0 && coupons.length === 0 && !showForm ? (
          <div className="text-center py-6 bg-muted/30 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No coupons available. Click "Add new" to create a custom coupon.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {orderedItems.map((item) => (
                  <SortableCouponRow
                    key={item.id}
                    item={item}
                    onToggleDefault={handleToggleDefaultCoupon}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReset={handleReset}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeCouponId ? (() => {
                const item = orderedItems.find((i) => i.id === activeCouponId);
                if (!item) return null;
                const coupon = item.coupon;
                return (
                  <div
                    className={`bg-gradient-to-br ${coupon.color} rounded-lg p-4 text-white border-2 border-dashed border-white/50 opacity-90 shadow-xl cursor-grabbing pointer-events-none`}
                    style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="w-4 h-4 flex-shrink-0 opacity-80" />
                      <span className="text-2xl flex-shrink-0">{coupon.emoji}</span>
                      <span className="text-sm font-semibold truncate">{coupon.title}</span>
                    </div>
                    <p className="text-[11px] opacity-95 line-clamp-2">{coupon.description}</p>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {orderedItems.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-2 text-sm font-medium rounded-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all coupons
          </button>
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-romantic"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  {editingCoupon ? "Edit coupon" : "New coupon"}
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
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className={labelCls}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Free Zoo Entry"
                    className={inputCls}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A fun day exploring together!"
                    rows={3}
                    className={`${inputCls} resize-none`}
                    required
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className={labelCls}>Emoji *</label>
                  <input
                    type="text"
                    value={formData.emoji || ""}
                    onChange={(e) => {
                      // Always update with the actual input value, allowing empty strings to clear
                      setFormData({ ...formData, emoji: e.target.value });
                    }}
                    placeholder="🎁"
                    maxLength={2}
                    className={`${inputCls} text-2xl text-center`}
                    required
                  />
                </div>

                {/* Color */}
                <div>
                  <label className={labelCls}>Color gradient *</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className={inputCls}
                    required
                  >
                    {COLOR_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  {/* Color preview */}
                  <div className={`mt-2 h-8 rounded-lg border border-border bg-gradient-to-r ${formData.color}`} />
                </div>

                {/* Required Stamps */}
                <div>
                  <label className={labelCls}>Required stamps *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.requiredStamps}
                    onChange={(e) => setFormData({ ...formData, requiredStamps: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={labelCls}>Category (optional)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coin price */}
                <div>
                  <label className={labelCls}>
                    <span className="inline-flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Coin price (optional — blank means free)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priceCoins}
                    onChange={(e) => setFormData({ ...formData, priceCoins: e.target.value })}
                    placeholder="Leave blank for free"
                    className={inputCls}
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  className="w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  <Save className="w-4 h-4" />
                  {editingCoupon ? "Update coupon" : "Create coupon"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CouponsManager;





