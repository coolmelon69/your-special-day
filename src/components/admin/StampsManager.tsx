import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, MapPin, GripVertical } from "lucide-react";
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
import { loadCustomStampsResult, loadGlobalAdminSettings } from "@/utils/supabaseSync";
import { saveCustomStampsToIndexedDB } from "@/utils/adminStorage";
import { getCurrentUser } from "@/utils/auth";

const AVAILABLE_SPRITES = Object.keys(sprites);

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
}: {
  item: StampListItem;
  onDeleteDefault: (e: React.MouseEvent, title: string) => void;
  onEdit: (stamp: CustomStamp) => void;
  onDelete: (stampId: string) => void;
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
      className={`bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] p-3 rounded-lg flex items-center gap-3 ${isDragging ? "opacity-80 z-50 shadow-lg" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing flex-shrink-0 p-1 text-[hsl(15_60%_35%)] hover:text-[hsl(15_70%_45%)]"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
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
            className="font-pixel text-[10px] md:text-xs bg-[hsl(var(--primary))] px-2 py-0.5 text-[hsl(var(--primary-foreground))] rounded"
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
            className={`font-pixel text-[8px] px-1.5 py-0.5 text-white rounded ${isDefault ? "bg-[hsl(200_60%_55%)]" : "bg-[hsl(142_60%_55%)]"}`}
            style={{ textRendering: "optimizeSpeed" }}
          >
            {isDefault ? "DEFAULT" : "CUSTOM"}
          </span>
        </div>
        <p
          className="font-pixel text-[9px] text-[hsl(15_60%_35%)] line-clamp-1"
          style={{ textRendering: "optimizeSpeed" }}
        >
          {stamp.description}
        </p>
        {customStamp?.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-[hsl(15_60%_35%)]" />
            <span
              className="font-pixel text-[8px] text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
              {customStamp.location.latitude.toFixed(4)}, {customStamp.location.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
      {isDefault && itineraryStamp && (
        <button
          type="button"
          onClick={(e) => onDeleteDefault(e, itineraryStamp.title)}
          className="w-8 h-8 flex items-center justify-center border-2 transition-colors rounded flex-shrink-0 bg-[hsl(0_70%_50%)] border-[hsl(0_60%_40%)] text-white hover:bg-[hsl(0_70%_60%)]"
          title="Delete stamp"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
      {!isDefault && customStamp && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(customStamp)}
            className="w-8 h-8 flex items-center justify-center bg-[hsl(200_60%_55%)] border-2 border-[hsl(200_50%_45%)] text-white hover:bg-[hsl(200_60%_60%)] transition-colors"
            title="Edit"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(customStamp.id)}
            className="w-8 h-8 flex items-center justify-center bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] text-white hover:bg-[hsl(0_70%_60%)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
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

  const visibleDefaults = initialItinerary.filter((s) => !disabledDefaultStamps.includes(s.title));
  const totalStampsCount = visibleDefaults.length + stamps.length;
  const orderedItems = buildOrderedStampList(visibleDefaults, stamps, stampOrder);

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
          Stamps ({totalStampsCount})
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
        Add custom stamps with the button above. Default stamps can be deleted to remove them from the list.
      </p>

      {/* Single combined Stamps list */}
      <div className="mb-6">
        {totalStampsCount === 0 && !showForm ? (
          <div className="text-center py-4 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] rounded-lg">
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
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
                    className="bg-[hsl(35_30%_80%)] border-2 border-dashed border-[hsl(30_40%_60%)] p-3 rounded-lg flex items-center gap-3 opacity-90 shadow-xl cursor-grabbing"
                    style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
                  >
                    <GripVertical className="w-4 h-4 flex-shrink-0 text-[hsl(15_60%_35%)]" />
                    <div className="w-10 h-10 flex-shrink-0">
                      {SpriteComponent ? (
                        <SpriteComponent isActive={item.stamp.isActive} isPast={item.stamp.isPast} />
                      ) : (
                        <div className="w-full h-full bg-[hsl(30_40%_60%)] rounded flex items-center justify-center">
                          <span className="font-pixel text-xs">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-pixel text-[10px] md:text-xs bg-[hsl(var(--primary))] px-2 py-0.5 text-[hsl(var(--primary-foreground))] rounded">
                        {item.stamp.time}
                      </span>
                      <span className="font-pixel text-xs text-[hsl(15_70%_40%)] ml-2 truncate">{item.stamp.title}</span>
                    </div>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
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





