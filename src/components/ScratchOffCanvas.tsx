import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScratchOffCanvasProps {
  children: React.ReactNode;
  onReveal?: () => void;
  brushSize?: number;
  revealThreshold?: number;
  className?: string;
  isInteractive?: boolean;
  isRevealed?: boolean;
}

export const ScratchOffCanvas: React.FC<ScratchOffCanvasProps> = ({
  children,
  onReveal,
  brushSize = 40,
  revealThreshold = 0.55,
  className = "",
  isInteractive = true,
  isRevealed: externalIsRevealed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalIsRevealed, setInternalIsRevealed] = useState(externalIsRevealed);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setInternalIsRevealed(externalIsRevealed);
  }, [externalIsRevealed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || internalIsRevealed) return;
    
    // Use willReadFrequently as we call getImageData
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      if (isInitialized) return; 
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      
      canvas.width = width;
      canvas.height = height;

      // Fill with rose-light color (premium foil look)
      ctx.fillStyle = "hsl(330, 60%, 92%)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add a subtle metallic/foil pattern overlay if desired, 
      // but a solid premium color is fine for now.
      setIsInitialized(true);
    };

    const observer = new ResizeObserver(() => {
      if (!isInitialized) {
        resizeCanvas();
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [internalIsRevealed, isInitialized]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (internalIsRevealed || !isInteractive) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getCoordinates(e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!isDrawing || internalIsRevealed || !isInteractive) return;
    
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sample pixels for performance instead of checking every single one
    const stride = 4;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let transparentCount = 0;
    let totalSampled = 0;

    for (let i = 3; i < pixels.length; i += 4 * stride) {
      if (pixels[i] < 128) {
        transparentCount++;
      }
      totalSampled++;
    }

    if (totalSampled > 0 && transparentCount / totalSampled > revealThreshold) {
      setInternalIsRevealed(true);
      onReveal?.();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    checkReveal();
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ touchAction: "none" }}
      onClick={(e) => {
        // Only stop propagation if we are interactive and haven't revealed yet, 
        // to prevent accidentally clicking the card while interacting with the foil.
        if (!internalIsRevealed && isInteractive) {
          e.stopPropagation();
        }
      }}
    >
      {children}
      
      <AnimatePresence>
        {!internalIsRevealed && (
          <motion.canvas
            ref={canvasRef}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`absolute inset-0 z-10 w-full h-full ${isInteractive ? 'cursor-pointer touch-none' : ''}`}
            style={{ touchAction: "none" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
