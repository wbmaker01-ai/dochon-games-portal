// Dochon Games Portal - Snowball Survival Core Physics, AI & Render Engine
// 100% Canvas 2D Procedural Art & Zero-Latency Local/P2P Physics

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ARENA_CONFIG,
  PLAYER_CONFIG,
  CHARACTER_SKINS,
  DIFFICULTY_PRESETS,
  SCORING
} from './snowballConstants';
import { snowballAudio } from './snowballAudio';
import { snowballNet } from './snowballNetwork';

const BOT_NAMES = [
  '눈폭풍도촌', '빙판의제왕', '스모팽이', '얼음썰매',
  '눈사람장인', '북극곰대장', '칼바람질주', '겨울방학'
];

export class SnowballLogic {
  constructor({
    difficulty = 'normal',
    networkMode = 'local', // 'local' | 'host' | 'guest'
    networkPlayers = [],
    myPeerId = 'local',
    mySkinId = 'penguin',
    onGameOver = null,
    onStateChange = null
  }) {
    this.difficultyKey = difficulty;
    this.diffConfig = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.normal;
    this.networkMode = networkMode;
    this.networkPlayers = networkPlayers;
    this.myPeerId = myPeerId;
    this.mySkinId = mySkinId;
    this.onGameOver = onGameOver;
    this.onStateChange = onStateChange;

    // Arena Dimensions & Center
    this.centerX = CANVAS_WIDTH / 2;
    this.centerY = CANVAS_HEIGHT / 2;
    this.currentRadius = ARENA_CONFIG.INITIAL_RADIUS;
    this.targetRadius = ARENA_CONFIG.INITIAL_RADIUS;
    this.isShrinking = false;
    this.shrinkStageIndex = 0;
    this.matchTime = 0; // seconds

    // Screen Shake
    this.shakeIntensity = 0;

    // Entities
    this.players = [];
    this.projectiles = [];
    this.particles = [];
    this.waterSplashes = [];
    this.snowTracks = [];

    // Local Player Control State
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      aimAngle: 0,
      isAiming: false,
      shootRequested: false
    };

    this.isGameOver = false;
    this.rankCount = 0;
    this.startTime = Date.now();

    this.initPlayers();
    this.setupNetworkHooks();
  }

  setupNetworkHooks() {
    if (this.networkMode === 'host') {
      snowballNet.onClientInput = (senderPeerId, data) => {
        const player = this.players.find(p => p.id === senderPeerId);
        if (player && player.isAlive) {
          player.inputAngle = data.angle;
          player.isMoving = data.isMoving;
          if (data.shoot) {
            this.shootSnowball(player);
          }
        }
      };
    } else if (this.networkMode === 'guest') {
      snowballNet.onSnapshot = (snapshot) => {
        this.applyNetworkSnapshot(snapshot);
      };
      snowballNet.onGameOver = (data) => {
        this.handleMatchEnd(data.stats);
      };
    }
  }

  initPlayers() {
    this.players = [];
    this.rankCount = 0;

    if (this.networkMode === 'local') {
      // 1 Local Player + (diffConfig.aiCount) AI Bots = Total 6~8 Players
      const mySkin = CHARACTER_SKINS.find(s => s.id === this.mySkinId) || CHARACTER_SKINS[0];
      const startAngle = 0;
      const spawnDist = 180;

      // Local Player
      this.players.push({
        id: this.myPeerId,
        name: '나 (플레이어)',
        isBot: false,
        skin: mySkin,
        x: this.centerX + Math.cos(startAngle) * spawnDist,
        y: this.centerY + Math.sin(startAngle) * spawnDist,
        vx: 0,
        vy: 0,
        kvx: 0, // Knockback velocity X
        kvy: 0, // Knockback velocity Y
        angle: startAngle + Math.PI,
        inputAngle: startAngle + Math.PI,
        isMoving: false,
        snowballRadius: PLAYER_CONFIG.SNOWBALL_MIN_RADIUS,
        isAlive: true,
        rank: 0,
        kills: 0,
        lastHitBy: null,
        lastHitTime: 0,
        spinAngle: 0,
        isSpinning: false,
        skinId: mySkin.id
      });

      // AI Bots
      const botCount = this.diffConfig.aiCount;
      const angleStep = (Math.PI * 2) / (botCount + 1);

      for (let i = 0; i < botCount; i++) {
        const botAngle = angleStep * (i + 1);
        const skinIndex = (i + 1) % CHARACTER_SKINS.length;
        const botSkin = CHARACTER_SKINS[skinIndex];

        this.players.push({
          id: `bot_${i}`,
          name: BOT_NAMES[i % BOT_NAMES.length],
          isBot: true,
          skin: botSkin,
          x: this.centerX + Math.cos(botAngle) * spawnDist,
          y: this.centerY + Math.sin(botAngle) * spawnDist,
          vx: 0,
          vy: 0,
          kvx: 0,
          kvy: 0,
          angle: botAngle + Math.PI,
          inputAngle: botAngle + Math.PI,
          isMoving: true,
          snowballRadius: PLAYER_CONFIG.SNOWBALL_MIN_RADIUS,
          isAlive: true,
          rank: 0,
          kills: 0,
          lastHitBy: null,
          lastHitTime: 0,
          spinAngle: 0,
          isSpinning: false,
          skinId: botSkin.id,
          // Bot AI Timers & Tactical States
          botTimer: Math.random() * 1.5,
          botState: 'CHARGE',
          orbitDir: Math.random() < 0.5 ? 1 : -1,
          repositionTimer: 0,
          targetPlayerId: null,
          shootDelay: 0
        });
      }
    } else {
      // P2P Multiplayer Mode
      const totalCount = this.networkPlayers.length;
      const angleStep = (Math.PI * 2) / Math.max(totalCount, 2);
      const spawnDist = 180;

      this.networkPlayers.forEach((p, idx) => {
        const pAngle = angleStep * idx;
        const pSkin = CHARACTER_SKINS.find(s => s.id === p.skinId) || CHARACTER_SKINS[idx % CHARACTER_SKINS.length];
        this.players.push({
          id: p.id,
          name: p.name || `플레이어${idx + 1}`,
          isBot: false,
          skin: pSkin,
          x: this.centerX + Math.cos(pAngle) * spawnDist,
          y: this.centerY + Math.sin(pAngle) * spawnDist,
          vx: 0,
          vy: 0,
          kvx: 0,
          kvy: 0,
          angle: pAngle + Math.PI,
          inputAngle: pAngle + Math.PI,
          isMoving: false,
          snowballRadius: PLAYER_CONFIG.SNOWBALL_MIN_RADIUS,
          isAlive: true,
          rank: 0,
          kills: 0,
          lastHitBy: null,
          lastHitTime: 0,
          spinAngle: 0,
          isSpinning: false,
          skinId: pSkin.id
        });
      });
    }
  }

  // --- Input Handlers from React UI ---
  updateKeyboardInput(keys) {
    if (this.isGameOver) return;
    let dx = 0;
    let dy = 0;
    if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

    const me = this.getLocalPlayer();
    if (!me || !me.isAlive) return;

    if (dx !== 0 || dy !== 0) {
      me.isMoving = true;
      me.inputAngle = Math.atan2(dy, dx);
    } else if (!this.input.isAiming) {
      me.isMoving = false;
      // Gentle active braking when keys released to prevent uncontrollable sliding
      me.vx *= 0.86;
      me.vy *= 0.86;
    }

    if (keys[' '] && !this.input.shootRequested) {
      this.input.shootRequested = true;
      this.shootSnowball(me);
    }
  }

  setMouseAim(canvasX, canvasY, isMouseDown) {
    const me = this.getLocalPlayer();
    if (!me || !me.isAlive) return;

    const dx = canvasX - me.x;
    const dy = canvasY - me.y;
    const angle = Math.atan2(dy, dx);

    this.input.aimAngle = angle;
    this.input.isAiming = isMouseDown;

    if (isMouseDown) {
      me.isMoving = true;
      me.inputAngle = angle;
    } else if (me.isMoving && !this.input.up && !this.input.down && !this.input.left && !this.input.right) {
      // Released mouse => fire snowball!
      this.shootSnowball(me);
      me.isMoving = false;
    }
  }

  setJoystickInput(dx, dy, isTouching) {
    const me = this.getLocalPlayer();
    if (!me || !me.isAlive) return;

    if (isTouching && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
      me.isMoving = true;
      me.inputAngle = Math.atan2(dy, dx);
    } else {
      me.isMoving = false;
    }
  }

  triggerShoot() {
    const me = this.getLocalPlayer();
    if (me && me.isAlive) {
      this.shootSnowball(me);
    }
  }

  getLocalPlayer() {
    return this.players.find(p => p.id === this.myPeerId) || this.players[0];
  }

  // --- Snowball Launch Mechanic ---
  shootSnowball(player) {
    if (!player || !player.isAlive) return;
    if (player.snowballRadius <= PLAYER_CONFIG.SNOWBALL_MIN_RADIUS + 2) return;

    const currentR = player.snowballRadius;
    const sizeRatio = (currentR - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS) /
      (PLAYER_CONFIG.SNOWBALL_MAX_RADIUS - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS);

    // Speed decreases slightly as size increases
    const speed = PLAYER_CONFIG.SNOWBALL_MAX_SPEED - sizeRatio * 4.0;
    const launchDist = PLAYER_CONFIG.RADIUS + currentR + 4;

    const projX = player.x + Math.cos(player.angle) * launchDist;
    const projY = player.y + Math.sin(player.angle) * launchDist;

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      ownerName: player.name,
      x: projX,
      y: projY,
      vx: Math.cos(player.angle) * speed,
      vy: Math.sin(player.angle) * speed,
      radius: currentR,
      sizeRatio,
      lifetime: PLAYER_CONFIG.SNOWBALL_LIFETIME,
      color: player.skin ? player.skin.accentColor : '#38BDF8'
    });

    // Reset player's snowball
    player.snowballRadius = PLAYER_CONFIG.SNOWBALL_MIN_RADIUS;

    // Audio & Haptics
    snowballAudio.playShoot(sizeRatio);

    // Small recoil
    player.kvx -= Math.cos(player.angle) * (sizeRatio * 3.5);
    player.kvy -= Math.sin(player.angle) * (sizeRatio * 3.5);

    // Networking broadcast if guest
    if (this.networkMode === 'guest') {
      snowballNet.guestSendInput({
        angle: player.angle,
        isMoving: player.isMoving,
        shoot: true
      });
    }
  }

  // --- Core Game Loop Update ---
  update(dt) {
    if (this.isGameOver) {
      this.updateParticles(dt);
      return;
    }

    this.matchTime += dt;

    // 1. Arena Shrinking Management
    this.updateArena(dt);

    // 2. Guest sends 20Hz input if playing P2P
    if (this.networkMode === 'guest') {
      const me = this.getLocalPlayer();
      if (me) {
        snowballNet.guestSendInput({
          angle: me.inputAngle,
          isMoving: me.isMoving,
          shoot: false
        });
      }
      this.updateParticles(dt);
      return; // Physics calculated by host
    }

    // 3. Update AI Bots
    this.updateAI(dt);

    // 4. Update Players Physics
    this.updatePlayersPhysics(dt);

    // 5. Update Projectiles & Collisions
    this.updateProjectiles(dt);

    // 6. Check Ring-Outs
    this.checkRingOuts();

    // 7. Update Particles & Tracks
    this.updateParticles(dt);

    // 8. Host broadcasts snapshot (20Hz)
    if (this.networkMode === 'host') {
      this.broadcastHostSnapshot();
    }

    // 9. Check Victory Conditions
    this.checkMatchConditions();

    // 10. Update React State
    if (this.onStateChange) {
      const alivePlayers = this.players.filter(p => p.isAlive);
      const me = this.getLocalPlayer();
      this.onStateChange({
        aliveCount: alivePlayers.length,
        totalPlayers: this.players.length,
        myKills: me ? me.kills : 0,
        mySnowballSize: me ? me.snowballRadius : 0,
        matchTime: Math.floor(this.matchTime),
        arenaRadius: Math.floor(this.currentRadius),
        isShrinking: this.isShrinking,
        shrinkWarning: this.isShrinkWarning()
      });
    }
  }

  // --- Arena Shrinking Logic ---
  updateArena(dt) {
    const stage = ARENA_CONFIG.SHRINK_STAGES[this.shrinkStageIndex];
    if (!stage) return;

    const timeUntilShrink = stage.shrinkStartTime - this.matchTime;

    // Warning sound and screen shake before shrink
    if (timeUntilShrink > 0 && timeUntilShrink <= stage.warningTime) {
      this.shakeIntensity = 2.5;
      if (Math.random() < 0.08) {
        snowballAudio.playIceCrack();
      }
    } else {
      this.shakeIntensity = 0;
    }

    // Shrinking phase
    if (this.matchTime >= stage.shrinkStartTime) {
      this.isShrinking = true;
      const shrinkSpeed = (this.currentRadius - stage.targetRadius) / (stage.duration * 60);
      this.currentRadius = Math.max(stage.targetRadius, this.currentRadius - shrinkSpeed);

      // Create ice crumbling debris at perimeter
      if (Math.random() < 0.4) {
        const pAngle = Math.random() * Math.PI * 2;
        this.addIceDebris(
          this.centerX + Math.cos(pAngle) * this.currentRadius,
          this.centerY + Math.sin(pAngle) * this.currentRadius
        );
      }

      if (this.currentRadius <= stage.targetRadius + 1) {
        this.currentRadius = stage.targetRadius;
        this.isShrinking = false;
        this.shrinkStageIndex++;
      }
    }
  }

  isShrinkWarning() {
    const stage = ARENA_CONFIG.SHRINK_STAGES[this.shrinkStageIndex];
    if (!stage) return false;
    const timeUntil = stage.shrinkStartTime - this.matchTime;
    return timeUntil > 0 && timeUntil <= stage.warningTime;
  }

  // --- Advanced Multi-Layer Tactical AI Engine ---
  updateAI(dt) {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveBots = this.players.filter(p => p.isAlive && p.isBot);

    aliveBots.forEach(bot => {
      bot.botTimer -= dt;
      if (bot.repositionTimer > 0) bot.repositionTimer -= dt;

      const distFromCenter = Math.hypot(bot.x - this.centerX, bot.y - this.centerY);
      const safeRadius = this.currentRadius * 0.62;
      const dangerRadius = this.currentRadius * 0.80;

      // 1. [CRITICAL] Ring-Out Absolute Defense & Smooth Tangential Orbit
      if (distFromCenter > safeRadius) {
        const toCenterAngle = Math.atan2(this.centerY - bot.y, this.centerX - bot.x);

        if (distFromCenter > dangerRadius) {
          // Emergency Recovery: Full reverse thrust towards center
          bot.inputAngle = toCenterAngle;
          bot.isMoving = true;

          // Strongly brake outward velocity
          const outwardDot = (bot.x - this.centerX) * bot.vx + (bot.y - this.centerY) * bot.vy;
          if (outwardDot > 0) {
            bot.vx *= 0.75;
            bot.vy *= 0.75;
          }
          return;
        } else {
          // Boundary Patrol: Steer diagonally inwards along arena perimeter
          const orbitAngle = toCenterAngle + (bot.orbitDir || 1) * (Math.PI / 2.8);
          bot.inputAngle = orbitAngle;
          bot.isMoving = true;
          return;
        }
      }

      // 2. [EVASION] Active Sidestep against incoming high-speed snowballs
      let incomingThreat = null;
      for (const proj of this.projectiles) {
        if (proj.ownerId === bot.id) continue;
        const d = Math.hypot(proj.x - bot.x, proj.y - bot.y);
        if (d < 170) {
          const projToBotAngle = Math.atan2(bot.y - proj.y, bot.x - proj.x);
          const projDirAngle = Math.atan2(proj.vy, proj.vx);
          const angleDiff = Math.abs(projToBotAngle - projDirAngle);
          if (angleDiff < 0.65) {
            incomingThreat = proj;
            break;
          }
        }
      }

      if (incomingThreat) {
        const threatAngle = Math.atan2(incomingThreat.vy, incomingThreat.vx);
        bot.inputAngle = threatAngle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        bot.isMoving = true;
        return;
      }

      // 3. [REPOSITION] Temporary retreat after launching a snowball
      if (bot.repositionTimer > 0) {
        const toCenter = Math.atan2(this.centerY - bot.y, this.centerX - bot.x);
        bot.inputAngle = toCenter + (bot.orbitDir || 1) * 0.4;
        bot.isMoving = true;
        return;
      }

      // 4. [TARGET ACQUISITION & SMART KITING]
      let closestTarget = null;
      let closestDist = Infinity;
      for (const other of alivePlayers) {
        if (other.id === bot.id) continue;
        const dist = Math.hypot(other.x - bot.x, other.y - bot.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestTarget = other;
        }
      }

      if (!closestTarget) {
        bot.isMoving = false;
        return;
      }

      const angleToTarget = Math.atan2(closestTarget.y - bot.y, closestTarget.x - bot.x);
      const chargeRatio = (bot.snowballRadius - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS) /
        (PLAYER_CONFIG.SNOWBALL_MAX_RADIUS - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS);

      // (A) Still charging snowball: Maintain safe distance and cruise
      if (chargeRatio < 0.50) {
        if (closestDist < 140) {
          // Too close! Back off gently
          bot.inputAngle = angleToTarget + Math.PI;
        } else {
          // Circle around target while rolling snow
          bot.inputAngle = angleToTarget + (bot.orbitDir || 1) * (Math.PI / 2.3);
        }
        bot.isMoving = true;
        return;
      }

      // (B) Snowball is large & dangerous: Aim with Lead Shot Prediction
      if (bot.botTimer <= 0) {
        bot.botTimer = 1.1 + Math.random() * 1.4;

        // Lead Target Prediction based on target velocity
        const bulletSpeed = PLAYER_CONFIG.SNOWBALL_MAX_SPEED - chargeRatio * 3.0;
        const timeToHit = closestDist / Math.max(bulletSpeed, 4);
        const predictedX = closestTarget.x + (closestTarget.vx || 0) * timeToHit * 0.85;
        const predictedY = closestTarget.y + (closestTarget.vy || 0) * timeToHit * 0.85;

        const leadAngle = Math.atan2(predictedY - bot.y, predictedX - bot.x);
        const spread = (1 - this.diffConfig.botAimAccuracy) * (Math.random() - 0.5) * 0.4;
        bot.inputAngle = leadAngle + spread;

        // Fire when aligned within range
        if (closestDist >= 110 && closestDist <= 390) {
          const currentAngleDiff = Math.abs(bot.angle - leadAngle);
          if (currentAngleDiff < 0.40) {
            this.shootSnowball(bot);
            bot.repositionTimer = 1.3;
            bot.orbitDir = -bot.orbitDir; // Change circling direction
            return;
          }
        }
        bot.isMoving = true;
      }
    });
  }

  // --- Players Physics & Growth (Gentle acceleration, controllable braking) ---
  updatePlayersPhysics(dt) {
    this.players.forEach(p => {
      if (!p.isAlive) return;

      // Smooth Angle Interpolation (gentle turning, non-twitchy)
      let diff = p.inputAngle - p.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      p.angle += diff * (p.isBot ? 0.12 : PLAYER_CONFIG.TURN_SPEED);

      // Speed penalty based on snowball size (heavier as ball grows)
      const sizeRatio = (p.snowballRadius - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS) /
        (PLAYER_CONFIG.SNOWBALL_MAX_RADIUS - PLAYER_CONFIG.SNOWBALL_MIN_RADIUS);
      const speedModifier = (1.0 - sizeRatio * 0.35) * (p.isBot ? this.diffConfig.speedMultiplier : 1.0);
      const maxAllowedSpeed = PLAYER_CONFIG.BASE_SPEED * speedModifier;

      if (p.isMoving) {
        // Smooth progressive acceleration (no instant jerk)
        const accel = maxAllowedSpeed * 0.12;
        p.vx += Math.cos(p.angle) * accel;
        p.vy += Math.sin(p.angle) * accel;

        // Clamp speed to prevent uncontrollable sliding
        const currentSpeed = Math.hypot(p.vx, p.vy);
        if (currentSpeed > maxAllowedSpeed) {
          p.vx = (p.vx / currentSpeed) * maxAllowedSpeed;
          p.vy = (p.vy / currentSpeed) * maxAllowedSpeed;
        }

        // Grow snowball
        if (p.snowballRadius < PLAYER_CONFIG.SNOWBALL_MAX_RADIUS) {
          p.snowballRadius += PLAYER_CONFIG.SNOWBALL_GROWTH_RATE * dt;
          if (p.snowballRadius > PLAYER_CONFIG.SNOWBALL_MAX_RADIUS) {
            p.snowballRadius = PLAYER_CONFIG.SNOWBALL_MAX_RADIUS;
          }
        }

        // Footstep sound & track for local player
        if (p.id === this.myPeerId) {
          snowballAudio.playStep();
          snowballAudio.playRoll(sizeRatio);
        }

        // Add snow trail
        if (Math.random() < 0.25) {
          this.snowTracks.push({
            x: p.x,
            y: p.y,
            alpha: 0.4,
            radius: 7 + sizeRatio * 9
          });
        }
      }

      // Apply Friction & Knockback
      p.vx *= ARENA_CONFIG.FRICTION;
      p.vy *= ARENA_CONFIG.FRICTION;
      p.kvx *= ARENA_CONFIG.KNOCKBACK_FRICTION;
      p.kvy *= ARENA_CONFIG.KNOCKBACK_FRICTION;

      p.x += p.vx + p.kvx;
      p.y += p.vy + p.kvy;

      // Spinning animation during heavy knockback
      const knockbackSpeed = Math.hypot(p.kvx, p.kvy);
      if (knockbackSpeed > 2.0) {
        p.isSpinning = true;
        p.spinAngle += knockbackSpeed * 0.08;
      } else {
        p.isSpinning = false;
        p.spinAngle = 0;
      }
    });

    // Player vs Player Bumping (Sumo Top Collision)
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];
        if (!p1.isAlive || !p2.isAlive) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = PLAYER_CONFIG.RADIUS * 2;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Push apart
          p1.x -= nx * (overlap * 0.5);
          p1.y -= ny * (overlap * 0.5);
          p2.x += nx * (overlap * 0.5);
          p2.y += ny * (overlap * 0.5);

          // Knockback based on snowball sizes
          const impulse1 = (p2.snowballRadius / 15);
          const impulse2 = (p1.snowballRadius / 15);

          p1.kvx -= nx * impulse1;
          p1.kvy -= ny * impulse1;
          p2.kvx += nx * impulse2;
          p2.kvy += ny * impulse2;

          p1.lastHitBy = p2.id;
          p2.lastHitBy = p1.id;
          p1.lastHitTime = Date.now();
          p2.lastHitTime = Date.now();

          snowballAudio.playHit(0.3);
          this.addSnowParticles((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 10);
        }
      }
    }
  }

  // --- Projectiles Update & Collision ---
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.lifetime -= dt;

      // Trail particles
      if (Math.random() < 0.45) {
        this.particles.push({
          x: proj.x + (Math.random() - 0.5) * proj.radius,
          y: proj.y + (Math.random() - 0.5) * proj.radius,
          vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 1.5,
          vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 1.5,
          radius: 3 + Math.random() * 4,
          color: '#FFFFFF',
          alpha: 0.8,
          decay: 1.5
        });
      }

      // Check collision with other projectiles
      let shattered = false;
      for (let j = i - 1; j >= 0; j--) {
        const otherProj = this.projectiles[j];
        const pDist = Math.hypot(otherProj.x - proj.x, otherProj.y - proj.y);
        if (pDist < proj.radius + otherProj.radius) {
          // Clash!
          this.addSnowParticles((proj.x + otherProj.x) / 2, (proj.y + otherProj.y) / 2, 24);
          snowballAudio.playSnowballClash();
          this.projectiles.splice(i, 1);
          this.projectiles.splice(j, 1);
          shattered = true;
          break;
        }
      }
      if (shattered) continue;

      // Check collision with players
      for (const player of this.players) {
        if (!player.isAlive || player.id === proj.ownerId) continue;

        const pDist = Math.hypot(player.x - proj.x, player.y - proj.y);
        if (pDist < player.snowballRadius + proj.radius + 10) {
          // HIT!
          const nx = proj.vx / Math.hypot(proj.vx, proj.vy);
          const ny = proj.vy / Math.hypot(proj.vy, proj.vy);
          const knockbackPower = (proj.radius * 0.52);

          player.kvx += nx * knockbackPower;
          player.kvy += ny * knockbackPower;
          player.lastHitBy = proj.ownerId;
          player.lastHitTime = Date.now();

          // Break player's holding snowball on hit
          player.snowballRadius = Math.max(
            PLAYER_CONFIG.SNOWBALL_MIN_RADIUS,
            player.snowballRadius * 0.4
          );

          snowballAudio.playHit(proj.sizeRatio);
          this.addSnowParticles(proj.x, proj.y, 25);
          this.shakeIntensity = Math.min(6.0, proj.sizeRatio * 7.0);

          this.projectiles.splice(i, 1);
          break;
        }
      }

      // Expire or fly out into water
      if (proj.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // --- Ring-Out Check (Falling into Arctic Sea) ---
  checkRingOuts() {
    const alivePlayers = this.players.filter(p => p.isAlive);

    alivePlayers.forEach(p => {
      const distFromCenter = Math.hypot(p.x - this.centerX, p.y - this.centerY);
      // Ring-out threshold
      if (distFromCenter > this.currentRadius + 18) {
        p.isAlive = false;
        p.rank = alivePlayers.length; // E.g. 8th, 7th...

        // Audio & Splash
        snowballAudio.playRingOut();
        this.addWaterSplash(p.x, p.y);

        // Attribute kill if knocked out within 4 seconds
        if (p.lastHitBy && Date.now() - p.lastHitTime < 4500) {
          const killer = this.players.find(k => k.id === p.lastHitBy);
          if (killer) {
            killer.kills++;
          }
        }

        // If local player was eliminated
        if (p.id === this.myPeerId) {
          snowballAudio.playLose();
        }
      }
    });
  }

  // --- Match End Check ---
  checkMatchConditions() {
    const alivePlayers = this.players.filter(p => p.isAlive);

    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        alivePlayers[0].rank = 1;
      }

      const me = this.getLocalPlayer();
      const myRank = me ? (me.rank || 1) : 8;
      const myKills = me ? me.kills : 0;
      const survivalSeconds = Math.floor(this.matchTime);

      // Score Formula
      const rankBonus = SCORING.RANK_BONUS[myRank - 1] || 10;
      const killBonus = myKills * SCORING.KILL_BONUS;
      const survivalBonus = survivalSeconds * SCORING.SURVIVAL_PER_SEC;
      const totalScore = rankBonus + killBonus + survivalBonus;

      const matchStats = {
        isVictory: myRank === 1,
        rank: myRank,
        totalPlayers: this.players.length,
        kills: myKills,
        survivalSeconds,
        totalScore,
        winnerName: alivePlayers[0] ? alivePlayers[0].name : '생존자 없음'
      };

      if (myRank === 1) {
        snowballAudio.playWin();
        this.addVictoryConfetti();
      }

      this.handleMatchEnd(matchStats);
    }
  }

  handleMatchEnd(stats) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.networkMode === 'host') {
      snowballNet._broadcastToAll({
        type: 'GAME_OVER',
        stats
      });
    }

    if (this.onGameOver) {
      this.onGameOver(stats);
    }
  }

  // --- Particles & Visual FX ---
  addSnowParticles(x, y, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color: Math.random() < 0.3 ? '#BAE6FD' : '#FFFFFF',
        alpha: 1.0,
        decay: 1.2 + Math.random() * 0.8
      });
    }
  }

  addIceDebris(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 4 + Math.random() * 6,
        color: '#7DD3FC',
        alpha: 0.9,
        decay: 0.9
      });
    }
  }

  addWaterSplash(x, y) {
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 6,
        color: Math.random() < 0.5 ? '#38BDF8' : '#E0F2FE',
        alpha: 1.0,
        decay: 1.4
      });
    }
  }

  addVictoryConfetti() {
    const colors = ['#FBBF24', '#F43F5E', '#10B981', '#38BDF8', '#A855F7'];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: this.centerX + (Math.random() - 0.5) * 200,
        y: this.centerY - 100,
        vx: (Math.random() - 0.5) * 8,
        vy: -3 - Math.random() * 7,
        radius: 4 + Math.random() * 5,
        color: colors[i % colors.length],
        alpha: 1.0,
        decay: 0.5
      });
    }
  }

  updateParticles(dt) {
    // Regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 2.0 * dt; // Gravity
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Snow ground tracks fade
    for (let i = this.snowTracks.length - 1; i >= 0; i--) {
      const t = this.snowTracks[i];
      t.alpha -= 0.15 * dt;
      if (t.alpha <= 0) {
        this.snowTracks.splice(i, 1);
      }
    }
  }

  // --- Snapshot Synchronization (P2P Host & Guest) ---
  broadcastHostSnapshot() {
    const snapshot = {
      matchTime: this.matchTime,
      currentRadius: this.currentRadius,
      players: this.players.map(p => ({
        id: p.id,
        x: Math.round(p.x),
        y: Math.round(p.y),
        angle: Number(p.angle.toFixed(2)),
        snowballRadius: Math.round(p.snowballRadius),
        isAlive: p.isAlive,
        isSpinning: p.isSpinning,
        spinAngle: Number(p.spinAngle.toFixed(2)),
        kills: p.kills,
        rank: p.rank
      })),
      projectiles: this.projectiles.map(pr => ({
        id: pr.id,
        x: Math.round(pr.x),
        y: Math.round(pr.y),
        vx: Number(pr.vx.toFixed(1)),
        vy: Number(pr.vy.toFixed(1)),
        radius: Math.round(pr.radius),
        color: pr.color
      }))
    };
    snowballNet.hostBroadcastSnapshot(snapshot);
  }

  applyNetworkSnapshot(snapshot) {
    if (!snapshot) return;
    this.matchTime = snapshot.matchTime;
    this.currentRadius = snapshot.currentRadius;

    // Interpolate players
    snapshot.players.forEach(snapP => {
      const localP = this.players.find(p => p.id === snapP.id);
      if (localP) {
        localP.x += (snapP.x - localP.x) * 0.45;
        localP.y += (snapP.y - localP.y) * 0.45;
        localP.angle = snapP.angle;
        localP.snowballRadius = snapP.snowballRadius;
        localP.isAlive = snapP.isAlive;
        localP.isSpinning = snapP.isSpinning;
        localP.spinAngle = snapP.spinAngle;
        localP.kills = snapP.kills;
        localP.rank = snapP.rank;
      }
    });

    // Update projectiles
    this.projectiles = snapshot.projectiles || [];
  }

  // ==========================================
  // 🎨 CANVAS 2D PROCEDURAL RENDERING ENGINE
  // ==========================================
  render(ctx) {
    ctx.save();

    // 0. Screen Shake Offset
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. Deep Polar Ocean Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ocean Water Ripple Waves
    const timeSec = this.matchTime;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 2;
    for (let r = this.currentRadius + 30; r < 580; r += 45) {
      const pulse = Math.sin(timeSec * 2 + r * 0.05) * 6;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Ice Island (Arena) with Depth & 3D Outer Rim
    // Outer Water Drop Shadow
    ctx.shadowColor = 'rgba(2, 132, 199, 0.45)';
    ctx.shadowBlur = 24;

    // Sub-ice Base Layer (Underwater depth)
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY + 8, this.currentRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();

    // Main Ice Surface Gradient
    ctx.shadowBlur = 0;
    const iceGrad = ctx.createRadialGradient(
      this.centerX - 40, this.centerY - 40, 20,
      this.centerX, this.centerY, this.currentRadius
    );
    iceGrad.addColorStop(0, '#FFFFFF');
    iceGrad.addColorStop(0.65, '#E0F2FE');
    iceGrad.addColorStop(0.92, '#BAE6FD');
    iceGrad.addColorStop(1.0, '#7DD3FC');

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = iceGrad;
    ctx.fill();

    // Ice Ring Outer Border (Crispy Ice Rim)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38BDF8';
    ctx.stroke();

    // 3. Ice Cracks if Warning Stage
    if (this.isShrinkWarning() || this.isShrinking) {
      this.renderIceCracks(ctx);
    }

    // 4. Ground Tracks (Snow footprints & sliding)
    this.renderSnowTracks(ctx);

    // 5. Projectiles (Flying Giant Snowballs)
    this.renderProjectiles(ctx);

    // 6. Players & Their Charging Snowballs
    this.renderPlayers(ctx);

    // 7. Particles & Confetti
    this.renderParticles(ctx);

    // 8. Ingame Minimap & Radar at Top-Right
    this.renderMinimap(ctx);

    ctx.restore();
  }

  // --- Render Ice Cracks when Arena Shrinking ---
  renderIceCracks(ctx) {
    ctx.save();
    ctx.strokeStyle = this.isShrinking ? '#EF4444' : '#F59E0B';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const count = 16;
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = step * i;
      const startR = this.currentRadius;
      const endR = this.currentRadius - 35;
      const midR = this.currentRadius - 18;

      ctx.beginPath();
      ctx.moveTo(
        this.centerX + Math.cos(angle) * startR,
        this.centerY + Math.sin(angle) * startR
      );
      ctx.lineTo(
        this.centerX + Math.cos(angle + 0.08) * midR,
        this.centerY + Math.sin(angle + 0.08) * midR
      );
      ctx.lineTo(
        this.centerX + Math.cos(angle - 0.04) * endR,
        this.centerY + Math.sin(angle - 0.04) * endR
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Render Ground Footprints ---
  renderSnowTracks(ctx) {
    ctx.save();
    for (const t of this.snowTracks) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(186, 230, 253, ${t.alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Render Flying Snowball Projectiles ---
  renderProjectiles(ctx) {
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.translate(proj.x, proj.y);

      // Shadow on ice
      ctx.beginPath();
      ctx.ellipse(0, 10, proj.radius * 0.9, proj.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.fill();

      // 3D Snowball Sphere Gradient
      const grad = ctx.createRadialGradient(
        -proj.radius * 0.3, -proj.radius * 0.3, proj.radius * 0.1,
        0, 0, proj.radius
      );
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.7, '#E0F2FE');
      grad.addColorStop(1.0, '#7DD3FC');

      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle ice crystal rim
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = proj.color || '#38BDF8';
      ctx.stroke();

      // Rotation snowflake accent
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-proj.radius * 0.5, 0);
      ctx.lineTo(proj.radius * 0.5, 0);
      ctx.moveTo(0, -proj.radius * 0.5);
      ctx.lineTo(0, proj.radius * 0.5);
      ctx.stroke();

      ctx.restore();
    }
  }

  // --- Render Players and Charging Snowballs ---
  renderPlayers(ctx) {
    // Sort players by Y coordinate for natural 2.5D depth
    const sorted = [...this.players].sort((a, b) => a.y - b.y);

    sorted.forEach(p => {
      if (!p.isAlive) return;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Spin rotation if in knockback
      if (p.isSpinning) {
        ctx.rotate(p.spinAngle);
      }

      // Drop Shadow on Ice
      ctx.beginPath();
      ctx.ellipse(0, PLAYER_CONFIG.RADIUS * 0.75, PLAYER_CONFIG.RADIUS * 1.1, PLAYER_CONFIG.RADIUS * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fill();

      // 1. Draw Player Character Based on Skin
      this.drawCharacterSkin(ctx, p);

      // 2. Draw Attached Growing Snowball in Front
      this.drawChargingSnowball(ctx, p);

      // 3. Name Tag & Kill Counter
      this.drawPlayerHUD(ctx, p);

      ctx.restore();
    });
  }

  // --- Procedural Character Vector Graphics ---
  drawCharacterSkin(ctx, p) {
    const skinId = p.skinId || 'penguin';
    const angle = p.angle;

    ctx.save();
    ctx.rotate(angle);

    const r = PLAYER_CONFIG.RADIUS;

    if (skinId === 'penguin') {
      // Body (Dark Navy / Black)
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0F172A';
      ctx.stroke();

      // White Belly
      ctx.beginPath();
      ctx.ellipse(r * 0.25, 0, r * 0.55, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();

      // Yellow/Orange Beak
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -4);
      ctx.lineTo(r + 7, 0);
      ctx.lineTo(r * 0.7, 4);
      ctx.closePath();
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      // Blue Winter Scarf
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(-r * 0.3, -r * 0.7, 8, r * 1.4);

      // Cute Eyes
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(r * 0.45, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(r * 0.45, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skinId === 'snowman') {
      // Pure White Body
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#CBD5E1';
      ctx.stroke();

      // Carrot Nose
      ctx.beginPath();
      ctx.moveTo(r * 0.6, -3);
      ctx.lineTo(r + 9, 0);
      ctx.lineTo(r * 0.6, 3);
      ctx.closePath();
      ctx.fillStyle = '#EA580C';
      ctx.fill();

      // Red Santa Hat
      ctx.beginPath();
      ctx.arc(-r * 0.3, 0, r * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();

      // Coal Eyes
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(r * 0.4, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(r * 0.4, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skinId === 'polarbear') {
      // Cream Polar Bear Fur
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#94A3B8';
      ctx.stroke();

      // Bear Ears
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(-r * 0.5, -r * 0.8, 6, 0, Math.PI * 2);
      ctx.arc(-r * 0.5, r * 0.8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Emerald Beanie Hat
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(-r * 0.2, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Black Nose & Eyes
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(r * 0.7, 0, 3.5, 0, Math.PI * 2);
      ctx.arc(r * 0.4, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(r * 0.4, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dochon Student (Padding Jacket & Earmuffs)
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1D4ED8';
      ctx.stroke();

      // Skin Tone Face
      ctx.beginPath();
      ctx.arc(r * 0.25, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#FED7AA';
      ctx.fill();

      // Yellow Earmuffs
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, -r * 0.85, 7, 0, Math.PI * 2);
      ctx.arc(0, r * 0.85, 7, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Blushing Cheeks
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(r * 0.4, -5, 2.5, 0, Math.PI * 2);
      ctx.arc(r * 0.4, 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(r * 0.35, -9, 3, 0, Math.PI * 2);
      ctx.arc(r * 0.35, 9, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Draw Charging Snowball In Front of Player ---
  drawChargingSnowball(ctx, p) {
    if (p.snowballRadius <= 0) return;

    const angle = p.angle;
    const dist = PLAYER_CONFIG.RADIUS + p.snowballRadius + 2;
    const ballX = Math.cos(angle) * dist;
    const ballY = Math.sin(angle) * dist;

    ctx.save();
    ctx.translate(ballX, ballY);

    // Ball Shadow
    ctx.beginPath();
    ctx.ellipse(0, p.snowballRadius * 0.8, p.snowballRadius * 0.85, p.snowballRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fill();

    // 3D Sphere Gradient
    const ballGrad = ctx.createRadialGradient(
      -p.snowballRadius * 0.3, -p.snowballRadius * 0.3, p.snowballRadius * 0.1,
      0, 0, p.snowballRadius
    );
    ballGrad.addColorStop(0, '#FFFFFF');
    ballGrad.addColorStop(0.7, '#E0F2FE');
    ballGrad.addColorStop(1.0, '#BAE6FD');

    ctx.beginPath();
    ctx.arc(0, 0, p.snowballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Ice Rim Highlight
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = p.skin ? p.skin.color : '#38BDF8';
    ctx.stroke();

    ctx.restore();
  }

  // --- Draw Player Name & HUD ---
  drawPlayerHUD(ctx, p) {
    ctx.save();

    const isMe = p.id === this.myPeerId;
    const nameY = -PLAYER_CONFIG.RADIUS - 16;

    // Background Pill
    ctx.font = 'bold 11px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayName = isMe ? `⭐ ${p.name}` : p.name;
    const textWidth = ctx.measureText(displayName).width;

    ctx.fillStyle = isMe ? 'rgba(2, 132, 199, 0.85)' : 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 8, nameY - 9, textWidth + 16, 18, 9);
    ctx.fill();

    ctx.fillStyle = isMe ? '#FDE047' : '#F8FAFC';
    ctx.fillText(displayName, 0, nameY);

    // Kills Badge if kills > 0
    if (p.kills > 0) {
      const killText = `⚔️ ${p.kills}`;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.roundRect(-16, nameY - 24, 32, 14, 7);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Pretendard, sans-serif';
      ctx.fillText(killText, 0, nameY - 17);
    }

    ctx.restore();
  }

  // --- Render Particles ---
  renderParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color || '#FFFFFF';
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Render Minimap Radar ---
  renderMinimap(ctx) {
    ctx.save();
    const mapSize = 90;
    const mapX = CANVAS_WIDTH - mapSize - 16;
    const mapY = 16;
    const mapScale = (mapSize * 0.45) / ARENA_CONFIG.INITIAL_RADIUS;
    const mapCenterX = mapX + mapSize / 2;
    const mapCenterY = mapY + mapSize / 2;

    // Radar Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapSize, mapSize, 12);
    ctx.fill();
    ctx.stroke();

    // Arena Ring on Radar
    ctx.beginPath();
    ctx.arc(mapCenterX, mapCenterY, this.currentRadius * mapScale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.3)';
    ctx.fill();
    ctx.strokeStyle = this.isShrinking ? '#EF4444' : '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Player Blips
    this.players.forEach(p => {
      if (!p.isAlive) return;
      const bx = mapCenterX + (p.x - this.centerX) * mapScale;
      const by = mapCenterY + (p.y - this.centerY) * mapScale;

      ctx.beginPath();
      ctx.arc(bx, by, p.id === this.myPeerId ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.id === this.myPeerId ? '#FBBF24' : (p.isBot ? '#EF4444' : '#38BDF8');
      ctx.fill();
    });

    ctx.restore();
  }
}
