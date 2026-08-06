import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, X, Save, GripVertical, Trophy, Heart, Star, Camera, Sparkles } from "lucide-react";
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
import type { CustomWrappedSlide, WrappedSlideIcon } from "@/types/admin";
import { WRAPPED_SLIDE_ICONS } from "@/types/admin";
import {
  getAllCustomWrappedSlides,
  addCustomWrappedSlide,
  updateCustomWrappedSlide,
  deleteCustomWrappedSlide,
  reorderCustomWrappedSlides,
  saveCustomWrappedSlidesToIndexedDB,
} from "@/utils/adminStorage";
import { loadCustomWrappedSlides } from "@/utils/supabaseSync";
import { getCurrentUser } from "@/utils/auth";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";
const iconBtnCls =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex-shrink-0";
const iconBtnDanger =
  "w-8 h-8 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0";

const ICON_MAP: Record<WrappedSlideIcon, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  heart: Heart,
  star: Star,
  camera: Camera,
  sparkles: Sparkles,
};

function SortableSlideRow({
  slide,
  onEdit,
  onDelete,
}: {
  slide: CustomWrappedSlide;
  onEdit: (slide: CustomWrappedSlide) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = slide.icon ? ICON_MAP[slide.icon] : null;

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
      <div className="w-9 h-9 flex-shrink-0 rounded-lg border border-border bg-foreground/5 grid place-items-center">
        {Icon ? <Icon className="w-4 h-4 text-rose" /> : <span className="text-xs text-muted-foreground">—</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground truncate">
          {slide.eyebrow}
        </p>
        <h4 className="font-medium text-sm text-foreground truncate">{slide.heading}</h4>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(slide)} className={iconBtnCls} title="Edit">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(slide.id)} className={iconBtnDanger} title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

const WrappedSlidesManager = () => {
  const [slides, setSlides] = useState<CustomWrappedSlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<CustomWrappedSlide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    eyebrow: "",
    icon: "" as WrappedSlideIcon | "",
    heading: "",
    emphasis: "",
    body: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const local = await getAllCustomWrappedSlides();
      setSlides(local);
      setIsLoading(false);

      const user = await getCurrentUser();
      if (user) {
        try {
          const remote = await loadCustomWrappedSlides();
          await saveCustomWrappedSlidesToIndexedDB(remote);
          setSlides(remote);
        } catch (syncError) {
          console.warn("Background sync failed (using local data):", syncError);
        }
      }
    } catch (error) {
      console.error("Error loading wrapped slides:", error);
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingSlide(null);
    setFormData({ eyebrow: "", icon: "", heading: "", emphasis: "", body: "" });
    setShowForm(true);
  };

  const handleEdit = (slide: CustomWrappedSlide) => {
    setEditingSlide(slide);
    setFormData({
      eyebrow: slide.eyebrow,
      icon: slide.icon ?? "",
      heading: slide.heading,
      emphasis: slide.emphasis ?? "",
      body: slide.body,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await deleteCustomWrappedSlide(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting wrapped slide:", error);
      alert("Failed to delete slide. Please try again.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveSlideId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSlideId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(slides, oldIndex, newIndex);
    setSlides(reordered);
    await reorderCustomWrappedSlides(reordered.map((s) => s.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eyebrow || !formData.heading || !formData.body) {
      alert("Please fill in eyebrow, heading, and body.");
      return;
    }

    try {
      const slideData: Omit<CustomWrappedSlide, "id" | "createdAt" | "updatedAt"> = {
        eyebrow: formData.eyebrow,
        icon: formData.icon || undefined,
        heading: formData.heading,
        emphasis: formData.emphasis || undefined,
        body: formData.body,
        order: editingSlide?.order ?? slides.length,
      };

      if (editingSlide) {
        await updateCustomWrappedSlide({ ...editingSlide, ...slideData });
      } else {
        await addCustomWrappedSlide(slideData);
      }

      setShowForm(false);
      setEditingSlide(null);
      await loadData();
    } catch (error) {
      console.error("Error saving wrapped slide:", error);
      alert("Failed to save slide. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Wrapped slides <span className="text-muted-foreground">({slides.length})</span>
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
        These render as slides right before the closing share card on /wrapped, in the order below.
      </p>

      <div className="mb-6">
        {slides.length === 0 && !showForm ? (
          <div className="text-center py-6 bg-muted/30 border border-border rounded-xl">
            <p className="text-sm text-muted-foreground">
              No custom slides yet — add one to close out the wrapped story with your own message.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {slides.map((slide) => (
                  <SortableSlideRow key={slide.id} slide={slide} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeSlideId ? (() => {
                const slide = slides.find((s) => s.id === activeSlideId);
                if (!slide) return null;
                return (
                  <div
                    className="bg-card border border-dashed border-primary/40 p-3 rounded-xl flex items-center gap-3 opacity-95 cursor-grabbing"
                    style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}
                  >
                    <GripVertical className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <span className="font-medium text-sm text-foreground truncate">{slide.heading}</span>
                  </div>
                );
              })() : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

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
                  {editingSlide ? "Edit slide" : "New slide"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingSlide(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Eyebrow *</label>
                  <input
                    type="text"
                    value={formData.eyebrow}
                    onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
                    placeholder="Award Nº 01"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Icon (optional)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: "" })}
                      className={`w-9 h-9 flex-shrink-0 rounded-lg border grid place-items-center transition-colors ${
                        formData.icon === "" ? "border-primary bg-primary/10" : "border-border text-muted-foreground"
                      }`}
                      title="No icon"
                    >
                      <span className="text-xs">—</span>
                    </button>
                    {WRAPPED_SLIDE_ICONS.map((key) => {
                      const IconComp = ICON_MAP[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: key })}
                          className={`w-9 h-9 flex-shrink-0 rounded-lg border grid place-items-center transition-colors ${
                            formData.icon === key ? "border-primary bg-primary/10" : "border-border text-muted-foreground"
                          }`}
                          title={key}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Heading *</label>
                  <input
                    type="text"
                    value={formData.heading}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                    placeholder="Most Likely To Cari Pintu"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className={labelCls}>Emphasis line (optional)</label>
                  <input
                    type="text"
                    value={formData.emphasis}
                    onChange={(e) => setFormData({ ...formData, emphasis: e.target.value })}
                    placeholder="Wa wa wa, nyenyenye, kucukucu"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Body *</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="One line on why this award exists."
                    rows={3}
                    className={`${inputCls} resize-none`}
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  className="w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  <Save className="w-4 h-4" />
                  {editingSlide ? "Update slide" : "Create slide"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WrappedSlidesManager;
