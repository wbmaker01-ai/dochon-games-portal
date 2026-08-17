// Pure Physics, Ball Trajectory, Timing Judgment & Particle Engine for Dochon Cricket

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BOWLER_POS,
  BATTER_POS,
  WICKET_POS,
  PITCH_BOUNCE_Y,
  PITCH_TYPES,
  TIMING_THRESHOLDS,
  HIT_RESULTS,
  SPEED_LEVELS
} from './cricketConstants';

/**
 * Creates a transparent sprite canvas from a source image by flood-filling the outer white background.
 * Preserves all internal white details (eyes, clothes, pads) with 100% opacity.
 */
export function createTransparentSprite(img, threshold = 220) {
  const offCanvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width || 400;
  const h = img.naturalHeight || img.height || 400;
  offCanvas.width = w;
  offCanvas.height = h;

  const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const queue = [];

    const isBackgroundPixel = (x, y) => {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return r >= threshold && g >= threshold && b >= threshold;
    };

    // Seed top and bottom borders
    for (let x = 0; x < w; x++) {
      if (isBackgroundPixel(x, 0)) {
        queue.push((0 << 16) | x);
        visited[0 * w + x] = 1;
      }
      if (isBackgroundPixel(x, h - 1)) {
        queue.push(((h - 1) << 16) | x);
        visited[(h - 1) * w + x] = 1;
      }
    }
    // Seed left and right borders
    for (let y = 0; y < h; y++) {
      if (isBackgroundPixel(0, y) && !visited[y * w + 0]) {
        queue.push((y << 16) | 0);
        visited[y * w + 0] = 1;
      }
      if (isBackgroundPixel(w - 1, y) && !visited[y * w + (w - 1)]) {
        queue.push((y << 16) | (w - 1));
        visited[y * w + (w - 1)] = 1;
      }
    }

    let head = 0;
    while (head < queue.length) {
      const val = queue[head++];
      const cx = val & 0xffff;
      const cy = val >>> 16;
      const idx = (cy * w + cx) * 4;
      data[idx + 3] = 0; // Transparent

      // 4-directional flood fill
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const vIdx = ny * w + nx;
          if (!visited[vIdx] && isBackgroundPixel(nx, ny)) {
            visited[vIdx] = 1;
            queue.push((ny << 16) | nx);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('Canvas flood fill fallback:', e);
  }

  return offCanvas;
}

/**
 * Calculate dynamic pitch speed and speed tier level based on score progression
 */
export function calculatePitchSpeed(score = 0, pitchConfig = PITCH_TYPES.FASTBALL) {
  const safeScore = Math.max(0, Number(score) || 0);

  let currentTier = SPEED_LEVELS[0];
  for (let i = SPEED_LEVELS.length - 1; i >= 0; i--) {
    if (safeScore >= SPEED_LEVELS[i].minScore) {
      currentTier = SPEED_LEVELS[i];
      break;
    }
  }

  // Speed multiplier formula: 1.0 -> 1.6x max
  const expFactor = 1 - Math.exp(-safeScore / 220);
  const multiplier = 1.0 + 0.55 * expFactor;

  const baseSpeed = pitchConfig?.baseSpeed || 1700;
  const actualDuration = Math.max(720, Math.round(baseSpeed / multiplier));

  return {
    actualDuration,
    speedLevel: currentTier,
    speedMultiplier: Number(multiplier.toFixed(2))
  };
}

/**
 * Weighted pitch selection based on score
 */
export function selectNextPitch(score = 0) {
  const safeScore = Math.max(0, Number(score) || 0);

  if (safeScore < 25) {
    return Math.random() < 0.75 ? PITCH_TYPES.FASTBALL : PITCH_TYPES.SLOW_BOUNCER;
  } else if (safeScore < 60) {
    const roll = Math.random();
    if (roll < 0.45) return PITCH_TYPES.FASTBALL;
    if (roll < 0.75) return PITCH_TYPES.SLOW_BOUNCER;
    return PITCH_TYPES.SLIDER;
  } else if (safeScore < 120) {
    const roll = Math.random();
    if (roll < 0.3) return PITCH_TYPES.FASTBALL;
    if (roll < 0.55) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.8) return PITCH_TYPES.SLIDER;
    return PITCH_TYPES.GOOGLY;
  } else {
    const roll = Math.random();
    if (roll < 0.25) return PITCH_TYPES.FIRE_YORKER;
    if (roll < 0.5) return PITCH_TYPES.GOOGLY;
    if (roll < 0.75) return PITCH_TYPES.SLIDER;
    return PITCH_TYPES.CHANGEUP;
  }
}

/**
 * 3D Perspective Cricket Pitch Ball Trajectory Calculation
 * Progress 0.0 (Bowler hand) -> ~0.55 (Turf bounce) -> 1.0 (Bat/Wicket contact)
 */
export function calculateBallState(progress, pitchConfig) {
  const t = Math.max(0, Math.min(1.0, progress));
  const bounceT = 0.52; // Moment ball bounces on pitch turf

  const startX = BOWLER_POS.x;
  const startY = BOWLER_POS.y + 10;
  const targetX = BATTER_POS.x;
  const targetY = BATTER_POS.y + 15;

  let x, y, shadowY, shadowAlpha, scale, isBouncingMoment = false;

  // Longitudinal linear interpolation
  const currentGroundY = startY + (targetY - startY) * t;

  if (t <= bounceT) {
    // Phase 1: In the air descending from bowler hand to bounce point
    const subT = t / bounceT;
    const arcHeight = 35 * (1 - subT * subT); // Descending arc
    y = startY + (PITCH_BOUNCE_Y - startY) * subT - arcHeight;
    x = startX + (targetX - startX) * 0.45 * subT;
    shadowY = startY + (PITCH_BOUNCE_Y - startY) * subT;
    shadowAlpha = 0.2 + 0.5 * subT;
  } else {
    // Phase 2: Post-bounce rising arc towards batter
    const subT = (t - bounceT) / (1 - bounceT);
    const bounceHeight = pitchConfig.bounceHeight || 35;
    // Parabolic bounce arc: 4 * h * subT * (1 - subT)
    const arcHeight = bounceHeight * 4 * subT * (1 - subT * 0.75);

    const curveOffset = (pitchConfig.curveAmount || 0) * Math.sin(subT * Math.PI);
    x = startX + (targetX - startX) * (0.45 + 0.55 * subT) + curveOffset;
    y = PITCH_BOUNCE_Y + (targetY - PITCH_BOUNCE_Y) * subT - arcHeight;
    shadowY = PITCH_BOUNCE_Y + (targetY - PITCH_BOUNCE_Y) * subT;
    shadowAlpha = Math.max(0.2, 0.7 - 0.4 * (arcHeight / bounceHeight));
  }

  // Scale expands as ball approaches screen (0.45x -> 1.1x)
  scale = 0.45 + 0.65 * t;

  return {
    x,
    y,
    shadowX: x,
    shadowY,
    shadowAlpha,
    scale,
    radius: 9 * scale,
    progress: t,
    isPostBounce: t > bounceT
  };
}

/**
 * Judge bat swing timing
 */
export function judgeSwing(timeDiffMs) {
  const absDiff = Math.abs(timeDiffMs);

  if (absDiff <= TIMING_THRESHOLDS.PERFECT) {
    return { result: HIT_RESULTS.SIX, diff: timeDiffMs, rating: 'PERFECT' };
  } else if (absDiff <= TIMING_THRESHOLDS.GREAT) {
    return { result: HIT_RESULTS.FOUR, diff: timeDiffMs, rating: 'GREAT' };
  } else if (absDiff <= TIMING_THRESHOLDS.GOOD) {
    return { result: HIT_RESULTS.TWO_RUNS, diff: timeDiffMs, rating: 'GOOD' };
  } else if (absDiff <= TIMING_THRESHOLDS.OK) {
    return { result: HIT_RESULTS.ONE_RUN, diff: timeDiffMs, rating: 'OK' };
  } else {
    return { result: null, diff: timeDiffMs, rating: 'MISS' };
  }
}

/**
 * Particle System for Hits, Fireworks, Dust, and Shattered Wickets
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addHitSparks(x, y, count = 25, color = '#FBBF24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.15,
        type: 'spark'
      });
    }
  }

  addConfetti(x, y, count = 60) {
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#FBBF24'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 4 + Math.random() * 9;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.015,
        gravity: 0.12,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        type: 'confetti'
      });
    }
  }

  addBounceDust(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: 'rgba(217, 180, 130, 0.7)',
        alpha: 0.8,
        decay: 0.04 + Math.random() * 0.03,
        gravity: -0.02,
        type: 'dust'
      });
    }
  }

  addWicketSplinters(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 8,
        color: '#D97706',
        alpha: 1.0,
        decay: 0.02,
        gravity: 0.22,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 25,
        type: 'splinter'
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.alpha -= p.decay;
      if (p.rotation !== undefined) {
        p.rotation += p.rotSpeed || 0;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'confetti' || p.type === 'splinter') {
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}

/**
 * Animated Wickets (Stumps & Bails) Entity
 */
export class WicketEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.isShattered = false;
    this.stumps = [
      { xOffset: -12, angle: 0, vAngle: 0, vx: 0, vy: 0 },
      { xOffset: 0, angle: 0, vAngle: 0, vx: 0, vy: 0 },
      { xOffset: 12, angle: 0, vAngle: 0, vx: 0, vy: 0 }
    ];
    this.bails = [
      { xOffset: -6, yOffset: -38, angle: 0, vx: 0, vy: 0, vAngle: 0 },
      { xOffset: 6, yOffset: -38, angle: 0, vx: 0, vy: 0, vAngle: 0 }
    ];
  }

  shatter() {
    if (this.isShattered) return;
    this.isShattered = true;

    this.stumps[0].vx = -2.5 - Math.random() * 2;
    this.stumps[0].vy = -3 - Math.random() * 3;
    this.stumps[0].vAngle = -0.12;

    this.stumps[1].vx = (Math.random() - 0.5) * 2;
    this.stumps[1].vy = -4 - Math.random() * 4;
    this.stumps[1].vAngle = 0.08;

    this.stumps[2].vx = 2.5 + Math.random() * 2;
    this.stumps[2].vy = -3 - Math.random() * 3;
    this.stumps[2].vAngle = 0.15;

    this.bails[0].vx = -3.5 + Math.random() * 2;
    this.bails[0].vy = -7 - Math.random() * 4;
    this.bails[0].vAngle = 0.25;

    this.bails[1].vx = 3.5 + Math.random() * 2;
    this.bails[1].vy = -7 - Math.random() * 4;
    this.bails[1].vAngle = -0.25;
  }

  update() {
    if (!this.isShattered) return;

    this.stumps.forEach((s) => {
      s.xOffset += s.vx;
      s.vy += 0.25;
      s.angle += s.vAngle;
    });

    this.bails.forEach((b) => {
      b.xOffset += b.vx;
      b.yOffset += b.vy;
      b.vy += 0.28;
      b.angle += b.vAngle;
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Stumps (Wooden posts)
    this.stumps.forEach((s) => {
      ctx.save();
      ctx.translate(s.xOffset, 0);
      ctx.rotate(s.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(-3, 2, 6, 4);

      // Wood stump body
      ctx.fillStyle = '#D97706';
      ctx.fillRect(-3, -36, 6, 36);

      // Highlight line
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(-2, -36, 2, 36);

      // Stump crown cap
      ctx.fillStyle = '#B45309';
      ctx.fillRect(-4, -38, 8, 3);

      ctx.restore();
    });

    // Bails (Crossbars on top)
    this.bails.forEach((b) => {
      ctx.save();
      ctx.translate(b.xOffset, b.yOffset);
      ctx.rotate(b.angle);

      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillStyle = '#B45309';
      ctx.strokeRect(-8, -2, 16, 4);

      ctx.restore();
    });

    ctx.restore();
  }

  reset() {
    this.isShattered = false;
    this.stumps = [
      { xOffset: -12, angle: 0, vAngle: 0, vx: 0, vy: 0 },
      { xOffset: 0, angle: 0, vAngle: 0, vx: 0, vy: 0 },
      { xOffset: 12, angle: 0, vAngle: 0, vx: 0, vy: 0 }
    ];
    this.bails = [
      { xOffset: -6, yOffset: -38, angle: 0, vx: 0, vy: 0, vAngle: 0 },
      { xOffset: 6, yOffset: -38, angle: 0, vx: 0, vy: 0, vAngle: 0 }
    ];
  }
}
