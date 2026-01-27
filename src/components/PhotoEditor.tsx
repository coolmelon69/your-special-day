import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Save, Sparkles } from "lucide-react";
import type { Photo, Sticker } from "@/components/TimelineSection";
import { applyFilter, type FilterPreset, getAllFilters, getFilterName } from "@/utils/pixelFilters";
import { applyFrame, type FramePreset, getAllFrames, getFrameName } from "@/utils/pixelFrames";
import { createCanvasFromImage, canvasToDataURL } from "@/utils/photoProcessing";
import StickerPicker, { type StickerType, stickerComponents } from "./StickerPicker";
import { Slider } from "@/components/ui/slider";

interface PhotoEditorProps {
  photoSrc: string;
  checkpointId: string;
  onSave: (photo: Omit<Photo, "id" | "timestamp">) => void;
  onClose: () => void;
}

const PhotoEditor = ({ photoSrc, checkpointId, onSave, onClose }: PhotoEditorProps) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>("none");
  const [filterIntensity, setFilterIntensity] = useState<number>(100);
  const [selectedFrame, setSelectedFrame] = useState<FramePreset>("none");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [caption, setCaption] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(photoSrc);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartDistance, setResizeStartDistance] = useState(0);
  const [resizeStartScale, setResizeStartScale] = useState(1);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateStartRotation, setRotateStartRotation] = useState(0);

  // Reset intensity to 100 when filter changes
  useEffect(() => {
    setFilterIntensity(100);
  }, [selectedFilter]);

  // Render preview when filter, frame, stickers, or intensity change
  useEffect(() => {
    renderPreview();
  }, [selectedFilter, filterIntensity, selectedFrame, stickers, photoSrc]);

  // Update overlay when canvas size changes
  useEffect(() => {
    const updateOverlay = () => {
      if (!canvasRef.current || !overlayRef.current) return;
      
      // The overlay should match the canvas container size
      // Since canvas uses object-contain, we need to account for the actual displayed size
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;
      
      // Get the actual displayed canvas dimensions
      const canvasRect = canvas.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Position overlay to match canvas display area
      overlayRef.current.style.width = `${canvasRect.width}px`;
      overlayRef.current.style.height = `${canvasRect.height}px`;
      overlayRef.current.style.left = `${canvasRect.left - containerRect.left}px`;
      overlayRef.current.style.top = `${canvasRect.top - containerRect.top}px`;
    };

    // Use ResizeObserver to watch canvas size changes
    const resizeObserver = new ResizeObserver(updateOverlay);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    updateOverlay();

    return () => {
      resizeObserver.disconnect();
    };
  }, [previewSrc]);

  const renderPreview = async () => {
    try {
      setIsProcessing(true);
      let canvas = await createCanvasFromImage(photoSrc);
      
      // Apply filter with intensity
      if (selectedFilter !== "none") {
        canvas = applyFilter(canvas, selectedFilter, filterIntensity);
      }

      // Apply frame
      if (selectedFrame !== "none") {
        canvas = applyFrame(canvas, selectedFrame);
      }

      // Don't draw stickers on canvas during editing - they're rendered on the overlay instead
      // Stickers will only be drawn on canvas when saving

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
    const x = (canvas.width * sticker.x) / 100;
    const y = (canvas.height * sticker.y) / 100;
    const rotation = sticker.rotation || 0;

    // Draw sticker as SVG (simplified - in production, use actual sticker rendering)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180); // Convert degrees to radians
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

  // Coordinate conversion utilities
  const pixelToPercent = useCallback((clientX: number, clientY: number) => {
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return { x: 50, y: 50 };
    
    const x = ((clientX - overlayRect.left) / overlayRect.width) * 100;
    const y = ((clientY - overlayRect.top) / overlayRect.height) * 100;
    
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  const handleStickerClick = (sticker: Sticker, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
  };

  const handleStickerMouseDown = (sticker: Sticker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    
    const stickerX = (overlayRect.width * sticker.x) / 100;
    const stickerY = (overlayRect.height * sticker.y) / 100;
    
    setDragOffset({
      x: event.clientX - overlayRect.left - stickerX,
      y: event.clientY - overlayRect.top - stickerY,
    });
    
    setIsDragging(true);
  };

  const handleStickerTouchStart = (sticker: Sticker, event: React.TouchEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    
    const touch = event.touches[0];
    const stickerX = (overlayRect.width * sticker.x) / 100;
    const stickerY = (overlayRect.height * sticker.y) / 100;
    
    setDragOffset({
      x: touch.clientX - overlayRect.left - stickerX,
      y: touch.clientY - overlayRect.top - stickerY,
    });
    
    setIsDragging(true);
  };

  const handleResizeMouseDown = (sticker: Sticker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    setIsResizing(true);
    setResizeStartScale(sticker.scale);
    
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    
    // Calculate distance from sticker center to mouse position
    const stickerCenterX = (overlayRect.width * sticker.x) / 100 + overlayRect.left;
    const stickerCenterY = (overlayRect.height * sticker.y) / 100 + overlayRect.top;
    
    const baseSize = 48;
    const currentSize = baseSize * sticker.scale;
    const distance = Math.max(currentSize / 2, Math.sqrt(
      Math.pow(event.clientX - stickerCenterX, 2) + Math.pow(event.clientY - stickerCenterY, 2)
    ));
    setResizeStartDistance(distance);
  };

  const handleResizeTouchStart = (sticker: Sticker, event: React.TouchEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    
    if (event.touches.length === 2) {
      // Pinch to zoom
      setIsResizing(true);
      setResizeStartScale(sticker.scale);
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setResizeStartDistance(distance);
    }
  };

  const handleRotateMouseDown = (sticker: Sticker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    setIsRotating(true);
    
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    
    const stickerCenterX = (overlayRect.width * sticker.x) / 100 + overlayRect.left;
    const stickerCenterY = (overlayRect.height * sticker.y) / 100 + overlayRect.top;
    
    const angle = Math.atan2(
      event.clientY - stickerCenterY,
      event.clientX - stickerCenterX
    ) * (180 / Math.PI);
    
    setRotateStartAngle(angle);
    setRotateStartRotation(sticker.rotation || 0);
  };

  const handleRotateTouchStart = (sticker: Sticker, event: React.TouchEvent) => {
    event.stopPropagation();
    setSelectedSticker(sticker);
    setIsRotating(true);
    
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    
    const touch = event.touches[0];
    const stickerCenterX = (overlayRect.width * sticker.x) / 100 + overlayRect.left;
    const stickerCenterY = (overlayRect.height * sticker.y) / 100 + overlayRect.top;
    
    const angle = Math.atan2(
      touch.clientY - stickerCenterY,
      touch.clientX - stickerCenterX
    ) * (180 / Math.PI);
    
    setRotateStartAngle(angle);
    setRotateStartRotation(sticker.rotation || 0);
  };

  // Global mouse/touch move handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing && !isRotating) return;
      if (!selectedSticker || !overlayRef.current) return;

      const overlayRect = overlayRef.current.getBoundingClientRect();
      
      if (isDragging) {
        const newPos = pixelToPercent(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, x: newPos.x, y: newPos.y } : s
          )
        );
      } else if (isResizing) {
        const stickerCenterX = (overlayRect.width * selectedSticker.x) / 100 + overlayRect.left;
        const stickerCenterY = (overlayRect.height * selectedSticker.y) / 100 + overlayRect.top;
        
        const currentDistance = Math.sqrt(
          Math.pow(e.clientX - stickerCenterX, 2) + Math.pow(e.clientY - stickerCenterY, 2)
        );
        
        const scaleFactor = currentDistance / resizeStartDistance;
        const newScale = Math.max(0.1, Math.min(3.0, resizeStartScale * scaleFactor));
        
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, scale: newScale } : s
          )
        );
      } else if (isRotating) {
        const stickerCenterX = (overlayRect.width * selectedSticker.x) / 100 + overlayRect.left;
        const stickerCenterY = (overlayRect.height * selectedSticker.y) / 100 + overlayRect.top;
        
        const currentAngle = Math.atan2(
          e.clientY - stickerCenterY,
          e.clientX - stickerCenterX
        ) * (180 / Math.PI);
        
        const angleDiff = currentAngle - rotateStartAngle;
        let newRotation = rotateStartRotation + angleDiff;
        
        // Normalize to 0-360
        newRotation = ((newRotation % 360) + 360) % 360;
        
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, rotation: newRotation } : s
          )
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging && !isResizing && !isRotating) return;
      if (!selectedSticker || !overlayRef.current) return;
      
      e.preventDefault(); // Prevent scrolling

      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const newPos = pixelToPercent(touch.clientX - dragOffset.x, touch.clientY - dragOffset.y);
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, x: newPos.x, y: newPos.y } : s
          )
        );
      } else if (isResizing && e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scaleFactor = currentDistance / resizeStartDistance;
        const newScale = Math.max(0.1, Math.min(3.0, resizeStartScale * scaleFactor));
        
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, scale: newScale } : s
          )
        );
      } else if (isRotating && e.touches.length === 1) {
        const touch = e.touches[0];
        const overlayRect = overlayRef.current.getBoundingClientRect();
        const stickerCenterX = (overlayRect.width * selectedSticker.x) / 100 + overlayRect.left;
        const stickerCenterY = (overlayRect.height * selectedSticker.y) / 100 + overlayRect.top;
        
        const currentAngle = Math.atan2(
          touch.clientY - stickerCenterY,
          touch.clientX - stickerCenterX
        ) * (180 / Math.PI);
        
        const angleDiff = currentAngle - rotateStartAngle;
        let newRotation = rotateStartRotation + angleDiff;
        
        // Normalize to 0-360
        newRotation = ((newRotation % 360) + 360) % 360;
        
        setStickers(
          stickers.map((s) =>
            s.id === selectedSticker.id ? { ...s, rotation: newRotation } : s
          )
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, isResizing, isRotating, selectedSticker, dragOffset, resizeStartDistance, resizeStartScale, rotateStartAngle, rotateStartRotation, stickers, pixelToPercent]);

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
        canvas = applyFilter(canvas, selectedFilter, filterIntensity);
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
        filterIntensity: selectedFilter !== "none" ? filterIntensity : undefined,
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
            {/* Interactive Sticker Overlay */}
            <div
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none"
              onClick={(e) => {
                // Click outside to deselect
                if (e.target === e.currentTarget) {
                  setSelectedSticker(null);
                }
              }}
            >
              {stickers.map((sticker) => {
                const StickerComponent = stickerComponents[sticker.type];
                const isSelected = selectedSticker?.id === sticker.id;
                const baseSize = 48; // Base size in pixels
                const rotation = sticker.rotation || 0;
                
                return (
                  <div
                    key={sticker.id}
                    className="absolute pointer-events-auto cursor-move select-none"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${sticker.scale})`,
                      zIndex: isSelected ? 10 : 1,
                    }}
                    onClick={(e) => handleStickerClick(sticker, e)}
                    onMouseDown={(e) => handleStickerMouseDown(sticker, e)}
                    onTouchStart={(e) => handleStickerTouchStart(sticker, e)}
                  >
                    <div className="relative flex items-center justify-center">
                      <StickerComponent size={baseSize} />
                      {isSelected && (
                        <>
                          {/* Selection border with glow effect */}
                          <motion.div
                            className="absolute inset-0 border-2 rounded-sm"
                            style={{
                              width: `${baseSize}px`,
                              height: `${baseSize}px`,
                              transform: "translate(-50%, -50%)",
                              left: "50%",
                              top: "50%",
                              borderColor: "hsl(200, 80%, 60%)",
                              boxShadow: "0 0 8px rgba(59, 130, 246, 0.5), inset 0 0 8px rgba(59, 130, 246, 0.2)",
                            }}
                            animate={{
                              boxShadow: [
                                "0 0 8px rgba(59, 130, 246, 0.5), inset 0 0 8px rgba(59, 130, 246, 0.2)",
                                "0 0 12px rgba(59, 130, 246, 0.7), inset 0 0 8px rgba(59, 130, 246, 0.3)",
                                "0 0 8px rgba(59, 130, 246, 0.5), inset 0 0 8px rgba(59, 130, 246, 0.2)",
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          {/* Resize handles - enhanced with gradients and shadows */}
                          {[
                            { pos: "top-left", x: -baseSize / 2, y: -baseSize / 2, cursor: "nwse-resize" },
                            { pos: "top-right", x: baseSize / 2, y: -baseSize / 2, cursor: "nesw-resize" },
                            { pos: "bottom-left", x: -baseSize / 2, y: baseSize / 2, cursor: "nesw-resize" },
                            { pos: "bottom-right", x: baseSize / 2, y: baseSize / 2, cursor: "nwse-resize" },
                          ].map((handle) => (
                            <motion.div
                              key={handle.pos}
                              className="absolute cursor-pointer rounded-full flex items-center justify-center"
                              style={{
                                left: `calc(50% + ${handle.x}px)`,
                                top: `calc(50% + ${handle.y}px)`,
                                transform: "translate(-50%, -50%)",
                                width: "20px",
                                height: "20px",
                                background: "linear-gradient(135deg, hsl(200, 85%, 65%) 0%, hsl(200, 75%, 55%) 100%)",
                                border: "2px solid white",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3), 0 0 8px rgba(59, 130, 246, 0.6)",
                                cursor: handle.cursor,
                              }}
                              whileHover={{
                                scale: 1.2,
                                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.4), 0 0 12px rgba(59, 130, 246, 0.8)",
                              }}
                              whileTap={{ scale: 0.9 }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeMouseDown(sticker, e);
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                handleResizeTouchStart(sticker, e);
                              }}
                            >
                              {/* Inner dot indicator */}
                              <div
                                className="w-2 h-2 rounded-full bg-white"
                                style={{
                                  boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
                                }}
                              />
                            </motion.div>
                          ))}
                          {/* Rotation handle - enhanced with better icon and styling */}
                          <motion.div
                            className="absolute cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center"
                            style={{
                              left: "50%",
                              top: `calc(50% - ${baseSize / 2 + 24}px)`,
                              transform: "translate(-50%, -50%)",
                              width: "32px",
                              height: "32px",
                              background: "linear-gradient(135deg, hsl(200, 85%, 65%) 0%, hsl(200, 75%, 55%) 100%)",
                              border: "3px solid white",
                              boxShadow: "0 3px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(59, 130, 246, 0.6)",
                            }}
                            whileHover={{
                              scale: 1.15,
                              rotate: 15,
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), 0 0 14px rgba(59, 130, 246, 0.8)",
                            }}
                            whileTap={{ scale: 0.9 }}
                            animate={{
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              rotate: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              },
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleRotateMouseDown(sticker, e);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleRotateTouchStart(sticker, e);
                            }}
                          >
                            {/* Enhanced rotation icon */}
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white"
                            >
                              {/* Outer circle with arrow indicators */}
                              <circle
                                cx="9"
                                cy="9"
                                r="7"
                                stroke="white"
                                strokeWidth="1.5"
                                fill="none"
                              />
                              {/* Curved arrows */}
                              <path
                                d="M 9 2 Q 11 4, 11 6"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                              />
                              <path
                                d="M 11 6 L 9.5 5 L 9.5 7 Z"
                                fill="white"
                              />
                              <path
                                d="M 9 16 Q 7 14, 7 12"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                              />
                              <path
                                d="M 7 12 L 8.5 11 L 8.5 13 Z"
                                fill="white"
                              />
                              {/* Center dot */}
                              <circle
                                cx="9"
                                cy="9"
                                r="1.5"
                                fill="white"
                              />
                            </svg>
                          </motion.div>
                          {/* Connecting line from rotation handle to sticker */}
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: "50%",
                              top: `calc(50% - ${baseSize / 2 + 4}px)`,
                              transform: "translateX(-50%)",
                              width: "2px",
                              height: "20px",
                              background: "linear-gradient(to top, hsl(200, 80%, 60%) 0%, transparent 100%)",
                              opacity: 0.6,
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_0%)] bg-opacity-50 pointer-events-none">
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
            {/* Filter Intensity Slider */}
            {selectedFilter !== "none" && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    className="font-pixel text-xs text-[hsl(15_60%_35%)]"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    Intensity
                  </label>
                  <span className="font-pixel text-xs text-[hsl(15_60%_35%)]">
                    {filterIntensity}%
                  </span>
                </div>
                <Slider
                  value={[filterIntensity]}
                  onValueChange={(value) => setFilterIntensity(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
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

