import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, MapPin, GripVertical, RotateCcw } from "lucide-react";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { loadCustomStampsResult, loadGlobalAdminSettings, resetStamp, resetAllStamps } from "@/utils/supabaseSync";
import { saveCustomStampsToIndexedDB } from "@/utils/adminStorage";
import { getCurrentUser } from "@/utils/auth";
import { Pill } from "@/components/editorial";

const AVAILABLE_SPRITES = Object.keys(sprites);

// Shared editorial field styles
const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";
const iconBtnCls =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex-shrink-0";
const iconBtnDanger =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0";

type StampListItem =
  | { type: "default"; stamp: ItineraryItem; id: string }
  | { type: "custom"; stamp: CustomStamp; id: string };

function buildOrderedStampList(
  visibleDefaults: ItineraryItem[],
  stamps: CustomStamp[],
  stampOrder: string[]
): StampListItem[] {
  const defaultByTitle = new Map(visibleDefaults.map((s) => [s.title, s]));
  const customById = new Map(stamps.map((s) => [s.id, s]));
  const result: StampListItem[] = [];
  const seen = new Set<string>();
  if (stampOrder.length > 0) {
    for (const key of stampOrder) {
      if (key.startsWith("default:")) {
        const title = key.slice(8);
        const stamp = defaultByTitle.get(title);
        if (stamp) {
          result.push({ type: "default", stamp, id: key });
          seen.add(key);
        }
      } else if (key.startsWith("custom:")) {
        const id = key.slice(7);
        const stamp = customById.get(id);
        if (stamp) {
          result.push({ type: "custom", stamp, id: key });
          seen.add(key);
        }
      }
    }
  }
  for (const s of visibleDefaults) {
    const key = `default:${s.title}`;
    if (!seen.has(key)) {
      result.push({ type: "default", stamp: s, id: key });
      seen.add(key);
    }
  }
  for (const s of stamps) {
    const key = `custom:${s.id}`;
    if (!seen.has(key)) {
      result.push({ type: "custom", stamp: s, id: key });
      seen.add(key);
    }
  }
  return result;
}

function SortableStampRow({
  item,
  onDeleteDefault,
  onEdit,
  onDelete,
  onReset,
}: {
  item: StampListItem;
  onDeleteDefault: (e: React.MouseEvent, title: string) => void;
  onEdit: (stamp: CustomStamp) => void;
  onDelete: (stampId: string) => void;
  onReset: (item: StampListItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const stamp = item.stamp;
  const SpriteComponent = sprites[stamp.sprite];
  const isDefault = item.type === "default";
  const itineraryStamp = isDefault ? (stamp as ItineraryItem) : null;
  const customStamp = !isDefault ? (stamp as CustomStamp) : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border p-3 rounded-xl flex items-center gap-3 ${isDragging ? "opacity-80 z-50 shadow-romantic" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 p-1 text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-11 h-11 flex-shrink-0 rounded-lg border border-border bg-foreground/5 grid place-items-center p-1.5">
        {SpriteComponent ? (
          <SpriteComponent isActive={stamp.isActive} isPast={stamp.isPast} />
        ) : (
          <span className="text-xs text-muted-foreground">?</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Pill variant="rose">{stamp.time}</Pill>
          <h4 className="font-medium text-sm text-foreground truncate">{stamp.title}</h4>
          <Pill variant={isDefault ? "accent" : "done"}>{isDefault ? "Default" : "Custom"}</Pill>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{stamp.description}</p>
        {customStamp?.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-[11px] text-muted-foreground">
              {customStamp.location.latitude.toFixed(4)}, {customStamp.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onReset(item)}
        className={iconBtnCls}
        title="Reset stamp (mark as uncollected)"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      {isDefault && itineraryStamp && (
        <button
          type="button"
          onClick={(e) => onDeleteDefault(e, itineraryStamp.title)}
          className={iconBtnDanger}
          title="Delete stamp"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {!isDefault && customStamp && (
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(customStamp)} className={iconBtnCls} title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(customStamp.id)} className={iconBtnDanger} title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

const StampsManager = () => {
  const [stamps, setStamps] = useState<CustomStamp[]>([]);
  const [disabledDefaultStamps, setDisabledDefaultStamps] = useState<string[]>([]);
  const [stampOrder, setStampOrder] = useState<string[]>([]);
  const [activeStampId, setActiveStampId] = useState<string | null>(null);
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
    is_secret: false,
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
      setStampOrder(settings.stampOrder ?? []);
      setIsLoading(false);
      
      // Background sync from Supabase (non-blocking)
      // This will update the UI if there's newer data, but won't block initial render
      const user = await getCurrentUser();
      if (user) {
        try {
          const stampsResult = await loadCustomStampsResult();
          if (stampsResult.ok) {
            // Supabase is authoritative (even if empty) -> clear stale cache
            await saveCustomStampsToIndexedDB(stampsResult.data);
            setStamps(stampsResult.data);
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

  const handleDeleteDefaultStamp = async (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const settings = await getAdminSettings();
      const currentDisabled = settings.disabledDefaultStamps || [];
      if (currentDisabled.includes(title)) return;
      const newDisabled = [...currentDisabled, title];

      setDisabledDefaultStamps(newDisabled);
      await updateAdminSettings({ disabledDefaultStamps: newDisabled });

      try {
        const globalSettings = await loadGlobalAdminSettings();
        if (globalSettings) {
          setDisabledDefaultStamps(globalSettings.disabledDefaultStamps || []);
        }
      } catch (verifyError) {
        console.warn("Could not reload global settings after update:", verifyError);
      }
    } catch (error) {
      console.error("Error deleting default stamp:", error);
      alert("Failed to delete stamp. Please try again.");
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
      is_secret: false,
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
      is_secret: stamp.is_secret || false,
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

  const handleReset = async (item: StampListItem) => {
    const stampKey = `${item.stamp.time}-${item.stamp.title}`;
    if (!window.confirm(`Reset "${item.stamp.title}" so it's marked as uncollected?`)) {
      return;
    }
    const ok = await resetStamp(stampKey);
    if (!ok) alert("Failed to reset stamp. Please try again.");
  };

  const handleResetAll = async () => {
    if (!window.confirm("Reset all stamps so none of them are marked as collected?")) {
      return;
    }
    const ok = await resetAllStamps();
    if (!ok) alert("Failed to reset stamps. Please try again.");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveStampId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStampId(null);
    if (!over || active.id === over.id) return;
    const visible = initialItinerary.filter((s) => !disabledDefaultStamps.includes(s.title));
    const ordered = buildOrderedStampList(visible, stamps, stampOrder);
    const oldIndex = ordered.findIndex((i) => i.id === active.id);
    const newIndex = ordered.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ordered, oldIndex, newIndex);
    const newStampOrder = reordered.map((i) => i.id);
    setStampOrder(newStampOrder);
    await updateAdminSettings({ stampOrder: newStampOrder });
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
        is_secret: formData.is_secret,
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
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const visibleDefaults = initialItinerary.filter((s) => !disabledDefaultStamps.includes(s.title));
  const totalStampsCount = visibleDefaults.length + stamps.length;
  const orderedItems = buildOrderedStampList(visibleDefaults, stamps, stampOrder);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Stamps <span className="text-muted-foreground">({totalStampsCount})</span>
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
        Add custom stamps with the button above. Default stamps can be deleted to remove them from the list.
      </p>

      {/* Single combined Stamps list */}
      <div className="mb-6">
        {totalStampsCount === 0 && !showForm ? (
          <div className="text-center py-6 bg-muted/30 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No stamps. Add a custom stamp or restore defaults (if you add a restore feature later).
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {orderedItems.map((item) => (
                  <SortableStampRow
                    key={item.id}
                    item={item}
                    onDeleteDefault={handleDeleteDefaultStamp}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReset={handleReset}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeStampId ? (() => {
                const item = orderedItems.find((i) => i.id === activeStampId);
                if (!item) return null;
                const SpriteComponent = sprites[item.stamp.sprite];
                return (
                  <div
                    className="bg-card border border-dashed border-primary/40 p-3 rounded-xl flex items-center gap-3 opacity-95 cursor-grabbing"
                    style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
                  >
                    <GripVertical className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <div className="w-11 h-11 flex-shrink-0 rounded-lg border border-border bg-foreground/5 grid place-items-center p-1.5">
                      {SpriteComponent ? (
                        <SpriteComponent isActive={item.stamp.isActive} isPast={item.stamp.isPast} />
                      ) : (
                        <span className="text-xs text-muted-foreground">?</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <Pill variant="rose">{item.stamp.time}</Pill>
                      <span className="font-medium text-sm text-foreground truncate">{item.stamp.title}</span>
                    </div>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {orderedItems.length > 0 && (
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-4 py-2 text-sm font-medium rounded-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all stamps
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
                  {editingStamp ? "Edit stamp" : "New stamp"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingStamp(null);
                    setIsSpriteDropdownOpen(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Time */}
                <div>
                  <label className={labelCls}>Time *</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="9:00 AM"
                    className={inputCls}
                    required
                  />
                </div>

                {/* Title */}
                <div>
                  <label className={labelCls}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Breakfast Quest"
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
                    placeholder="Wake up to your favorite breakfast..."
                    rows={3}
                    className={`${inputCls} resize-none`}
                    required
                  />
                </div>

                {/* Sprite */}
                <div>
                  <label className={labelCls}>Sprite *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSpriteDropdownOpen(!isSpriteDropdownOpen)}
                      className={`${inputCls} flex items-center gap-2`}
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
                      <span className="text-muted-foreground">▼</span>
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
                            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-[10px] max-h-60 overflow-y-auto shadow-romantic"
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
                                  className={`w-full px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                                    formData.sprite === sprite
                                      ? "bg-primary text-primary-foreground"
                                      : "text-foreground hover:bg-muted/60"
                                  }`}
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
                  <label className={labelCls}>Location (optional)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="Latitude"
                      className={inputCls}
                    />
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="Longitude"
                      className={inputCls}
                    />
                    <input
                      type="number"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                      placeholder="Radius (m)"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Is Secret? */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_secret"
                    checked={formData.is_secret}
                    onChange={(e) => setFormData({ ...formData, is_secret: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="is_secret" className="text-sm font-medium text-foreground cursor-pointer">
                    Is Secret?
                  </label>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  className="w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  <Save className="w-4 h-4" />
                  {editingStamp ? "Update stamp" : "Create stamp"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StampsManager;





