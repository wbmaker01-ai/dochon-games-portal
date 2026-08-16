// Dochon Baseball Game Physics, Trajectory, Timing Judgments, and Particle Logic

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PITCHER_POS,
  BATTER_POS,
  HOME_PLATE_POS,
  PITCH_TYPES,
  TIMING_THRESHOLDS,
  HIT_RESULTS
} from './baseballConstants';

/**
 * Creates a transparent sprite canvas from a source image by keying out white background
 */
export function createTransparentSprite(img, threshold = 235) {
  const offCanvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width || 400;
  const h = img.naturalHeight || img.height || 400;
  offCanvas.width = w;
  offCanvas.height = h;

  const ctx = offCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Solid white or near-white background removal
      if (r >= threshold && g >= threshold && b >= threshold) {
        data[i + 3] = 0;
      } else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
        // Soft anti-aliasing edge blending
        const avg = (r + g + b) / 3;
        const alphaRatio = (255 - avg) / 25;
        data[i + 3] = Math.max(0, Math.min(255, Math.floor(data[i + 3] * alphaRatio)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // In case of any cross-origin restrictions, fallback to original canvas
  }

  return offCanvas;
}

/**
 * Select the next pitch type based on score progression and combo
 */
export function selectNextPitch(score, combo) {
  const roll = Math.random();

  if (score < 400) {
    // Beginner: Mostly Fastball & Slowball
    if (roll < 0.65) return PITCH_TYPES.FASTBALL;
    return PITCH_TYPES.SLOWBALL;
  } else if (score < 1000) {
    // Intermediate: Fastball, Slowball, Changeup, Curve
    if (roll < 0.4) return PITCH_TYPES.FASTBALL;
    if (roll < 0.65) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.85) return PITCH_TYPES.CURVE;
    return PITCH_TYPES.SLOWBALL;
  } else if (score < 2000) {
    // Advanced: Fastball, Changeup, Curve, Sinker
    if (roll < 0.3) return PITCH_TYPES.FASTBALL;
    if (roll < 0.55) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.75) return PITCH_TYPES.CURVE;
    if (roll < 0.9) return PITCH_TYPES.SINKER;
    return PITCH_TYPES.ZIGZAG;
  } else if (score < 3500) {
    // Master: All types + Zigzag & Ghost
    if (roll < 0.25) return PITCH_TYPES.ZIGZAG;
    if (roll < 0.5) return PITCH_TYPES.GHOST;
    if (roll < 0.7) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.85) return PITCH_TYPES.CURVE;
    return PITCH_TYPES.FIREBALL;
  } else {
    // Grandmaster: Fast Fireball, Ghost, Zigzag, Sinker
    if (roll < 0.3) return PITCH_TYPES.FIREBALL;
    if (roll < 0.55) return PITCH_TYPES.GHOST;
    if (roll < 0.8) return PITCH_TYPES.ZIGZAG;
    return PITCH_TYPES.CHANGEUP;
  }
}

/**
 * Calculate instantaneous 3D perspective ball coordinates and shadow mapping
 */
export function calculateBallState(pitchConfig, elapsedMs, totalDuration) {
  const safeDuration = Math.max(500, Number(totalDuration) || 2000);
  const rawProgress = Math.min(1, Math.max(0, Number(elapsedMs) / safeDuration));
  let progress = rawProgress;

  // Handle changeup nonlinear deceleration safely
  if (pitchConfig?.id === 'CHANGEUP' && pitchConfig.deceleratePoint) {
    const p1 = pitchConfig.deceleratePoint || 0.5;
    if (progress > p1) {
      const rem = Math.max(0, Math.min(1, (progress - p1) / (1 - p1)));
      const factor = pitchConfig.decelerateFactor || 1.6;
      progress = p1 + Math.pow(rem, factor) * (1 - p1);
    }
  }

  // 3D Perspective Scaling (Z: 0 = Pitcher Mound, 1 = Home Plate)
  const z = Math.max(0, Math.min(1, progress));
  const radius = Math.max(8, 8 + z * 18); // Ball expands from 8px to 26px
  const shadowRadiusX = Math.max(6, 6 + z * 16);
  const shadowRadiusY = shadowRadiusX * 0.45;

  // 1. Ground Surface Track (Perspective line from Mound to Home Plate)
  const groundStartY = PITCHER_POS.y + 10; // Y = 165
  const groundTargetY = HOME_PLATE_POS.y;   // Y = 460
  let groundX = PITCHER_POS.x;              // X = 480
  let groundY = groundStartY + (groundTargetY - groundStartY) * z;

  // Lateral curve movement on ground X
  if (pitchConfig?.id === 'CURVE') {
    const amp = pitchConfig.curveAmplitude || 60;
    groundX += Math.sin(progress * Math.PI) * amp;
  } else if (pitchConfig?.id === 'ZIGZAG') {
    const freq = pitchConfig.zigzagFreq || 4;
    const amp = pitchConfig.zigzagAmp || 40;
    groundX += Math.sin(progress * Math.PI * freq) * amp * (1 - progress * 0.2);
  }

  // 2. 3D Elevation / Ball Flight Height above ground
  const maxArc = pitchConfig?.id === 'SLOWBALL' ? 55 : (pitchConfig?.id === 'FASTBALL' ? 20 : 30);
  let flightHeight = Math.sin(progress * Math.PI) * maxArc + (1 - progress) * 12;

  // Sinker drops sharply near plate
  if (pitchConfig?.id === 'SINKER' && progress > 0.55) {
    const sinkProgress = (progress - 0.55) / 0.45;
    flightHeight -= Math.pow(sinkProgress, 2) * (pitchConfig.verticalDrop || 35);
    flightHeight = Math.max(0, flightHeight);
  }

  // 3. Final 2D Screen Projected Position
  const ballX = isFinite(groundX) ? groundX : 480;
  const ballY = isFinite(groundY - flightHeight) ? (groundY - flightHeight) : 300;

  // Ghost ball opacity handling
  let opacity = 1;
  if (pitchConfig?.id === 'GHOST' && pitchConfig.disappearRange) {
    const [dStart, dEnd] = pitchConfig.disappearRange;
    if (progress >= dStart && progress <= dEnd) {
      opacity = 0.08; // Almost invisible
    } else if (progress > dEnd && progress < dEnd + 0.12) {
      opacity = (progress - dEnd) / 0.12;
    }
  }

  // Sweet spot convergence ring on home plate
  const timingRingRadius = Math.max(0, (1 - progress) * 45);

  return {
    x: ballX,
    y: ballY,
    shadowX: groundX,
    shadowY: groundY,
    radius,
    shadowRadiusX,
    shadowRadiusY,
    progress,
    opacity,
    timingRingRadius,
    isAtSweetSpot: progress >= 0.88 && progress <= 1.05
  };
}

/**
 * Judge Batting Swing Timing and calculate Hit Result
 */
export function judgeSwing(swingTimeMs, targetArrivalMs, pitchConfig, currentRunners = [false, false, false]) {
  const diffMs = swingTimeMs - targetArrivalMs; // Negative = Early, Positive = Late
  const absDiff = Math.abs(diffMs);

  let resultType = null;
  let distance = 0;
  let exitAngle = 0; // Degrees
  let timingFeedback = '';

  if (diffMs < -TIMING_THRESHOLDS.FOUL) {
    // Too Early
    resultType = HIT_RESULTS.STRIKE;
    timingFeedback = '너무 빨랐어요! (TOO EARLY)';
  } else if (diffMs > TIMING_THRESHOLDS.FOUL) {
    // Too Late
    resultType = HIT_RESULTS.STRIKE;
    timingFeedback = '너무 늦었어요! (TOO LATE)';
  } else if (absDiff <= TIMING_THRESHOLDS.PERFECT) {
    // Perfect Homerun
    const isBasesLoaded = currentRunners[0] && currentRunners[1] && currentRunners[2];
    resultType = isBasesLoaded ? HIT_RESULTS.GRAND_SLAM : HIT_RESULTS.HOMERUN;
    distance = Math.floor(115 + Math.random() * 35 + (35 - absDiff) * 0.5); // 115m ~ 150m
    exitAngle = -45 + (Math.random() * 10 - 5);
    timingFeedback = isBasesLoaded ? '🔥 대폭발 만루 홈런!! PERFECT!!' : '💥 장외 대형 홈런!! PERFECT!!';
  } else if (absDiff <= TIMING_THRESHOLDS.GREAT) {
    // Great Hit: Double or Triple
    const roll = Math.random();
    if (roll < 0.45) {
      resultType = HIT_RESULTS.TRIPLE;
      distance = Math.floor(85 + Math.random() * 20);
      timingFeedback = '⚡ 총알같은 3루타! GREAT!!';
    } else {
      resultType = HIT_RESULTS.DOUBLE;
      distance = Math.floor(65 + Math.random() * 20);
      timingFeedback = '✨ 펜스 직격 2루타! GREAT!';
    }
    exitAngle = diffMs < 0 ? -30 : -60;
  } else if (absDiff <= TIMING_THRESHOLDS.GOOD) {
    // Good Hit: Single
    resultType = HIT_RESULTS.SINGLE;
    distance = Math.floor(40 + Math.random() * 22);
    timingFeedback = '⚾ 깔끔한 안타! GOOD!';
    exitAngle = diffMs < 0 ? -20 : -70;
  } else {
    // Foul Ball
    resultType = HIT_RESULTS.FOUL;
    distance = Math.floor(25 + Math.random() * 20);
    timingFeedback = diffMs < 0 ? '⚠️ 당겨친 파울 (EARLY FOUL)' : '⚠️ 밀어친 파울 (LATE FOUL)';
    exitAngle = diffMs < 0 ? -10 : -80;
  }

  return {
    ...resultType,
    diffMs,
    distance,
    exitAngle,
    timingFeedback
  };
}

/**
 * Advance Runners on the Diamond
 * @param {Array<boolean>} currentRunners [1B, 2B, 3B]
 * @param {number} hitBases 1 (Single), 2 (Double), 3 (Triple), 4 (Homerun)
 * @returns {{ newRunners: Array<boolean>, runsScored: number, isGrandSlam: boolean }}
 */
export function advanceRunners(currentRunners, hitBases) {
  if (hitBases <= 0) {
    return { newRunners: [...currentRunners], runsScored: 0, isGrandSlam: false };
  }

  let runsScored = 0;
  const isGrandSlam = hitBases >= 4 && currentRunners[0] && currentRunners[1] && currentRunners[2];

  if (hitBases >= 4) {
    // Homerun: all existing runners + batter score
    runsScored = 1 + (currentRunners[0] ? 1 : 0) + (currentRunners[1] ? 1 : 0) + (currentRunners[2] ? 1 : 0);
    return { newRunners: [false, false, false], runsScored, isGrandSlam };
  }

  // Track runners on numbered positions [1, 2, 3]
  let runnerPositions = [];
  if (currentRunners[0]) runnerPositions.push(1);
  if (currentRunners[1]) runnerPositions.push(2);
  if (currentRunners[2]) runnerPositions.push(3);

  // Batter becomes a runner advancing to hitBases
  runnerPositions.push(0);

  const nextPositions = [];
  for (const pos of runnerPositions) {
    const newPos = pos + hitBases;
    if (newPos >= 4) {
      runsScored++;
    } else {
      nextPositions.push(newPos);
    }
  }

  const nextRunners = [
    nextPositions.includes(1),
    nextPositions.includes(2),
    nextPositions.includes(3)
  ];

  return {
    newRunners: nextRunners,
    runsScored,
    isGrandSlam: false
  };
}

/**
 * Particle System for Baseball Visual Effects
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addHitSparks(x, y, count = 25, color = '#FBBF24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.18
      });
    }
  }

  addHomerunFireworks(centerX = CANVAS_WIDTH / 2, centerY = CANVAS_HEIGHT / 3, count = 70) {
    const colors = ['#F43F5E', '#FBBF24', '#38BDF8', '#34D399', '#A855F7', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push({
        x: centerX + (Math.random() * 160 - 80),
        y: centerY + (Math.random() * 100 - 50),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 3 + Math.random() * 5,
        color,
        alpha: 1,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        gravity: 0.12
      });
    }
  }

  addFireballTrail(x, y) {
    this.particles.push({
      x: x + (Math.random() * 8 - 4),
      y: y + (Math.random() * 8 - 4),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 4 + Math.random() * 6,
      color: Math.random() > 0.5 ? '#EF4444' : '#F59E0B',
      alpha: 0.85,
      life: 1,
      decay: 0.06,
      gravity: -0.05
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}
