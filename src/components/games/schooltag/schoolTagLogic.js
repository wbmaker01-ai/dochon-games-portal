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
    const T = SCHOOL_TAG_CONSTANTS.TILE_SIZE;
    this.tagger = tagger;
    this.state = AI_STATES.PATROL;
    this.targetX = tagger.x;
    this.targetY = tagger.y;
    this.patrolIndex = 0;
    this.investigateTimer = 0;
    this.lastSeenRunnerPos = null;

    // Continuous Anti-Stuck & Motion Tracking
    this.lastPosX = tagger.x;
    this.lastPosY = tagger.y;
    this.stuckTimer = 0;
    this.avoidanceAngle = 0;
    this.sweepTimer = 0;

    // School Map 26x18 Accurate Patrol Graph (Upper Hallway, Lower Hallway, Stairs, All Rooms)
    this.waypoints = [
      // 1. 2F Upper Corridor & Classrooms (West to East)
      { x: 2.5 * T, y: 5.5 * T, name: '2층 서쪽 복도' },
      { x: 2.5 * T, y: 2.5 * T, name: '1학년 1반' },
      { x: 2.5 * T, y: 5.5 * T, name: '2층 복도 복귀' },
      { x: 7.5 * T, y: 5.5 * T, name: '과학실 앞' },
      { x: 8.5 * T, y: 2.5 * T, name: '과학실' },
      { x: 7.5 * T, y: 5.5 * T, name: '과학실 앞' },
      { x: 12.5 * T, y: 5.5 * T, name: '2층 중앙 계단' },
      { x: 17.5 * T, y: 5.5 * T, name: '음악실 앞' },
      { x: 15.5 * T, y: 2.5 * T, name: '음악실' },
      { x: 17.5 * T, y: 5.5 * T, name: '음악실 앞' },
      { x: 22.5 * T, y: 5.5 * T, name: '도서관 앞' },
      { x: 22.5 * T, y: 2.5 * T, name: '도서관' },
      { x: 22.5 * T, y: 5.5 * T, name: '도서관 앞' },

      // 2. Descend via East Corridor to 1F
      { x: 24.0 * T, y: 8.5 * T, name: '동쪽 연결 복도' },
      { x: 23.5 * T, y: 12.5 * T, name: '1층 동쪽 복도' },
      { x: 22.5 * T, y: 9.5 * T, name: '교무실' },
      { x: 22.5 * T, y: 12.5 * T, name: '1층 동쪽 복도' },

      // 3. 1F Lower Corridor & Special Rooms (East to West)
      { x: 17.5 * T, y: 12.5 * T, name: '1층 보건실 앞' },
      { x: 12.5 * T, y: 12.5 * T, name: '1층 중앙홀' },
      { x: 12.5 * T, y: 15.5 * T, name: '중앙현관 로비' },
      { x: 12.5 * T, y: 12.5 * T, name: '1층 중앙홀' },
      { x: 7.5 * T, y: 12.5 * T, name: '방송실 앞' },
      { x: 8.0 * T, y: 9.5 * T, name: '방송실' },
      { x: 7.5 * T, y: 12.5 * T, name: '방송실 앞' },
      { x: 2.5 * T, y: 12.5 * T, name: '1층 서쪽 복도' },
      { x: 2.5 * T, y: 9.5 * T, name: '컴퓨터실' },
      { x: 2.5 * T, y: 12.5 * T, name: '1층 서쪽 복도' },

      // 4. Ascend via West Corridor to 2F
      { x: 1.5 * T, y: 8.5 * T, name: '서쪽 연결 복도' },
    ];
  }

  update(dt, runners, noiseWaves, walls, mapWidth, mapHeight) {
    const t = this.tagger;
    if (t.isStunned) {
      t.stunTimer -= dt;
      if (t.stunTimer <= 0) t.isStunned = false;
      return;
    }

    this.sweepTimer += dt;

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

        // Check if within FOV or close proximity (within 75px radius)
        if (Math.abs(diff) < SCHOOL_TAG_CONSTANTS.TAGGER_FOV_ANGLE / 2 || dist < 75) {
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
      this.investigateTimer = 0;
    } else if (this.state === AI_STATES.CHASE) {
      // Lost sight, smoothly transition to investigate last known spot
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
        if (dist < 480 && dist < closestNoiseDist) {
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

    // 3. State Behavior Execution & Dynamic Target Selection
    if (this.state === AI_STATES.INVESTIGATE) {
      this.investigateTimer -= dt;
      if (this.investigateTimer <= 0) {
        this.state = AI_STATES.PATROL;
      } else {
        // While investigating, if close to noise target, wander actively around the spot instead of stopping
        const distToTarget = Math.hypot(this.targetX - t.x, this.targetY - t.y);
        if (distToTarget < 35) {
          // Patrol nearby circle to keep moving
          const searchOffsetAngle = this.sweepTimer * 2.2;
          this.targetX += Math.cos(searchOffsetAngle) * 50;
          this.targetY += Math.sin(searchOffsetAngle) * 50;
        }
      }
    }

    if (this.state === AI_STATES.PATROL) {
      const currentWp = this.waypoints[this.patrolIndex];
      this.targetX = currentWp.x;
      this.targetY = currentWp.y;

      const distToWp = Math.hypot(currentWp.x - t.x, currentWp.y - t.y);
      if (distToWp < 40) {
        // Advance to next waypoint immediately for fluid uninterrupted walking
        this.patrolIndex = (this.patrolIndex + 1) % this.waypoints.length;
        const nextWp = this.waypoints[this.patrolIndex];
        this.targetX = nextWp.x;
        this.targetY = nextWp.y;
      }
    }

    // 4. Calculate Desired Angle & Obstacle Avoidance
    const dx = this.targetX - t.x;
    const dy = this.targetY - t.y;
    let desiredAngle = Math.atan2(dy, dx);

    // Apply Active Flashlight Sweeping during Patrol
    if (this.state === AI_STATES.PATROL) {
      const sweep = Math.sin(this.sweepTimer * 2.8) * 0.35;
      desiredAngle += sweep;
    }

    // Apply Avoidance Offset if Wall Collision is detected
    if (Math.abs(this.avoidanceAngle) > 0.01) {
      desiredAngle += this.avoidanceAngle;
    }

    // 5. Smooth Angular Rotation
    let angleDiff = desiredAngle - t.facingAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    t.facingAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 5.5 * dt);

    // 6. Dynamic Movement Speed
    let speed = SCHOOL_TAG_CONSTANTS.TAGGER_SPEED;
    if (this.state === AI_STATES.CHASE) speed *= 1.2;
    else if (this.state === AI_STATES.PATROL) speed *= 0.95;
    else if (this.state === AI_STATES.INVESTIGATE) speed *= 1.05;

    const vx = Math.cos(t.facingAngle) * speed;
    const vy = Math.sin(t.facingAngle) * speed;

    const prevX = t.x;
    const prevY = t.y;

    moveEntityWithSliding(t, vx, vy, dt, walls, mapWidth, mapHeight);

    // 7. Active Anti-Stuck & Auto-Bypass Recovery Engine
    const actualDistMoved = Math.hypot(t.x - prevX, t.y - prevY);
    const expectedDist = speed * dt * 0.45;

    if (actualDistMoved < expectedDist) {
      // Movement blocked by wall/corner
      this.stuckTimer += dt;

      if (this.stuckTimer > 0.35) {
        // Steer sideways (turn 60 ~ 90 degrees) to slide around corners
        this.avoidanceAngle = (Math.sin(this.sweepTimer * 4) > 0 ? 1 : -1) * (Math.PI / 2.5);
      }

      if (this.stuckTimer > 1.1) {
        // Still stuck after 1.1s: skip to next waypoint or pick random clear route
        if (this.state === AI_STATES.PATROL) {
          this.patrolIndex = (this.patrolIndex + 1) % this.waypoints.length;
        } else {
          this.state = AI_STATES.PATROL;
        }
        this.avoidanceAngle = Math.PI; // Flip 180 degrees
        this.stuckTimer = 0;
      }
    } else {
      // Moving smoothly: quickly decay stuck timer and avoidance angle
      this.stuckTimer = Math.max(0, this.stuckTimer - dt * 2.5);
      this.avoidanceAngle *= Math.max(0, 1 - dt * 4);
    }

    this.lastPosX = t.x;
    this.lastPosY = t.y;
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
