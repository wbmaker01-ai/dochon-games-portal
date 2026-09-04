// Dochon Games Portal - Micro Kart 2D Physics, Waypoints & Battle Item Engine
// 100% Deterministic & Modular Logic Class

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TOTAL_LAPS,
  KART_PHYSICS,
  KART_SKINS,
  ITEM_TYPES,
  RANK_POINTS,
  DIFFICULTY_PRESETS
} from './microKartConstants.js';

import {
  TRACK_WAYPOINTS,
  DESK_OBSTACLES,
  PAINT_SPILLS,
  BOOST_PADS,
  ITEM_BOX_SPAWNS,
  isPointOnTrack
} from './microKartTrack.js';

export class MicroKartLogic {
  constructor(options = {}) {
    this.mode = options.mode || 'SOLO'; // 'SOLO' | 'P2P'
    this.difficulty = options.difficulty || 'normal';
    this.playerSkin = options.playerSkin || 'eraser';
    this.playerName = options.playerName || '나';
    this.audio = options.audio || null;

    // Callbacks
    this.onLapComplete = options.onLapComplete || null;
    this.onRaceFinish = options.onRaceFinish || null;

    this.karts = [];
    this.itemBoxes = [];
    this.traps = [];       // Dropped bananas: { id, x, y, radius, lifetime }
    this.projectiles = []; // Rockets & water balloons: { id, type, x, y, vx, vy, targetId, angle }
    this.particles = [];   // Sparks, explosions, smoke
    this.skidmarks = [];   // Skid marks left on road

    this.animTick = 0;
    this.raceStarted = false;
    this.raceFinished = false;
    this.totalRaceTime = 0;
    this.finishedKarts = [];

    // Player Stats Tracking for Hall of Fame
    this.driftSuccessCount = 0;
    this.itemHitCount = 0;

    // Player Inputs
    this.playerInput = {
      throttle: 0, // -1 (reverse/brake), 0, 1 (forward)
      steer: 0,    // -1 (left), 0, 1 (right)
      drift: false,
      useItem: false
    };

    this.initWorld(options);
  }

  initWorld(options) {
    // 1. Initialize Item Mystery Boxes
    this.itemBoxes = ITEM_BOX_SPAWNS.map(spawn => ({
      ...spawn,
      active: true,
      respawnTimer: 0
    }));

    // 2. Initialize Starting Grid at Waypoint 0
    const startWp = TRACK_WAYPOINTS[0];
    const gridRows = 5;
    const initialKarts = [];

    // Player Kart
    initialKarts.push(this.createKart({
      id: 'player',
      name: this.playerName,
      isPlayer: true,
      skinId: this.playerSkin,
      gridIndex: 0
    }));

    // AI Bots (4 rivals)
    const botProfiles = [
      { name: '민준 (6A)', skinId: 'pencil' },
      { name: '서연 (5B)', skinId: 'magnet' },
      { name: '도현 (4C)', skinId: 'highlighter' },
      { name: '지호 (6C)', skinId: 'eraser' }
    ];

    botProfiles.forEach((bot, idx) => {
      initialKarts.push(this.createKart({
        id: `bot_${idx + 1}`,
        name: bot.name,
        isPlayer: false,
        skinId: bot.skinId,
        gridIndex: idx + 1
      }));
    });

    this.karts = initialKarts;
  }

  createKart({ id, name, isPlayer, skinId, gridIndex }) {
    const p0 = TRACK_WAYPOINTS[0];
    // Staggered grid starting positions along track angle
    const angle = 0; // Pointing East along waypoint 0 to 1
    const rowOffset = Math.floor(gridIndex / 2) * 80;
    const sideOffset = (gridIndex % 2 === 0 ? -1 : 1) * 38;

    const skin = KART_SKINS.find(s => s.id === skinId) || KART_SKINS[0];

    return {
      id,
      name,
      isPlayer,
      skin,
      x: p0.x - rowOffset,
      y: p0.y + sideOffset,
      vx: 0,
      vy: 0,
      angle: angle,
      speed: 0,

      // Drift Dynamics
      isDrifting: false,
      driftDir: 0,        // -1 left, 1 right
      driftTime: 0,
      turboCharge: 0,     // 0: none, 1: blue turbo, 2: red super turbo

      // Active Status Effects
      boostTimer: 0,
      spinTimer: 0,
      waterTrapTimer: 0,
      shieldTimer: 0,

      // Race Progression
      currentLap: 1,
      nextWaypoint: 1,
      checkpointsPassedInLap: new Set([0]),
      lapStartTime: 0,
      lapTimes: [],
      isFinished: false,
      finishRank: 0,
      finalTime: 0,

      // Inventory
      item: null
    };
  }

  setPlayerInput(input) {
    this.playerInput = { ...this.playerInput, ...input };
  }

  usePlayerItem() {
    const player = this.karts.find(k => k.isPlayer);
    if (!player || !player.item || player.spinTimer > 0 || player.waterTrapTimer > 0) return;

    this.triggerItemUse(player);
  }

  triggerItemUse(kart) {
    const itemType = kart.item;
    kart.item = null;

    if (itemType === ITEM_TYPES.BOOSTER) {
      kart.boostTimer = KART_PHYSICS.BOOST_DURATION;
      if (this.audio) this.audio.playBooster();
      this.spawnBoostParticles(kart);
    } else if (itemType === ITEM_TYPES.SHIELD) {
      kart.shieldTimer = 5.0;
      if (this.audio) this.audio.playShield();
    } else if (itemType === ITEM_TYPES.BANANA) {
      // Drop behind kart
      const dropDist = KART_PHYSICS.KART_RADIUS + 25;
      const bx = kart.x - Math.cos(kart.angle) * dropDist;
      const by = kart.y - Math.sin(kart.angle) * dropDist;

      this.traps.push({
        id: `trap_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.BANANA,
        ownerId: kart.id,
        x: bx,
        y: by,
        radius: 18,
        createdAt: this.totalRaceTime
      });
    } else if (itemType === ITEM_TYPES.WATER_BALLOON) {
      // Target the kart ahead in rank
      const myRank = this.getKartRank(kart.id);
      const targetKart = this.karts.find(k => this.getKartRank(k.id) === myRank - 1 && !k.isFinished);

      const targetId = targetKart ? targetKart.id : null;
      const launchAngle = kart.angle;

      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.WATER_BALLOON,
        ownerId: kart.id,
        x: kart.x + Math.cos(launchAngle) * 30,
        y: kart.y + Math.sin(launchAngle) * 30,
        vx: Math.cos(launchAngle) * 12,
        vy: Math.sin(launchAngle) * 12,
        targetId: targetId,
        lifetime: 4.0
      });
    } else if (itemType === ITEM_TYPES.ROCKET) {
      if (this.audio) this.audio.playRocketFire();
      const launchAngle = kart.angle;

      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        type: ITEM_TYPES.ROCKET,
        ownerId: kart.id,
        x: kart.x + Math.cos(launchAngle) * 35,
        y: kart.y + Math.sin(launchAngle) * 35,
        vx: Math.cos(launchAngle) * 19,
        vy: Math.sin(launchAngle) * 19,
        angle: launchAngle,
        lifetime: 3.5
      });
    }
  }

  // --- MAIN PHYSICS & GAME LOOP TICK ---
  update(dt = 0.016) {
    if (this.raceFinished) return;

    this.animTick += 1;
    this.totalRaceTime += dt;

    // 1. Update Item Mystery Boxes Respawn
    this.itemBoxes.forEach(box => {
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
        }
      }
    });

    // 2. Update Active Karts
    this.karts.forEach(kart => {
      if (kart.isFinished) return;
      this.updateKartPhysics(kart, dt);
      this.updateKartCheckpoints(kart, dt);
      this.checkKartCollisions(kart);
      this.checkItemPickups(kart);
    });

    // 3. Update Traps (Banana peels) & Projectiles
    this.updateTrapsAndProjectiles(dt);

    // 4. Update Particle Systems
    this.updateParticles(dt);

    // 5. Check Overall Race Completion
    const player = this.karts.find(k => k.isPlayer);
    if (player && player.isFinished && !this.raceFinished) {
      this.raceFinished = true;
      if (this.onRaceFinish) {
        const results = this.generateFinalResults();
        this.onRaceFinish(results);
      }
    }
  }

  updateKartPhysics(kart, dt) {
    // 1. Status Effects (Spin, Water Bubble, Shield, Boost)
    if (kart.spinTimer > 0) {
      kart.spinTimer -= dt;
      kart.angle += 0.28; // Spin around
      kart.speed *= 0.94;
      kart.x += kart.vx;
      kart.y += kart.vy;
      return;
    }

    if (kart.waterTrapTimer > 0) {
      kart.waterTrapTimer -= dt;
      kart.speed *= 0.90;
      kart.x += kart.vx;
      kart.y += kart.vy;
      return;
    }

    if (kart.shieldTimer > 0) {
      kart.shieldTimer -= dt;
    }

    // Determine Throttle & Steering
    let throttle = 0;
    let steer = 0;
    let driftKey = false;

    if (kart.isPlayer) {
      throttle = this.playerInput.throttle;
      steer = this.playerInput.steer;
      driftKey = this.playerInput.drift;
    } else {
      // AI Steering and Throttle
      const aiCmd = this.computeAIControl(kart);
      throttle = aiCmd.throttle;
      steer = aiCmd.steer;
      driftKey = aiCmd.drift;
      if (aiCmd.useItem) {
        this.triggerItemUse(kart);
      }
    }

    // Boost Modifier
    let isBoosting = false;
    let topSpeed = KART_PHYSICS.TOP_SPEED;
    let accel = KART_PHYSICS.ACCELERATION;

    if (kart.boostTimer > 0) {
      kart.boostTimer -= dt;
      isBoosting = true;
      topSpeed *= KART_PHYSICS.BOOST_TOP_SPEED_MULT;
      accel *= KART_PHYSICS.BOOST_ACCEL_MULT;
      this.spawnBoostParticles(kart);
    }

    // Check Surface: Offroad or Paint Spill
    const onTrack = isPointOnTrack(kart.x, kart.y);
    let currentFriction = onTrack ? KART_PHYSICS.NATURAL_FRICTION : KART_PHYSICS.OFFROAD_FRICTION;

    PAINT_SPILLS.forEach(spill => {
      const d = Math.hypot(kart.x - spill.x, kart.y - spill.y);
      if (d < spill.radius + KART_PHYSICS.KART_RADIUS) {
        currentFriction = 0.88; // Sticky paint slowdown
      }
    });

    // Drift Logic
    if (driftKey && steer !== 0 && Math.abs(kart.speed) > 3.0) {
      if (!kart.isDrifting) {
        kart.isDrifting = true;
        kart.driftDir = steer > 0 ? 1 : -1;
        kart.driftTime = 0;
        kart.turboCharge = 0;
      }
      kart.driftTime += dt;

      // Charge Mini-Turbo Stages
      if (kart.driftTime >= KART_PHYSICS.MINI_TURBO_STAGE2_TIME) {
        kart.turboCharge = 2; // Red Super Turbo
      } else if (kart.driftTime >= KART_PHYSICS.MINI_TURBO_STAGE1_TIME) {
        kart.turboCharge = 1; // Blue Mini Turbo
      }

      if (kart.isPlayer && this.audio) {
        this.audio.playDrift();
      }

      // Spawn Drift Sparks & Skidmarks
      this.spawnDriftSparks(kart);
      this.addSkidmark(kart);
    } else {
      // Released Drift -> Trigger Mini Turbo Boost!
      if (kart.isDrifting) {
        if (kart.turboCharge === 2) {
          kart.boostTimer = 1.8;
          if (kart.isPlayer) {
            this.driftSuccessCount += 1;
            if (this.audio) this.audio.playBooster();
          }
        } else if (kart.turboCharge === 1) {
          kart.boostTimer = 1.0;
          if (kart.isPlayer) {
            this.driftSuccessCount += 1;
            if (this.audio) this.audio.playBooster();
          }
        }
        kart.isDrifting = false;
        kart.turboCharge = 0;
        kart.driftTime = 0;
      }
    }

    // Acceleration & Braking
    if (throttle > 0) {
      kart.speed = Math.min(topSpeed, kart.speed + accel);
    } else if (throttle < 0) {
      if (kart.speed > 0.5) {
        kart.speed = Math.max(0, kart.speed - KART_PHYSICS.BRAKE_FORCE);
      } else {
        kart.speed = Math.max(-KART_PHYSICS.TOP_REVERSE_SPEED, kart.speed - KART_PHYSICS.REVERSE_ACCELERATION);
      }
    } else {
      // Natural Coasting Friction
      kart.speed *= currentFriction;
      if (Math.abs(kart.speed) < 0.05) kart.speed = 0;
    }

    // Steering Angle
    const turnRate = kart.isDrifting ? KART_PHYSICS.DRIFT_TURN_RATE : KART_PHYSICS.TURN_RATE;
    if (Math.abs(kart.speed) > 0.2) {
      const dirMult = kart.speed >= 0 ? 1 : -1;
      kart.angle += steer * turnRate * dirMult;
    }

    // Velocity Vector
    const moveAngle = kart.angle;
    kart.vx = Math.cos(moveAngle) * kart.speed;
    kart.vy = Math.sin(moveAngle) * kart.speed;

    // Apply Position
    kart.x += kart.vx;
    kart.y += kart.vy;

    // Clamp World Bounds
    kart.x = Math.max(80, Math.min(WORLD_WIDTH - 80, kart.x));
    kart.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, kart.y));

    // Check Boost Pads
    BOOST_PADS.forEach(pad => {
      const d = Math.hypot(kart.x - pad.x, kart.y - pad.y);
      if (d < 50) {
        kart.boostTimer = 2.0;
        if (kart.isPlayer && this.audio) {
          this.audio.playBooster();
        }
      }
    });
  }

  // --- AI NAVIGATION & DECISION MAKING ---
  computeAIControl(kart) {
    const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
    const targetWp = TRACK_WAYPOINTS[kart.nextWaypoint];

    // Angle to target waypoint
    const dx = targetWp.x - kart.x;
    const dy = targetWp.y - kart.y;
    const desiredAngle = Math.atan2(dy, dx);

    let angleDiff = desiredAngle - kart.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Steering
    let steer = 0;
    if (angleDiff > 0.08) steer = 1;
    else if (angleDiff < -0.08) steer = -1;

    // Throttle: Brake on sharp turns, full throttle on straights
    let throttle = 1;
    if (Math.abs(angleDiff) > 1.2) {
      throttle = 0.4;
    }

    // AI Drift on sharp curves
    let drift = false;
    if (Math.abs(angleDiff) > 0.6 && Math.random() < diff.driftSkill) {
      drift = true;
    }

    // AI Item Usage
    let useItem = false;
    if (kart.item && Math.random() < 0.02) {
      useItem = true;
    }

    return { throttle, steer, drift, useItem };
  }

  // --- WAYPOINT & CHECKPOINTS ---
  updateKartCheckpoints(kart, dt) {
    if (kart.isFinished) return;

    if (!kart.checkpointsPassedInLap) {
      kart.checkpointsPassedInLap = new Set([0]);
    }

    const currentTargetIdx = kart.nextWaypoint;
    const targetWp = TRACK_WAYPOINTS[currentTargetIdx];
    const d = Math.hypot(kart.x - targetWp.x, kart.y - targetWp.y);
    const hitRadius = Math.max((targetWp.width || 220) * 1.25, 275);

    // Fallback: If a racer drifts wide or cuts a corner, also check next+1 waypoint
    const nextPlusOneIdx = (currentTargetIdx + 1) % TRACK_WAYPOINTS.length;
    const nextPlusOneWp = TRACK_WAYPOINTS[nextPlusOneIdx];
    const dNextPlusOne = Math.hypot(kart.x - nextPlusOneWp.x, kart.y - nextPlusOneWp.y);
    const hitRadiusPlusOne = Math.max((nextPlusOneWp.width || 220) * 1.25, 275);

    let reachedWaypoint = -1;
    if (d < hitRadius) {
      reachedWaypoint = currentTargetIdx;
    } else if (dNextPlusOne < hitRadiusPlusOne && dNextPlusOne < d) {
      // Advance past skipped corner waypoint
      reachedWaypoint = nextPlusOneIdx;
    }

    // Finish Line Crossing Gate check (Waypoint 0 is Start/Finish line at x: 500, y: 1950)
    // Checkered line spans y: 1800~2100 across x: 500
    if (currentTargetIdx === 0 || reachedWaypoint === 0 || currentTargetIdx === TRACK_WAYPOINTS.length - 1) {
      const isCrossingFinishGate = Math.abs(kart.x - 500) < 70 && Math.abs(kart.y - 1950) < 170;
      if (isCrossingFinishGate && kart.checkpointsPassedInLap.size >= 8) {
        reachedWaypoint = 0;
      }
    }

    if (reachedWaypoint !== -1) {
      kart.checkpointsPassedInLap.add(currentTargetIdx);
      kart.checkpointsPassedInLap.add(reachedWaypoint);

      if (reachedWaypoint === 0) {
        // Crossing the START/FINISH LINE!
        // Prevent reverse cheats: verify at least 8 waypoints were hit during this lap
        const validLap = kart.checkpointsPassedInLap.size >= 8;

        if (validLap) {
          const lapTime = this.totalRaceTime - kart.lapStartTime;
          kart.lapTimes.push(lapTime);
          kart.lapStartTime = this.totalRaceTime;

          if (kart.currentLap >= TOTAL_LAPS) {
            // Race Complete!
            kart.isFinished = true;
            kart.finishRank = this.finishedKarts.length + 1;
            kart.finalTime = this.totalRaceTime;
            this.finishedKarts.push(kart);

            if (kart.isPlayer && this.audio) {
              this.audio.playVictory();
            }
          } else {
            // Start next lap
            kart.currentLap += 1;
            kart.nextWaypoint = 1;
            kart.checkpointsPassedInLap = new Set([0]);

            if (kart.isPlayer && this.audio) {
              this.audio.playLapPass();
            }
          }
        }
      } else {
        // Advance to next waypoint along circuit
        kart.nextWaypoint = (reachedWaypoint + 1) % TRACK_WAYPOINTS.length;
      }
    }
  }

  // --- COLLISION RESOLUTION ---
  checkKartCollisions(kart) {
    const r = KART_PHYSICS.KART_RADIUS;

    // 1. Kart vs Desk Obstacles
    DESK_OBSTACLES.forEach(obs => {
      if (obs.type === 'circle') {
        const d = Math.hypot(kart.x - obs.x, kart.y - obs.y);
        const minDist = r + obs.radius;
        if (d < minDist) {
          const overlap = minDist - d;
          const nx = (kart.x - obs.x) / (d || 1);
          const ny = (kart.y - obs.y) / (d || 1);
          kart.x += nx * overlap;
          kart.y += ny * overlap;
          kart.speed *= -0.3; // Rebound

          if (kart.isPlayer && this.audio) this.audio.playBump();
        }
      } else if (obs.type === 'rect') {
        // Simple AABB approximation for obstacles
        const halfW = obs.width / 2 + r;
        const halfH = obs.height / 2 + r;
        const dx = kart.x - obs.x;
        const dy = kart.y - obs.y;

        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
          const bounce = obs.isBouncy ? 1.4 : -0.4;
          kart.speed *= bounce;
          kart.x += Math.sign(dx) * 8;
          kart.y += Math.sign(dy) * 8;

          if (kart.isPlayer && this.audio) this.audio.playBump();
        }
      }
    });

    // 2. Kart vs Other Karts
    this.karts.forEach(other => {
      if (other.id === kart.id || other.isFinished) return;
      const dx = kart.x - other.x;
      const dy = kart.y - other.y;
      const dist = Math.hypot(dx, dy);
      const minDist = r * 2;

      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;

        kart.x += nx * overlap;
        kart.y += ny * overlap;
        other.x -= nx * overlap;
        other.y -= ny * overlap;

        // Bump impulse
        const avgSpeed = (kart.speed + other.speed) / 2;
        kart.speed = avgSpeed * 0.9;
        other.speed = avgSpeed * 0.9;

        if ((kart.isPlayer || other.isPlayer) && this.audio) {
          this.audio.playBump();
        }
      }
    });
  }

  // --- ITEM BOX PICKUPS ---
  checkItemPickups(kart) {
    if (kart.item) return; // Already holding an item

    this.itemBoxes.forEach(box => {
      if (!box.active) return;
      const d = Math.hypot(kart.x - box.x, kart.y - box.y);
      if (d < 38) {
        box.active = false;
        box.respawnTimer = 6.0;

        // Pick random item (Weighted towards banana & booster for balanced racing)
        const items = [
          ITEM_TYPES.BANANA,
          ITEM_TYPES.BANANA,
          ITEM_TYPES.BOOSTER,
          ITEM_TYPES.BOOSTER,
          ITEM_TYPES.WATER_BALLOON,
          ITEM_TYPES.ROCKET,
          ITEM_TYPES.SHIELD
        ];
        kart.item = items[Math.floor(Math.random() * items.length)];

        if (kart.isPlayer && this.audio) {
          this.audio.playItemBox();
        }
      }
    });
  }

  // --- TRAPS & PROJECTILES UPDATE ---
  updateTrapsAndProjectiles(dt) {
    // 1. Banana Traps
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i];

      // Check if any kart runs over it
      for (const kart of this.karts) {
        if (kart.isFinished || kart.spinTimer > 0) continue;
        const d = Math.hypot(kart.x - trap.x, kart.y - trap.y);
        if (d < trap.radius + KART_PHYSICS.KART_RADIUS) {
          if (kart.shieldTimer > 0) {
            kart.shieldTimer = 0; // Shield consumed
          } else {
            kart.spinTimer = KART_PHYSICS.SPIN_DURATION;
            if (kart.isPlayer && this.audio) this.audio.playBananaSlip();
            if (trap.ownerId === 'player') this.itemHitCount += 1;
          }
          this.traps.splice(i, 1);
          break;
        }
      }
    }

    // 2. Projectiles (Rockets & Water Balloons)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.lifetime -= dt;

      if (proj.type === ITEM_TYPES.WATER_BALLOON && proj.targetId) {
        const target = this.karts.find(k => k.id === proj.targetId);
        if (target) {
          // Gentle homing curve towards target
          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const targetAngle = Math.atan2(dy, dx);
          proj.vx = Math.cos(targetAngle) * 11;
          proj.vy = Math.sin(targetAngle) * 11;
        }
      }

      proj.x += proj.vx;
      proj.y += proj.vy;

      // Check collision with karts (except owner)
      let hit = false;
      for (const kart of this.karts) {
        if (kart.id === proj.ownerId || kart.isFinished) continue;
        const d = Math.hypot(kart.x - proj.x, kart.y - proj.y);
        if (d < 30) {
          hit = true;
          if (kart.shieldTimer > 0) {
            kart.shieldTimer = 0; // Shield absorbed attack
          } else {
            if (proj.type === ITEM_TYPES.WATER_BALLOON) {
              kart.waterTrapTimer = 2.0;
              if (kart.isPlayer && this.audio) this.audio.playWaterBalloonHit();
            } else if (proj.type === ITEM_TYPES.ROCKET) {
              kart.speed *= -0.2;
              kart.spinTimer = 1.2;
              if (this.audio) this.audio.playRocketExplosion();
              this.spawnExplosionParticles(kart.x, kart.y);
            }
            if (proj.ownerId === 'player') this.itemHitCount += 1;
          }
          break;
        }
      }

      if (hit || proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // --- PARTICLES & SKIDMARKS ---
  spawnDriftSparks(kart) {
    if (this.animTick % 3 !== 0) return;
    const sparkColor = kart.turboCharge === 2 ? '#EF4444' : '#38BDF8';
    const rearX = kart.x - Math.cos(kart.angle) * 20;
    const rearY = kart.y - Math.sin(kart.angle) * 20;

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: rearX + (Math.random() - 0.5) * 14,
        y: rearY + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        color: sparkColor,
        life: 0.25,
        maxLife: 0.25
      });
    }
  }

  spawnBoostParticles(kart) {
    const rearX = kart.x - Math.cos(kart.angle) * 22;
    const rearY = kart.y - Math.sin(kart.angle) * 22;

    this.particles.push({
      x: rearX,
      y: rearY,
      vx: -Math.cos(kart.angle) * (Math.random() * 6 + 3),
      vy: -Math.sin(kart.angle) * (Math.random() * 6 + 3),
      size: Math.random() * 6 + 4,
      color: Math.random() > 0.5 ? '#F97316' : '#FBBF24',
      life: 0.3,
      maxLife: 0.3
    });
  }

  spawnExplosionParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: Math.random() * 6 + 3,
        color: Math.random() > 0.4 ? '#EF4444' : '#F59E0B',
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  addSkidmark(kart) {
    if (this.animTick % 4 !== 0) return;
    const rearX = kart.x - Math.cos(kart.angle) * 18;
    const rearY = kart.y - Math.sin(kart.angle) * 18;

    this.skidmarks.push({ x: rearX, y: rearY, alpha: 0.45 });
    if (this.skidmarks.length > 200) {
      this.skidmarks.shift();
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- LIVE RANKINGS & FINISH SCORING ---
  getLiveRankings() {
    const sorted = [...this.karts].sort((a, b) => {
      if (a.isFinished && b.isFinished) {
        return a.finishRank - b.finishRank;
      }
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;

      // Waypoint 0 is the finish line of the current lap (after waypoint 15)
      const wpOrderA = a.nextWaypoint === 0 ? TRACK_WAYPOINTS.length : a.nextWaypoint;
      const wpOrderB = b.nextWaypoint === 0 ? TRACK_WAYPOINTS.length : b.nextWaypoint;

      const progressA = (a.currentLap - 1) * TRACK_WAYPOINTS.length + wpOrderA;
      const progressB = (b.currentLap - 1) * TRACK_WAYPOINTS.length + wpOrderB;

      if (progressA !== progressB) {
        return progressB - progressA;
      }

      // Proximity to target waypoint (closer is better)
      const targetWpA = TRACK_WAYPOINTS[a.nextWaypoint];
      const targetWpB = TRACK_WAYPOINTS[b.nextWaypoint];
      const distA = Math.hypot(a.x - targetWpA.x, a.y - targetWpA.y);
      const distB = Math.hypot(b.x - targetWpB.x, b.y - targetWpB.y);
      return distA - distB;
    });

    return sorted;
  }

  getKartRank(kartId) {
    const ranks = this.getLiveRankings();
    const idx = ranks.findIndex(k => k.id === kartId);
    return idx >= 0 ? idx + 1 : 1;
  }

  generateFinalResults() {
    const player = this.karts.find(k => k.isPlayer);
    const playerRank = player.finishRank || this.getKartRank('player');

    const rankBasePoints = RANK_POINTS[Math.min(playerRank - 1, RANK_POINTS.length - 1)] || 500;
    const timeBonus = Math.max(0, 1800 - Math.floor(player.finalTime * 12));
    const driftBonus = this.driftSuccessCount * 50;
    const itemBonus = this.itemHitCount * 100;

    const totalScore = rankBasePoints + timeBonus + driftBonus + itemBonus;

    return {
      playerRank,
      totalScore,
      rankBasePoints,
      timeBonus,
      driftBonus,
      itemBonus,
      finalTime: player.finalTime,
      lapTimes: player.lapTimes,
      allKarts: this.getLiveRankings()
    };
  }
}
