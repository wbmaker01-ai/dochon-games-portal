// Core Logic & Canvas Drawing Engine for Dochon Pony Express
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LANES,
  STAGES,
  OBSTACLE_TYPES,
  ITEM_TYPES,
  GAME_SPEED_BASE,
  JUMP_DURATION_FRAMES,
  JUMP_HEIGHT_MAX,
  TOTAL_LETTERS
} from './ponyConstants';
import { ponyAudio } from './ponyAudio';

export class PonyGameLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.player = {
      x: 140,
      lane: 1, // Start at Middle Lane
      y: LANES[1].y,
      targetY: LANES[1].y,
      width: 70,
      height: 60,
      isJumping: false,
      jumpTimer: 0,
      jumpOffset: 0,
      hitStun: 0,
      speedBoost: 0,
      animFrame: 0,
      animTimer: 0
    };

    this.stageIndex = 0;
    this.currentStage = STAGES[0];
    this.collectedLetters = 0;
    this.spawnedLetters = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hits = 0;
    this.gameDistance = 0;
    this.isGoalReached = false;
    this.goalTimer = 0;

    this.items = [];
    this.obstacles = [];
    this.particles = [];
    this.clouds = this.initClouds();
    this.scenery = [];
    this.tumbleweeds = [];

    this.spawnTimer = 0;
    this.nextSpawnDistance = 60;
    this.townSpawned = false;
  }

  initClouds() {
    const clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 25 + Math.random() * 60,
        speed: 0.4 + Math.random() * 0.5,
        scale: 0.6 + Math.random() * 0.7,
        alpha: 0.5 + Math.random() * 0.4
      });
    }
    return clouds;
  }

  // Controls: Change Lane
  moveUp() {
    if (this.player.lane > 0) {
      this.player.lane--;
      this.player.targetY = LANES[this.player.lane].y;
      ponyAudio.playLaneChange();
    }
  }

  moveDown() {
    if (this.player.lane < LANES.length - 1) {
      this.player.lane++;
      this.player.targetY = LANES[this.player.lane].y;
      ponyAudio.playLaneChange();
    }
  }

  setLane(laneIndex) {
    if (laneIndex >= 0 && laneIndex < LANES.length && laneIndex !== this.player.lane) {
      this.player.lane = laneIndex;
      this.player.targetY = LANES[this.player.lane].y;
      ponyAudio.playLaneChange();
    }
  }

  jump() {
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.jumpTimer = JUMP_DURATION_FRAMES;
      ponyAudio.playJump();
    }
  }

  // Update Game Physics & State
  update(dt = 16.66) {
    const timeScale = Math.min(2.5, Math.max(0.2, dt / 16.666));

    // Current Speed based on boost & hit stun
    let speed = GAME_SPEED_BASE;
    if (this.player.speedBoost > 0) {
      this.player.speedBoost -= 1 * timeScale;
      speed *= 1.35;
    }
    if (this.player.hitStun > 0) {
      this.player.hitStun -= 1 * timeScale;
      speed *= 0.65;
    }

    const scaledSpeed = speed * timeScale;

    if (this.isGoalReached) {
      this.goalTimer += 1 * timeScale;
      this.updateParticles(timeScale);
      // Player slowly gallops into the town
      this.player.x = Math.min(CANVAS_WIDTH * 0.65, this.player.x + 2.5 * timeScale);
      return;
    }

    this.gameDistance += scaledSpeed;

    // 1. Player Jump & Lane Interpolation
    this.player.y += (this.player.targetY - this.player.y) * Math.min(1, 0.22 * timeScale);

    if (this.player.isJumping) {
      this.player.jumpTimer -= 1 * timeScale;
      const progress = 1 - Math.max(0, this.player.jumpTimer) / JUMP_DURATION_FRAMES;
      this.player.jumpOffset = Math.sin(progress * Math.PI) * JUMP_HEIGHT_MAX;
      if (this.player.jumpTimer <= 0) {
        this.player.isJumping = false;
        this.player.jumpOffset = 0;
      }
    } else {
      this.player.jumpOffset = 0;
    }

    // Horse Running Animation
    this.player.animTimer += scaledSpeed * 0.12;
    if (this.player.animTimer >= 1) {
      this.player.animTimer = 0;
      this.player.animFrame = (this.player.animFrame + 1) % 4;
      if (!this.player.isJumping) {
        ponyAudio.playGallop();
      }
    }

    // Hoof Dust Particles
    if (!this.player.isJumping && Math.random() < 0.35 * timeScale) {
      this.particles.push({
        x: this.player.x - 28,
        y: this.player.y + 22,
        vx: -speed * 0.7 - Math.random() * 1.5,
        vy: -0.5 - Math.random() * 1.0,
        size: 3 + Math.random() * 4,
        color: this.currentStage.theme === 'snow' ? '#E2E8F0' : '#D97706',
        alpha: 0.6,
        life: 20
      });
    }

    // 2. Stage Progression (Based on spawned/collected letters)
    const prevStage = this.stageIndex;
    if (this.spawnedLetters >= 65) {
      this.stageIndex = 2;
    } else if (this.spawnedLetters >= 30) {
      this.stageIndex = 1;
    } else {
      this.stageIndex = 0;
    }
    this.currentStage = STAGES[this.stageIndex];

    if (this.stageIndex !== prevStage) {
      ponyAudio.playStageClear();
    }

    // 3. Spawner System
    this.spawnTimer += scaledSpeed;
    if (this.spawnTimer >= this.nextSpawnDistance && this.spawnedLetters < TOTAL_LETTERS) {
      this.spawnTimer = 0;
      this.nextSpawnDistance = 110 + Math.random() * 70;
      this.spawnWave();
    }

    // Check Goal Condition (All 100 letters spawned and left screen or collected)
    if (this.spawnedLetters >= TOTAL_LETTERS && this.items.length === 0 && !this.townSpawned) {
      this.townSpawned = true;
      this.scenery.push({
        type: 'TOWN_GOAL',
        x: CANVAS_WIDTH + 80,
        y: 110,
        width: 320,
        height: 280
      });
    }

    // 4. Update Scenery & Parallax
    this.updateScenery(scaledSpeed);

    // 5. Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.x -= scaledSpeed;

      // Collision Check with Player
      if (Math.abs(it.x - this.player.x) < 40 && it.lane === this.player.lane) {
        // Collect Item!
        if (it.type === 'LETTER' || it.type === 'GOLD_LETTER') {
          this.collectedLetters++;
          this.combo++;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;

          const comboBonus = Math.min(this.combo * 2, 20);
          const earned = it.score + comboBonus;
          this.score += earned;

          if (it.type === 'GOLD_LETTER') {
            ponyAudio.playGoldLetterPickup();
          } else {
            ponyAudio.playLetterPickup();
          }

          // Sparkle particles
          this.createSparkles(it.x, it.y, it.type === 'GOLD_LETTER' ? '#FBBF24' : '#60A5FA', earned);
        } else if (it.type === 'CARROT') {
          this.player.speedBoost = 180;
          this.score += it.score;
          ponyAudio.playCarrot();
          this.createSparkles(it.x, it.y, '#FB923C', it.score);
        }

        this.items.splice(i, 1);
        continue;
      }

      // Despawn if off screen
      if (it.x < -60) {
        if (it.type === 'LETTER' || it.type === 'GOLD_LETTER') {
          this.combo = 0; // Missed a letter breaks combo
        }
        this.items.splice(i, 1);
      }
    }

    // 6. Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i];
      ob.x -= scaledSpeed;

      // Check collision
      const xDiff = Math.abs(ob.x - this.player.x);
      const isSameLane = ob.lane === this.player.lane;
      const isHit = xDiff < 38 && isSameLane;

      if (isHit && this.player.hitStun <= 0) {
        // Can we jump over?
        const isJumpingOver = this.player.isJumping && this.player.jumpOffset > 24 && ob.canJumpOver;

        if (!isJumpingOver) {
          // Obstacle Hit!
          this.player.hitStun = 50;
          this.hits++;
          this.combo = 0;
          this.score = Math.max(0, this.score - ob.penalty);
          ponyAudio.playHit();
          this.createHitStars(this.player.x, this.player.y, `-${ob.penalty}`);
        }
      }

      if (ob.x < -80) {
        this.obstacles.splice(i, 1);
      }
    }

    // 7. Update Scenery End of Goal
    const town = this.scenery.find(s => s.type === 'TOWN_GOAL');
    if (town && town.x <= this.player.x - 30) {
      if (!this.isGoalReached) {
        this.isGoalReached = true;
        this.goalTimer = 0;
        ponyAudio.playGoalFanfare();
      }
    }

    // 8. Update Particles
    this.updateParticles(timeScale);
  }

  // Spawn Waves (Letters & Obstacles)
  spawnWave() {
    const stage = this.currentStage;
    const availableLanes = [0, 1, 2];

    // Pick Letter Lane
    const letterLaneIdx = Math.floor(Math.random() * availableLanes.length);
    const letterLane = availableLanes.splice(letterLaneIdx, 1)[0];

    this.spawnedLetters++;
    const isGold = this.spawnedLetters % 10 === 0 || Math.random() < 0.12;

    this.items.push({
      type: isGold ? 'GOLD_LETTER' : 'LETTER',
      score: isGold ? ITEM_TYPES.GOLD_LETTER.score : ITEM_TYPES.LETTER.score,
      lane: letterLane,
      x: CANVAS_WIDTH + 40,
      y: LANES[letterLane].y,
      animTimer: 0
    });

    // Occasional Carrot Powerup on another lane
    if (Math.random() < 0.08 && availableLanes.length > 0) {
      const carrotLaneIdx = Math.floor(Math.random() * availableLanes.length);
      const carrotLane = availableLanes.splice(carrotLaneIdx, 1)[0];
      this.items.push({
        type: 'CARROT',
        score: ITEM_TYPES.CARROT.score,
        lane: carrotLane,
        x: CANVAS_WIDTH + 80,
        y: LANES[carrotLane].y,
        animTimer: 0
      });
    }

    // Spawn Obstacles (Always keep at least 1 lane safe or jumpable)
    if (Math.random() < 0.65 && availableLanes.length > 0) {
      const obsLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      let obType = OBSTACLE_TYPES.CACTUS;

      if (stage.theme === 'desert') {
        obType = Math.random() < 0.6 ? OBSTACLE_TYPES.CACTUS : OBSTACLE_TYPES.ROCK;
      } else if (stage.theme === 'canyon') {
        const r = Math.random();
        obType = r < 0.4 ? OBSTACLE_TYPES.PUDDLE : (r < 0.75 ? OBSTACLE_TYPES.FENCE : OBSTACLE_TYPES.ROCK);
      } else if (stage.theme === 'snow') {
        const r = Math.random();
        obType = r < 0.45 ? OBSTACLE_TYPES.SNOWDRIFT : (r < 0.8 ? OBSTACLE_TYPES.BANDIT : OBSTACLE_TYPES.FENCE);
      }

      this.obstacles.push({
        ...obType,
        lane: obsLane,
        x: CANVAS_WIDTH + 60 + Math.random() * 40,
        y: LANES[obsLane].y
      });
    }
  }

  // Update Background & Environment
  updateScenery(speed) {
    // Clouds
    for (const c of this.clouds) {
      c.x -= c.speed * (speed / GAME_SPEED_BASE);
      if (c.x < -120) {
        c.x = CANVAS_WIDTH + 50;
        c.y = 25 + Math.random() * 60;
      }
    }

    // Scenery Elements (Cacti/Rocks in background, telegraph poles, etc.)
    if (Math.random() < 0.04) {
      this.scenery.push({
        type: 'BG_PROP',
        x: CANVAS_WIDTH + 40,
        y: 135 + Math.random() * 20,
        scale: 0.5 + Math.random() * 0.4,
        theme: this.currentStage.theme
      });
    }

    for (let i = this.scenery.length - 1; i >= 0; i--) {
      const s = this.scenery[i];
      if (s.type === 'TOWN_GOAL') {
        s.x -= speed;
        // Check if player reached the town gate
        if (s.x <= this.player.x + 60 && !this.isGoalReached) {
          this.isGoalReached = true;
          ponyAudio.playVictory();
          this.createVictoryConfetti();
        }
      } else {
        s.x -= speed * 0.7;
      }

      if (s.x < -350) {
        this.scenery.splice(i, 1);
      }
    }
  }

  // Particle Generators
  createSparkles(x, y, color, scoreText) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1,
        life: 25
      });
    }

    if (scoreText) {
      this.particles.push({
        x,
        y: y - 15,
        vx: 0,
        vy: -1.4,
        text: `+${scoreText}`,
        color: '#FDE047',
        alpha: 1,
        life: 35
      });
    }
  }

  createHitStars(x, y, penaltyText) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y: y - 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 4,
        color: '#EF4444',
        alpha: 1,
        life: 20
      });
    }

    if (penaltyText) {
      this.particles.push({
        x,
        y: y - 25,
        vx: 0,
        vy: -1.2,
        text: penaltyText,
        color: '#EF4444',
        alpha: 1,
        life: 35
      });
    }
  }

  createVictoryConfetti() {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FDE047'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: CANVAS_WIDTH * 0.6 + (Math.random() - 0.5) * 200,
        y: 100 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 8,
        vy: -4 - Math.random() * 6,
        gravity: 0.18,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 90
      });
    }
  }

  updateParticles(timeScale = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx || 0) * timeScale;
      p.y += (p.vy || 0) * timeScale;
      if (p.gravity) p.vy += p.gravity * timeScale;
      p.life -= 1 * timeScale;
      p.alpha = p.life / 35;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ----------------------------------------------------
  // DRAW METHODS (Canvas 2D Vector Rendering)
  // ----------------------------------------------------
  draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Sky & Background Mountains
    this.drawBackground(ctx);

    // 2. Road Lanes & Ground
    this.drawRoad(ctx);

    // 3. Scenery Props (Props, Town, etc.)
    this.drawScenery(ctx);

    // 4. Obstacles & Items (Y-sorted for proper layering)
    const renderEntities = [
      ...this.items.map(it => ({ type: 'ITEM', item: it, y: it.y })),
      ...this.obstacles.map(ob => ({ type: 'OBSTACLE', ob, y: ob.y })),
      {
        type: 'PLAYER',
        y: this.player.y - this.player.jumpOffset
      }
    ];

    renderEntities.sort((a, b) => a.y - b.y);

    for (const ent of renderEntities) {
      if (ent.type === 'ITEM') {
        this.drawItem(ctx, ent.item);
      } else if (ent.type === 'OBSTACLE') {
        this.drawObstacle(ctx, ent.ob);
      } else if (ent.type === 'PLAYER') {
        this.drawPlayer(ctx);
      }
    }

    // 5. Particles & Text
    this.drawParticles(ctx);
  }

  // Draw Background Sky & Horizon
  drawBackground(ctx) {
    const stage = this.currentStage;
    const sky = stage.skyGradient || stage.skyColors || ['#F59E0B', '#FDE68A', '#FEF3C7'];

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
    if (sky.length >= 3) {
      skyGrad.addColorStop(0, sky[0]);
      skyGrad.addColorStop(0.5, sky[1]);
      skyGrad.addColorStop(1, sky[2]);
    } else {
      skyGrad.addColorStop(0, sky[0]);
      skyGrad.addColorStop(1, sky[1] || sky[0]);
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 180);

    // Sun / Moon in sky
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 90, 50, 26, 0, Math.PI * 2);
    ctx.fillStyle = stage.theme === 'snow' ? '#F8FAFC' : '#FDE047';
    ctx.fill();
    ctx.restore();

    // Distant Mountains / Mesas (Parallax)
    ctx.fillStyle = stage.theme === 'desert' ? '#D97706' : (stage.theme === 'canyon' ? '#7F1D1D' : '#3B82F6');
    ctx.beginPath();
    ctx.moveTo(0, 160);
    const mountainOffsets = [
      [0, 130], [90, 85], [180, 140], [270, 75], [380, 145],
      [490, 90], [600, 135], [700, 80], [800, 140]
    ];
    for (const pt of mountainOffsets) {
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.lineTo(CANVAS_WIDTH, 160);
    ctx.closePath();
    ctx.fill();

    // Clouds
    for (const c of this.clouds) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 18 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 14 * c.scale, c.y - 6 * c.scale, 22 * c.scale, 0, Math.PI * 2);
      ctx.arc(c.x + 30 * c.scale, c.y, 16 * c.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3-Lane Road & Ground
  drawRoad(ctx) {
    const stage = this.currentStage;

    // Ground Base
    ctx.fillStyle = stage.groundColor;
    ctx.fillRect(0, 150, CANVAS_WIDTH, CANVAS_HEIGHT - 150);

    // Main 3-Lane Trail Road
    ctx.fillStyle = stage.roadColor;
    ctx.fillRect(0, 160, CANVAS_WIDTH, 260);

    // Lane Dividers (Dashed Western lines)
    ctx.strokeStyle = stage.roadLineColor;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([16, 14]);
    ctx.lineDashOffset = -this.gameDistance * 0.8;

    // Divider 1 (Between Lane 0 and 1)
    ctx.beginPath();
    ctx.moveTo(0, 238);
    ctx.lineTo(CANVAS_WIDTH, 238);
    ctx.stroke();

    // Divider 2 (Between Lane 1 and 2)
    ctx.beginPath();
    ctx.moveTo(0, 322);
    ctx.lineTo(CANVAS_WIDTH, 322);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
  }

  // Scenery & Town Goal
  drawScenery(ctx) {
    for (const s of this.scenery) {
      if (s.type === 'TOWN_GOAL') {
        this.drawTownGoal(ctx, s);
      } else if (s.type === 'BG_PROP') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(s.scale, s.scale);
        if (s.theme === 'desert') {
          // Small distant cactus
          ctx.fillStyle = '#065F46';
          ctx.fillRect(-4, -20, 8, 20);
          ctx.fillRect(-12, -14, 8, 4);
          ctx.fillRect(-12, -18, 4, 6);
        } else if (s.theme === 'canyon') {
          // Rock formation
          ctx.fillStyle = '#991B1B';
          ctx.beginPath();
          ctx.arc(0, 0, 14, Math.PI, 0);
          ctx.fill();
        } else {
          // Pine tree in snow
          ctx.fillStyle = '#064E3B';
          ctx.beginPath();
          ctx.moveTo(0, -28);
          ctx.lineTo(14, 0);
          ctx.lineTo(-14, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  drawTownGoal(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);

    // Saloon / Post Office Wooden Building
    ctx.fillStyle = '#78350F';
    ctx.fillRect(0, 0, 260, 220);

    // Roof Triangle
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(130, -50);
    ctx.lineTo(280, 0);
    ctx.closePath();
    ctx.fill();

    // Saloon / Post Office Signboard
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 3;
    ctx.fillRect(30, 20, 200, 42);
    ctx.strokeRect(30, 20, 200, 42);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOCHON EXPRESS', 130, 47);

    // Wooden Balcony & Windows
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(40, 80, 40, 40);
    ctx.fillRect(180, 80, 40, 40);

    // Doorway
    ctx.fillStyle = '#292524';
    ctx.fillRect(100, 130, 60, 90);

    // Welcome Banner & Finish Line Ribbon across the road
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-15, 60, 30, 160);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(-15, 60, 30, 160);

    ctx.restore();
  }

  // Player (Horse & Rider) Canvas Drawing
  drawPlayer(ctx) {
    const p = this.player;
    const px = p.x;
    const py = p.y - p.jumpOffset;
    const frame = p.animFrame;
    const isBlinking = p.hitStun > 0 && Math.floor(p.hitStun / 4) % 2 === 0;

    if (isBlinking) return; // Blinking effect on hit

    ctx.save();
    ctx.translate(px, py);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 24 + p.jumpOffset * 0.4, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Horse Body
    ctx.fillStyle = '#854D0E'; // Chestnut brown horse

    // Horse Main Torso
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 16, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Horse Neck & Head
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(24, -26);
    ctx.lineTo(34, -20);
    ctx.lineTo(22, 6);
    ctx.closePath();
    ctx.fill();

    // Horse Head Muzzle
    ctx.beginPath();
    ctx.ellipse(32, -22, 10, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Horse Mane (Black/Dark Brown)
    ctx.fillStyle = '#3F200A';
    ctx.beginPath();
    ctx.moveTo(18, -26);
    ctx.lineTo(12, -10);
    ctx.lineTo(6, -6);
    ctx.lineTo(12, -20);
    ctx.closePath();
    ctx.fill();

    // Horse Ears
    ctx.fillStyle = '#854D0E';
    ctx.beginPath();
    ctx.moveTo(22, -30);
    ctx.lineTo(26, -37);
    ctx.lineTo(28, -28);
    ctx.closePath();
    ctx.fill();

    // Horse Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(31, -24, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Horse Tail (Waving)
    ctx.strokeStyle = '#3F200A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    const tailWave = Math.sin(frame * Math.PI * 0.5) * 6;
    ctx.quadraticCurveTo(-36, -8 + tailWave, -40, 8 + tailWave);
    ctx.stroke();

    // Horse Legs (Running 4-Frame cycle)
    ctx.fillStyle = '#713F12';
    const legOffsets = [
      { fL: 8, fR: -10, bL: -12, bR: 8 },
      { fL: -6, fR: 12, bL: 10, bR: -10 },
      { fL: -12, fR: 6, bL: 8, bR: -8 },
      { fL: 12, fR: -8, bL: -10, bR: 12 }
    ][frame];

    // Back Legs
    ctx.fillRect(-18 + legOffsets.bL * 0.7, 8, 5, 16);
    ctx.fillRect(-10 + legOffsets.bR * 0.7, 8, 5, 16);

    // Front Legs
    ctx.fillRect(10 + legOffsets.fL * 0.7, 8, 5, 16);
    ctx.fillRect(18 + legOffsets.fR * 0.7, 8, 5, 16);

    // 2. Saddle & Mailbag (Pony Express Satchel)
    ctx.fillStyle = '#374151'; // Saddle blanket
    ctx.fillRect(-10, -6, 20, 6);

    // Iconic Leather Mail Satchel (Mochila)
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.roundRect(-14, -2, 22, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mailbag Stamp/Star
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✉', -3, 8);

    // 3. Cowboy Rider
    // Blue Jeans Pants
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(-4, -14, 8, 12);

    // Red Plaid Shirt
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(0, -22, 7, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Face / Head
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.arc(4, -32, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cowboy Hat (Brown wide brim)
    ctx.fillStyle = '#78350F';
    // Hat Brim
    ctx.beginPath();
    ctx.ellipse(4, -36, 15, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Hat Top Crown
    ctx.fillRect(-2, -44, 12, 9);

    // Reins / Bridle (가죽 고삐)
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(2, -20);
    ctx.lineTo(30, -18);
    ctx.stroke();

    // Speed Boost Flame Aura
    if (p.speedBoost > 0) {
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -10, 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Items (Letters, Gold Letters, Carrots)
  drawItem(ctx, it) {
    ctx.save();
    ctx.translate(it.x, it.y);

    it.animTimer = (it.animTimer || 0) + 0.1;
    const floatY = Math.sin(it.animTimer) * 4;

    if (it.type === 'LETTER') {
      // White Mail Envelope
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.fillRect(-16, -11 + floatY, 32, 22);
      ctx.strokeRect(-16, -11 + floatY, 32, 22);

      // Flap & Red Wax Seal
      ctx.strokeStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(-16, -11 + floatY);
      ctx.lineTo(0, 2 + floatY);
      ctx.lineTo(16, -11 + floatY);
      ctx.stroke();

      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(0, 1 + floatY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (it.type === 'GOLD_LETTER') {
      // Golden Glowing Envelope
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-18, -13 + floatY, 36, 26);
      ctx.strokeRect(-18, -13 + floatY, 36, 26);

      ctx.strokeStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(-18, -13 + floatY);
      ctx.lineTo(0, 3 + floatY);
      ctx.lineTo(18, -13 + floatY);
      ctx.stroke();

      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.arc(0, 2 + floatY, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (it.type === 'CARROT') {
      // Carrot
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(10, 8 + floatY);
      ctx.lineTo(-10, -8 + floatY);
      ctx.lineTo(-6, -12 + floatY);
      ctx.closePath();
      ctx.fill();

      // Green Leaves
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(-10, -10 + floatY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Obstacles
  drawObstacle(ctx, ob) {
    ctx.save();
    ctx.translate(ob.x, ob.y);

    if (ob.type === 'CACTUS') {
      // Saguaro Cactus
      ctx.fillStyle = '#059669';
      // Main Stem
      ctx.fillRect(-6, -26, 12, 44);
      // Left Arm
      ctx.fillRect(-16, -14, 10, 6);
      ctx.fillRect(-16, -24, 6, 12);
      // Right Arm
      ctx.fillRect(6, -8, 10, 6);
      ctx.fillRect(10, -18, 6, 12);
    } else if (ob.type === 'ROCK') {
      // Boulder
      ctx.fillStyle = '#78716C';
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A8A29E';
      ctx.beginPath();
      ctx.ellipse(-4, 0, 10, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (ob.type === 'PUDDLE') {
      // Water Puddle
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.ellipse(0, 10, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#60A5FA';
      ctx.beginPath();
      ctx.ellipse(4, 8, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (ob.type === 'FENCE') {
      // Wooden Fence
      ctx.fillStyle = '#854D0E';
      ctx.fillRect(-18, -16, 6, 32);
      ctx.fillRect(12, -16, 6, 32);
      ctx.fillRect(-22, -8, 44, 6);
      ctx.fillRect(-22, 4, 44, 6);
    } else if (ob.type === 'SNOWDRIFT') {
      // Snow Drift
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.ellipse(0, 8, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(-4, 6, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (ob.type === 'BANDIT') {
      // Bandit with mask
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-10, -20, 20, 36);
      // Face & Mask
      ctx.fillStyle = '#FCA5A5';
      ctx.fillRect(-7, -18, 14, 10);
      ctx.fillStyle = '#000000'; // Black eye mask
      ctx.fillRect(-8, -16, 16, 5);
      // Hat
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-14, -25, 28, 5);
      ctx.fillRect(-8, -32, 16, 8);
    }

    ctx.restore();
  }

  // Draw Particles & Floating Texts
  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.text) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
