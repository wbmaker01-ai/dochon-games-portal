// Dochon Games Portal - School Tag Game Core Logic
// 2D Raycasting Lighting, Physics Collision, Noise Propagation, Smart AI & State Machine

import { SCHOOL_TAG_CONSTANTS, ROLE_TYPES } from './schoolTagConstants';

// --- 1. Fast Raycasting Light Geometry ---

export function getRayIntersection(ray, segment) {
  const r_px = ray.x;
  const r_py = ray.y;
  const r_dx = ray.dx;
  const r_dy = ray.dy;

  const s_px = segment.a.x;
  const s_py = segment.a.y;
  const s_dx = segment.b.x - segment.a.x;
  const s_dy = segment.b.y - segment.a.y;

  const denom = s_dx * r_dy - s_dy * r_dx;
  if (Math.abs(denom) < 1e-9) return null; // Parallel or collinear

  const T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / denom;
  if (isNaN(T2) || T2 < 0 || T2 > 1) return null; // Not on segment

  let T1;
  if (Math.abs(r_dx) > Math.abs(r_dy)) {
    T1 = (s_px + s_dx * T2 - r_px) / r_dx;
  } else {
    T1 = (s_py + s_dy * T2 - r_py) / r_dy;
  }

  if (isNaN(T1) || T1 <= 0.05) return null; // Behind ray or self-collision

  return {
    x: r_px + r_dx * T1,
    y: r_py + r_dy * T1,
    dist: T1,
  };
}

export function computeFlashlightPolygon(originX, originY, facingAngle, fovAngle, maxDistance, segments) {
  const halfFov = fovAngle / 2;
  const numConeRays = 48;
  const rayAngles = [];

  // 1. Cone Boundary and Intermediate Rays
  for (let i = 0; i <= numConeRays; i++) {
    const a = facingAngle - halfFov + (fovAngle * i) / numConeRays;
    rayAngles.push(a);
  }

  // 2. Add rays towards segment vertices that lie within cone
  if (Array.isArray(segments)) {
    segments.forEach((seg) => {
      [seg.a, seg.b].forEach((pt) => {
        const dx = pt.x - originX;
        const dy = pt.y - originY;
        const angle = Math.atan2(dy, dx);
        let diff = angle - facingAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        if (Math.abs(diff) <= halfFov + 0.05) {
          rayAngles.push(angle - 0.0003);
          rayAngles.push(angle);
          rayAngles.push(angle + 0.0003);
        }
      });
    });
  }

  // Sort ray angles from start to end of cone
  rayAngles.sort((a, b) => {
    let da = a - facingAngle;
    while (da < -Math.PI) da += Math.PI * 2;
    while (da > Math.PI) da -= Math.PI * 2;

    let db = b - facingAngle;
    while (db < -Math.PI) db += Math.PI * 2;
    while (db > Math.PI) db -= Math.PI * 2;

    return da - db;
  });

  // Cast each ray
  const points = [];
  rayAngles.forEach((angle) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const ray = { x: originX, y: originY, dx, dy };

    let closest = null;
    let minT = maxDistance;

    if (Array.isArray(segments)) {
      for (let i = 0; i < segments.length; i++) {
        const hit = getRayIntersection(ray, segments[i]);
        if (hit && hit.dist < minT) {
          minT = hit.dist;
          closest = hit;
        }
      }
    }

    if (closest && Number.isFinite(closest.x) && Number.isFinite(closest.y)) {
      points.push({ x: closest.x, y: closest.y });
    } else {
      points.push({
        x: originX + dx * maxDistance,
        y: originY + dy * maxDistance,
      });
    }
  });

  return points;
}

// --- 2. Physics & Collision Handling ---

export function checkCircleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  const testX = Math.max(rx, Math.min(cx, rx + rw));
  const testY = Math.max(ry, Math.min(cy, ry + rh));
  const distX = cx - testX;
  const distY = cy - testY;
  const distSq = distX * distX + distY * distY;
  return distSq < radius * radius;
}

export function moveEntityWithSliding(entity, vx, vy, dt, walls, mapWidth, mapHeight) {
  const radius = entity.radius;
  let newX = entity.x + vx * dt;
  let newY = entity.y + vy * dt;

  // Boundary clamp
  newX = Math.max(radius + 2, Math.min(mapWidth - radius - 2, newX));
  newY = Math.max(radius + 2, Math.min(mapHeight - radius - 2, newY));

  // Test X movement first
  let testX = newX;
  let testY = entity.y;
  let collideX = false;

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (checkCircleRectCollision(testX, testY, radius, w.x, w.y, w.w, w.h)) {
      collideX = true;
      break;
    }
  }

  if (!collideX) {
    entity.x = testX;
  }

  // Test Y movement
  testX = entity.x;
  testY = newY;
  let collideY = false;

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (checkCircleRectCollision(testX, testY, radius, w.x, w.y, w.w, w.h)) {
      collideY = true;
      break;
    }
  }

  if (!collideY) {
    entity.y = testY;
  }
}

// --- 3. Smart AI Tagger State Machine ---

export const AI_STATES = {
  PATROL: 'PATROL',
  INVESTIGATE: 'INVESTIGATE',
  CHASE: 'CHASE',
};

export class SmartTaggerAI {
  constructor(tagger) {
    this.tagger = tagger;
    this.state = AI_STATES.PATROL;
    this.targetX = tagger.x;
    this.targetY = tagger.y;
    this.patrolIndex = 0;
    this.investigateTimer = 0;
    this.lastSeenRunnerPos = null;

    // School Patrol Waypoints (Key intersections across hallways and rooms)
    this.waypoints = [
      { x: 300, y: 260 },
      { x: 600, y: 260 },
      { x: 950, y: 260 },
      { x: 1050, y: 450 },
      { x: 600, y: 600 },
      { x: 200, y: 600 },
      { x: 150, y: 400 },
      { x: 600, y: 400 },
    ];
  }

  update(dt, runners, noiseWaves, walls, mapWidth, mapHeight) {
    const t = this.tagger;
    if (t.isStunned) {
      t.stunTimer -= dt;
      if (t.stunTimer <= 0) t.isStunned = false;
      return;
    }

    // 1. Check for visible runners in tagger FOV
    let closestVisibleRunner = null;
    let minDist = Infinity;

    runners.forEach((r) => {
      if (r.isHiding || r.isJailed || r.isEscaped) return;

      const dx = r.x - t.x;
      const dy = r.y - t.y;
      const dist = Math.hypot(dx, dy);

      if (dist < SCHOOL_TAG_CONSTANTS.TAGGER_LIGHT_DISTANCE) {
        const angleToRunner = Math.atan2(dy, dx);
        let diff = angleToRunner - t.facingAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Check if within FOV or very close
        if (Math.abs(diff) < SCHOOL_TAG_CONSTANTS.TAGGER_FOV_ANGLE / 2 || dist < 70) {
          if (dist < minDist) {
            minDist = dist;
            closestVisibleRunner = r;
          }
        }
      }
    });

    // 2. State Transitions
    if (closestVisibleRunner) {
      this.state = AI_STATES.CHASE;
      this.targetX = closestVisibleRunner.x;
      this.targetY = closestVisibleRunner.y;
      this.lastSeenRunnerPos = { x: closestVisibleRunner.x, y: closestVisibleRunner.y };
    } else if (this.state === AI_STATES.CHASE) {
      // Lost sight, investigate last known spot
      this.state = AI_STATES.INVESTIGATE;
      this.investigateTimer = 3.5;
      if (this.lastSeenRunnerPos) {
        this.targetX = this.lastSeenRunnerPos.x;
        this.targetY = this.lastSeenRunnerPos.y;
      }
    } else {
      // Check noise waves
      let hearNoise = null;
      let closestNoiseDist = Infinity;

      noiseWaves.forEach((nw) => {
        const dist = Math.hypot(nw.x - t.x, nw.y - t.y);
        if (dist < 450 && dist < closestNoiseDist) {
          closestNoiseDist = dist;
          hearNoise = nw;
        }
      });

      if (hearNoise && this.state !== AI_STATES.INVESTIGATE) {
        this.state = AI_STATES.INVESTIGATE;
        this.investigateTimer = 4.0;
        this.targetX = hearNoise.x;
        this.targetY = hearNoise.y;
      }
    }

    // 3. State Behavior Execution
    if (this.state === AI_STATES.INVESTIGATE) {
      this.investigateTimer -= dt;
      if (this.investigateTimer <= 0) {
        this.state = AI_STATES.PATROL;
      }
    }

    if (this.state === AI_STATES.PATROL) {
      const currentWp = this.waypoints[this.patrolIndex];
      this.targetX = currentWp.x;
      this.targetY = currentWp.y;

      const distToWp = Math.hypot(currentWp.x - t.x, currentWp.y - t.y);
      if (distToWp < 50) {
        this.patrolIndex = (this.patrolIndex + 1) % this.waypoints.length;
      }
    }

    // Move toward target
    const dx = this.targetX - t.x;
    const dy = this.targetY - t.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 10) {
      const desiredAngle = Math.atan2(dy, dx);
      // Smoothly rotate facing angle toward target
      let angleDiff = desiredAngle - t.facingAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      t.facingAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 4.5 * dt);

      // Speed depends on state
      let speed = SCHOOL_TAG_CONSTANTS.TAGGER_SPEED;
      if (this.state === AI_STATES.CHASE) speed *= 1.15;
      else if (this.state === AI_STATES.PATROL) speed *= 0.85;

      const vx = Math.cos(t.facingAngle) * speed;
      const vy = Math.sin(t.facingAngle) * speed;

      moveEntityWithSliding(t, vx, vy, dt, walls, mapWidth, mapHeight);
    }
  }
}

// --- 4. Score Calculation Rule Compliance ---

export function calculateSchoolTagScore({
  isEscaped,
  remainingSeconds,
  keysCollected,
  rescuedCount = 0,
  timeSurvivedSeconds = 0,
  isTagger = false,
  taggedCount = 0,
}) {
  const {
    SCORE_ESCAPE_SUCCESS,
    SCORE_TIME_BONUS_PER_SEC,
    SCORE_KEY_COLLECTED,
    SCORE_TEAMMATE_RESCUE,
    SCORE_SURVIVAL_TIME_PER_SEC,
  } = SCHOOL_TAG_CONSTANTS;

  let total = 0;

  if (!isTagger) {
    if (isEscaped) {
      total += SCORE_ESCAPE_SUCCESS;
      total += Math.max(0, Math.floor(remainingSeconds)) * SCORE_TIME_BONUS_PER_SEC;
    }
    total += keysCollected * SCORE_KEY_COLLECTED;
    total += rescuedCount * SCORE_TEAMMATE_RESCUE;
    total += Math.floor(timeSurvivedSeconds) * SCORE_SURVIVAL_TIME_PER_SEC;
  } else {
    // Tagger Score
    total += taggedCount * 650;
    if (remainingSeconds > 0) {
      total += Math.floor(remainingSeconds) * 8;
    }
  }

  return Math.max(0, Math.floor(total));
}
