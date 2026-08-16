// Champion Island Game Logic & 4 Sports Physics Engines
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  OVERWORLD_MAP,
  TILES,
  NPCS,
  SPORTS
} from './championConstants';
import { championAudio } from './championAudio';

// ==========================================
// 1. OVERWORLD ENGINE & COLLISION DETECTION
// ==========================================

export function checkOverworldCollision(x, y, radius = 12) {
  // Check bounds
  if (x - radius < 0 || x + radius > MAP_COLS * TILE_SIZE ||
      y - radius < 0 || y + radius > MAP_ROWS * TILE_SIZE) {
    return true;
  }

  const corners = [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y: y + radius },
    { x: x + radius, y: y + radius }
  ];

  for (const c of corners) {
    const col = Math.floor(c.x / TILE_SIZE);
    const row = Math.floor(c.y / TILE_SIZE);

    if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
      const tile = OVERWORLD_MAP[row][col];
      // Solid tiles: Water(2), Tree(5), Torii Pillar(6 edges)
      if (tile === TILES.WATER || tile === TILES.TREE) {
        return true;
      }
    }
  }
  return false;
}

export function checkNPCInteraction(playerX, playerY) {
  for (const npc of NPCS) {
    const npcCenterX = npc.tileX * TILE_SIZE + TILE_SIZE / 2;
    const npcCenterY = npc.tileY * TILE_SIZE + TILE_SIZE / 2;
    const dist = Math.hypot(playerX - npcCenterX, playerY - npcCenterY);
    if (dist < 48) {
      return npc;
    }
  }
  return null;
}

export function checkArenaTrigger(playerX, playerY) {
  const col = Math.floor(playerX / TILE_SIZE);
  const row = Math.floor(playerY / TILE_SIZE);

  if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
    const tile = OVERWORLD_MAP[row][col];
    if (tile === TILES.ARENA_PINGPONG) return SPORTS.TABLE_TENNIS;
    if (tile === TILES.ARENA_ARCHERY) return SPORTS.ARCHERY;
    if (tile === TILES.ARENA_MARATHON) return SPORTS.MARATHON;
    if (tile === TILES.ARENA_CLIMBING) return SPORTS.CLIMBING;
  }
  return null;
}

// ==========================================
// 2. TABLE TENNIS ENGINE (vs TENGU)
// ==========================================

export class TableTennisEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.playerY = CANVAS_HEIGHT / 2;
    this.tenguY = CANVAS_HEIGHT / 2;
    this.paddleHeight = 80;
    this.paddleWidth = 14;

    this.ballX = CANVAS_WIDTH / 2;
    this.ballY = CANVAS_HEIGHT / 2;
    this.ballRadius = 9;
    this.ballVX = 5.5;
    this.ballVY = 2.5;
    this.ballSpeed = 6.0;

    this.playerScore = 0;
    this.tenguScore = 0;
    this.targetPoints = 5;
    this.rallyCount = 0;
    this.maxRally = 0;
    this.isSmashReady = false;
    this.smashCooldown = 0;
    this.effectParticles = [];
    this.winner = null; // 'player' | 'boss'
  }

  update(keys, isMobileSmash = false) {
    if (this.winner) return;

    // Player Paddle Movement (Up / Down)
    const moveSpeed = 7;
    if (keys.ArrowUp || keys.KeyW) {
      this.playerY = Math.max(this.paddleHeight / 2 + 30, this.playerY - moveSpeed);
    }
    if (keys.ArrowDown || keys.KeyS) {
      this.playerY = Math.min(CANVAS_HEIGHT - this.paddleHeight / 2 - 30, this.playerY + moveSpeed);
    }

    // Smash trigger
    if ((keys.Space || isMobileSmash) && this.smashCooldown <= 0) {
      this.isSmashReady = true;
    }

    if (this.smashCooldown > 0) this.smashCooldown--;

    // Tengu AI Movement (Tracks ball with slight delay)
    const tenguSpeed = 5.2 + Math.min(this.rallyCount * 0.15, 2.5);
    const targetY = this.ballY + (Math.sin(Date.now() / 200) * 12);
    if (this.tenguY < targetY - 6) {
      this.tenguY += tenguSpeed;
    } else if (this.tenguY > targetY + 6) {
      this.tenguY -= tenguSpeed;
    }
    this.tenguY = Math.max(this.paddleHeight / 2 + 30, Math.min(CANVAS_HEIGHT - this.paddleHeight / 2 - 30, this.tenguY));

    // Ball Movement
    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    // Top / Bottom Wall Bounce
    if (this.ballY - this.ballRadius <= 30) {
      this.ballY = 30 + this.ballRadius;
      this.ballVY = Math.abs(this.ballVY);
      championAudio.playPingPongHit(false);
    } else if (this.ballY + this.ballRadius >= CANVAS_HEIGHT - 30) {
      this.ballY = CANVAS_HEIGHT - 30 - this.ballRadius;
      this.ballVY = -Math.abs(this.ballVY);
      championAudio.playPingPongHit(false);
    }

    // Player Paddle Collision (Left side: X = 70)
    const playerPaddleX = 70;
    if (
      this.ballVX < 0 &&
      this.ballX - this.ballRadius <= playerPaddleX + this.paddleWidth / 2 &&
      this.ballX + this.ballRadius >= playerPaddleX - this.paddleWidth / 2 &&
      Math.abs(this.ballY - this.playerY) <= this.paddleHeight / 2 + 6
    ) {
      this.rallyCount++;
      if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;
      const hitOffset = (this.ballY - this.playerY) / (this.paddleHeight / 2); // -1 to 1

      const isSmash = this.isSmashReady;
      this.isSmashReady = false;
      if (isSmash) this.smashCooldown = 60;

      const baseSpeed = isSmash ? 11 : Math.min(6 + this.rallyCount * 0.35, 10.5);
      this.ballVX = Math.abs(baseSpeed);
      this.ballVY = hitOffset * (baseSpeed * 0.75);

      championAudio.playPingPongHit(isSmash);

      // Create Hit Particles
      for (let i = 0; i < (isSmash ? 12 : 5); i++) {
        this.effectParticles.push({
          x: this.ballX,
          y: this.ballY,
          vx: (Math.random() * 4) * (isSmash ? 2 : 1),
          vy: (Math.random() - 0.5) * 6,
          color: isSmash ? '#EF4444' : '#FDE047',
          life: 20
        });
      }
    }

    // Tengu Paddle Collision (Right side: X = CANVAS_WIDTH - 70)
    const tenguPaddleX = CANVAS_WIDTH - 70;
    if (
      this.ballVX > 0 &&
      this.ballX + this.ballRadius >= tenguPaddleX - this.paddleWidth / 2 &&
      this.ballX - this.ballRadius <= tenguPaddleX + this.paddleWidth / 2 &&
      Math.abs(this.ballY - this.tenguY) <= this.paddleHeight / 2 + 6
    ) {
      this.rallyCount++;
      if (this.rallyCount > this.maxRally) this.maxRally = this.rallyCount;
      const hitOffset = (this.ballY - this.tenguY) / (this.paddleHeight / 2);
      const baseSpeed = Math.min(6 + this.rallyCount * 0.3, 10);
      this.ballVX = -Math.abs(baseSpeed);
      this.ballVY = hitOffset * (baseSpeed * 0.7);

      championAudio.playPingPongHit(false);

      for (let i = 0; i < 6; i++) {
        this.effectParticles.push({
          x: this.ballX,
          y: this.ballY,
          vx: -Math.random() * 4,
          vy: (Math.random() - 0.5) * 5,
          color: '#38BDF8',
          life: 18
        });
      }
    }

    // Point Scored Check
    if (this.ballX < 20) {
      // Tengu scores
      this.tenguScore++;
      championAudio.playTone(220, 'sawtooth', 0.2, 0.1);
      this.resetServe(-1);
    } else if (this.ballX > CANVAS_WIDTH - 20) {
      // Player scores
      this.playerScore++;
      championAudio.playTone(880, 'triangle', 0.25, 0.12, 100);
      this.resetServe(1);
    }

    // Check Match Winner
    if (this.playerScore >= this.targetPoints) {
      this.winner = 'player';
      championAudio.playScrollWin();
    } else if (this.tenguScore >= this.targetPoints) {
      this.winner = 'boss';
      championAudio.playGameOver();
    }

    // Update Particles
    this.effectParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    this.effectParticles = this.effectParticles.filter(p => p.life > 0);
  }

  resetServe(direction) {
    this.ballX = CANVAS_WIDTH / 2;
    this.ballY = CANVAS_HEIGHT / 2;
    this.ballVX = direction * 5.5;
    this.ballVY = (Math.random() - 0.5) * 4;
    this.rallyCount = 0;
  }
}

// ==========================================
// 3. ARCHERY ENGINE (vs YOICHI)
// ==========================================

export class ArcheryEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.arrowsLeft = 10;
    this.score = 0;
    this.wind = (Math.random() * 4 - 2); // Wind force
    this.bowY = CANVAS_HEIGHT / 2;
    this.aimY = CANVAS_HEIGHT / 2;
    this.aimX = 120;
    this.isCharging = false;
    this.chargePower = 0;
    this.activeArrow = null;
    this.targets = [
      { x: 550, y: 150, radius: 45, vy: 1.6, minY: 100, maxY: 400, points: [100, 50, 25, 10] },
      { x: 670, y: 280, radius: 36, vy: -2.2, minY: 80, maxY: 420, points: [150, 80, 40, 20] },
      { x: 740, y: 350, radius: 28, vy: 3.0, minY: 70, maxY: 430, points: [200, 100, 50, 30] }
    ];
    this.hitFeedbacks = [];
    this.winner = null; // 'player' if score >= 600
  }

  update(keys, isMobileShoot = false) {
    if (this.winner !== null && this.arrowsLeft <= 0 && !this.activeArrow) return;

    // Bow vertical aiming
    const aimSpeed = 5;
    if (keys.ArrowUp || keys.KeyW) {
      this.aimY = Math.max(70, this.aimY - aimSpeed);
    }
    if (keys.ArrowDown || keys.KeyS) {
      this.aimY = Math.min(CANVAS_HEIGHT - 70, this.aimY + aimSpeed);
    }

    // Update Targets Movement
    this.targets.forEach(t => {
      t.y += t.vy;
      if (t.y <= t.minY || t.y >= t.maxY) {
        t.vy *= -1;
      }
    });

    // Arrow Charging / Releasing
    const shootKeyDown = keys.Space || isMobileShoot;
    if (shootKeyDown && !this.activeArrow && this.arrowsLeft > 0) {
      this.isCharging = true;
      this.chargePower = Math.min(100, this.chargePower + 2.5);
    } else if (!shootKeyDown && this.isCharging && !this.activeArrow) {
      // Fire Arrow!
      this.isCharging = false;
      this.arrowsLeft--;
      const powerFraction = Math.max(0.4, this.chargePower / 100);
      this.activeArrow = {
        x: this.aimX,
        y: this.aimY,
        vx: 14 * powerFraction,
        vy: (Math.sin(this.aimY / 100) * 0.5) + this.wind * 0.6,
        life: 70
      };
      this.chargePower = 0;
      championAudio.playArrowShoot();
    }

    // Update Active Arrow
    if (this.activeArrow) {
      this.activeArrow.x += this.activeArrow.vx;
      this.activeArrow.y += this.activeArrow.vy;
      this.activeArrow.vy += 0.05; // slight gravity
      this.activeArrow.life--;

      // Check Target Collisions
      for (const t of this.targets) {
        const dist = Math.hypot(this.activeArrow.x - t.x, this.activeArrow.y - t.y);
        if (dist <= t.radius) {
          // Hit Target! Determine ring points
          let hitPoints = 10;
          let ringLabel = '10점';
          if (dist <= t.radius * 0.25) {
            hitPoints = t.points[0];
            ringLabel = '🎯 BULLSEYE 100점!';
          } else if (dist <= t.radius * 0.5) {
            hitPoints = t.points[1];
            ringLabel = '✨ 50점 명중!';
          } else if (dist <= t.radius * 0.75) {
            hitPoints = t.points[2];
            ringLabel = '25점';
          } else {
            hitPoints = t.points[3];
            ringLabel = '10점';
          }

          this.score += hitPoints;
          championAudio.playArrowHit(hitPoints);

          this.hitFeedbacks.push({
            x: this.activeArrow.x,
            y: this.activeArrow.y,
            text: `+${hitPoints} (${ringLabel})`,
            color: hitPoints >= 100 ? '#F59E0B' : '#10B981',
            life: 45
          });

          this.activeArrow = null;
          // Change wind slightly on hit
          this.wind = Number((Math.random() * 4 - 2).toFixed(1));
          break;
        }
      }

      // Arrow Offscreen / Expired
      if (this.activeArrow && (this.activeArrow.x > CANVAS_WIDTH + 20 || this.activeArrow.life <= 0)) {
        this.activeArrow = null;
        this.wind = Number((Math.random() * 4 - 2).toFixed(1));
      }
    }

    // End of match evaluation
    if (this.arrowsLeft <= 0 && !this.activeArrow && this.winner === null) {
      if (this.score >= 500) {
        this.winner = 'player';
        championAudio.playScrollWin();
      } else {
        this.winner = 'boss';
        championAudio.playGameOver();
      }
    }

    // Update Hit Feedbacks
    this.hitFeedbacks.forEach(f => {
      f.y -= 0.8;
      f.life--;
    });
    this.hitFeedbacks = this.hitFeedbacks.filter(f => f.life > 0);
  }
}

// ==========================================
// 4. MARATHON ENGINE (vs KAPPA)
// ==========================================

export class MarathonEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.playerLaneY = CANVAS_HEIGHT / 2; // Y position
    this.kappaLaneY = CANVAS_HEIGHT / 2 + 50;
    this.distance = 0; // 0 to 1000 meters
    this.targetDistance = 1000;
    this.playerSpeed = 4.5;
    this.kappaSpeed = 4.6;
    this.stamina = 100;
    this.boostTimer = 0;
    this.obstacles = [];
    this.items = [];
    this.score = 0;
    this.winner = null;
    this.spawnTimer = 0;
  }

  update(keys, isMobileDash = false) {
    if (this.winner) return;

    // Player Lane Control (Up / Down)
    const laneSpeed = 6;
    if (keys.ArrowUp || keys.KeyW) {
      this.playerLaneY = Math.max(120, this.playerLaneY - laneSpeed);
    }
    if (keys.ArrowDown || keys.KeyS) {
      this.playerLaneY = Math.min(CANVAS_HEIGHT - 120, this.playerLaneY + laneSpeed);
    }

    // Dash / Sprint (Space / Mobile Dash)
    const isDashing = (keys.Space || isMobileDash) && this.stamina > 10;
    if (isDashing) {
      this.stamina = Math.max(0, this.stamina - 0.7);
      this.playerSpeed = 6.8;
    } else {
      this.stamina = Math.min(100, this.stamina + 0.3);
      this.playerSpeed = this.boostTimer > 0 ? 7.5 : 4.5;
    }

    if (this.boostTimer > 0) this.boostTimer--;

    // Progress distance
    this.distance += this.playerSpeed * 0.35;
    this.score = Math.floor(this.distance * 1.5) + (this.boostTimer > 0 ? 50 : 0);

    // Kappa AI movement
    this.kappaLaneY += (Math.sin(Date.now() / 400) * 1.5);
    this.kappaLaneY = Math.max(130, Math.min(CANVAS_HEIGHT - 130, this.kappaLaneY));

    // Spawn Obstacles (Crabs 🦀, Water puddles 🌊) & Items (Watermelon 🍉)
    this.spawnTimer++;
    if (this.spawnTimer > 45) {
      this.spawnTimer = 0;
      const type = Math.random() < 0.35 ? 'boost' : (Math.random() < 0.5 ? 'crab' : 'puddle');
      const obj = {
        x: CANVAS_WIDTH + 50,
        y: 120 + Math.random() * (CANVAS_HEIGHT - 240),
        type,
        radius: type === 'boost' ? 18 : 22,
        vx: -(this.playerSpeed + 3)
      };
      if (type === 'boost') {
        this.items.push(obj);
      } else {
        this.obstacles.push(obj);
      }
    }

    // Move Obstacles & Collide with Player (Player X is fixed at 150)
    const playerX = 150;
    this.obstacles.forEach(obs => {
      obs.x += obs.vx;
      const dist = Math.hypot(playerX - obs.x, this.playerLaneY - obs.y);
      if (dist < 28) {
        // Hit Obstacle: Slow down player & drain stamina
        this.stamina = Math.max(0, this.stamina - 20);
        this.playerSpeed = 2.0;
        obs.x = -100; // remove
        championAudio.playSplash();
      }
    });
    this.obstacles = this.obstacles.filter(obs => obs.x > -50);

    // Move Items & Collect
    this.items.forEach(it => {
      it.x += it.vx;
      const dist = Math.hypot(playerX - it.x, this.playerLaneY - it.y);
      if (dist < 28) {
        // Collect Watermelon Boost!
        this.boostTimer = 120;
        this.stamina = 100;
        this.score += 150;
        it.x = -100;
        championAudio.playBoost();
      }
    });
    this.items = this.items.filter(it => it.x > -50);

    // Finish Line Reached
    if (this.distance >= this.targetDistance) {
      this.score += 800;
      this.winner = 'player';
      championAudio.playScrollWin();
    }
  }
}

// ==========================================
// 5. CLIMBING ENGINE (vs FUKURO)
// ==========================================

export class ClimbingEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.playerX = CANVAS_WIDTH / 2;
    this.playerY = CANVAS_HEIGHT - 80;
    this.altitude = 0; // 0 to 500 meters
    this.targetAltitude = 500;
    this.stamina = 100;
    this.score = 0;
    this.holds = [];
    this.fallingRocks = [];
    this.currentHold = null;
    this.isLeaping = false;
    this.leapVX = 0;
    this.leapVY = 0;
    this.winner = null;

    // Generate initial climbing holds
    for (let y = CANVAS_HEIGHT - 60; y > -1000; y -= 55) {
      this.holds.push({
        x: 180 + Math.random() * (CANVAS_WIDTH - 360),
        y,
        radius: 18,
        color: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'][Math.floor(Math.random() * 4)]
      });
    }
  }

  update(keys, isMobileJump = false) {
    if (this.winner) return;

    // Movement while on hold / ground
    const climbSpeed = 3.5;
    if (keys.ArrowLeft || keys.KeyA) {
      this.playerX = Math.max(140, this.playerX - climbSpeed);
    }
    if (keys.ArrowRight || keys.KeyD) {
      this.playerX = Math.min(CANVAS_WIDTH - 140, this.playerX + climbSpeed);
    }

    // Jump / Leap to next Hold (Space or Up key or Mobile Jump)
    if ((keys.Space || keys.ArrowUp || keys.KeyW || isMobileJump) && !this.isLeaping && this.stamina > 5) {
      this.isLeaping = true;
      this.leapVY = -8.5;
      this.stamina = Math.max(0, this.stamina - 4);
      championAudio.playClimbGrab();
    }

    // Leap Physics
    if (this.isLeaping) {
      this.playerY += this.leapVY;
      this.leapVY += 0.35; // Gravity

      // Check if grabbed any hold
      for (const hold of this.holds) {
        const dist = Math.hypot(this.playerX - hold.x, this.playerY - hold.y);
        if (dist < 26 && this.leapVY > 0) {
          // Grabbed hold!
          this.playerY = hold.y;
          this.playerX = hold.x;
          this.isLeaping = false;
          this.leapVY = 0;
          this.altitude += 25;
          this.score += 80;
          championAudio.playClimbGrab();

          // Scroll camera down so player stays near bottom-center
          const scrollAmount = 55;
          this.holds.forEach(h => h.y += scrollAmount);
          this.fallingRocks.forEach(r => r.y += scrollAmount);

          // Add top new hold
          this.holds.push({
            x: 180 + Math.random() * (CANVAS_WIDTH - 360),
            y: -60,
            radius: 18,
            color: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444'][Math.floor(Math.random() * 4)]
          });
          break;
        }
      }

      // Fell below screen
      if (this.playerY > CANVAS_HEIGHT - 40) {
        this.playerY = CANVAS_HEIGHT - 40;
        this.isLeaping = false;
        this.leapVY = 0;
      }
    }

    // Spawn falling snowballs / rocks
    if (Math.random() < 0.04) {
      this.fallingRocks.push({
        x: 150 + Math.random() * (CANVAS_WIDTH - 300),
        y: -30,
        radius: 16,
        vy: 4.5 + Math.random() * 3
      });
    }

    // Update rocks
    this.fallingRocks.forEach(rock => {
      rock.y += rock.vy;
      const dist = Math.hypot(this.playerX - rock.x, this.playerY - rock.y);
      if (dist < 26) {
        // Hit by rock! Knockback and stamina loss
        this.stamina = Math.max(0, this.stamina - 30);
        this.playerY = Math.min(CANVAS_HEIGHT - 40, this.playerY + 40);
        this.isLeaping = false;
        rock.y = CANVAS_HEIGHT + 100;
        championAudio.playRockHit();
      }
    });
    this.fallingRocks = this.fallingRocks.filter(r => r.y < CANVAS_HEIGHT + 50);

    // Natural stamina recovery
    this.stamina = Math.min(100, this.stamina + 0.15);

    // Peak reached
    if (this.altitude >= this.targetAltitude) {
      this.score += 1000;
      this.winner = 'player';
      championAudio.playScrollWin();
    }
  }
}
