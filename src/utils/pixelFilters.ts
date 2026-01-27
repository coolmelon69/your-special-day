// Pixel art filter presets and application functions

export type FilterPreset = 
  | "none"
  | "pixelated"
  | "retro"
  | "scanlines"
  | "vintage"
  | "neon"
  | "monochrome"
  | "y2k-pink-blue"
  | "y2k-glitch"
  | "y2k-vaporwave"
  | "y2k-digicam"
  | "y2k-neon"
  | "y2k-flash";

// Helper function to blend filtered result with original based on intensity
const blendWithOriginal = (
  originalCanvas: HTMLCanvasElement,
  filteredCanvas: HTMLCanvasElement,
  intensity: number
): HTMLCanvasElement => {
  if (intensity >= 1) return filteredCanvas;
  if (intensity <= 0) return originalCanvas;

  const ctx = filteredCanvas.getContext("2d");
  if (!ctx) return filteredCanvas;

  const originalCtx = originalCanvas.getContext("2d");
  if (!originalCtx) return filteredCanvas;

  const originalData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  const filteredData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
  const original = originalData.data;
  const filtered = filteredData.data;

  // Blend pixels: result = original * (1 - intensity) + filtered * intensity
  for (let i = 0; i < filtered.length; i += 4) {
    filtered[i] = Math.round(original[i] * (1 - intensity) + filtered[i] * intensity);
    filtered[i + 1] = Math.round(original[i + 1] * (1 - intensity) + filtered[i + 1] * intensity);
    filtered[i + 2] = Math.round(original[i + 2] * (1 - intensity) + filtered[i + 2] * intensity);
    // Alpha channel stays the same
  }

  ctx.putImageData(filteredData, 0, 0);
  return filteredCanvas;
};

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

// Y2K Pink/Blue filter - Pink/magenta highlights, cyan/blue shadows
const applyY2KPinkBlue = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness
    const brightness = (r + g + b) / 3;
    
    // Boost pink/magenta in highlights
    if (brightness > 128) {
      data[i] = Math.min(255, r * 1.2); // Boost red
      data[i + 1] = Math.min(255, g * 0.9); // Reduce green slightly
      data[i + 2] = Math.min(255, b * 1.1); // Boost blue for magenta
    } else {
      // Add cyan/blue tints to shadows
      data[i] = Math.max(0, r * 0.85); // Reduce red
      data[i + 1] = Math.min(255, g * 1.1); // Boost green
      data[i + 2] = Math.min(255, b * 1.2); // Boost blue for cyan
    }
    
    // Increase overall saturation
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    const delta = max - min;
    
    if (delta > 0) {
      const s = delta / max;
      const newS = Math.min(1, s * 1.3);
      const newDelta = max * newS;
      const ratio = newDelta / delta;
      
      data[i] = Math.min(255, Math.max(0, data[i] * ratio));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * ratio));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * ratio));
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

// Y2K Glitch filter - RGB channel separation and digital artifacts
const applyY2KGlitch = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create separate channels
  const redChannel = new Uint8ClampedArray(data.length);
  const greenChannel = new Uint8ClampedArray(data.length);
  const blueChannel = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    redChannel[i] = data[i];
    redChannel[i + 1] = data[i];
    redChannel[i + 2] = data[i];
    redChannel[i + 3] = data[i + 3];

    greenChannel[i] = data[i + 1];
    greenChannel[i + 1] = data[i + 1];
    greenChannel[i + 2] = data[i + 1];
    greenChannel[i + 3] = data[i + 3];

    blueChannel[i] = data[i + 2];
    blueChannel[i + 1] = data[i + 2];
    blueChannel[i + 2] = data[i + 2];
    blueChannel[i + 3] = data[i + 3];
  }

  // Apply channel separation (offset red and green slightly)
  const offset = 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const redIdx = (y * width + Math.min(width - 1, x + offset)) * 4;
      const greenIdx = (y * width + Math.max(0, x - offset)) * 4;
      const blueIdx = idx;

      data[idx] = redChannel[redIdx];
      data[idx + 1] = greenChannel[greenIdx];
      data[idx + 2] = blueChannel[blueIdx];
    }
  }

  // Add digital noise artifacts
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.02) {
      // Random color banding
      data[i] = Math.random() > 0.5 ? 255 : 0;
      data[i + 1] = Math.random() > 0.5 ? 255 : 0;
      data[i + 2] = Math.random() > 0.5 ? 255 : 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Add scanline glitches
  for (let y = 0; y < height; y += Math.floor(Math.random() * 20) + 10) {
    if (Math.random() < 0.3) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, 0.5)`;
      ctx.fillRect(0, y, width, 1);
    }
  }
};

// Y2K Vaporwave filter - Purple/blue gradients with geometric patterns
const applyY2KVaporwave = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Apply purple/blue gradient overlay
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    
    // Create gradient effect
    const gradientFactor = (x + y) / (width + height);
    
    // Shift colors toward purple/blue
    data[i] = Math.min(255, data[i] * (1 - gradientFactor * 0.3)); // Reduce red
    data[i + 1] = Math.min(255, data[i + 1] * (1 - gradientFactor * 0.2)); // Slight reduce green
    data[i + 2] = Math.min(255, data[i + 2] * (1 + gradientFactor * 0.2)); // Boost blue
    
    // Add purple tint
    if (gradientFactor > 0.5) {
      data[i] = Math.min(255, data[i] + 20);
      data[i + 2] = Math.min(255, data[i + 2] + 30);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Add geometric grid pattern overlay
  ctx.strokeStyle = "rgba(138, 43, 226, 0.2)";
  ctx.lineWidth = 1;
  const gridSize = 20;
  
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Increase contrast
  const contrastData = ctx.getImageData(0, 0, width, height);
  const contrast = contrastData.data;
  const factor = (259 * (1.3 + 1)) / (259 - 1.3);
  
  for (let i = 0; i < contrast.length; i += 4) {
    contrast[i] = Math.min(255, Math.max(0, factor * (contrast[i] - 128) + 128));
    contrast[i + 1] = Math.min(255, Math.max(0, factor * (contrast[i + 1] - 128) + 128));
    contrast[i + 2] = Math.min(255, Math.max(0, factor * (contrast[i + 2] - 128) + 128));
  }
  
  ctx.putImageData(contrastData, 0, 0);
};

// Y2K Digicam filter - JPEG artifacts, grain, vignetting, CCD color shift
const applyY2KDigicam = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Apply CCD sensor color shift (cooler tones)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, data[i] * 0.95); // Reduce red
    data[i + 1] = Math.min(255, data[i + 1] * 1.02); // Slight boost green
    data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Boost blue
  }

  ctx.putImageData(imageData, 0, 0);

  // Add JPEG compression artifacts (blocky patterns)
  const blockSize = 8;
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      if (Math.random() < 0.1) {
        // Randomly quantize some blocks
        let r = 0, g = 0, b = 0, count = 0;
        for (let py = 0; py < blockSize && y + py < height; py++) {
          for (let px = 0; px < blockSize && x + px < width; px++) {
            const idx = ((y + py) * width + (x + px)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }
        const avgR = Math.floor(r / count / 32) * 32;
        const avgG = Math.floor(g / count / 32) * 32;
        const avgB = Math.floor(b / count / 32) * 32;
        
        for (let py = 0; py < blockSize && y + py < height; py++) {
          for (let px = 0; px < blockSize && x + px < width; px++) {
            const idx = ((y + py) * width + (x + px)) * 4;
            data[idx] = avgR;
            data[idx + 1] = avgG;
            data[idx + 2] = avgB;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Add film grain texture
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = width;
  grainCanvas.height = height;
  const grainCtx = grainCanvas.getContext("2d");
  if (!grainCtx) return;

  const grainData = grainCtx.createImageData(width, height);
  for (let i = 0; i < grainData.data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 25;
    grainData.data[i] = 128 + grain;
    grainData.data[i + 1] = 128 + grain;
    grainData.data[i + 2] = 128 + grain;
    grainData.data[i + 3] = 40;
  }
  grainCtx.putImageData(grainData, 0, 0);

  ctx.globalAlpha = 0.4;
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.globalAlpha = 1.0;

  // Add vignetting (darkened edges)
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  const vignetteData = ctx.getImageData(0, 0, width, height);
  const vignette = vignetteData.data;
  
  for (let i = 0; i < vignette.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const vignetteFactor = 1 - (dist / maxDist) * 0.4;
    
    vignette[i] = Math.max(0, vignette[i] * vignetteFactor);
    vignette[i + 1] = Math.max(0, vignette[i + 1] * vignetteFactor);
    vignette[i + 2] = Math.max(0, vignette[i + 2] * vignetteFactor);
  }
  
  ctx.putImageData(vignetteData, 0, 0);

  // Add slight chromatic aberration
  const aberrationOffset = 1;
  const aberrationCanvas = document.createElement("canvas");
  aberrationCanvas.width = width;
  aberrationCanvas.height = height;
  const aberrationCtx = aberrationCanvas.getContext("2d");
  if (!aberrationCtx) return;
  
  aberrationCtx.drawImage(canvas, 0, 0);
  const aberrationData = aberrationCtx.getImageData(0, 0, width, height);
  const aberration = aberrationData.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const redIdx = (y * width + Math.min(width - 1, x + aberrationOffset)) * 4;
      const blueIdx = (y * width + Math.max(0, x - aberrationOffset)) * 4;
      
      data[idx] = aberration[redIdx];
      data[idx + 2] = aberration[blueIdx];
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// Y2K Neon filter - Enhanced neon with pink/cyan glow
const applyY2KNeon = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Enhance saturation and add pink/cyan glow
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Increase saturation significantly
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta > 0) {
      const s = delta / max;
      const newS = Math.min(1, s * 2.0);
      const newDelta = max * newS;
      
      if (max === r) {
        // Red channel dominant - push toward pink
        data[i] = Math.min(255, r * 1.2);
        data[i + 1] = Math.min(255, (g / max) * newDelta * 0.8);
        data[i + 2] = Math.min(255, (b / max) * newDelta * 1.1);
      } else if (max === g) {
        // Green channel dominant - push toward cyan
        data[i] = Math.min(255, (r / max) * newDelta * 0.7);
        data[i + 1] = Math.min(255, g * 1.2);
        data[i + 2] = Math.min(255, (b / max) * newDelta * 1.2);
      } else {
        // Blue channel dominant - enhance cyan
        data[i] = Math.min(255, (r / max) * newDelta * 0.6);
        data[i + 1] = Math.min(255, (g / max) * newDelta * 1.1);
        data[i + 2] = Math.min(255, b * 1.3);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  
  // Add multiple glow layers
  ctx.shadowBlur = 15;
  ctx.shadowColor = "rgba(255, 100, 255, 0.6)";
  ctx.drawImage(canvas, 0, 0);
  
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(100, 255, 255, 0.4)";
  ctx.drawImage(canvas, 0, 0);
  
  ctx.shadowBlur = 0;
};

// Y2K Flash filter - Bright white center with radial fade, soft blur, color wash
const applyY2KFlash = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void => {
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  // Apply soft blur effect
  ctx.filter = "blur(2px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";

  // Create flash overlay
  const flashCanvas = document.createElement("canvas");
  flashCanvas.width = width;
  flashCanvas.height = height;
  const flashCtx = flashCanvas.getContext("2d");
  if (!flashCtx) return;

  // Create radial gradient for flash
  const gradient = flashCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxDist);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.4)");
  gradient.addColorStop(0.6, "rgba(255, 240, 200, 0.2)");
  gradient.addColorStop(1, "rgba(200, 220, 255, 0.1)");

  flashCtx.fillStyle = gradient;
  flashCtx.fillRect(0, 0, width, height);

  // Blend flash overlay
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(flashCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // Apply warm color wash
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const flashFactor = 1 - (dist / maxDist) * 0.5;
    
    // Warm tint in flash area
    data[i] = Math.min(255, data[i] * (1 + flashFactor * 0.1));
    data[i + 1] = Math.min(255, data[i + 1] * (1 + flashFactor * 0.05));
    data[i + 2] = Math.max(0, data[i + 2] * (1 - flashFactor * 0.1));
    
    // Reduce contrast in flash area
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const contrastReduction = flashFactor * 0.3;
    data[i] = brightness + (data[i] - brightness) * (1 - contrastReduction);
    data[i + 1] = brightness + (data[i + 1] - brightness) * (1 - contrastReduction);
    data[i + 2] = brightness + (data[i + 2] - brightness) * (1 - contrastReduction);
  }

  ctx.putImageData(imageData, 0, 0);
};

// Apply filter to canvas with intensity support
export const applyFilter = (
  canvas: HTMLCanvasElement,
  filter: FilterPreset,
  intensity: number = 1.0
): HTMLCanvasElement => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Normalize intensity (0-100 to 0-1)
  const normalizedIntensity = Math.max(0, Math.min(1, intensity / 100));

  if (filter === "none" || normalizedIntensity <= 0) {
    return canvas;
  }

  // Save original canvas
  const originalCanvas = document.createElement("canvas");
  originalCanvas.width = canvas.width;
  originalCanvas.height = canvas.height;
  const originalCtx = originalCanvas.getContext("2d");
  if (!originalCtx) return canvas;
  originalCtx.drawImage(canvas, 0, 0);

  // Apply filter
  switch (filter) {
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
    case "y2k-pink-blue":
      applyY2KPinkBlue(ctx, canvas);
      break;
    case "y2k-glitch":
      applyY2KGlitch(ctx, canvas);
      break;
    case "y2k-vaporwave":
      applyY2KVaporwave(ctx, canvas);
      break;
    case "y2k-digicam":
      applyY2KDigicam(ctx, canvas);
      break;
    case "y2k-neon":
      applyY2KNeon(ctx, canvas);
      break;
    case "y2k-flash":
      applyY2KFlash(ctx, canvas);
      break;
  }

  // Blend with original based on intensity
  return blendWithOriginal(originalCanvas, canvas, normalizedIntensity);
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
    "y2k-pink-blue": "Y2K Pink/Blue",
    "y2k-glitch": "Y2K Glitch",
    "y2k-vaporwave": "Y2K Vaporwave",
    "y2k-digicam": "Y2K Digicam",
    "y2k-neon": "Y2K Neon",
    "y2k-flash": "Y2K Flash",
  };
  return names[filter];
};

// Get all available filters
export const getAllFilters = (): FilterPreset[] => {
  return [
    "none",
    "pixelated",
    "retro",
    "scanlines",
    "vintage",
    "neon",
    "monochrome",
    "y2k-pink-blue",
    "y2k-glitch",
    "y2k-vaporwave",
    "y2k-digicam",
    "y2k-neon",
    "y2k-flash",
  ];
};
