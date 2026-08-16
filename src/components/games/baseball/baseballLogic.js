// Dochon Baseball Game Physics, Trajectory, Timing Judgments, and Particle Logic

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PITCHER_POS,
  BATTER_POS,
  HOME_PLATE_POS,
  PITCH_TYPES,
  TIMING_THRESHOLDS,
  HIT_RESULTS,
  SPEED_LEVELS
} from './baseballConstants';

/**
 * Calculate dynamic pitch speed and speed tier level based on score progression
 * Uses an Asymptotic Exponential decay model ensuring min reaction duration (>= 800ms)
 * @param {number} score Current game score
 * @param {Object} pitchConfig Pitch configuration object
 * @returns {{ actualDuration: number, speedLevel: Object, speedMultiplier: number }}
 */
export function calculatePitchSpeed(score = 0, pitchConfig = PITCH_TYPES.FASTBALL) {
  const safeScore = Math.max(0, Number(score) || 0);

  // 1. Identify discrete Speed Tier
  let currentTier = SPEED_LEVELS[0];
  for (let i = SPEED_LEVELS.length - 1; i >= 0; i--) {
    if (safeScore >= SPEED_LEVELS[i].minScore) {
      currentTier = SPEED_LEVELS[i];
      break;
    }
  }

  // 2. Continuous Asymptotic Exponential Acceleration Formula:
  // SpeedScale = 1.0 + 0.55 * (1 - e^(-Score / 2500))
  const expFactor = 1 - Math.exp(-safeScore / 2500);
  const continuousMultiplier = 1.0 + 0.55 * expFactor;

  // 3. Bound actual duration with human reaction limit (min 800ms)
  const baseSpeed = pitchConfig?.baseSpeed || 2000;
  const actualDuration = Math.max(800, Math.round(baseSpeed / continuousMultiplier));

  return {
    actualDuration,
    speedLevel: currentTier,
    speedMultiplier: Number(continuousMultiplier.toFixed(2))
  };
}

/**
 * Creates a transparent sprite canvas from a source image by flood-filling the outer white background.
 * Preserves all internal white details (pants, eyes, gloves, socks) with 100% opacity!
 */
export function createTransparentSprite(img, threshold = 225) {
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

    // Fast boundary-connected flood fill (BFS) so internal whites stay solid!
    const isBackground = new Uint8Array(w * h);
    const queue = [];

    const isWhite = (idx) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return r >= threshold && g >= threshold && b >= threshold;
    };

    // Enqueue top & bottom border pixels
    for (let x = 0; x < w; x++) {
      const topIdx = (0 * w + x) * 4;
      if (isWhite(topIdx)) {
        isBackground[x] = 1;
        queue.push(x);
      }
      const bPos = (h - 1) * w + x;
      const bottomIdx = bPos * 4;
      if (isWhite(bottomIdx)) {
        isBackground[bPos] = 1;
        queue.push(bPos);
      }
    }

    // Enqueue left & right border pixels
    for (let y = 0; y < h; y++) {
      const lPos = y * w;
      const leftIdx = lPos * 4;
      if (!isBackground[lPos] && isWhite(leftIdx)) {
        isBackground[lPos] = 1;
        queue.push(lPos);
      }
      const rPos = y * w + (w - 1);
      const rightIdx = rPos * 4;
      if (!isBackground[rPos] && isWhite(rightIdx)) {
        isBackground[rPos] = 1;
        queue.push(rPos);
      }
    }

    // BFS Queue Expansion
    let head = 0;
    while (head < queue.length) {
      const pos = queue[head++];
      const px = pos % w;
      const py = Math.floor(pos / w);

      const neighbors = [
        px > 0 ? pos - 1 : -1,
        px < w - 1 ? pos + 1 : -1,
        py > 0 ? pos - w : -1,
        py < h - 1 ? pos + w : -1
      ];

      for (const nPos of neighbors) {
        if (nPos >= 0 && !isBackground[nPos]) {
          const nIdx = nPos * 4;
          if (isWhite(nIdx)) {
            isBackground[nPos] = 1;
            queue.push(nPos);
          }
        }
      }
    }

    // Apply transparency ONLY to verified external background pixels
    for (let i = 0; i < w * h; i++) {
      if (isBackground[i]) {
        data[i * 4 + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('createTransparentSprite fallback:', e);
  }

  return offCanvas;
}

/**
 * Select the next pitch type based on score progression, combo, and deceptive ball probability
 */
export function selectNextPitch(score, combo) {
  const roll = Math.random();

  // Idea 5: Deceptive Bad Ball (15% ~ 22% chance after score >= 400)
  if (score >= 400 && Math.random() < (score >= 2000 ? 0.22 : 0.15)) {
    const badRoll = Math.random();
    if (badRoll < 0.35) return PITCH_TYPES.BAD_BALL_HIGH;
    if (badRoll < 0.7) return PITCH_TYPES.BAD_BALL_LOW;
    return PITCH_TYPES.BAD_BALL_WIDE;
  }

  if (score < 400) {
    // Beginner: Fastball & Slowball
    if (roll < 0.65) return PITCH_TYPES.FASTBALL;
    return PITCH_TYPES.SLOWBALL;
  } else if (score < 1000) {
    // Intermediate: Fastball, Slowball, Changeup, Curve
    if (roll < 0.35) return PITCH_TYPES.FASTBALL;
    if (roll < 0.6) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.85) return PITCH_TYPES.CURVE;
    return PITCH_TYPES.SLOWBALL;
  } else if (score < 2000) {
    // Advanced: Fastball, Changeup, Curve, Sinker, Zigzag
    if (roll < 0.25) return PITCH_TYPES.FASTBALL;
    if (roll < 0.5) return PITCH_TYPES.CHANGEUP;
    if (roll < 0.7) return PITCH_TYPES.CURVE;
    if (roll < 0.88) return PITCH_TYPES.SINKER;
    return PITCH_TYPES.ZIGZAG;
  } else if (score < 3500) {
    // Master: Zigzag, Ghost, Sinker, Fireball
    if (roll < 0.25) return PITCH_TYPES.ZIGZAG;
    if (roll < 0.5) return PITCH_TYPES.GHOST;
    if (roll < 0.7) return PITCH_TYPES.SINKER;
    if (roll < 0.85) return PITCH_TYPES.CHANGEUP;
    return PITCH_TYPES.FIREBALL;
  } else {
    // Grandmaster: Fast Fireball, Ghost, Zigzag, Sinker
    if (roll < 0.35) return PITCH_TYPES.FIREBALL;
    if (roll < 0.6) return PITCH_TYPES.GHOST;
    if (roll < 0.8) return PITCH_TYPES.ZIGZAG;
    return PITCH_TYPES.SINKER;
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
      const factor = pitchConfig.decelerateFactor || 1.9;
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
    const amp = pitchConfig.curveAmplitude || 70;
    groundX += Math.sin(progress * Math.PI) * amp;
  } else if (pitchConfig?.id === 'ZIGZAG') {
    const freq = pitchConfig.zigzagFreq || 4.5;
    const amp = pitchConfig.zigzagAmp || 45;
    groundX += Math.sin(progress * Math.PI * freq) * amp * (1 - progress * 0.2);
  } else if (pitchConfig?.lateralOffset) {
    // Bad Ball Lateral Drift
    groundX += pitchConfig.lateralOffset * Math.pow(progress, 1.8);
  }

  // 2. 3D Elevation / Ball Flight Height above ground
  const maxArc = pitchConfig?.id === 'SLOWBALL' ? 55 : (pitchConfig?.id === 'FASTBALL' ? 20 : 30);
  let flightHeight = Math.sin(progress * Math.PI) * maxArc + (1 - progress) * 12;

  // Sinker drops sharply near plate
  if (pitchConfig?.id === 'SINKER' && progress > 0.55) {
    const sinkProgress = (progress - 0.55) / 0.45;
    flightHeight -= Math.pow(sinkProgress, 2) * (pitchConfig.verticalDrop || 45);
    flightHeight = Math.max(0, flightHeight);
  } else if (pitchConfig?.verticalOffset) {
    // Bad Ball Elevation Drift (High or Low into the dirt)
    flightHeight += pitchConfig.verticalOffset * Math.pow(progress, 1.5);
  }

  // 3. Final 2D Screen Projected Position
  const ballX = isFinite(groundX) ? groundX : 480;
  const ballY = isFinite(groundY - flightHeight) ? (groundY - flightHeight) : 300;

  // Ghost ball translucent opacity handling
  let opacity = 1;
  if (pitchConfig?.id === 'GHOST' && pitchConfig.disappearRange) {
    const [dStart, dEnd] = pitchConfig.disappearRange;
    if (progress >= dStart && progress <= dEnd) {
      opacity = 0.25; // Translucent ghostly sphere
    } else if (progress > dEnd && progress < dEnd + 0.15) {
      opacity = 0.25 + ((progress - dEnd) / 0.15) * 0.75;
    } else if (progress < dStart && progress > dStart - 0.10) {
      opacity = 1.0 - ((progress - (dStart - 0.10)) / 0.10) * 0.75;
    }
  }

  // Sweet spot convergence ring on home plate
  const timingRingRadius = Math.max(0, (1 - progress) * 45);

  return {
    x: isFinite(ballX) ? ballX : 480,
    y: isFinite(ballY) ? ballY : 400,
    shadowX: isFinite(groundX) ? groundX : 480,
    shadowY: isFinite(groundY) ? groundY : 460,
    radius: Math.max(8, isFinite(radius) ? radius : 10),
    shadowRadiusX: Math.max(6, isFinite(shadowRadiusX) ? shadowRadiusX : 8),
    shadowRadiusY: Math.max(3, isFinite(shadowRadiusY) ? shadowRadiusY : 4),
    progress,
    opacity: Math.max(0.15, Math.min(1, isFinite(opacity) ? opacity : 1)),
    timingRingRadius: Math.max(0, isFinite(timingRingRadius) ? timingRingRadius : 0),
    isAtSweetSpot: progress >= 0.82 && progress <= 1.05
  };
}

/**
 * Judge Batting Swing Timing and calculate Hit Result
 * Incorporates:
 * 1. Idea 2: Fly Out & Ground Out for mistimed swings
 * 2. Idea 3: Dynamic Timing Window Scale based on Speed Tier
 * 3. Idea 5: Deceptive Bad Ball Swing Penalty
 */
export function judgeSwing(swingTimeMs, targetArrivalMs, pitchConfig, currentRunners = [false, false, false], speedLevel = SPEED_LEVELS[0]) {
  const diffMs = swingTimeMs - targetArrivalMs; // Negative = Early, Positive = Late
  const absDiff = Math.abs(diffMs);

  // If swinging at a Bad Ball (유인구):
  if (pitchConfig?.isBadBall) {
    if (Math.random() < 0.6) {
      const isFly = Math.random() < 0.5;
      return {
        ...(isFly ? HIT_RESULTS.FLY_OUT : HIT_RESULTS.GROUND_OUT),
        diffMs,
        distance: Math.floor(30 + Math.random() * 25),
        exitAngle: isFly ? -45 : -15,
        timingFeedback: '유인구에 속았습니다! 빗맞은 아웃! 🚫'
      };
    } else {
      return {
        ...HIT_RESULTS.STRIKE,
        diffMs,
        distance: 0,
        exitAngle: 0,
        timingFeedback: '스트라이크 존 밖의 유인구에 헛스윙! ❌'
      };
    }
  }

  // Dynamic Scale from Speed Tier (1.0 -> 0.42)
  const scale = speedLevel?.timingScale || 1.0;
  const thPerfect = Math.round(TIMING_THRESHOLDS.PERFECT * scale);
  const thGreat = Math.round(TIMING_THRESHOLDS.GREAT * scale);
  const thGood = Math.round(TIMING_THRESHOLDS.GOOD * scale);
  const thOut = Math.round(TIMING_THRESHOLDS.OUT * scale);
  const thFoul = Math.round(TIMING_THRESHOLDS.FOUL * scale);

  let resultType = null;
  let distance = 0;
  let exitAngle = 0;
  let timingFeedback = '';

  if (absDiff <= thPerfect) {
    // Perfect Homerun
    const isBasesLoaded = currentRunners[0] && currentRunners[1] && currentRunners[2];
    resultType = isBasesLoaded ? HIT_RESULTS.GRAND_SLAM : HIT_RESULTS.HOMERUN;
    distance = Math.floor(120 + Math.random() * 35 + (thPerfect - absDiff) * 0.5);
    exitAngle = -45 + (Math.random() * 10 - 5);
    timingFeedback = isBasesLoaded ? '🔥 대폭발 만루 홈런!! PERFECT!!' : '💥 장외 대형 홈런!! PERFECT!!';
  } else if (absDiff <= thGreat) {
    // Great Hit: Double or Triple
    const roll = Math.random();
    if (roll < 0.4) {
      resultType = HIT_RESULTS.TRIPLE;
      distance = Math.floor(85 + Math.random() * 20);
      timingFeedback = '⚡ 총알같은 3루타! GREAT!!';
    } else {
      resultType = HIT_RESULTS.DOUBLE;
      distance = Math.floor(65 + Math.random() * 20);
      timingFeedback = '✨ 펜스 직격 2루타! GREAT!';
    }
    exitAngle = diffMs < 0 ? -30 : -60;
  } else if (absDiff <= thGood) {
    // Single Hit
    resultType = HIT_RESULTS.SINGLE;
    distance = Math.floor(40 + Math.random() * 22);
    timingFeedback = '⚾ 깔끔한 1루타 안타! GOOD!';
    exitAngle = diffMs < 0 ? -20 : -70;
  } else if (absDiff <= thOut) {
    // Mistimed Swing: Fly Out or Ground Out! (Idea 2)
    const isFly = diffMs < 0; // Early swing -> Sky-high Pop Fly, Late swing -> Weak Chopper Grounder
    resultType = isFly ? HIT_RESULTS.FLY_OUT : HIT_RESULTS.GROUND_OUT;
    distance = Math.floor(35 + Math.random() * 25);
    exitAngle = isFly ? -65 : -15;
    timingFeedback = isFly ? '빗맞은 외야 뜬공 플라이 아웃! 🧤' : '타이밍 빗나간 내야 땅볼 아웃! 🧤';
  } else if (absDiff <= thFoul) {
    // Foul Ball
    resultType = HIT_RESULTS.FOUL;
    distance = Math.floor(25 + Math.random() * 20);
    timingFeedback = diffMs < 0 ? '⚠️ 당겨친 파울 (EARLY FOUL)' : '⚠️ 밀어친 파울 (LATE FOUL)';
    exitAngle = diffMs < 0 ? -10 : -80;
  } else {
    // Complete Miss Strike
    resultType = HIT_RESULTS.STRIKE;
    distance = 0;
    exitAngle = 0;
    timingFeedback = diffMs < 0 ? '너무 빠른 헛스윙! (TOO EARLY)' : '너무 늦은 헛스윙! (TOO LATE)';
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
