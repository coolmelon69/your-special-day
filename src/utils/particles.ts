/**
 * Particle Effects Utility
 * Provides various particle effects: confetti variations, heart rain, sparkles, and pixel art
 */

import confetti from "canvas-confetti";

// Theme colors matching the app
const THEME_COLORS = ["#f4a5b8", "#d4a5c9", "#a8d5ba", "#ffd700"];

// Performance detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const particleMultiplier = isMobile ? 0.6 : 1;

// ============================================================================
// CONFETTI VARIATIONS
// ============================================================================

/**
 * Explosive burst confetti from center
 */
export const burstConfetti = (options?: {
  particleCount?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) => {
  const {
    particleCount = 100,
    origin = { x: 0.5, y: 0.5 },
    colors = THEME_COLORS,
  } = options || {};

  confetti({
    particleCount: Math.floor(particleCount * particleMultiplier),
    spread: 360,
    origin,
    colors,
    shapes: ["circle", "square"],
    gravity: 0.8,
    drift: 0,
    ticks: 200,
  });
};

/**
 * Continuous rain confetti from top
 */
export const rainConfetti = (options?: {
  duration?: number;
  particleCount?: number;
  colors?: string[];
}) => {
  const {
    duration = 3000,
    particleCount = 50,
    colors = THEME_COLORS,
  } = options || {};

  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: Math.floor(particleCount * particleMultiplier),
      angle: 90,
      spread: 55,
      startVelocity: 45,
      origin: { x: Math.random(), y: 0 },
      colors,
      gravity: 0.5,
      ticks: 200,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

/**
 * Dual-angle side confetti (enhanced version of HeroSection pattern)
 */
export const sideConfetti = (options?: {
  duration?: number;
  particleCount?: number;
  colors?: string[];
}) => {
  const {
    duration = 3000,
    particleCount = 3,
    colors = THEME_COLORS,
  } = options || {};

  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: Math.floor(particleCount * particleMultiplier),
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      shapes: ["circle", "square"],
    });
    confetti({
      particleCount: Math.floor(particleCount * particleMultiplier),
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      shapes: ["circle", "square"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

/**
 * Celebration confetti with multiple bursts
 */
export const celebrationConfetti = (options?: {
  bursts?: number;
  particleCount?: number;
  colors?: string[];
}) => {
  const {
    bursts = 5,
    particleCount = 100,
    colors = THEME_COLORS,
  } = options || {};

  for (let i = 0; i < bursts; i++) {
    setTimeout(() => {
      confetti({
        particleCount: Math.floor(particleCount * particleMultiplier),
        angle: Math.random() * 360,
        spread: 55 + Math.random() * 20,
        origin: {
          x: 0.3 + Math.random() * 0.4,
          y: 0.3 + Math.random() * 0.4,
        },
        colors,
        shapes: ["circle", "square", "star"],
        gravity: 0.8,
        ticks: 200,
      });
    }, i * 200);
  }
};

/**
 * Spiral pattern confetti
 */
export const spiralConfetti = (options?: {
  particleCount?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) => {
  const {
    particleCount = 200,
    origin = { x: 0.5, y: 0.5 },
    colors = THEME_COLORS,
  } = options || {};

  const count = Math.floor(particleCount * particleMultiplier);
  const angleIncrement = 360 / count;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      confetti({
        particleCount: 1,
        angle: i * angleIncrement,
        spread: 5,
        origin,
        colors,
        shapes: ["circle", "square"],
        gravity: 0.6,
        ticks: 200,
      });
    }, i * 10);
  }
};

// ============================================================================
// HEART RAIN EFFECT
// ============================================================================

interface HeartParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

/**
 * Heart rain effect using canvas
 */
export const heartRain = (options?: {
  duration?: number;
  heartCount?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    duration = 5000,
    heartCount = 30,
    colors = THEME_COLORS,
    canvasId = "heart-rain-canvas",
  } = options || {};

  // Remove existing canvas if present
  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create heart particles
  const hearts: HeartParticle[] = [];
  const count = Math.floor(heartCount * particleMultiplier);

  for (let i = 0; i < count; i++) {
    hearts.push({
      x: Math.random() * canvas.width,
      y: -50 - Math.random() * 200,
      size: 8 + Math.random() * 12,
      speed: 1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    });
  }

  // Draw heart shape
  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    // Left curve
    ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
    // Left bottom curve
    ctx.bezierCurveTo(
      -size / 2,
      size / 2 + topCurveHeight,
      0,
      size / 2 + topCurveHeight,
      0,
      size
    );
    // Right bottom curve
    ctx.bezierCurveTo(
      0,
      size / 2 + topCurveHeight,
      size / 2,
      size / 2 + topCurveHeight,
      size / 2,
      topCurveHeight
    );
    // Right curve
    ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
    ctx.fill();
    ctx.restore();
  };

  // Animation loop
  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hearts.forEach((heart) => {
      heart.y += heart.speed;
      heart.rotation += heart.rotationSpeed;

      if (heart.y > canvas.height + 50) {
        heart.y = -50;
        heart.x = Math.random() * canvas.width;
      }

      drawHeart(ctx, heart.x, heart.y, heart.size, heart.color, heart.rotation);
    });

    requestAnimationFrame(animate);
  };

  animate();

  // Cleanup on window resize
  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  // Remove resize listener after duration
  setTimeout(() => {
    window.removeEventListener("resize", handleResize);
  }, duration);
};

// ============================================================================
// SPARKLE EFFECTS
// ============================================================================

interface SparkleParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  angle: number;
  life: number;
  maxLife: number;
}

/**
 * Sparkle burst at specific coordinates
 */
export const sparkleBurst = (options?: {
  x?: number;
  y?: number;
  particleCount?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    x = window.innerWidth / 2,
    y = window.innerHeight / 2,
    particleCount = 20,
    colors = THEME_COLORS,
    canvasId = "sparkle-burst-canvas",
  } = options || {};

  // Remove existing canvas if present
  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const sparkles: SparkleParticle[] = [];
  const count = Math.floor(particleCount * particleMultiplier);

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    sparkles.push({
      x,
      y,
      size: 2 + Math.random() * 4,
      speed: 2 + Math.random() * 4,
      opacity: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: angle,
      life: 0,
      maxLife: 30 + Math.random() * 20,
    });
  }

  const drawSparkle = (
    ctx: CanvasRenderingContext2D,
    sparkle: SparkleParticle
  ) => {
    ctx.save();
    ctx.globalAlpha = sparkle.opacity;
    ctx.fillStyle = sparkle.color;
    ctx.strokeStyle = sparkle.color;

    // Draw sparkle as a cross/star
    const size = sparkle.size;
    ctx.beginPath();
    ctx.moveTo(sparkle.x, sparkle.y - size);
    ctx.lineTo(sparkle.x, sparkle.y + size);
    ctx.moveTo(sparkle.x - size, sparkle.y);
    ctx.lineTo(sparkle.x + size, sparkle.y);
    ctx.stroke();

    // Add glow
    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let aliveCount = 0;

    sparkles.forEach((sparkle) => {
      sparkle.life++;
      sparkle.x += Math.cos(sparkle.angle) * sparkle.speed;
      sparkle.y += Math.sin(sparkle.angle) * sparkle.speed;
      sparkle.opacity = 1 - sparkle.life / sparkle.maxLife;
      sparkle.size *= 0.98;

      if (sparkle.life < sparkle.maxLife && sparkle.opacity > 0) {
        drawSparkle(ctx, sparkle);
        aliveCount++;
      }
    });

    if (aliveCount > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  animate();
};

/**
 * Sparkle trail following mouse/cursor
 */
export const sparkleTrail = (options?: {
  duration?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    duration = 3000,
    colors = THEME_COLORS,
    canvasId = "sparkle-trail-canvas",
  } = options || {};

  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const sparkles: SparkleParticle[] = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const handleMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Add sparkle at mouse position
    sparkles.push({
      x: mouseX,
      y: mouseY,
      size: 3 + Math.random() * 3,
      speed: 0,
      opacity: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      life: 0,
      maxLife: 20 + Math.random() * 10,
    });
  };

  window.addEventListener("mousemove", handleMouseMove);

  const drawSparkle = (
    ctx: CanvasRenderingContext2D,
    sparkle: SparkleParticle
  ) => {
    ctx.save();
    ctx.globalAlpha = sparkle.opacity;
    ctx.fillStyle = sparkle.color;
    ctx.strokeStyle = sparkle.color;

    const size = sparkle.size;
    ctx.beginPath();
    ctx.moveTo(sparkle.x, sparkle.y - size);
    ctx.lineTo(sparkle.x, sparkle.y + size);
    ctx.moveTo(sparkle.x - size, sparkle.y);
    ctx.lineTo(sparkle.x + size, sparkle.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      canvas.remove();
      window.removeEventListener("mousemove", handleMouseMove);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparkles.forEach((sparkle) => {
      sparkle.life++;
      sparkle.opacity = 1 - sparkle.life / sparkle.maxLife;
      sparkle.size *= 0.95;

      if (sparkle.life < sparkle.maxLife && sparkle.opacity > 0) {
        drawSparkle(ctx, sparkle);
      }
    });

    // Remove dead sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      if (sparkles[i].life >= sparkles[i].maxLife) {
        sparkles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  };

  animate();
};

/**
 * Ambient sparkles for backgrounds
 */
export const ambientSparkles = (options?: {
  duration?: number;
  sparkleCount?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    duration = 10000,
    sparkleCount = 15,
    colors = THEME_COLORS,
    canvasId = "ambient-sparkles-canvas",
  } = options || {};

  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const sparkles: SparkleParticle[] = [];
  const count = Math.floor(sparkleCount * particleMultiplier);

  for (let i = 0; i < count; i++) {
    sparkles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 2 + Math.random() * 3,
      speed: 0.5 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 100,
    });
  }

  const drawSparkle = (
    ctx: CanvasRenderingContext2D,
    sparkle: SparkleParticle
  ) => {
    ctx.save();
    const alpha = sparkle.opacity * (0.5 + 0.5 * Math.sin((sparkle.life / sparkle.maxLife) * Math.PI * 2));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = sparkle.color;
    ctx.strokeStyle = sparkle.color;

    const size = sparkle.size;
    ctx.beginPath();
    ctx.moveTo(sparkle.x, sparkle.y - size);
    ctx.lineTo(sparkle.x, sparkle.y + size);
    ctx.moveTo(sparkle.x - size, sparkle.y);
    ctx.lineTo(sparkle.x + size, sparkle.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparkles.forEach((sparkle) => {
      sparkle.life++;
      if (sparkle.life > sparkle.maxLife) {
        sparkle.life = 0;
        sparkle.x = Math.random() * canvas.width;
        sparkle.y = Math.random() * canvas.height;
      }

      drawSparkle(ctx, sparkle);
    });

    requestAnimationFrame(animate);
  };

  animate();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  setTimeout(() => {
    window.removeEventListener("resize", handleResize);
  }, duration);
};

// ============================================================================
// PIXEL ART PARTICLES
// ============================================================================

interface PixelParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  maxLife: number;
}

/**
 * Pixel burst effect (8-bit aesthetic)
 */
export const pixelBurst = (options?: {
  x?: number;
  y?: number;
  particleCount?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    x = window.innerWidth / 2,
    y = window.innerHeight / 2,
    particleCount = 50,
    colors = THEME_COLORS,
    canvasId = "pixel-burst-canvas",
  } = options || {};

  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.style.imageRendering = "pixelated";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Enable pixelated rendering
  (ctx as any).imageSmoothingEnabled = false;

  const pixels: PixelParticle[] = [];
  const count = Math.floor(particleCount * particleMultiplier);

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    pixels.push({
      x,
      y,
      size: 4 + Math.random() * 6,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: 40 + Math.random() * 20,
    });
  }

  const drawPixel = (ctx: CanvasRenderingContext2D, pixel: PixelParticle) => {
    ctx.save();
    const alpha = 1 - pixel.life / pixel.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(
      Math.floor(pixel.x),
      Math.floor(pixel.y),
      Math.floor(pixel.size),
      Math.floor(pixel.size)
    );
    ctx.restore();
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let aliveCount = 0;

    pixels.forEach((pixel) => {
      pixel.life++;
      pixel.x += pixel.speedX;
      pixel.y += pixel.speedY;
      pixel.speedY += 0.2; // Gravity

      if (pixel.life < pixel.maxLife) {
        drawPixel(ctx, pixel);
        aliveCount++;
      }
    });

    if (aliveCount > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  animate();
};

/**
 * Pixel rain effect
 */
export const pixelRain = (options?: {
  duration?: number;
  particleCount?: number;
  colors?: string[];
  canvasId?: string;
}) => {
  const {
    duration = 5000,
    particleCount = 40,
    colors = THEME_COLORS,
    canvasId = "pixel-rain-canvas",
  } = options || {};

  const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.style.imageRendering = "pixelated";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  (ctx as any).imageSmoothingEnabled = false;

  const pixels: PixelParticle[] = [];
  const count = Math.floor(particleCount * particleMultiplier);

  for (let i = 0; i < count; i++) {
    pixels.push({
      x: Math.random() * canvas.width,
      y: -50 - Math.random() * 200,
      size: 4 + Math.random() * 8,
      speedX: (Math.random() - 0.5) * 1,
      speedY: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: 1000,
    });
  }

  const drawPixel = (ctx: CanvasRenderingContext2D, pixel: PixelParticle) => {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(
      Math.floor(pixel.x),
      Math.floor(pixel.y),
      Math.floor(pixel.size),
      Math.floor(pixel.size)
    );
  };

  const startTime = Date.now();
  const animate = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((pixel) => {
      pixel.x += pixel.speedX;
      pixel.y += pixel.speedY;

      if (pixel.y > canvas.height + 50) {
        pixel.y = -50;
        pixel.x = Math.random() * canvas.width;
      }

      drawPixel(ctx, pixel);
    });

    requestAnimationFrame(animate);
  };

  animate();

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", handleResize);

  setTimeout(() => {
    window.removeEventListener("resize", handleResize);
  }, duration);
};




