// Pixel art frame presets and rendering functions

import type { FilterPreset } from "./pixelFilters";

export type FramePreset = 
  | "none"
  | "warm-wood"
  | "colorful-corners"
  | "pasar-seni"
  | "retro-border"
  | "heart-frame";

// Draw frame on canvas
export const drawFrame = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: FramePreset
): void => {
  const width = canvas.width;
  const height = canvas.height;
  const frameWidth = Math.min(width, height) * 0.05; // 5% of smaller dimension

  switch (frame) {
    case "none":
      // No frame
      break;

    case "warm-wood":
      // Wooden frame matching PixelBorder
      ctx.fillStyle = "hsl(30, 40%, 60%)";
      ctx.fillRect(0, 0, width, frameWidth); // Top
      ctx.fillRect(0, 0, frameWidth, height); // Left
      ctx.fillRect(0, height - frameWidth, width, frameWidth); // Bottom
      ctx.fillRect(width - frameWidth, 0, frameWidth, height); // Right
      
      // Inner border
      ctx.fillStyle = "hsl(15, 60%, 50%)";
      const innerWidth = frameWidth * 0.3;
      ctx.fillRect(innerWidth, innerWidth, width - innerWidth * 2, innerWidth); // Top
      ctx.fillRect(innerWidth, innerWidth, innerWidth, height - innerWidth * 2); // Left
      ctx.fillRect(innerWidth, height - innerWidth * 2, width - innerWidth * 2, innerWidth); // Bottom
      ctx.fillRect(width - innerWidth * 2, innerWidth, innerWidth, height - innerWidth * 2); // Right
      break;

    case "colorful-corners":
      // Colorful corner accents
      const cornerSize = frameWidth * 2;
      // Top-left
      ctx.fillStyle = "hsl(0, 70%, 60%)";
      ctx.fillRect(0, 0, cornerSize, cornerSize);
      // Top-right
      ctx.fillStyle = "hsl(45, 80%, 65%)";
      ctx.fillRect(width - cornerSize, 0, cornerSize, cornerSize);
      // Bottom-left
      ctx.fillStyle = "hsl(200, 60%, 55%)";
      ctx.fillRect(0, height - cornerSize, cornerSize, cornerSize);
      // Bottom-right
      ctx.fillStyle = "hsl(120, 50%, 50%)";
      ctx.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize);
      
      // Border
      ctx.strokeStyle = "hsl(15, 60%, 50%)";
      ctx.lineWidth = frameWidth * 0.5;
      ctx.strokeRect(cornerSize * 0.5, cornerSize * 0.5, width - cornerSize, height - cornerSize);
      break;

    case "pasar-seni":
      // Art market themed frame with decorative pattern
      ctx.fillStyle = "hsl(35, 40%, 85%)";
      ctx.fillRect(0, 0, width, frameWidth);
      ctx.fillRect(0, 0, frameWidth, height);
      ctx.fillRect(0, height - frameWidth, width, frameWidth);
      ctx.fillRect(width - frameWidth, 0, frameWidth, height);
      
      // Decorative dots pattern
      ctx.fillStyle = "hsl(15, 70%, 50%)";
      const dotSize = 4;
      const dotSpacing = frameWidth / 3;
      
      // Top border dots
      for (let x = dotSpacing; x < width; x += dotSpacing) {
        ctx.fillRect(x, frameWidth / 2 - dotSize / 2, dotSize, dotSize);
      }
      // Bottom border dots
      for (let x = dotSpacing; x < width; x += dotSpacing) {
        ctx.fillRect(x, height - frameWidth / 2 - dotSize / 2, dotSize, dotSize);
      }
      // Left border dots
      for (let y = dotSpacing; y < height; y += dotSpacing) {
        ctx.fillRect(frameWidth / 2 - dotSize / 2, y, dotSize, dotSize);
      }
      // Right border dots
      for (let y = dotSpacing; y < height; y += dotSpacing) {
        ctx.fillRect(width - frameWidth / 2 - dotSize / 2, y, dotSize, dotSize);
      }
      break;

    case "retro-border":
      // Retro game border style
      ctx.fillStyle = "hsl(15, 70%, 40%)";
      ctx.fillRect(0, 0, width, frameWidth);
      ctx.fillRect(0, 0, frameWidth, height);
      ctx.fillRect(0, height - frameWidth, width, frameWidth);
      ctx.fillRect(width - frameWidth, 0, frameWidth, height);
      
      // Inner highlight
      ctx.fillStyle = "hsl(15, 70%, 60%)";
      ctx.fillRect(frameWidth * 0.2, frameWidth * 0.2, width - frameWidth * 0.4, frameWidth * 0.3);
      ctx.fillRect(frameWidth * 0.2, frameWidth * 0.2, frameWidth * 0.3, height - frameWidth * 0.4);
      
      // Shadow
      ctx.fillStyle = "hsl(15, 50%, 30%)";
      ctx.fillRect(frameWidth * 0.8, height - frameWidth * 0.3, width - frameWidth * 0.8, frameWidth * 0.3);
      ctx.fillRect(width - frameWidth * 0.3, frameWidth * 0.8, frameWidth * 0.3, height - frameWidth * 0.8);
      break;

    case "heart-frame":
      // Heart-themed decorative frame
      ctx.fillStyle = "hsl(340, 70%, 65%)";
      ctx.fillRect(0, 0, width, frameWidth);
      ctx.fillRect(0, 0, frameWidth, height);
      ctx.fillRect(0, height - frameWidth, width, frameWidth);
      ctx.fillRect(width - frameWidth, 0, frameWidth, height);
      
      // Heart decorations at corners
      const heartSize = frameWidth * 1.5;
      const drawHeart = (x: number, y: number, size: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x - size * 0.5, y + size * 0.5, x, y + size * 0.7, x, y + size);
        ctx.bezierCurveTo(x, y + size * 0.7, x + size * 0.5, y + size * 0.5, x + size * 0.5, y + size * 0.3);
        ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
        ctx.fill();
      };
      
      ctx.fillStyle = "hsl(340, 80%, 75%)";
      drawHeart(frameWidth, frameWidth, heartSize);
      drawHeart(width - frameWidth, frameWidth, heartSize);
      drawHeart(frameWidth, height - frameWidth, heartSize);
      drawHeart(width - frameWidth, height - frameWidth, heartSize);
      break;
  }
};

// Apply frame to canvas
export const applyFrame = (
  canvas: HTMLCanvasElement,
  frame: FramePreset
): HTMLCanvasElement => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  if (frame === "none") {
    return canvas;
  }

  // Create a new canvas with frame
  const framedCanvas = document.createElement("canvas");
  const frameWidth = Math.min(canvas.width, canvas.height) * 0.05;
  framedCanvas.width = canvas.width;
  framedCanvas.height = canvas.height;
  
  const framedCtx = framedCanvas.getContext("2d");
  if (!framedCtx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw original image
  framedCtx.drawImage(canvas, 0, 0);
  
  // Draw frame
  drawFrame(framedCtx, framedCanvas, frame);

  return framedCanvas;
};

// Get frame display name
export const getFrameName = (frame: FramePreset): string => {
  const names: Record<FramePreset, string> = {
    none: "None",
    "warm-wood": "Warm Wood",
    "colorful-corners": "Colorful Corners",
    "pasar-seni": "Pasar Seni",
    "retro-border": "Retro Border",
    "heart-frame": "Heart Frame",
  };
  return names[frame];
};

// Get all available frames
export const getAllFrames = (): FramePreset[] => {
  return ["none", "warm-wood", "colorful-corners", "pasar-seni", "retro-border", "heart-frame"];
};

