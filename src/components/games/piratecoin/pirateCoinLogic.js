// Dochon Games Portal - Dochon Pirate Coin Heist Simulation Logic Engine
// Ship Physics, Coin Chain Dynamics, Ramming Impact, Banking Zones, Items & AI Bots

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ISLAND_CENTER,
  ISLAND_RADIUS,
  TEAM_BASES,
  SHIP_CLASSES,
  COIN_TYPES,
  ITEM_TYPES,
  REEFS,
  WHIRLPOOLS,
  MAX_HELD_COINS,
  RAM_MIN_REL_SPEED,
  RAM_COIN_DROP_RATIO,
  AI_DIFFICULTIES
} from './pirateCoinConstants.js';
import { pirateAudio } from './pirateCoinAudio.js';

export class PirateCoinLogic {
  constructor(options = {}) {
    this.difficulty = AI_DIFFICULTIES[options.difficulty || 'normal'];
    this.isMultiplayer = !!options.isMultiplayer;
    this.onEvent = options.onEvent || (() => {});

    // Entities
    this.players = []; // [Ship, Ship, Ship, Ship]
    this.coins = [];   // [{ id, x, y, type, value, radius, animPhase }]
    this.itemCrates = []; // [{ id, x, y, itemType }]
    this.projectiles = []; // [{ id, x, y, vx, vy, ownerId, radius, lifeMs }]
    this.particles = []; // [{ x, y, vx, vy, color, radius, alpha, lifeMs, maxLife }]
    this.floatingTexts = []; // [{ x, y, text, color, alpha, lifeMs }]

    this.coinIdCounter = 1;
    this.projectileIdCounter = 1;
    this.crateIdCounter = 1;

    this.nextCoinSpawnTime = 0;
    this.nextCrateSpawnTime = 0;
  }

  // --- Initialize Players for Match ---
  initMatch(humanPlayerConfig, botSkins = ['cutter', 'galleon', 'sloop']) {
    this.players = [];
    this.coins = [];
    this.itemCrates = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Human Player (Slot 0, Base 0 by default or chosen team)
    const myTeamId = humanPlayerConfig.teamId !== undefined ? humanPlayerConfig.teamId : 0;
    const myBase = TEAM_BASES[myTeamId];
    const myClass = SHIP_CLASSES[humanPlayerConfig.shipClass || 'caravel'];

    const humanPlayer = this._createShip({
      id: humanPlayerConfig.id || 'player_me',
      name: humanPlayerConfig.name || '도촌 선장',
      isMe: true,
      isAi: false,
      teamId: myTeamId,
      teamColor: myBase.color,
      shipClass: myClass,
      x: myBase.x,
      y: myBase.y,
      angle: myBase.dockAngle
    });
    this.players.push(humanPlayer);

    // AI Bots or Remote Players (Remaining 3 Slots)
    let botIndex = 0;
    for (let t = 0; t < 4; t++) {
      if (t === myTeamId) continue;
      const botBase = TEAM_BASES[t];
      const skinKey = botSkins[botIndex % botSkins.length] || 'caravel';
      const botClass = SHIP_CLASSES[skinKey];
      const botNames = ['해적왕 버기', '캡틴 실버', '검은수염 티치', '붉은머리 샹크'];

      const bot = this._createShip({
        id: `bot_${t}`,
        name: botNames[t % botNames.length],
        isMe: false,
        isAi: !this.isMultiplayer,
        teamId: t,
        teamColor: botBase.color,
        shipClass: botClass,
        x: botBase.x,
        y: botBase.y,
        angle: botBase.dockAngle
      });
      this.players.push(bot);
      botIndex++;
    }

    // Spawn Initial Batch of Island & Sea Coins (40 coins)
    for (let i = 0; i < 40; i++) {
      this.spawnRandomCoin(i % 6 === 0 ? 'chest' : i % 8 === 0 ? 'skull' : 'gold');
    }

    // Spawn Initial Item Crates (4 crates)
    for (let i = 0; i < 4; i++) {
      this.spawnItemCrate();
    }
  }

  _createShip(data) {
    return {
      id: data.id,
      name: data.name,
      isMe: !!data.isMe,
      isAi: !!data.isAi,
      teamId: data.teamId,
      teamColor: data.teamColor,
      shipClass: data.shipClass,
      x: data.x,
      y: data.y,
      vx: 0,
      vy: 0,
      angle: data.angle || 0,
      targetAngle: data.angle || 0,
      speed: 0,
      alive: true,
      radius: 26,

      // Inventory & Scores
      heldCoins: 0,
      bankedScore: 0,
      currentSlotItem: null, // itemType or null

      // Active Buffs / Debuffs
      boostEndTime: 0,
      shieldEndTime: 0,
      shieldActive: false,
      magnetEndTime: 0,
      stunEndTime: 0,
      lastDepositTime: 0,

      // Visual Trailing Trail Points for held coins
      trail: [], // array of { x, y, angle }

      // Input Controls State
      inputs: {
        forward: false,
        backward: false,
        turnLeft: false,
        turnRight: false,
        useItem: false
      }
    };
  }

  // --- Spawn Coins ---
  spawnRandomCoin(typeKey = 'gold') {
    const coinDef = COIN_TYPES[typeKey.toUpperCase()] || COIN_TYPES.GOLD;

    // 65% spawn on island beach/perimeter, 35% in open water
    let x, y;
    if (Math.random() < 0.65) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * (ISLAND_RADIUS - 80);
      x = ISLAND_CENTER.x + Math.cos(angle) * dist;
      y = ISLAND_CENTER.y + Math.sin(angle) * dist;
    } else {
      x = 300 + Math.random() * (WORLD_WIDTH - 600);
      y = 300 + Math.random() * (WORLD_HEIGHT - 600);
    }

    this.coins.push({
      id: `coin_${this.coinIdCounter++}`,
      x,
      y,
      type: coinDef.id,
      value: coinDef.value,
      radius: coinDef.radius,
      color: coinDef.color,
      glowColor: coinDef.glowColor,
      animPhase: Math.random() * Math.PI * 2
    });
  }

  // --- Spawn Item Crate ---
  spawnItemCrate() {
    if (this.itemCrates.length >= 6) return;
    const items = ['cannon', 'boost', 'magnet', 'shield'];
    const selectedItem = items[Math.floor(Math.random() * items.length)];

    const x = 350 + Math.random() * (WORLD_WIDTH - 700);
    const y = 350 + Math.random() * (WORLD_HEIGHT - 700);

    this.itemCrates.push({
      id: `crate_${this.crateIdCounter++}`,
      x,
      y,
      itemType: selectedItem,
      radius: 20,
      respawnTimer: 0
    });
  }

  // --- Main Tick Update Loop (Delta Time) ---
  update(dt, nowSec) {
    // 1. Spawning Timers
    if (nowSec > this.nextCoinSpawnTime) {
      if (this.coins.length < 55) {
        const roll = Math.random();
        const type = roll < 0.15 ? 'chest' : roll < 0.25 ? 'skull' : 'gold';
        this.spawnRandomCoin(type);
      }
      this.nextCoinSpawnTime = nowSec + 1.2;
    }

    if (nowSec > this.nextCrateSpawnTime) {
      this.spawnItemCrate();
      this.nextCrateSpawnTime = nowSec + 8.0;
    }

    // 2. Update AI Decisions
    this.players.forEach((p) => {
      if (p.isAi && p.alive) {
        this._updateAiDecision(p, nowSec);
      }
    });

    // 3. Update Ships Physics & Movements
    this.players.forEach((p) => {
      if (!p.alive) return;
      this._updateShipPhysics(p, dt, nowSec);
    });

    // 4. Ship-to-Ship Ramming Collision
    this._handleShipCollisions(nowSec);

    // 5. Coin Pickups & Magnet Effect
    this._handleCoinInteractions(nowSec);

    // 6. Item Crate Pickups
    this._handleCrateInteractions(nowSec);

    // 7. Base Banking Zone Check
    this._handleBaseBanking(nowSec);

    // 8. Projectiles (Cannonballs)
    this._updateProjectiles(dt, nowSec);

    // 9. Particles & Floating Texts
    this._updateVisualEffects(dt);
  }

  // --- Ship Movement & Physics Simulation ---
  _updateShipPhysics(p, dt, nowSec) {
    const isStunned = nowSec < p.stunEndTime;
    const isBoosted = nowSec < p.boostEndTime;

    // Weight penalty: held coins reduce speed (max 32% penalty)
    const weightFactor = Math.max(0.68, 1.0 - (p.heldCoins * 0.012));
    const baseSpeed = p.shipClass.maxSpeed * weightFactor;
    const currentMaxSpeed = isStunned ? 0 : isBoosted ? baseSpeed * 1.7 : baseSpeed;

    // Steering
    if (!isStunned) {
      const turnPower = p.shipClass.turnSpeed * (isBoosted ? 0.85 : 1.0);
      if (p.inputs.turnLeft) {
        p.angle -= turnPower;
      }
      if (p.inputs.turnRight) {
        p.angle += turnPower;
      }
    }

    // Acceleration & Braking
    const accel = p.shipClass.accel * (isBoosted ? 1.8 : 1.0);
    if (!isStunned && p.inputs.forward) {
      p.speed = Math.min(currentMaxSpeed, p.speed + accel);
    } else if (!isStunned && p.inputs.backward) {
      p.speed = Math.max(-baseSpeed * 0.4, p.speed - accel * 0.8);
    } else {
      // Water friction drag
      p.speed *= 0.94;
      if (Math.abs(p.speed) < 0.05) p.speed = 0;
    }

    // Velocity vector from angle & speed
    p.vx = Math.cos(p.angle) * p.speed;
    p.vy = Math.sin(p.angle) * p.speed;

    // Whirlpool pull
    WHIRLPOOLS.forEach((wp) => {
      const dx = wp.x - p.x;
      const dy = wp.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < wp.radius * 1.5 && dist > 10) {
        const pull = (1 - dist / (wp.radius * 1.5)) * wp.pullForce;
        p.vx += (dx / dist) * pull;
        p.vy += (dy / dist) * pull;
        p.angle += 0.03; // vortex spin
      }
    });

    // Move Ship
    p.x += p.vx;
    p.y += p.vy;

    // World Boundary Collision with soft bounce
    const margin = p.radius + 10;
    if (p.x < margin) {
      p.x = margin;
      p.vx = -p.vx * 0.5;
    } else if (p.x > WORLD_WIDTH - margin) {
      p.x = WORLD_WIDTH - margin;
      p.vx = -p.vx * 0.5;
    }
    if (p.y < margin) {
      p.y = margin;
      p.vy = -p.vy * 0.5;
    } else if (p.y > WORLD_HEIGHT - margin) {
      p.y = WORLD_HEIGHT - margin;
      p.vy = -p.vy * 0.5;
    }

    // Reef Obstacle Collision
    REEFS.forEach((reef) => {
      const dx = p.x - reef.x;
      const dy = p.y - reef.y;
      const dist = Math.hypot(dx, dy);
      const minDist = p.radius + reef.radius;
      if (dist < minDist && dist > 0) {
        const push = minDist - dist;
        p.x += (dx / dist) * push;
        p.y += (dy / dist) * push;
        p.speed *= -0.3;
        this.addSparks(p.x, p.y, '#94A3B8', 5);
      }
    });

    // Central Island Deep Jungle Block (Shallow beach allowed, deep core blocked)
    const islandDx = p.x - ISLAND_CENTER.x;
    const islandDy = p.y - ISLAND_CENTER.y;
    const islandDist = Math.hypot(islandDx, islandDy);
    const jungleRadius = ISLAND_RADIUS * 0.5;
    if (islandDist < jungleRadius && islandDist > 0) {
      const push = jungleRadius - islandDist;
      p.x += (islandDx / islandDist) * push;
      p.y += (islandDy / islandDist) * push;
      p.speed *= -0.2;
    }

    // Trail Points Tracking (Keep last 25 positions for trailing coin snake)
    if (p.speed !== 0 || Math.random() < 0.1) {
      p.trail.unshift({ x: p.x, y: p.y, angle: p.angle });
      if (p.trail.length > 28) {
        p.trail.pop();
      }
    }

    // Wake Water Particles
    if (Math.abs(p.speed) > 1.2 && Math.random() < 0.4) {
      const wakeAngle = p.angle + Math.PI + (Math.random() - 0.5) * 0.6;
      this.particles.push({
        x: p.x + Math.cos(p.angle + Math.PI) * (p.radius * 0.8),
        y: p.y + Math.sin(p.angle + Math.PI) * (p.radius * 0.8),
        vx: Math.cos(wakeAngle) * 0.8,
        vy: Math.sin(wakeAngle) * 0.8,
        color: 'rgba(255, 255, 255, 0.6)',
        radius: 2 + Math.random() * 3,
        alpha: 0.6,
        lifeMs: 400,
        maxLife: 400
      });
    }

    // Handle Item Usage
    if (p.inputs.useItem && p.currentSlotItem && !isStunned) {
      this._activateItem(p, nowSec);
      p.inputs.useItem = false;
    }
  }

  // --- Item Activation ---
  _activateItem(p, nowSec) {
    const item = p.currentSlotItem;
    p.currentSlotItem = null;

    if (item === 'cannon') {
      // Fire Cannonball
      pirateAudio.playCannonFire();
      const spawnDist = p.radius + 15;
      const cannonSpeed = 11;
      this.projectiles.push({
        id: `proj_${this.projectileIdCounter++}`,
        ownerId: p.id,
        teamId: p.teamId,
        x: p.x + Math.cos(p.angle) * spawnDist,
        y: p.y + Math.sin(p.angle) * spawnDist,
        vx: Math.cos(p.angle) * cannonSpeed + p.vx * 0.5,
        vy: Math.sin(p.angle) * cannonSpeed + p.vy * 0.5,
        radius: 7,
        lifeMs: 1600
      });
      this.addFloatingText(p.x, p.y - 20, '💣 대포 발사!', '#EF4444');
    } else if (item === 'boost') {
      pirateAudio.playBoost();
      p.boostEndTime = nowSec + 2.5;
      this.addFloatingText(p.x, p.y - 20, '💨 순풍 부스터!', '#06B6D4');
      this.addSparks(p.x, p.y, '#06B6D4', 12);
    } else if (item === 'magnet') {
      pirateAudio.playShield();
      p.magnetEndTime = nowSec + 3.5;
      this.addFloatingText(p.x, p.y - 20, '🧲 코인 자석 가동!', '#F59E0B');
    } else if (item === 'shield') {
      pirateAudio.playShield();
      p.shieldEndTime = nowSec + 5.0;
      p.shieldActive = true;
      this.addFloatingText(p.x, p.y - 20, '🛡️ 크라켄 방패!', '#8B5CF6');
    }
  }

  // --- Ship to Ship Ramming & Collision ---
  _handleShipCollisions(nowSec) {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i];
        const b = this.players[j];
        if (!a.alive || !b.alive) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
          // Push apart to prevent overlapping
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          a.x -= nx * (overlap * 0.5);
          a.y -= ny * (overlap * 0.5);
          b.x += nx * (overlap * 0.5);
          b.y += ny * (overlap * 0.5);

          // Relative speed along collision normal
          const relVel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;

          if (Math.abs(relVel) > RAM_MIN_REL_SPEED) {
            // A rams B or B rams A
            const aIsRammer = relVel > 0;
            const rammer = aIsRammer ? a : b;
            const victim = aIsRammer ? b : a;

            pirateAudio.playRam();

            // Calculate coin spill from victim
            if (victim.shieldActive && nowSec < victim.shieldEndTime) {
              // Shield blocks attack
              victim.shieldActive = false;
              victim.shieldEndTime = 0;
              this.addFloatingText(victim.x, victim.y - 25, '🛡️ 방어 성공!', '#A855F7');
              this.addSparks(victim.x, victim.y, '#A855F7', 15);
            } else if (victim.heldCoins > 0) {
              const droppedCoinsCount = Math.max(1, Math.ceil(victim.heldCoins * RAM_COIN_DROP_RATIO));
              victim.heldCoins = Math.max(0, victim.heldCoins - droppedCoinsCount);

              // Spill coins outward
              for (let k = 0; k < droppedCoinsCount; k++) {
                const angle = Math.random() * Math.PI * 2;
                const force = 30 + Math.random() * 55;
                this.coins.push({
                  id: `spill_${this.coinIdCounter++}`,
                  x: victim.x + Math.cos(angle) * force,
                  y: victim.y + Math.sin(angle) * force,
                  type: 'gold',
                  value: 10,
                  radius: 13,
                  color: '#FBBF24',
                  glowColor: 'rgba(251, 191, 36, 0.4)',
                  animPhase: Math.random() * Math.PI * 2
                });
              }

              // Victim briefly stunned
              victim.stunEndTime = nowSec + 0.8;
              this.addFloatingText(victim.x, victim.y - 25, `💥 들이받힘! -${droppedCoinsCount * 10}점 탈취!`, '#EF4444');
              this.addFloatingText(rammer.x, rammer.y - 35, `⚔️ 들이받기 성공!`, '#F59E0B');
              this.addSparks(victim.x, victim.y, '#EF4444', 16);
            }

            // Rammer impulse bounce
            const impulse = Math.min(4, Math.abs(relVel) * 0.6 * rammer.shipClass.ramPower);
            victim.vx += (aIsRammer ? nx : -nx) * impulse;
            victim.vy += (aIsRammer ? ny : -ny) * impulse;
          }
        }
      }
    }
  }

  // --- Coin Interactions & Magnet ---
  _handleCoinInteractions(nowSec) {
    this.players.forEach((p) => {
      if (!p.alive) return;
      const isMagnetActive = nowSec < p.magnetEndTime;

      for (let i = this.coins.length - 1; i >= 0; i--) {
        const coin = this.coins[i];
        const dx = p.x - coin.x;
        const dy = p.y - coin.y;
        const dist = Math.hypot(dx, dy);

        // Magnet attraction
        if (isMagnetActive && dist < 360 && dist > 10) {
          coin.x += (dx / dist) * 7.5;
          coin.y += (dy / dist) * 7.5;
        }

        // Direct Pickup
        if (dist < p.radius + coin.radius + 6) {
          this.coins.splice(i, 1);

          if (coin.type === 'skull') {
            pirateAudio.playSkull();
            const lost = Math.min(2, p.heldCoins);
            p.heldCoins -= lost;
            this.addFloatingText(p.x, p.y - 25, `☠️ 저주! -${lost * 10}`, '#A855F7');
          } else {
            if (coin.type === 'chest') {
              pirateAudio.playChest();
              p.heldCoins += 5; // equals 50 points
              this.addFloatingText(p.x, p.y - 25, '👑 보물상자 +50!', '#F59E0B');
              this.addSparks(coin.x, coin.y, '#F59E0B', 14);
            } else {
              pirateAudio.playCoin();
              p.heldCoins += 1; // equals 10 points
              this.addFloatingText(p.x, p.y - 20, '+10', '#FDE68A');
            }
          }

          // Cap held coins
          if (p.heldCoins > MAX_HELD_COINS) {
            p.heldCoins = MAX_HELD_COINS;
            this.addFloatingText(p.x, p.y - 35, '배가 가득 찼어요! 선착장으로!', '#F59E0B');
          }
        }
      }
    });
  }

  // --- Item Crate Interactions ---
  _handleCrateInteractions(nowSec) {
    this.players.forEach((p) => {
      if (!p.alive || p.currentSlotItem) return;

      for (let i = this.itemCrates.length - 1; i >= 0; i--) {
        const crate = this.itemCrates[i];
        const dist = Math.hypot(p.x - crate.x, p.y - crate.y);

        if (dist < p.radius + crate.radius + 6) {
          const itemDef = ITEM_TYPES[crate.itemType.toUpperCase()];
          p.currentSlotItem = crate.itemType;
          this.itemCrates.splice(i, 1);

          pirateAudio.playShield();
          this.addFloatingText(p.x, p.y - 25, `${itemDef.icon} ${itemDef.name} 획득!`, itemDef.color);
          this.addSparks(crate.x, crate.y, itemDef.color, 10);
        }
      }
    });
  }

  // --- Base Harbor Banking Zone Check ---
  _handleBaseBanking(nowSec) {
    this.players.forEach((p) => {
      if (!p.alive || p.heldCoins <= 0) return;

      const base = TEAM_BASES[p.teamId];
      const dist = Math.hypot(p.x - base.x, p.y - base.y);

      // Inside Team Safe Harbor Ring
      if (dist < base.radius) {
        if (nowSec - p.lastDepositTime > 0.25) {
          p.lastDepositTime = nowSec;
          p.heldCoins -= 1;
          p.bankedScore += 10;

          pirateAudio.playDeposit();
          this.addFloatingText(p.x, p.y - 25, `💰 입금! +10 (${p.bankedScore}점)`, '#10B981');
          this.addSparks(p.x, p.y, '#10B981', 6);
        }
      }
    });
  }

  // --- Projectiles (Cannonballs) ---
  _updateProjectiles(dt, nowSec) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.lifeMs -= dt * 1000;

      if (proj.lifeMs <= 0 || proj.x < 0 || proj.x > WORLD_WIDTH || proj.y < 0 || proj.y > WORLD_HEIGHT) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check hit with other ships
      for (let j = 0; j < this.players.length; j++) {
        const p = this.players[j];
        if (!p.alive || p.id === proj.ownerId) continue;

        const dist = Math.hypot(proj.x - p.x, proj.y - p.y);
        if (dist < p.radius + proj.radius) {
          // Hit!
          pirateAudio.playCannonHit();
          this.projectiles.splice(i, 1);

          if (p.shieldActive && nowSec < p.shieldEndTime) {
            p.shieldActive = false;
            p.shieldEndTime = 0;
            this.addFloatingText(p.x, p.y - 25, '🛡️ 대포 방패 방어!', '#8B5CF6');
          } else {
            p.stunEndTime = nowSec + 1.5;
            p.speed = 0;
            const drop = Math.min(3, p.heldCoins);
            p.heldCoins -= drop;

            // Spawn dropped coins
            for (let k = 0; k < drop; k++) {
              this.spawnRandomCoin('gold');
            }

            this.addFloatingText(p.x, p.y - 25, `💥 대포 직격 스턴! -${drop * 10}`, '#EF4444');
            this.addSparks(p.x, p.y, '#EF4444', 18);
          }
          break;
        }
      }
    }
  }

  // --- AI Bot Decision Tree ---
  _updateAiDecision(bot, nowSec) {
    const base = TEAM_BASES[bot.teamId];
    let targetX = ISLAND_CENTER.x;
    let targetY = ISLAND_CENTER.y;

    // 1. Should Return to Bank? (Held coins exceeded threshold)
    if (bot.heldCoins >= this.difficulty.bankCoinThreshold) {
      targetX = base.x;
      targetY = base.y;
    } else {
      // 2. Should Ram an Enemy? (Check if close enemy has lots of coins)
      let ramCandidate = null;
      let minRamDist = 320;
      this.players.forEach((other) => {
        if (other.id !== bot.id && other.alive && other.heldCoins >= 3) {
          const d = Math.hypot(other.x - bot.x, other.y - bot.y);
          if (d < minRamDist) {
            minRamDist = d;
            ramCandidate = other;
          }
        }
      });

      if (ramCandidate && Math.random() < this.difficulty.ramAggressiveness) {
        targetX = ramCandidate.x;
        targetY = ramCandidate.y;
      } else {
        // 3. Find closest coin (prioritize chest > gold)
        let bestCoin = null;
        let bestScore = -99999;
        this.coins.forEach((c) => {
          if (c.type === 'skull') return;
          const dist = Math.hypot(c.x - bot.x, c.y - bot.y);
          const score = (c.value * 10) - dist;
          if (score > bestScore) {
            bestScore = score;
            bestCoin = c;
          }
        });

        if (bestCoin) {
          targetX = bestCoin.x;
          targetY = bestCoin.y;
        }
      }
    }

    // Steering towards target
    const desiredAngle = Math.atan2(targetY - bot.y, targetX - bot.x);
    let diff = desiredAngle - bot.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    bot.inputs.turnLeft = diff < -0.1;
    bot.inputs.turnRight = diff > 0.1;
    bot.inputs.forward = Math.abs(diff) < 1.4;
    bot.inputs.backward = Math.abs(diff) > 2.4;

    // Use Item randomly when available
    if (bot.currentSlotItem && Math.random() < 0.02) {
      bot.inputs.useItem = true;
    }
  }

  // --- Visual Effects & Floating Texts ---
  _updateVisualEffects(dt) {
    // Floating text decay
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= dt * 35;
      ft.lifeMs -= dt * 1000;
      ft.alpha = Math.max(0, ft.lifeMs / 900);
      if (ft.lifeMs <= 0) this.floatingTexts.splice(i, 1);
    }

    // Particles decay
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.lifeMs -= dt * 1000;
      pt.alpha = Math.max(0, pt.lifeMs / pt.maxLife);
      if (pt.lifeMs <= 0) this.particles.splice(i, 1);
    }
  }

  addFloatingText(x, y, text, color = '#FFFFFF') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      lifeMs: 900
    });
  }

  addSparks(x, y, color = '#FDE68A', count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 2,
        alpha: 1.0,
        lifeMs: 350 + Math.random() * 250,
        maxLife: 600
      });
    }
  }
}
