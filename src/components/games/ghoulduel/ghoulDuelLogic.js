// Dochon Games Portal - The Great Ghoul Duel 2D Canvas Physics, AI & P2P Network Renderer Engine
// v4: Synchronized P2P Authority (Position Sync, Lag-Compensated Pickups/Deposits, Viewport Culling & Chromebook Optimization)

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
    this.playerName = options.playerName || '';
    this.onBroadcastSnapshot = options.onBroadcastSnapshot || null;
    this.onBroadcastGameOver = options.onBroadcastGameOver || null;
    this.onSendInput = options.onSendInput || null;

    this.lastBroadcastTime = 0;
    this.lastInputSendTime = 0;
    this.remoteInputs = new Map(); // peerId -> { x, y, vx, vy, angle, vector }

    // Throttled React state change cache to eliminate 60Hz re-render lag
    this._lastReportedScores = null;
    this._lastReportedSec = -1;
    this._lastReportedTail = -1;
    this._lastReportedDep = -1;

    this.reset();
  }

  setDifficulty(diffKey) {
    if (DIFFICULTY_PRESETS[diffKey]) {
      this.difficultyKey = diffKey;
      this.difficulty = DIFFICULTY_PRESETS[diffKey];
    }
  }

  // Handle incoming guest input & position packet on Host
  handleGuestInput(peerId, data) {
    this.remoteInputs.set(peerId, data);
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

          if (!g.isPlayer) {
            // Smoothly interpolate positions for other players and bots
            g.x += (snapG.x - g.x) * 0.55;
            g.y += (snapG.y - g.y) * 0.55;
            g.angle = snapG.angle;
            g.vx = snapG.vx;
            g.vy = snapG.vy;
          } else {
            // Local player on Guest:
            // Check for pickups and deposits registered by Host to play sounds and FX
            const oldTailLen = g.tail ? g.tail.length : 0;
            const newTailLen = snapG.tail ? snapG.tail.length : 0;
            const oldDeposited = g.depositedCount || 0;
            const newDeposited = snapG.depositedCount || 0;

            if (newTailLen > oldTailLen) {
              const gained = newTailLen - oldTailLen;
              if (gained >= 5) {
                ghoulAudio.playMegaSpirit();
                this.addFloatingText(g.x, g.y - 30, `🌟 MEGA SPIRIT! +${gained}`, '#fde047');
              } else {
                ghoulAudio.playSpiritPickup();
              }
              this.addSparks(g.x, g.y, g.team === 'green' ? '#34d399' : '#c084fc', 8);
            }

            if (newDeposited > oldDeposited) {
              const pts = newDeposited - oldDeposited;
              const base = g.team === 'green' ? TEAMS.GREEN : TEAMS.PURPLE;
              ghoulAudio.playBaseDeposit(pts);
              this.addFloatingText(g.x, g.y - 30, `+${pts} 영혼 납품!`, base.primaryColor);
              this.addDepositParticle(
                g.x,
                g.y,
                base.baseX + base.baseWidth / 2,
                base.baseY + base.baseHeight / 2,
                base.primaryColor
              );
            }

            // Gently blend towards Host position if large drift occurred (> 100px)
            const driftDist = Math.hypot(snapG.x - g.x, snapG.y - g.y);
            if (driftDist > 100) {
              g.x += (snapG.x - g.x) * 0.35;
              g.y += (snapG.y - g.y) * 0.35;
            }
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
            (assignedPlayer.isHost && this.networkMode === 'host') ||
            (this.networkMode === 'guest' &&
              this.playerName &&
              assignedPlayer.name === this.playerName);

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
        tail: [], // [{ x, y, angle, isMega }]
        depositedCount: 0,
        stolenCount: 0,
        invulnerableTimer: 0,
        activePowerup: null, // { type, timer }
        fsmState: 'SEARCH', // 'SEARCH' | 'RETURN' | 'HUNT_STEAL' | 'FLEE'
        fsmTarget: null,
        fsmTimer: 0,
        wobbleOffset: Math.random() * Math.PI * 2
      };
    });

    this.player = this.ghosts.find((g) => g.isPlayer);
    if (!this.player) {
      // Robust fallback: if no ghost matched isPlayer, assign first human or team leader
      const fallback =
        this.ghosts.find((g) => g.isRemoteHuman) ||
        (this.networkMode === 'guest' ? this.ghosts[4] : this.ghosts[0]);
      if (fallback) {
        fallback.isPlayer = true;
        fallback.isRemoteHuman = false;
        fallback.name = `${fallback.name} (나)`;
        this.player = fallback;
      }
    }

    // Input States
    this.keys = {};
    this.joystickVector = { x: 0, y: 0 };

    // Initial Spirits & Powerups
    this.spirits = [];
    this.powerupDrops = [];
    this.particles = [];
    this.floatingTexts = [];

    this.spawnInitialSpirits(65);
    this.spawnPowerupDrops(4);

    // Initial camera position
    if (this.player) {
      this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, this.player.x - CANVAS_WIDTH / 2));
      this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, this.player.y - CANVAS_HEIGHT / 2));
    }
  }

  // Viewport Culling Helper for Canvas 2D Performance
  isInViewport(x, y, margin = 60) {
    return (
      x >= this.camera.x - margin &&
      x <= this.camera.x + CANVAS_WIDTH + margin &&
      y >= this.camera.y - margin &&
      y <= this.camera.y + CANVAS_HEIGHT + margin
    );
  }

  spawnInitialSpirits(count) {
    for (let i = 0; i < count; i++) {
      this.spawnSpirit();
    }
  }

  spawnSpirit() {
    let attempts = 0;
    while (attempts < 20) {
      attempts++;
      const x = 60 + Math.random() * (WORLD_WIDTH - 120);
      const y = 60 + Math.random() * (WORLD_HEIGHT - 120);

      // Do not spawn inside bases
      if (
        (x > TEAMS.GREEN.baseX - 40 &&
          x < TEAMS.GREEN.baseX + TEAMS.GREEN.baseWidth + 40 &&
          y > TEAMS.GREEN.baseY - 40 &&
          y < TEAMS.GREEN.baseY + TEAMS.GREEN.baseHeight + 40) ||
        (x > TEAMS.PURPLE.baseX - 40 &&
          x < TEAMS.PURPLE.baseX + TEAMS.PURPLE.baseWidth + 40 &&
          y > TEAMS.PURPLE.baseY - 40 &&
          y < TEAMS.PURPLE.baseY + TEAMS.PURPLE.baseHeight + 40)
      ) {
        continue;
      }

      // Do not spawn inside walls
      let insideWall = false;
      for (const wall of MANSION_WALLS) {
        if (x > wall.x - 15 && x < wall.x + wall.w + 15 && y > wall.y - 15 && y < wall.y + wall.h + 15) {
          insideWall = true;
          break;
        }
      }
      if (insideWall) continue;

      const isMega = Math.random() < 0.12; // 12% chance for 5-pt Mega Spirit
      this.spirits.push({
        x,
        y,
        type: isMega ? 'mega' : 'normal',
        radius: isMega ? 12 : 7,
        floatOffset: Math.random() * Math.PI * 2
      });
      break;
    }
  }

  spawnPowerupDrops(count) {
    const types = Object.keys(POWERUP_TYPES);
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const x = 120 + Math.random() * (WORLD_WIDTH - 240);
      const y = 120 + Math.random() * (WORLD_HEIGHT - 240);

      this.powerupDrops.push({
        x,
        y,
        type,
        info: POWERUP_TYPES[type],
        floatOffset: Math.random() * Math.PI * 2
      });
    }
  }

  handleKeyDown(code) {
    this.keys[code] = true;
  }

  handleKeyUp(code) {
    this.keys[code] = false;
  }

  handleJoystickMove(x, y) {
    this.joystickVector = { x, y };
  }

  handleJoystickEnd() {
    this.joystickVector = { x: 0, y: 0 };
  }

  // Main 60 FPS Physics & AI Loop
  update(deltaTime) {
    if (this.isGameOver || this.isPaused) return;

    // 1. Update Match Timer
    this.matchTime -= deltaTime;
    if (this.matchTime <= 0) {
      this.matchTime = 0;
      this.endGame();
      return;
    }

    // Audio warning when time is low
    const currentSecond = Math.ceil(this.matchTime);
    if (currentSecond <= 10 && currentSecond < this.lastSecond && currentSecond > 0) {
      ghoulAudio.playTimeWarning();
    }
    this.lastSecond = currentSecond;

    // 2. Spirit & Powerup Replenishment (Host / Local only)
    if (this.networkMode !== 'guest') {
      const targetSpirits = 65 * this.difficulty.spiritSpawnRate;
      if (this.spirits.length < targetSpirits && Math.random() < 0.08) {
        this.spawnSpirit();
      }
      if (this.powerupDrops.length < 4 && Math.random() < 0.008) {
        this.spawnPowerupDrops(1);
      }
    }

    // 3. Update All 8 Ghosts
    this.ghosts.forEach((ghost) => {
      this.updateGhost(ghost, deltaTime);
    });

    // 4. Interception Tail Stealing (Host / Local only)
    if (this.networkMode !== 'guest') {
      this.checkTailSteals();
    }

    // 5. Host P2P Snapshot Broadcast (30 FPS throttle)
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

    // 8. Throttled State Change Notifications to React (eliminates 60Hz re-render choke on Chromebooks)
    const curSec = Math.ceil(this.matchTime);
    const pTail = this.player ? this.player.tail.length : 0;
    const pDep = this.player ? this.player.depositedCount : 0;

    const scoresChanged =
      !this._lastReportedScores ||
      this._lastReportedScores.green !== this.teamScores.green ||
      this._lastReportedScores.purple !== this.teamScores.purple;
    const timerChanged = this._lastReportedSec !== curSec;
    const tailChanged = this._lastReportedTail !== pTail;
    const depChanged = this._lastReportedDep !== pDep;

    if (scoresChanged || timerChanged || tailChanged || depChanged) {
      this._lastReportedScores = { ...this.teamScores };
      this._lastReportedSec = curSec;
      this._lastReportedTail = pTail;
      this._lastReportedDep = pDep;

      this.onStateChange({
        teamScores: this._lastReportedScores,
        matchTime: curSec,
        playerTail: pTail,
        playerDeposited: pDep
      });
    }
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
        if (pInfo.canPassWalls) canPassWalls = true;
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

      // Guest: send input and authoritative position to host via P2P (throttled ~30fps)
      if (this.networkMode === 'guest' && this.onSendInput) {
        const now = performance.now();
        if (!this.lastInputSendTime || now - this.lastInputSendTime >= 32) {
          this.lastInputSendTime = now;
          this.onSendInput({
            x: Math.round(ghost.x),
            y: Math.round(ghost.y),
            vx: Number(ghost.vx.toFixed(2)),
            vy: Number(ghost.vy.toFixed(2)),
            angle: Number(ghost.angle.toFixed(2)),
            vector: { x: moveX, y: moveY }
          });
        }
      }
    } else if (ghost.isRemoteHuman) {
      // Remote Network Human Player: Apply received authoritative network position & velocity
      const remoteInput = this.remoteInputs.get(ghost.networkPeerId);
      if (remoteInput) {
        if (typeof remoteInput.x === 'number' && typeof remoteInput.y === 'number') {
          // Reconcile position smoothly towards guest's reported position
          const safeX = Math.max(30, Math.min(WORLD_WIDTH - 30, remoteInput.x));
          const safeY = Math.max(30, Math.min(WORLD_HEIGHT - 30, remoteInput.y));
          const dist = Math.hypot(safeX - ghost.x, safeY - ghost.y);

          if (dist > 150) {
            ghost.x = safeX;
            ghost.y = safeY;
          } else {
            ghost.x += (safeX - ghost.x) * 0.65;
            ghost.y += (safeY - ghost.y) * 0.65;
          }

          ghost.vx = remoteInput.vx || 0;
          ghost.vy = remoteInput.vy || 0;
          if (typeof remoteInput.angle === 'number') {
            ghost.angle = remoteInput.angle;
          }
        } else if (remoteInput.vector) {
          moveX = remoteInput.vector.x || 0;
          moveY = remoteInput.vector.y || 0;
        }
      }
    } else {
      // Smart AI Behavior (FSM)
      if (this.networkMode !== 'guest') {
        this.updateAIBehavior(ghost, deltaTime);
        moveX = ghost.vx;
        moveY = ghost.vy;
      }
    }

    // Non-remote human movement & collision resolution
    if (!ghost.isRemoteHuman) {
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
  resolveWallCollisions(oldX, oldY, newX, newY, radius) {
    let curX = newX;
    let curY = newY;

    for (const wall of MANSION_WALLS) {
      const closestX = Math.max(wall.x, Math.min(curX, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(curY, wall.y + wall.h));

      const distX = curX - closestX;
      const distY = curY - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < radius * radius && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        curX += (distX / dist) * overlap;
        curY += (distY / dist) * overlap;
      }
    }

    curX = Math.max(radius, Math.min(WORLD_WIDTH - radius, curX));
    curY = Math.max(radius, Math.min(WORLD_HEIGHT - radius, curY));

    return { x: curX, y: curY };
  }

  // Update Inverse Kinematic (IK) Chain Tail
  updateGhostTail(ghost) {
    if (ghost.tail.length === 0) return;

    let prevNode = ghost;
    const segmentDistance = 14;

    for (let i = 0; i < ghost.tail.length; i++) {
      const node = ghost.tail[i];
      const dx = node.x - prevNode.x;
      const dy = node.y - prevNode.y;
      const dist = Math.hypot(dx, dy);

      if (dist > segmentDistance) {
        const angle = Math.atan2(dy, dx);
        node.x = prevNode.x + Math.cos(angle) * segmentDistance;
        node.y = prevNode.y + Math.sin(angle) * segmentDistance;
        node.angle = angle;
      }

      prevNode = node;
    }
  }

  // Autonomous Bot AI (Finite State Machine)
  updateAIBehavior(ghost, deltaTime) {
    ghost.fsmTimer -= deltaTime;

    const myBase = ghost.team === 'green' ? TEAMS.GREEN : TEAMS.PURPLE;
    const baseCenterX = myBase.baseX + myBase.baseWidth / 2;
    const baseCenterY = myBase.baseY + myBase.baseHeight / 2;

    // State Transitions
    if (ghost.tail.length >= 7) {
      ghost.fsmState = 'RETURN';
    } else if (ghost.tail.length >= 3 && Math.random() < 0.015) {
      ghost.fsmState = 'RETURN';
    } else if (ghost.tail.length < 3) {
      if (Math.random() < this.difficulty.aiStealAggressiveness * 0.02) {
        ghost.fsmState = 'HUNT_STEAL';
      } else {
        ghost.fsmState = 'SEARCH';
      }
    }

    // State Execution
    if (ghost.fsmState === 'RETURN') {
      const angle = Math.atan2(baseCenterY - ghost.y, baseCenterX - ghost.x);
      ghost.vx = Math.cos(angle);
      ghost.vy = Math.sin(angle);
    } else if (ghost.fsmState === 'HUNT_STEAL') {
      let targetGhost = null;
      let maxTail = 0;

      for (const other of this.ghosts) {
        if (other.team !== ghost.team && other.tail.length > maxTail && other.invulnerableTimer <= 0) {
          maxTail = other.tail.length;
          targetGhost = other;
        }
      }

      if (targetGhost && targetGhost.tail.length > 0) {
        const targetTailNode = targetGhost.tail[Math.floor(targetGhost.tail.length / 2)];
        const angle = Math.atan2(targetTailNode.y - ghost.y, targetTailNode.x - ghost.x);
        ghost.vx = Math.cos(angle);
        ghost.vy = Math.sin(angle);
      } else {
        ghost.fsmState = 'SEARCH';
      }
    } else {
      // SEARCH for closest spirit flame or powerup
      let closestItem = null;
      let minDist = 999999;

      for (const spirit of this.spirits) {
        const dist = Math.hypot(spirit.x - ghost.x, spirit.y - ghost.y);
        const weight = spirit.type === 'mega' ? dist * 0.4 : dist;
        if (weight < minDist) {
          minDist = weight;
          closestItem = spirit;
        }
      }

      for (const drop of this.powerupDrops) {
        const dist = Math.hypot(drop.x - ghost.x, drop.y - ghost.y) * 0.7;
        if (dist < minDist) {
          minDist = dist;
          closestItem = drop;
        }
      }

      if (closestItem) {
        const angle = Math.atan2(closestItem.y - ghost.y, closestItem.x - ghost.x);
        ghost.vx = Math.cos(angle);
        ghost.vy = Math.sin(angle);
      } else {
        ghost.vx = Math.cos(ghost.angle);
        ghost.vy = Math.sin(ghost.angle);
      }
    }

    // Obstacle Avoidance Raycasting
    for (const wall of MANSION_WALLS) {
      const lookAhead = 45;
      const probeX = ghost.x + ghost.vx * lookAhead;
      const probeY = ghost.y + ghost.vy * lookAhead;

      if (probeX > wall.x - 20 && probeX < wall.x + wall.w + 20 && probeY > wall.y - 20 && probeY < wall.y + wall.h + 20) {
        const avoidAngle = ghost.angle + Math.PI * 0.5;
        ghost.vx = Math.cos(avoidAngle);
        ghost.vy = Math.sin(avoidAngle);
        break;
      }
    }
  }

  // Spirit Flame Pickups
  checkSpiritPickups(ghost, magnetRadius) {
    const pickupRadius = ghost.radius + 15 + magnetRadius;
    const directCatchDist = ghost.radius + 14;

    for (let i = this.spirits.length - 1; i >= 0; i--) {
      const spirit = this.spirits[i];
      const dist = Math.hypot(spirit.x - ghost.x, spirit.y - ghost.y);

      if (magnetRadius > 0 && dist < pickupRadius && dist > 20) {
        spirit.x += (ghost.x - spirit.x) * 0.12;
        spirit.y += (ghost.y - spirit.y) * 0.12;
      }

      if (dist < directCatchDist + spirit.radius) {
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

  // Powerup Pickup Detection
  checkPowerupPickups(ghost) {
    for (let i = this.powerupDrops.length - 1; i >= 0; i--) {
      const drop = this.powerupDrops[i];
      const dist = Math.hypot(drop.x - ghost.x, drop.y - ghost.y);

      if (dist < ghost.radius + 20) {
        ghost.activePowerup = {
          type: drop.type,
          timer: drop.info.durationMs
        };

        if (ghost.isPlayer) {
          ghoulAudio.playPowerup();
          this.addFloatingText(ghost.x, ghost.y - 30, `⚡ ${drop.info.name}!`, drop.info.color);
        }

        this.addSparks(drop.x, drop.y, drop.info.color, 20);
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

          if (dist < attacker.radius + 14) {
            const stolenNodes = victim.tail.splice(i);
            const stolenCount = stolenNodes.length;

            if (stolenCount > 0) {
              for (const stolenNode of stolenNodes) {
                const lastNode = attacker.tail.length > 0 ? attacker.tail[attacker.tail.length - 1] : attacker;
                attacker.tail.push({
                  x: lastNode.x - Math.cos(attacker.angle) * 14,
                  y: lastNode.y - Math.sin(attacker.angle) * 14,
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

    // Generous base boundary (+15px margin) so players touching the base edge deposit smoothly
    const margin = 15;
    if (
      ghost.x >= base.baseX - margin &&
      ghost.x <= base.baseX + base.baseWidth + margin &&
      ghost.y >= base.baseY - margin &&
      ghost.y <= base.baseY + base.baseHeight + margin
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
        ghoulAudio.playMatchVictory();
      } else {
        ghoulAudio.playMatchDefeat();
      }
    }, 400);

    const rosterStats = this.ghosts.map((g) => ({
      id: g.id,
      name: g.name,
      team: g.team,
      isPlayer: g.isPlayer,
      depositedCount: g.depositedCount,
      stolenCount: g.stolenCount,
      score: g.depositedCount * 10 + g.stolenCount * 15
    }));

    rosterStats.sort((a, b) => b.score - a.score);

    const stats = {
      isVictory,
      isDraw: greenTotal === purpleTotal,
      teamGreenScore: greenTotal,
      teamPurpleScore: purpleTotal,
      playerScore: this.player ? this.player.depositedCount * 10 + this.player.stolenCount * 15 : 0,
      playerDeposited: this.player ? this.player.depositedCount : 0,
      playerStolen: this.player ? this.player.stolenCount : 0,
      roster: rosterStats,
      mvp: rosterStats[0] || null
    };

    if (this.networkMode === 'host' && this.onBroadcastGameOver) {
      this.onBroadcastGameOver(stats);
    }

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

  // Main 2D Canvas Renderer (Viewport-Culled & Chromebook Optimized)
  render(ctx) {
    ctx.save();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Mansion Floor (Viewport-only lines)
    this.renderMansionFloor(ctx);

    // 2. Draw Team Bases
    this.renderTeamBase(ctx, TEAMS.GREEN);
    this.renderTeamBase(ctx, TEAMS.PURPLE);

    // 3. Draw Mansion Walls & Columns (Viewport-culled)
    this.renderMansionWalls(ctx);

    // 4. Draw Powerup Drops (Viewport-culled)
    this.renderPowerupDrops(ctx);

    // 5. Draw Floating Spirit Flames (Viewport-culled & lightweight alpha arcs)
    this.renderSpirits(ctx);

    // 6. Draw Ghost Tails (Viewport-culled)
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
    ctx.fillRect(this.camera.x, this.camera.y, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    const step = 80;
    const startX = Math.floor(this.camera.x / step) * step;
    const endX = Math.min(WORLD_WIDTH, this.camera.x + CANVAS_WIDTH + step);
    const startY = Math.floor(this.camera.y / step) * step;
    const endY = Math.min(WORLD_HEIGHT, this.camera.y + CANVAS_HEIGHT + step);

    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  renderTeamBase(ctx, team) {
    const cx = team.baseX + team.baseWidth / 2;
    const cy = team.baseY + team.baseHeight / 2;

    if (!this.isInViewport(cx, cy, 200)) return;

    ctx.save();
    ctx.fillStyle = team.baseColor;
    ctx.strokeStyle = team.baseBorder;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(team.baseX, team.baseY, team.baseWidth, team.baseHeight, 24);
    ctx.fill();
    ctx.stroke();

    const pulse = Math.sin(Date.now() * 0.005) * 6;
    ctx.fillStyle = team.primaryColor;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, 80 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

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
      if (
        wall.x + wall.w < this.camera.x - 20 ||
        wall.x > this.camera.x + CANVAS_WIDTH + 20 ||
        wall.y + wall.h < this.camera.y - 20 ||
        wall.y > this.camera.y + CANVAS_HEIGHT + 20
      ) {
        continue;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(wall.x + 4, wall.y + 4, wall.w, wall.h);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }
    ctx.restore();
  }

  renderSpirits(ctx) {
    const time = Date.now() * 0.004;

    for (let i = 0; i < this.spirits.length; i++) {
      const spirit = this.spirits[i];
      if (!this.isInViewport(spirit.x, spirit.y, 40)) continue;

      const floatY = Math.sin(time + spirit.floatOffset) * 5;
      const isMega = spirit.type === 'mega';
      const rad = spirit.radius + Math.sin(time * 2 + spirit.floatOffset) * 2;

      ctx.save();
      ctx.translate(spirit.x, spirit.y + floatY);

      // Outer Glow
      ctx.fillStyle = isMega ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, rad * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // Main Core
      ctx.fillStyle = isMega ? '#fef08a' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();

      // Inner Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.45, 0, Math.PI * 2);
      ctx.fill();

      if (isMega) {
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★5', 0, 4);
      }

      ctx.restore();
    }
  }

  renderPowerupDrops(ctx) {
    const time = Date.now() * 0.005;

    for (let i = 0; i < this.powerupDrops.length; i++) {
      const drop = this.powerupDrops[i];
      if (!this.isInViewport(drop.x, drop.y, 50)) continue;

      const bounce = Math.sin(time) * 4;
      ctx.save();
      ctx.translate(drop.x, drop.y + bounce);

      ctx.fillStyle = drop.info.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

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
    }
  }

  renderGhostTail(ctx, ghost) {
    if (ghost.tail.length === 0) return;

    const isGreen = ghost.team === 'green';
    const color = isGreen ? '#34d399' : '#c084fc';
    const glowColor = isGreen ? 'rgba(52, 211, 153, 0.3)' : 'rgba(192, 132, 252, 0.3)';

    ctx.save();

    for (let i = 0; i < ghost.tail.length; i++) {
      const node = ghost.tail[i];
      if (!this.isInViewport(node.x, node.y, 30)) continue;

      const scale = Math.max(0.45, 1 - i * 0.025);
      const rad = 11 * scale;

      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = node.isMega ? '#fef08a' : color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderGhostBody(ctx, ghost) {
    if (!this.isInViewport(ghost.x, ghost.y, 60)) return;

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

    ctx.fillStyle = ghost.color;
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
