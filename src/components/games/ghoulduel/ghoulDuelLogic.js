// Dochon Games Portal - The Great Ghoul Duel 2D Canvas Physics, AI & P2P Network Renderer Engine

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  MATCH_DURATION_SEC,
  TEAMS,
  GHOST_ROSTER,
  POWERUP_TYPES,
  MANSION_WALLS,
  DIFFICULTY_PRESETS
} from './ghoulDuelConstants';
import { ghoulAudio } from './ghoulDuelAudio';

export class GhoulDuelLogic {
  constructor(options = {}) {
    this.difficultyKey = options.difficulty || 'normal';
    this.difficulty = DIFFICULTY_PRESETS[this.difficultyKey];
    this.onGameOver = options.onGameOver || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // P2P Network Options
    this.networkMode = options.networkMode || 'local'; // 'local' | 'host' | 'guest'
    this.networkPlayers = options.networkPlayers || []; // [{ id, name, team, isHost, slotIndex }]
    this.myPeerId = options.myPeerId || 'local';
    this.onBroadcastSnapshot = options.onBroadcastSnapshot || null;
    this.onSendInput = options.onSendInput || null;

    this.lastBroadcastTime = 0;
    this.remoteInputs = new Map(); // peerId -> { vx, vy, angle }

    this.reset();
  }

  setDifficulty(diffKey) {
    if (DIFFICULTY_PRESETS[diffKey]) {
      this.difficultyKey = diffKey;
      this.difficulty = DIFFICULTY_PRESETS[diffKey];
    }
  }

  // Handle incoming guest input packet on Host
  handleGuestInput(peerId, vector, angle) {
    this.remoteInputs.set(peerId, { vector, angle });
  }

  // Apply received snapshot on Guest
  applySnapshot(snapshot) {
    if (!snapshot || this.networkMode !== 'guest') return;

    this.matchTime = snapshot.time;
    this.teamScores = { ...snapshot.teamScores };

    // Update ghosts
    if (snapshot.ghosts) {
      snapshot.ghosts.forEach((snapG, idx) => {
        if (this.ghosts[idx]) {
          const g = this.ghosts[idx];
          // Smoothly interpolate positions for other players/bots
          if (!g.isPlayer) {
            g.x += (snapG.x - g.x) * 0.45;
            g.y += (snapG.y - g.y) * 0.45;
            g.angle = snapG.angle;
            g.vx = snapG.vx;
            g.vy = snapG.vy;
          }
          g.tail = snapG.tail || [];
          g.depositedCount = snapG.depositedCount;
          g.stolenCount = snapG.stolenCount;
          g.invulnerableTimer = snapG.invulnerableTimer;
          g.activePowerup = snapG.activePowerup;
          g.fsmState = snapG.fsmState || 'SEARCH';
        }
      });
    }

    if (snapshot.spirits) {
      this.spirits = snapshot.spirits;
    }
    if (snapshot.powerupDrops) {
      this.powerupDrops = snapshot.powerupDrops;
    }
  }

  reset() {
    this.isGameOver = false;
    this.isPaused = false;
    this.matchTime = MATCH_DURATION_SEC;
    this.lastSecond = MATCH_DURATION_SEC;

    this.teamScores = {
      green: 0,
      purple: 0
    };

    // Camera viewport
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0
    };

    // Build 8 Ghost Entities with Network / Local Mapping
    const greenPlayers = this.networkPlayers.filter((p) => p.team === 'green');
    const purplePlayers = this.networkPlayers.filter((p) => p.team === 'purple');

    this.ghosts = GHOST_ROSTER.map((info, idx) => {
      const isGreen = info.team === 'green';
      const base = isGreen ? TEAMS.GREEN : TEAMS.PURPLE;
      const startX = base.baseX + base.baseWidth / 2 + (Math.random() - 0.5) * 80;
      const startY = base.baseY + base.baseHeight / 2 + (Math.random() - 0.5) * 80;

      // Determine if slot is assigned to a real human player
      let isPlayer = false;
      let isRemoteHuman = false;
      let networkPeerId = null;
      let displayName = info.name;

      if (this.networkMode === 'local') {
        isPlayer = info.isPlayer; // Green leader is local player
      } else {
        // Multi-player slot mapping
        const teamSlotIdx = isGreen ? idx : idx - 4;
        const targetList = isGreen ? greenPlayers : purplePlayers;
        const assignedPlayer = targetList[teamSlotIdx];

        if (assignedPlayer) {
          const isMe =
            assignedPlayer.id === this.myPeerId ||
            (assignedPlayer.isHost && this.networkMode === 'host');

          if (isMe) {
            isPlayer = true;
            displayName = `${assignedPlayer.name} (나)`;
          } else {
            isRemoteHuman = true;
            networkPeerId = assignedPlayer.id;
            displayName = assignedPlayer.name;
          }
        }
      }

      return {
        ...info,
        name: displayName,
        isPlayer,
        isRemoteHuman,
        networkPeerId,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        angle: isGreen ? Math.PI / 4 : -3 * Math.PI / 4,
        targetAngle: isGreen ? Math.PI / 4 : -3 * Math.PI / 4,
        speed: isPlayer ? this.difficulty.playerSpeed : this.difficulty.aiSpeed,
        radius: 22,
        tail: [], // Array of { x, y, angle, isMega }
        depositedCount: 0,
        stolenCount: 0,
        invulnerableTimer: 0,
        activePowerup: null, // { type, timer }
        // AI State
        fsmState: 'SEARCH',
        targetX: startX,
        targetY: startY,
        aiTimer: Math.random() * 2,
        wobbleOffset: Math.random() * Math.PI * 2
      };
    });

    this.player = this.ghosts.find((g) => g.isPlayer) || this.ghosts[0];

    // Initialize Floating Spirits & Powerups
    this.spirits = [];
    this.initSpirits(65);

    this.powerupDrops = [];
    this.spawnPowerupDrop();

    // Particle & Visual Effect Systems
    this.particles = [];
    this.floatingTexts = [];
    this.depositBeams = [];

    // Controller input
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };
  }

  // Generate Initial Spirit Clusters across the Mansion
  initSpirits(count) {
    this.spirits = [];
    for (let i = 0; i < count; i++) {
      this.spawnSingleSpirit(i < 6 ? 'mega' : 'normal');
    }
  }

  spawnSingleSpirit(type = 'normal') {
    let attempts = 0;
    while (attempts < 30) {
      attempts++;
      const x = 60 + Math.random() * (WORLD_WIDTH - 120);
      const y = 60 + Math.random() * (WORLD_HEIGHT - 120);

      // Check if inside wall
      let insideWall = false;
      for (const wall of MANSION_WALLS) {
        if (x >= wall.x - 20 && x <= wall.x + wall.w + 20 && y >= wall.y - 20 && y <= wall.y + wall.h + 20) {
          insideWall = true;
          break;
        }
      }

      if (!insideWall) {
        this.spirits.push({
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          type,
          value: type === 'mega' ? 5 : 1,
          radius: type === 'mega' ? 14 : 9,
          floatOffset: Math.random() * Math.PI * 2
        });
        break;
      }
    }
  }

  spawnPowerupDrop() {
    const types = Object.keys(POWERUP_TYPES);
    const selectedType = types[Math.floor(Math.random() * types.length)];
    let attempts = 0;
    while (attempts < 20) {
      attempts++;
      const x = 200 + Math.random() * (WORLD_WIDTH - 400);
      const y = 200 + Math.random() * (WORLD_HEIGHT - 400);

      let insideWall = false;
      for (const wall of MANSION_WALLS) {
        if (x >= wall.x - 30 && x <= wall.x + wall.w + 30 && y >= wall.y - 30 && y <= wall.y + wall.h + 30) {
          insideWall = true;
          break;
        }
      }

      if (!insideWall) {
        this.powerupDrops.push({
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          type: selectedType,
          info: POWERUP_TYPES[selectedType],
          pulse: 0
        });
        break;
      }
    }
  }

  handleKeyDown(code) {
    this.keys[code] = true;
  }

  handleKeyUp(code) {
    this.keys[code] = false;
  }

  setJoystick(vector) {
    this.joystickVector = vector;
  }

  // Main Game Loop Update
  update(deltaTime) {
    if (this.isGameOver || this.isPaused) return;

    // 1. Update Match Time
    this.matchTime -= deltaTime;
    if (this.matchTime <= 0) {
      this.matchTime = 0;
      this.endGame();
      return;
    }

    const currentSec = Math.ceil(this.matchTime);
    if (currentSec <= 10 && currentSec !== this.lastSecond) {
      this.lastSecond = currentSec;
      ghoulAudio.playCountdownBeep();
    }

    // 2. Host / Local: Periodic Respawn of Spirits & Powerups
    if (this.networkMode !== 'guest') {
      if (this.spirits.length < 65 && Math.random() < 0.05) {
        this.spawnSingleSpirit(Math.random() < 0.08 ? 'mega' : 'normal');
      }
      if (this.powerupDrops.length < 2 && Math.random() < 0.01) {
        this.spawnPowerupDrop();
      }
    }

    // 3. Update Ghosts
    this.ghosts.forEach((ghost) => {
      this.updateGhost(ghost, deltaTime);
    });

    // 4. Host / Local: Check Tail Steal Collisions
    if (this.networkMode !== 'guest') {
      this.checkTailSteals();
    }

    // 5. Host: 30Hz Snapshot Broadcast to all connected peers
    if (this.networkMode === 'host' && this.onBroadcastSnapshot) {
      const now = performance.now();
      if (now - this.lastBroadcastTime >= 33) {
        this.lastBroadcastTime = now;
        const snapshot = {
          time: Math.ceil(this.matchTime),
          teamScores: this.teamScores,
          ghosts: this.ghosts.map((g) => ({
            x: Math.round(g.x),
            y: Math.round(g.y),
            vx: Number(g.vx.toFixed(2)),
            vy: Number(g.vy.toFixed(2)),
            angle: Number(g.angle.toFixed(2)),
            tail: g.tail,
            depositedCount: g.depositedCount,
            stolenCount: g.stolenCount,
            invulnerableTimer: Number(g.invulnerableTimer.toFixed(2)),
            activePowerup: g.activePowerup,
            fsmState: g.fsmState
          })),
          spirits: this.spirits,
          powerupDrops: this.powerupDrops
        };
        this.onBroadcastSnapshot(snapshot);
      }
    }

    // 6. Update Camera smoothly tracking local player
    if (this.player) {
      const targetCamX = this.player.x - CANVAS_WIDTH / 2;
      const targetCamY = this.player.y - CANVAS_HEIGHT / 2;
      this.camera.x += (targetCamX - this.camera.x) * 0.1;
      this.camera.y += (targetCamY - this.camera.y) * 0.1;

      // Clamp Camera to World
      this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, this.camera.x));
      this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, this.camera.y));
    }

    // 7. Update Particle & Floating Text FX
    this.updateParticles(deltaTime);

    // Notify React state changes
    this.onStateChange({
      teamScores: this.teamScores,
      matchTime: Math.ceil(this.matchTime),
      playerTail: this.player ? this.player.tail.length : 0,
      playerDeposited: this.player ? this.player.depositedCount : 0
    });
  }

  updateGhost(ghost, deltaTime) {
    // A. Update Timers & Powerups
    if (ghost.invulnerableTimer > 0) {
      ghost.invulnerableTimer -= deltaTime;
    }

    let speedMultiplier = 1.0;
    let canPassWalls = false;
    let magnetRadius = 0;

    if (ghost.activePowerup) {
      ghost.activePowerup.timer -= deltaTime * 1000;
      const pInfo = POWERUP_TYPES[ghost.activePowerup.type];
      if (pInfo) {
        if (pInfo.speedMultiplier) speedMultiplier = pInfo.speedMultiplier;
        if (pInfo.id === 'ghost_walk') canPassWalls = true;
        if (pInfo.magnetRadius) magnetRadius = pInfo.magnetRadius;
      }
      if (ghost.activePowerup.timer <= 0) {
        ghost.activePowerup = null;
      }
    }

    // B. Calculate Direction & Movement
    let moveX = 0;
    let moveY = 0;

    if (ghost.isPlayer) {
      // Local Player Keyboard / Joystick Input
      if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
      if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;

      if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
        moveX += this.joystickVector.x;
        moveY += this.joystickVector.y;
      }

      // Guest: send input to host via P2P
      if (this.networkMode === 'guest' && this.onSendInput) {
        this.onSendInput({ x: moveX, y: moveY }, ghost.angle);
      }
    } else if (ghost.isRemoteHuman) {
      // Remote Network Human Player: Apply received network input
      const remoteInput = this.remoteInputs.get(ghost.networkPeerId);
      if (remoteInput && remoteInput.vector) {
        moveX = remoteInput.vector.x || 0;
        moveY = remoteInput.vector.y || 0;
      }
    } else {
      // Smart AI Behavior (FSM)
      if (this.networkMode !== 'guest') {
        this.updateAIBehavior(ghost, deltaTime);
        moveX = ghost.vx;
        moveY = ghost.vy;
      }
    }

    // Normalize & Apply Speed
    const len = Math.hypot(moveX, moveY);
    if (len > 0.05) {
      const currentSpeed = ghost.speed * speedMultiplier;
      const normalizedX = (moveX / len) * currentSpeed;
      const normalizedY = (moveY / len) * currentSpeed;

      ghost.vx = normalizedX;
      ghost.vy = normalizedY;
      ghost.targetAngle = Math.atan2(normalizedY, normalizedX);

      // Smooth turn angle
      let diff = ghost.targetAngle - ghost.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      ghost.angle += diff * 0.15;
    } else {
      ghost.vx *= 0.8;
      ghost.vy *= 0.8;
    }

    // Move ghost with Wall Collision Check
    const newX = ghost.x + ghost.vx;
    const newY = ghost.y + ghost.vy;

    if (canPassWalls) {
      ghost.x = Math.max(30, Math.min(WORLD_WIDTH - 30, newX));
      ghost.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, newY));
    } else {
      const resolved = this.resolveWallCollisions(ghost.x, ghost.y, newX, newY, ghost.radius);
      ghost.x = resolved.x;
      ghost.y = resolved.y;
    }

    // C. Update Chain IK Spirit Tail
    this.updateGhostTail(ghost);

    // D. Collect Spirits & Powerups (Host / Local only)
    if (this.networkMode !== 'guest') {
      this.checkSpiritPickups(ghost, magnetRadius);
      this.checkPowerupPickups(ghost);
      this.checkBaseDeposit(ghost);
    }
  }

  // Resolve Circle vs Axis-Aligned Bounding Box (AABB) Wall Obstacles
  resolveWallCollisions(currX, currY, nextX, nextY, radius) {
    let finalX = nextX;
    let finalY = nextY;

    finalX = Math.max(radius + 40, Math.min(WORLD_WIDTH - radius - 40, finalX));
    finalY = Math.max(radius + 40, Math.min(WORLD_HEIGHT - radius - 40, finalY));

    for (const wall of MANSION_WALLS) {
      const closestX = Math.max(wall.x, Math.min(finalX, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(finalY, wall.y + wall.h));

      const distX = finalX - closestX;
      const distY = finalY - closestY;
      const distance = Math.hypot(distX, distY);

      if (distance < radius) {
        if (distance > 0) {
          const overlap = radius - distance;
          finalX += (distX / distance) * overlap;
          finalY += (distY / distance) * overlap;
        } else {
          finalX = currX;
          finalY = currY;
        }
      }
    }

    return { x: finalX, y: finalY };
  }

  // Chain Inverse Kinematics for Smooth Spirit Tail Motion
  updateGhostTail(ghost) {
    const tailSpacing = 16;
    let prevX = ghost.x;
    let prevY = ghost.y;

    for (let i = 0; i < ghost.tail.length; i++) {
      const segment = ghost.tail[i];
      const dx = segment.x - prevX;
      const dy = segment.y - prevY;
      const dist = Math.hypot(dx, dy);

      if (dist > tailSpacing) {
        const ratio = tailSpacing / dist;
        segment.x = prevX + dx * ratio;
        segment.y = prevY + dy * ratio;
      }
      segment.angle = Math.atan2(prevY - segment.y, prevX - segment.x);

      prevX = segment.x;
      prevY = segment.y;
    }
  }

  // Smart AI Finite State Machine (SEARCH, RETURN, HUNT_STEAL, FLEE)
  updateAIBehavior(bot, deltaTime) {
    bot.aiTimer -= deltaTime;
    const isGreen = bot.team === 'green';
    const myBase = isGreen ? TEAMS.GREEN : TEAMS.PURPLE;
    const baseCenterX = myBase.baseX + myBase.baseWidth / 2;
    const baseCenterY = myBase.baseY + myBase.baseHeight / 2;

    const tailCount = bot.tail.length;
    const distToBase = Math.hypot(baseCenterX - bot.x, baseCenterY - bot.y);

    // 1. Evaluate State Transitions every 0.25~0.5 sec
    if (bot.aiTimer <= 0) {
      bot.aiTimer = 0.25 + Math.random() * 0.35;

      let threateningEnemy = null;
      let closestEnemyDist = 9999;
      for (const enemy of this.ghosts) {
        if (enemy.team !== bot.team) {
          const d = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);
          if (d < closestEnemyDist) {
            closestEnemyDist = d;
            threateningEnemy = enemy;
          }
        }
      }

      let stealTarget = null;
      let bestStealDist = 380;
      for (const enemy of this.ghosts) {
        if (enemy.team !== bot.team && enemy.tail.length >= 2 && enemy.invulnerableTimer <= 0) {
          const d = Math.hypot(enemy.x - bot.x, enemy.y - bot.y);
          if (d < bestStealDist && Math.random() < this.difficulty.aiStealAggressiveness) {
            bestStealDist = d;
            stealTarget = enemy;
          }
        }
      }

      // Priority: FLEE > RETURN > HUNT_STEAL > SEARCH
      if (tailCount >= 4 && threateningEnemy && closestEnemyDist < 220) {
        bot.fsmState = 'FLEE';
        bot.threatGhost = threateningEnemy;
      } else if (this.matchTime < 18 || tailCount >= 8 || (tailCount >= 5 && distToBase < 350)) {
        bot.fsmState = 'RETURN';
      } else if (stealTarget) {
        bot.fsmState = 'HUNT_STEAL';
        bot.targetGhost = stealTarget;
      } else {
        bot.fsmState = 'SEARCH';
      }
    }

    // 2. Execute Target Calculation per State
    let targetX = baseCenterX;
    let targetY = baseCenterY;

    if (bot.fsmState === 'FLEE' && bot.threatGhost) {
      const awayX = bot.x - bot.threatGhost.x;
      const awayY = bot.y - bot.threatGhost.y;
      const awayLen = Math.hypot(awayX, awayY) || 1;

      const toBaseX = baseCenterX - bot.x;
      const toBaseY = baseCenterY - bot.y;
      const toBaseLen = Math.hypot(toBaseX, toBaseY) || 1;

      targetX = bot.x + (awayX / awayLen) * 300 + (toBaseX / toBaseLen) * 120;
      targetY = bot.y + (awayY / awayLen) * 300 + (toBaseY / toBaseLen) * 120;
    } else if (bot.fsmState === 'RETURN') {
      targetX = baseCenterX;
      targetY = baseCenterY;
    } else if (bot.fsmState === 'HUNT_STEAL' && bot.targetGhost) {
      const targetTail = bot.targetGhost.tail;
      if (targetTail.length > 0) {
        const interceptIdx = Math.min(targetTail.length - 1, Math.max(1, Math.floor(targetTail.length * 0.6)));
        const targetNode = targetTail[interceptIdx];
        targetX = targetNode.x + (bot.targetGhost.vx || 0) * 8;
        targetY = targetNode.y + (bot.targetGhost.vy || 0) * 8;
      } else {
        targetX = bot.targetGhost.x;
        targetY = bot.targetGhost.y;
      }
    } else {
      let bestScore = -99999;
      for (const spirit of this.spirits) {
        const d = Math.hypot(spirit.x - bot.x, spirit.y - bot.y);
        const score = (spirit.value * 200) - d;
        if (score > bestScore) {
          bestScore = score;
          targetX = spirit.x;
          targetY = spirit.y;
        }
      }

      for (const drop of this.powerupDrops) {
        const d = Math.hypot(drop.x - bot.x, drop.y - bot.y);
        const score = 800 - d;
        if (score > bestScore) {
          bestScore = score;
          targetX = drop.x;
          targetY = drop.y;
        }
      }
    }

    // 3. Compute Steering Vector with Wall Avoidance
    let steerX = targetX - bot.x;
    let steerY = targetY - bot.y;
    const steerLen = Math.hypot(steerX, steerY) || 1;
    let dirX = steerX / steerLen;
    let dirY = steerY / steerLen;

    if (!bot.activePowerup || bot.activePowerup.type !== 'ghost_walk') {
      const probeDist = 55;
      const probeX = bot.x + dirX * probeDist;
      const probeY = bot.y + dirY * probeDist;

      for (const wall of MANSION_WALLS) {
        if (
          probeX >= wall.x - 10 &&
          probeX <= wall.x + wall.w + 10 &&
          probeY >= wall.y - 10 &&
          probeY <= wall.y + wall.h + 10
        ) {
          const slideX = -dirY;
          const slideY = dirX;
          dirX = dirX * 0.3 + slideX * 0.7;
          dirY = dirY * 0.3 + slideY * 0.7;
          break;
        }
      }
    }

    const wobble = Math.sin(Date.now() * 0.004 + bot.wobbleOffset) * 0.18;
    const finalAngle = Math.atan2(dirY, dirX) + wobble;

    bot.vx = Math.cos(finalAngle);
    bot.vy = Math.sin(finalAngle);
  }

  // Spirit Flame Pickups
  checkSpiritPickups(ghost, magnetRadius) {
    const pickupRadius = ghost.radius + 15 + magnetRadius;

    for (let i = this.spirits.length - 1; i >= 0; i--) {
      const spirit = this.spirits[i];
      const dist = Math.hypot(spirit.x - ghost.x, spirit.y - ghost.y);

      if (magnetRadius > 0 && dist < pickupRadius && dist > 20) {
        spirit.x += (ghost.x - spirit.x) * 0.12;
        spirit.y += (ghost.y - spirit.y) * 0.12;
      }

      if (dist < ghost.radius + spirit.radius) {
        const isMega = spirit.type === 'mega';
        const addCount = isMega ? 5 : 1;

        for (let k = 0; k < addCount; k++) {
          const lastNode = ghost.tail.length > 0 ? ghost.tail[ghost.tail.length - 1] : ghost;
          ghost.tail.push({
            x: lastNode.x - Math.cos(ghost.angle) * 14,
            y: lastNode.y - Math.sin(ghost.angle) * 14,
            angle: ghost.angle,
            isMega: isMega && k === 0
          });
        }

        if (ghost.isPlayer) {
          if (isMega) {
            ghoulAudio.playMegaSpirit();
            this.addFloatingText(ghost.x, ghost.y - 30, '🌟 MEGA SPIRIT! +5', '#fde047');
          } else {
            ghoulAudio.playSpiritPickup();
          }
        }

        this.addSparks(spirit.x, spirit.y, ghost.team === 'green' ? '#34d399' : '#c084fc', isMega ? 15 : 6);
        this.spirits.splice(i, 1);
      }
    }
  }

  // Powerup Rune Pickups
  checkPowerupPickups(ghost) {
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.powerupDrops[i];
      const dist = Math.hypot(drop.x - ghost.x, drop.y - ghost.y);

      if (dist < ghost.radius + 20) {
        ghost.activePowerup = {
          type: drop.type,
          timer: drop.info.duration
        };

        if (ghost.isPlayer) {
          ghoulAudio.playPowerup();
          this.addFloatingText(ghost.x, ghost.y - 40, `${drop.info.icon} ${drop.info.name}!`, drop.info.color);
        }

        this.addSparks(drop.x, drop.y, drop.info.color, 25);
        this.powerupDrops.splice(i, 1);
      }
    }
  }

  // Interception Tail Steal Collision Detection
  checkTailSteals() {
    for (const attacker of this.ghosts) {
      for (const victim of this.ghosts) {
        if (attacker.team === victim.team) continue;
        if (victim.tail.length === 0 || victim.invulnerableTimer > 0) continue;

        for (let i = 1; i < victim.tail.length; i++) {
          const seg = victim.tail[i];
          const dist = Math.hypot(attacker.x - seg.x, attacker.y - seg.y);

          if (dist < attacker.radius + 12) {
            const severedTail = victim.tail.splice(i);
            const stolenCount = severedTail.length;

            if (stolenCount > 0) {
              for (const stolenNode of severedTail) {
                attacker.tail.push({
                  x: stolenNode.x,
                  y: stolenNode.y,
                  angle: attacker.angle,
                  isMega: stolenNode.isMega
                });
              }

              attacker.stolenCount += stolenCount;
              victim.invulnerableTimer = 1.5;

              if (attacker.isPlayer) {
                ghoulAudio.playStealSuccess();
                this.addFloatingText(attacker.x, attacker.y - 35, `⚡ STEAL! +${stolenCount}`, '#fbbf24');
              } else if (victim.isPlayer) {
                ghoulAudio.playStealLost();
                this.addFloatingText(victim.x, victim.y - 35, `💔 꼬리 빼앗김! -${stolenCount}`, '#ef4444');
              }

              this.addLightningArc(attacker.x, attacker.y, seg.x, seg.y, attacker.team === 'green' ? '#10b981' : '#a855f7');
              this.addSparks(seg.x, seg.y, '#f59e0b', 20);
              break;
            }
          }
        }
      }
    }
  }

  // Team Base Spirit Deposit & Scoring
  checkBaseDeposit(ghost) {
    const isGreen = ghost.team === 'green';
    const base = isGreen ? TEAMS.GREEN : TEAMS.PURPLE;

    if (
      ghost.x >= base.baseX &&
      ghost.x <= base.baseX + base.baseWidth &&
      ghost.y >= base.baseY &&
      ghost.y <= base.baseY + base.baseHeight
    ) {
      if (ghost.tail.length > 0) {
        const depositRate = Math.min(3, ghost.tail.length);
        let depositedPoints = 0;

        for (let k = 0; k < depositRate; k++) {
          const node = ghost.tail.shift();
          const pts = node.isMega ? 5 : 1;
          depositedPoints += pts;
          this.teamScores[ghost.team] += pts;
          ghost.depositedCount += pts;

          const altarCenterX = base.baseX + base.baseWidth / 2;
          const altarCenterY = base.baseY + base.baseHeight / 2;
          this.addDepositParticle(node.x, node.y, altarCenterX, altarCenterY, base.primaryColor);
        }

        if (ghost.isPlayer) {
          ghoulAudio.playBaseDeposit(depositedPoints);
          this.addFloatingText(ghost.x, ghost.y - 30, `+${depositedPoints} 영혼 납품!`, base.primaryColor);
        }
      }
    }
  }

  endGame() {
    this.isGameOver = true;
    const greenTotal = this.teamScores.green;
    const purpleTotal = this.teamScores.purple;
    const isGreenTeam = this.player ? this.player.team === 'green' : true;
    const isVictory = isGreenTeam ? greenTotal > purpleTotal : purpleTotal > greenTotal;

    ghoulAudio.playMatchEnd();
    setTimeout(() => {
      if (isVictory) {
        ghoulAudio.playVictory();
      } else {
        ghoulAudio.playDefeat();
      }
    }, 400);

    const stats = {
      teamGreenScore: greenTotal,
      teamPurpleScore: purpleTotal,
      isVictory,
      playerScore: this.player ? this.player.depositedCount : 0,
      playerStolen: this.player ? this.player.stolenCount : 0,
      roster: this.ghosts.map((g) => ({
        id: g.id,
        name: g.name,
        team: g.team,
        isPlayer: g.isPlayer,
        deposited: g.depositedCount,
        stolen: g.stolenCount
      }))
    };

    this.onGameOver(stats);
  }

  // FX Helpers
  addSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        life: 0.4 + Math.random() * 0.4
      });
    }
  }

  addDepositParticle(startX, startY, targetX, targetY, color) {
    this.particles.push({
      type: 'deposit_beam',
      x: startX,
      y: startY,
      targetX,
      targetY,
      color,
      progress: 0,
      speed: 0.08
    });
  }

  addLightningArc(x1, y1, x2, y2, color) {
    this.particles.push({
      type: 'lightning',
      x1,
      y1,
      x2,
      y2,
      color,
      alpha: 1,
      life: 0.25
    });
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 1.2
    });
  }

  updateParticles(deltaTime) {
    // 1. Sparks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'spark') {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= deltaTime / p.life;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      } else if (p.type === 'deposit_beam') {
        p.progress += p.speed;
        p.x += (p.targetX - p.x) * 0.2;
        p.y += (p.targetY - p.y) * 0.2;
        if (p.progress >= 1 || Math.hypot(p.targetX - p.x, p.targetY - p.y) < 15) {
          this.particles.splice(i, 1);
        }
      } else if (p.type === 'lightning') {
        p.alpha -= deltaTime / p.life;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      }
    }

    // 2. Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * deltaTime;
      ft.alpha -= deltaTime / ft.life;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  // Main 2D Canvas Renderer
  render(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Mansion Floor
    this.renderMansionFloor(ctx);

    // 2. Draw Team Bases
    this.renderTeamBase(ctx, TEAMS.GREEN);
    this.renderTeamBase(ctx, TEAMS.PURPLE);

    // 3. Draw Mansion Walls & Columns
    this.renderMansionWalls(ctx);

    // 4. Draw Powerup Drops
    this.renderPowerupDrops(ctx);

    // 5. Draw Floating Spirit Flames
    this.renderSpirits(ctx);

    // 6. Draw Ghost Tails
    this.ghosts.forEach((ghost) => {
      this.renderGhostTail(ctx, ghost);
    });

    // 7. Draw Ghost Characters
    this.ghosts.forEach((ghost) => {
      this.renderGhostBody(ctx, ghost);
    });

    // 8. Draw FX Particles & Lightning
    this.renderParticles(ctx);

    // 9. Draw Floating Score Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();

    // 10. Draw Mini-Map Radar (HUD)
    this.renderMinimap(ctx);

    ctx.restore();
  }

  renderMansionFloor(ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < WORLD_WIDTH; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
  }

  renderTeamBase(ctx, team) {
    const cx = team.baseX + team.baseWidth / 2;
    const cy = team.baseY + team.baseHeight / 2;

    ctx.save();
    ctx.fillStyle = team.baseColor;
    ctx.strokeStyle = team.baseBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(team.baseX, team.baseY, team.baseWidth, team.baseHeight, 24);
    ctx.fill();
    ctx.stroke();

    const pulse = Math.sin(Date.now() * 0.005) * 6;
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 80 + pulse);
    grad.addColorStop(0, team.primaryColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 80 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = team.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${team.name} 기지`, cx, cy - 20);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = team.glowColor;
    ctx.fillText(`${this.teamScores[team.id]}점`, cx, cy + 15);

    ctx.restore();
  }

  renderMansionWalls(ctx) {
    ctx.save();
    for (const wall of MANSION_WALLS) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(wall.x + 4, wall.y + 4, wall.w, wall.h);

      const grad = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
    ctx.restore();
  }

  renderSpirits(ctx) {
    const time = Date.now() * 0.004;

    this.spirits.forEach((spirit) => {
      const floatY = Math.sin(time + spirit.floatOffset) * 5;
      const isMega = spirit.type === 'mega';
      const rad = spirit.radius + Math.sin(time * 2 + spirit.floatOffset) * 2;

      ctx.save();
      ctx.translate(spirit.x, spirit.y + floatY);

      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rad * 2.2);
      if (isMega) {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, '#bae6fd');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isMega ? '#ffffff' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();

      if (isMega) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★5', 0, 4);
      }

      ctx.restore();
    });
  }

  renderPowerupDrops(ctx) {
    const time = Date.now() * 0.005;

    this.powerupDrops.forEach((drop) => {
      const bounce = Math.sin(time) * 4;
      ctx.save();
      ctx.translate(drop.x, drop.y + bounce);

      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 28);
      grad.addColorStop(0, drop.info.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = drop.info.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drop.info.icon, 0, 1);

      ctx.restore();
    });
  }

  renderGhostTail(ctx, ghost) {
    if (ghost.tail.length === 0) return;

    const isGreen = ghost.team === 'green';
    const color = isGreen ? '#34d399' : '#c084fc';
    const glowColor = isGreen ? 'rgba(52, 211, 153, 0.4)' : 'rgba(192, 132, 252, 0.4)';

    ctx.save();

    for (let i = 0; i < ghost.tail.length; i++) {
      const node = ghost.tail[i];
      const scale = Math.max(0.45, 1 - i * 0.025);
      const rad = 11 * scale;

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = node.isMega ? '#fef08a' : color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderGhostBody(ctx, ghost) {
    ctx.save();

    if (ghost.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.translate(ghost.x, ghost.y);

    if (ghost.activePowerup) {
      const pColor = POWERUP_TYPES[ghost.activePowerup.type]?.color || '#ffffff';
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, ghost.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, ghost.radius + 4, ghost.radius * 0.8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const floatWobble = Math.sin(Date.now() * 0.006 + ghost.wobbleOffset) * 3;
    ctx.translate(0, floatWobble);

    const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, ghost.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, ghost.color);
    grad.addColorStop(1, ghost.glow);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(0, -4, ghost.radius, Math.PI, 0, false);
    ctx.lineTo(ghost.radius, ghost.radius);
    ctx.quadraticCurveTo(ghost.radius * 0.5, ghost.radius + 6, 0, ghost.radius);
    ctx.quadraticCurveTo(-ghost.radius * 0.5, ghost.radius + 6, -ghost.radius, ghost.radius);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = ghost.glow;
    ctx.lineWidth = 2;
    ctx.stroke();

    const eyeOffsetX = Math.cos(ghost.angle) * 4;
    const eyeOffsetY = Math.sin(ghost.angle) * 3;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-6 + eyeOffsetX, -4 + eyeOffsetY, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6 + eyeOffsetX, -4 + eyeOffsetY, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7 + eyeOffsetX, -6 + eyeOffsetY, 1.2, 0, Math.PI * 2);
    ctx.arc(5 + eyeOffsetX, -6 + eyeOffsetY, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
    ctx.beginPath();
    ctx.arc(-11, 2, 3, 0, Math.PI * 2);
    ctx.arc(11, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    this.renderGhostHat(ctx, ghost.hat);

    ctx.restore();

    // Name & Tail Counter Badge
    ctx.save();
    ctx.translate(ghost.x, ghost.y - 36);

    let stateIcon = '';
    if (ghost.isPlayer) {
      stateIcon = '👑 ';
    } else if (ghost.isRemoteHuman) {
      stateIcon = '🌐 ';
    } else if (ghost.fsmState === 'FLEE') {
      stateIcon = '😱 ';
    } else if (ghost.fsmState === 'HUNT_STEAL') {
      stateIcon = '⚡ ';
    } else if (ghost.fsmState === 'RETURN') {
      stateIcon = '🏃 ';
    }

    const badgeText = `${stateIcon}${ghost.name} ${ghost.tail.length > 0 ? `(${ghost.tail.length})` : ''}`;
    ctx.font = ghost.isPlayer ? 'bold 12px sans-serif' : '11px sans-serif';
    const textWidth = ctx.measureText(badgeText).width;

    ctx.fillStyle = ghost.isPlayer ? 'rgba(16, 185, 129, 0.9)' : 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = ghost.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 6, -10, textWidth + 12, 18, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 0);

    ctx.restore();
  }

  renderGhostHat(ctx, hatType) {
    ctx.save();
    ctx.translate(0, -22);

    if (hatType === 'crown') {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, 6);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, -8);
      ctx.lineTo(6, 0);
      ctx.lineTo(12, -4);
      ctx.lineTo(12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (hatType === 'witch') {
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.ellipse(0, 6, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(4, -14);
      ctx.lineTo(10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, 3, 12, 3);
    } else if (hatType === 'cat_ears') {
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(-10, 6);
      ctx.lineTo(-7, -4);
      ctx.lineTo(-2, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, 6);
      ctx.lineTo(7, -4);
      ctx.lineTo(10, 6);
      ctx.fill();
    } else if (hatType === 'horns') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.quadraticCurveTo(-12, -6, -4, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.quadraticCurveTo(12, -6, 4, 4);
      ctx.fill();
    } else if (hatType === 'pumpkin') {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(0, 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-1, -6, 2, 4);
    }

    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    this.particles.forEach((p) => {
      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'deposit_beam') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        const midX = (p.x1 + p.x2) / 2 + (Math.random() - 0.5) * 30;
        const midY = (p.y1 + p.y2) / 2 + (Math.random() - 0.5) * 30;
        ctx.lineTo(midX, midY);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    ctx.save();
    this.floatingTexts.forEach((ft) => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
  }

  // Mini-Map Radar HUD (Top Right Corner)
  renderMinimap(ctx) {
    const mapW = 150;
    const mapH = 100;
    const posX = CANVAS_WIDTH - mapW - 15;
    const posY = 15;
    const scaleX = mapW / WORLD_WIDTH;
    const scaleY = mapH / WORLD_HEIGHT;

    ctx.save();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(posX, posY, mapW, mapH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.fillRect(
      posX + TEAMS.GREEN.baseX * scaleX,
      posY + TEAMS.GREEN.baseY * scaleY,
      TEAMS.GREEN.baseWidth * scaleX,
      TEAMS.GREEN.baseHeight * scaleY
    );

    ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.fillRect(
      posX + TEAMS.PURPLE.baseX * scaleX,
      posY + TEAMS.PURPLE.baseY * scaleY,
      TEAMS.PURPLE.baseWidth * scaleX,
      TEAMS.PURPLE.baseHeight * scaleY
    );

    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    MANSION_WALLS.forEach((w) => {
      ctx.fillRect(posX + w.x * scaleX, posY + w.y * scaleY, Math.max(1, w.w * scaleX), Math.max(1, w.h * scaleY));
    });

    this.ghosts.forEach((g) => {
      const gx = posX + g.x * scaleX;
      const gy = posY + g.y * scaleY;
      ctx.fillStyle = g.isPlayer ? '#fde047' : g.team === 'green' ? '#34d399' : '#c084fc';
      ctx.beginPath();
      ctx.arc(gx, gy, g.isPlayer ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
