// Pixel art filter presets and application functions

export type FilterPreset = 
  | "none"
  | "pixelated"
  | "retro"
  | "scanlines"
  | "vintage"
  | "neon"
  | "monochrome";

// Apply pixelation filter
const applyPixelation = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, pixelSize: number): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Get average color of pixel block
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let py = 0; py < pixelSize && y + py < height; py++) {
        for (let px = 0; px < pixelSize && x + px < width; px++) {
          const idx = ((y + py) * width + (x + px)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      a = Math.floor(a / count);

      // Fill pixel block with average color
      for (let py = 0; py < pixelSize && y + py < height; py++) {
        for (let px = 0; px < pixelSize && x + px < width; px++) {
          const idx = ((y + py) * width + (x + px)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

// Apply retro color palette
const applyRetro = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Warm retro color palette
  const palette = [
    [255, 220, 177], // Warm beige
    [255, 200, 150], // Peach
    [255, 180, 120], // Orange
    [200, 150, 120], // Brown
    [180, 140, 100], // Dark brown
    [255, 240, 200], // Light cream
  ];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Find closest palette color
    let minDist = Infinity;
    let closestColor = palette[0];
    
    for (const color of palette) {
      const dist = Math.sqrt(
        Math.pow(r - color[0], 2) +
        Math.pow(g - color[1], 2) +
        Math.pow(b - color[2], 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestColor = color;
      }
    }

    data[i] = closestColor[0];
    data[i + 1] = closestColor[1];
    data[i + 2] = closestColor[2];
  }

  ctx.putImageData(imageData, 0, 0);
};

// Apply scanlines effect
const applyScanlines = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
};

// Apply vintage film grain
const applyVintage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Slight color shift to warm tones
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * 1.1); // Boost red
    data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slight boost green
    data[i + 2] = Math.max(0, data[i + 2] * 0.95); // Reduce blue
  }

  ctx.putImageData(imageData, 0, 0);

  // Add grain
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = canvas.width;
  grainCanvas.height = canvas.height;
  const grainCtx = grainCanvas.getContext("2d");
  if (!grainCtx) return;

  const grainData = grainCtx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < grainData.data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 30;
    grainData.data[i] = 128 + grain;
    grainData.data[i + 1] = 128 + grain;
    grainData.data[i + 2] = 128 + grain;
    grainData.data[i + 3] = 30; // Low opacity
  }
  grainCtx.putImageData(grainData, 0, 0);

  ctx.globalAlpha = 0.3;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
};

// Apply neon glow effect
const applyNeon = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhance saturation and add glow
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Increase saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta > 0) {
      const s = delta / max;
      const newS = Math.min(1, s * 1.5);
      const newDelta = max * newS;
      
      if (max === r) {
        data[i] = 255;
        data[i + 1] = Math.min(255, (g / max) * newDelta);
        data[i + 2] = Math.min(255, (b / max) * newDelta);
      } else if (max === g) {
        data[i] = Math.min(255, (r / max) * newDelta);
        data[i + 1] = 255;
        data[i + 2] = Math.min(255, (b / max) * newDelta);
      } else {
        data[i] = Math.min(255, (r / max) * newDelta);
        data[i + 1] = Math.min(255, (g / max) * newDelta);
        data[i + 2] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  
  // Add glow with shadow blur
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(255, 100, 255, 0.5)";
  ctx.drawImage(canvas, 0, 0);
  ctx.shadowBlur = 0;
};

// Apply monochrome pixel art
const applyMonochrome = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale with dithering
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
    
    // Threshold with dithering
    const threshold = 128 + (Math.random() - 0.5) * 40;
    const value = gray > threshold ? 255 : 0;
    
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
};

// Apply filter to canvas
export const applyFilter = (
  canvas: HTMLCanvasElement,
  filter: FilterPreset
): HTMLCanvasElement => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  switch (filter) {
    case "none":
      // No filter applied
      break;
    case "pixelated":
      applyPixelation(ctx, canvas, 8);
      break;
    case "retro":
      applyRetro(ctx, canvas);
      break;
    case "scanlines":
      applyScanlines(ctx, canvas);
      break;
    case "vintage":
      applyVintage(ctx, canvas);
      break;
    case "neon":
      applyNeon(ctx, canvas);
      break;
    case "monochrome":
      applyMonochrome(ctx, canvas);
      break;
  }

  return canvas;
};

// Get filter display name
export const getFilterName = (filter: FilterPreset): string => {
  const names: Record<FilterPreset, string> = {
    none: "None",
    pixelated: "Pixelated",
    retro: "Retro",
    scanlines: "Scanlines",
    vintage: "Vintage",
    neon: "Neon",
    monochrome: "Monochrome",
  };
  return names[filter];
};

// Get all available filters
export const getAllFilters = (): FilterPreset[] => {
  return ["none", "pixelated", "retro", "scanlines", "vintage", "neon", "monochrome"];
};

