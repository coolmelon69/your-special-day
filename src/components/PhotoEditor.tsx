import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Save, Sparkles } from "lucide-react";
import type { Photo, Sticker } from "@/components/TimelineSection";
import { applyFilter, type FilterPreset, getAllFilters, getFilterName } from "@/utils/pixelFilters";
import { applyFrame, type FramePreset, getAllFrames, getFrameName } from "@/utils/pixelFrames";
import { createCanvasFromImage, canvasToDataURL } from "@/utils/photoProcessing";
import StickerPicker, { type StickerType } from "./StickerPicker";

interface PhotoEditorProps {
  photoSrc: string;
  checkpointId: string;
  onSave: (photo: Omit<Photo, "id" | "timestamp">) => void;
  onClose: () => void;
}

const PhotoEditor = ({ photoSrc, checkpointId, onSave, onClose }: PhotoEditorProps) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>("none");
  const [selectedFrame, setSelectedFrame] = useState<FramePreset>("none");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [caption, setCaption] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(photoSrc);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Render preview when filter, frame, or stickers change
  useEffect(() => {
    renderPreview();
  }, [selectedFilter, selectedFrame, stickers, photoSrc]);

  const renderPreview = async () => {
    try {
      setIsProcessing(true);
      let canvas = await createCanvasFromImage(photoSrc);
      
      // Apply filter
      if (selectedFilter !== "none") {
        canvas = applyFilter(canvas, selectedFilter);
      }

      // Apply frame
      if (selectedFrame !== "none") {
        canvas = applyFrame(canvas, selectedFrame);
      }

      // Draw stickers
      const ctx = canvas.getContext("2d");
      if (ctx && stickers.length > 0) {
        stickers.forEach((sticker) => {
          drawSticker(ctx, canvas, sticker);
        });
      }

      const dataURL = canvasToDataURL(canvas);
      setPreviewSrc(dataURL);
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext("2d");
        if (displayCtx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          displayCtx.drawImage(canvas, 0, 0);
        }
      }
    } catch (error) {
      console.error("Error rendering preview:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const drawSticker = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, sticker: Sticker) => {
    const size = Math.min(canvas.width, canvas.height) * 0.1 * sticker.scale;
    const x = (canvas.width * sticker.x) / 100 - size / 2;
    const y = (canvas.height * sticker.y) / 100 - size / 2;

    // Draw sticker as SVG (simplified - in production, use actual sticker rendering)
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.scale(sticker.scale, sticker.scale);
    
    // Draw a simple shape for the sticker (you can enhance this)
    ctx.fillStyle = getStickerColor(sticker.type);
    ctx.beginPath();
    if (sticker.type.includes("heart")) {
      ctx.moveTo(0, size / 4);
      ctx.bezierCurveTo(0, 0, -size / 4, 0, -size / 4, size / 4);
      ctx.bezierCurveTo(-size / 4, size / 2, 0, size * 0.75, 0, size);
      ctx.bezierCurveTo(0, size * 0.75, size / 4, size / 2, size / 4, size / 4);
      ctx.bezierCurveTo(size / 4, 0, 0, 0, 0, size / 4);
      ctx.fill();
    } else if (sticker.type.includes("star")) {
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Default circle
      ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const getStickerColor = (type: StickerType): string => {
    const colors: Record<StickerType, string> = {
      heart: "hsl(0, 70%, 60%)",
      "heart-filled": "hsl(0, 80%, 65%)",
      star: "hsl(45, 80%, 65%)",
      "star-filled": "hsl(45, 90%, 70%)",
      flower: "hsl(var(--primary))",
      "music-note": "hsl(var(--foreground))",
      coffee: "hsl(var(--primary))",
      camera: "hsl(var(--foreground))",
      sparkle: "hsl(45, 80%, 70%)",
    };
    return colors[type] || "hsl(var(--primary))";
  };

  const handleStickerSelect = (sticker: Sticker) => {
    setStickers([...stickers, sticker]);
    setSelectedSticker(sticker);
    setShowStickerPicker(false);
  };

  const handleStickerClick = (sticker: Sticker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
  };

  const handleStickerDrag = (sticker: Sticker, event: React.MouseEvent) => {
    if (!isDragging || !selectedSticker || selectedSticker.id !== sticker.id) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setStickers(
      stickers.map((s) =>
        s.id === sticker.id ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s
      )
    );
  };

  const handleDeleteSticker = (stickerId: string) => {
    setStickers(stickers.filter((s) => s.id !== stickerId));
    if (selectedSticker?.id === stickerId) {
      setSelectedSticker(null);
    }
  };

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      let canvas = await createCanvasFromImage(photoSrc);
      
      if (selectedFilter !== "none") {
        canvas = applyFilter(canvas, selectedFilter);
      }
      
      if (selectedFrame !== "none") {
        canvas = applyFrame(canvas, selectedFrame);
      }

      const ctx = canvas.getContext("2d");
      if (ctx && stickers.length > 0) {
        stickers.forEach((sticker) => {
          drawSticker(ctx, canvas, sticker);
        });
      }

      const finalDataURL = canvasToDataURL(canvas);

      onSave({
        checkpointId,
        src: finalDataURL,
        filter: selectedFilter !== "none" ? selectedFilter : undefined,
        frame: selectedFrame !== "none" ? selectedFrame : undefined,
        stickers: stickers.length > 0 ? stickers : undefined,
        caption: caption || undefined,
      });

      onClose();
    } catch (error) {
      console.error("Error saving photo:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[hsl(0_0%_0%)] bg-opacity-70">
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="border-2 border-[hsl(30_50%_60%)] p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-pixel text-sm md:text-base text-[hsl(15_70%_40%)]"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
                letterSpacing: "0.05em",
              }}
            >
              Edit Photo
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Preview */}
          <div className="mb-4 relative bg-[hsl(0_0%_0%)] rounded-lg overflow-hidden" style={{ imageRendering: "pixelated" }}>
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[400px] object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_0%)] bg-opacity-50">
                <div className="text-white font-pixel text-xs">Processing...</div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="mb-4">
            <label
              className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-2"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Filter
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllFilters().map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 font-pixel text-xs border-2 transition-all ${
                    selectedFilter === filter
                      ? "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white"
                      : "bg-[hsl(35_30%_75%)] border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)]"
                  }`}
                >
                  {getFilterName(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Frames */}
          <div className="mb-4">
            <label
              className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-2"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Frame
            </label>
            <div className="flex flex-wrap gap-2">
              {getAllFrames().map((frame) => (
                <button
                  key={frame}
                  onClick={() => setSelectedFrame(frame)}
                  className={`px-3 py-1 font-pixel text-xs border-2 transition-all ${
                    selectedFrame === frame
                      ? "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white"
                      : "bg-[hsl(35_30%_75%)] border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)]"
                  }`}
                >
                  {getFrameName(frame)}
                </button>
              ))}
            </div>
          </div>

          {/* Stickers */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label
                className="block font-pixel text-xs text-[hsl(15_60%_35%)]"
                style={{ textRendering: "optimizeSpeed" }}
              >
                Stickers ({stickers.length})
              </label>
              <button
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className="px-3 py-1 font-pixel text-xs bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Add
              </button>
            </div>
            {showStickerPicker && (
              <div className="mb-2">
                <StickerPicker
                  onStickerSelect={handleStickerSelect}
                  onClose={() => setShowStickerPicker(false)}
                />
              </div>
            )}
            {stickers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="relative p-2 bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)]"
                  >
                    <div className="text-xs font-pixel text-[hsl(15_60%_35%)]">
                      {sticker.type}
                    </div>
                    <button
                      onClick={() => handleDeleteSticker(sticker.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(0_60%_50%)] text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label
              className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-2"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full px-3 py-2 font-pixel text-xs bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
              style={{ textRendering: "optimizeSpeed" }}
            />
          </div>

          {/* Save button */}
          <motion.button
            onClick={handleSave}
            disabled={isProcessing}
            className="w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
            whileHover={!isProcessing ? { scale: 1.05 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
          >
            <Save className="w-4 h-4" />
            {isProcessing ? "Saving..." : "Save Photo"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default PhotoEditor;

