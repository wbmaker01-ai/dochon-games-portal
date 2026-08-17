// Jerry Lawson 8-Bit Platformer & Level Editor Canvas Engine

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  COLS,
  ROWS,
  TILES,
  PHYSICS,
  SCORE_VALUES,
  STAGE_PRESETS
} from './jerryConstants';
import { jerryAudio } from './jerryAudio';

export class JerryGameLogic {
  constructor() {
    this.stageIndex = 0;
    this.currentMode = 'ADVENTURE'; // 'ADVENTURE' | 'CUSTOM' | 'EDITOR'
    this.score = 0;
    this.coinsCollected = 0;
    this.totalCoinsInLevel = 0;
    this.bugsDefeated = 0;
    this.lives = 3;
    this.timeLeft = 90;
    this.timeAccumulator = 0;
    this.combo = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.isStageCleared = false;

    // Grid Map (ROWS x COLS)
    this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(TILES.EMPTY));

    // Player
    this.player = {
      x: 64,
      y: 384,
      vx: 0,
      vy: 0,
      width: 22,
      height: 28,
      isGrounded: false,
      facingRight: true,
      walkAnim: 0,
      invulnerable: 0,
      dead: false
    };

    // Dynamic Entities
    this.coins = [];
    this.enemies = [];
    this.springs = [];
    this.spikes = [];
    this.goal = { x: 700, y: 100, active: true };
    this.particles = [];
    this.floatingTexts = [];

    // Background Images
    this.bgImages = {};
    this.loadBackgrounds();

    // Init with Stage 1
    this.loadStage(0);
  }

  loadBackgrounds() {
    const labBg = new Image();
    labBg.src = '/assets/jerrylawson/lab_background.jpg';
    this.bgImages.lab = labBg;

    const arcadeBg = new Image();
    arcadeBg.src = '/assets/jerrylawson/arcade_background.jpg';
    this.bgImages.arcade = arcadeBg;
  }

  // Load a Story Preset Stage
  loadStage(stageIdx) {
    this.stageIndex = stageIdx;
    const stage = STAGE_PRESETS[stageIdx % STAGE_PRESETS.length];
    this.timeLeft = stage.timeLimit;
    this.timeAccumulator = 0;
    this.isStageCleared = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.parseMapString(stage.map);
    this.resetPlayerPosition();
  }

  // Load a Custom Map Grid (from Editor)
  loadCustomMap(customGrid) {
    this.currentMode = 'CUSTOM';
    this.timeLeft = 99;
    this.timeAccumulator = 0;
    this.isStageCleared = false;
    this.isGameOver = false;
    this.isVictory = false;

    this.grid = customGrid.map(row => [...row]);
    this.extractEntitiesFromGrid();
    this.resetPlayerPosition();
  }

  resetPlayerPosition() {
    this.player.x = 48;
    this.player.y = 380;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.invulnerable = 60;
    this.player.dead = false;
  }

  // Parse map array of strings
  parseMapString(mapRows) {
    this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(TILES.EMPTY));

    for (let r = 0; r < ROWS && r < mapRows.length; r++) {
      const line = mapRows[r];
      for (let c = 0; c < COLS && c < line.length; c++) {
        const ch = line[c];
        if (ch === 'S') this.grid[r][c] = TILES.SOLID;
        else if (ch === 'P') this.grid[r][c] = TILES.PLATFORM;
        else if (ch === '^') this.grid[r][c] = TILES.SPIKE;
        else if (ch === 'C') this.grid[r][c] = TILES.COIN;
        else if (ch === 'J') this.grid[r][c] = TILES.SPRING;
        else if (ch === 'E') this.grid[r][c] = TILES.ENEMY_BUG;
        else if (ch === 'G') this.grid[r][c] = TILES.GOAL_CARTRIDGE;
        else this.grid[r][c] = TILES.EMPTY;
      }
    }

    this.extractEntitiesFromGrid();
  }

  // Separate static collision tiles from dynamic entities
  extractEntitiesFromGrid() {
    this.coins = [];
    this.enemies = [];
    this.springs = [];
    this.spikes = [];
    this.goal = null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TILES.COIN) {
          this.coins.push({ x: x + 16, y: y + 16, collected: false, bobTick: Math.random() * 10 });
          this.grid[r][c] = TILES.EMPTY;
        } else if (tile === TILES.ENEMY_BUG) {
          this.enemies.push({
            x: x + 4,
            y: y + 8,
            vx: -1.2,
            dir: -1,
            alive: true,
            squishTick: 0,
            animTick: 0
          });
          this.grid[r][c] = TILES.EMPTY;
        } else if (tile === TILES.SPRING) {
          this.springs.push({ x, y, boingTick: 0 });
        } else if (tile === TILES.SPIKE) {
          this.spikes.push({ x, y });
        } else if (tile === TILES.GOAL_CARTRIDGE) {
          this.goal = { x: x + 4, y: y + 2, active: true, floatTick: 0 };
          this.grid[r][c] = TILES.EMPTY;
        }
      }
    }

    this.totalCoinsInLevel = this.coins.length;
  }

  // Reset entire game state
  resetAll() {
    this.score = 0;
    this.coinsCollected = 0;
    this.bugsDefeated = 0;
    this.lives = 3;
    this.combo = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.loadStage(0);
  }

  // Input Handling
  handleInput(inputState) {
    if (this.player.dead || this.isStageCleared || this.isGameOver || this.isVictory) return;

    // Left / Right Movement
    if (inputState.left) {
      this.player.vx = -PHYSICS.WALK_SPEED;
      this.player.facingRight = false;
      this.player.walkAnim += 0.2;
    } else if (inputState.right) {
      this.player.vx = PHYSICS.WALK_SPEED;
      this.player.facingRight = true;
      this.player.walkAnim += 0.2;
    } else {
      this.player.vx *= PHYSICS.FRICTION;
      if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    }

    // Jump (W / Up / Space)
    if (inputState.jump && this.player.isGrounded) {
      this.player.vy = PHYSICS.JUMP_FORCE;
      this.player.isGrounded = false;
      jerryAudio.playJump();
      this.spawnDustParticles(this.player.x + 11, this.player.y + 28);
    }
  }

  // Main 60FPS Update Loop
  update(deltaTime = 0.016) {
    if (this.isGameOver || this.isVictory) {
      this.updateParticles();
      return;
    }

    // Time Countdown
    if (!this.isStageCleared) {
      this.timeAccumulator += deltaTime;
      if (this.timeAccumulator >= 1) {
        this.timeAccumulator -= 1;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        if (this.timeLeft === 0 && !this.player.dead) {
          this.handlePlayerDeath('시간 초과!');
        }
      }
    }

    if (this.player.invulnerable > 0) {
      this.player.invulnerable--;
    }

    // Player Physics Update
    if (!this.player.dead && !this.isStageCleared) {
      this.updatePlayerPhysics();
      this.checkEntityCollisions();
    }

    // Update Enemies
    this.updateEnemies();

    // Update Springs animation
    this.springs.forEach(s => {
      if (s.boingTick > 0) s.boingTick--;
    });

    // Update Particles and Floating Texts
    this.updateParticles();
  }

  updatePlayerPhysics() {
    const p = this.player;

    // Apply Gravity
    p.vy += PHYSICS.GRAVITY;
    if (p.vy > PHYSICS.MAX_FALL_SPEED) p.vy = PHYSICS.MAX_FALL_SPEED;

    // Horizontal Movement & Solid Wall Collision
    p.x += p.vx;
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (p.x + p.width > CANVAS_WIDTH) {
      p.x = CANVAS_WIDTH - p.width;
      p.vx = 0;
    }
    this.resolveHorizontalTileCollisions();

    // Vertical Movement & Tile Collision
    p.isGrounded = false;
    p.y += p.vy;
    this.resolveVerticalTileCollisions();

    // Check Fall out of screen bottom
    if (p.y > CANVAS_HEIGHT + 30) {
      this.handlePlayerDeath('추락!');
    }
  }

  resolveHorizontalTileCollisions() {
    const p = this.player;
    const startCol = Math.floor(p.x / TILE_SIZE);
    const endCol = Math.floor((p.x + p.width) / TILE_SIZE);
    const startRow = Math.floor(p.y / TILE_SIZE);
    const endRow = Math.floor((p.y + p.height - 1) / TILE_SIZE);

    for (let r = Math.max(0, startRow); r <= Math.min(ROWS - 1, endRow); r++) {
      for (let c = Math.max(0, startCol); c <= Math.min(COLS - 1, endCol); c++) {
        if (this.grid[r][c] === TILES.SOLID) {
          if (p.vx > 0) {
            p.x = c * TILE_SIZE - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = (c + 1) * TILE_SIZE;
            p.vx = 0;
          }
        }
      }
    }
  }

  resolveVerticalTileCollisions() {
    const p = this.player;
    const startCol = Math.floor((p.x + 2) / TILE_SIZE);
    const endCol = Math.floor((p.x + p.width - 2) / TILE_SIZE);
    const startRow = Math.floor(p.y / TILE_SIZE);
    const endRow = Math.floor((p.y + p.height) / TILE_SIZE);

    for (let r = Math.max(0, startRow); r <= Math.min(ROWS - 1, endRow); r++) {
      for (let c = Math.max(0, startCol); c <= Math.min(COLS - 1, endCol); c++) {
        const tile = this.grid[r][c];

        // Solid Block Collision
        if (tile === TILES.SOLID) {
          if (p.vy > 0) { // Landing on top
            p.y = r * TILE_SIZE - p.height;
            p.vy = 0;
            p.isGrounded = true;
          } else if (p.vy < 0) { // Hitting ceiling
            p.y = (r + 1) * TILE_SIZE;
            p.vy = 0;
          }
        }
        // One-way Jump-Through Platform Collision (Landing only)
        else if (tile === TILES.PLATFORM) {
          const platformTop = r * TILE_SIZE;
          if (p.vy > 0 && (p.y + p.height - p.vy) <= platformTop + 6 && (p.y + p.height) >= platformTop) {
            p.y = platformTop - p.height;
            p.vy = 0;
            p.isGrounded = true;
          }
        }
      }
    }
  }

  checkEntityCollisions() {
    const p = this.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;

    // 1. Coins Collection
    this.coins.forEach(coin => {
      if (!coin.collected) {
        const dist = Math.hypot(px - coin.x, py - coin.y);
        if (dist < 20) {
          coin.collected = true;
          this.coinsCollected++;
          this.score += SCORE_VALUES.COIN;
          jerryAudio.playCoin();
          this.spawnSparkleParticles(coin.x, coin.y, '#FFD700');
          this.addFloatingText(coin.x, coin.y - 10, `+${SCORE_VALUES.COIN}`, '#FFE600');
        }
      }
    });

    // 2. Spring Bounce
    this.springs.forEach(spring => {
      const springBox = { x: spring.x, y: spring.y + 12, w: TILE_SIZE, h: 20 };
      if (
        p.x + p.width > springBox.x &&
        p.x < springBox.x + springBox.w &&
        p.y + p.height >= springBox.y &&
        p.y + p.height <= springBox.y + 16 &&
        p.vy > 0
      ) {
        p.y = springBox.y - p.height;
        p.vy = PHYSICS.SPRING_FORCE;
        p.isGrounded = false;
        spring.boingTick = 12;
        jerryAudio.playSpring();
        this.spawnDustParticles(spring.x + 16, spring.y + 16, '#00FF66');
        this.addFloatingText(spring.x + 16, spring.y - 12, 'BOING! 🦘', '#00FF66');
      }
    });

    // 3. Spikes Hazard Hit
    this.spikes.forEach(spike => {
      const spikeBox = { x: spike.x + 4, y: spike.y + 12, w: 24, h: 20 };
      if (
        p.x + p.width > spikeBox.x &&
        p.x < spikeBox.x + spikeBox.w &&
        p.y + p.height > spikeBox.y &&
        p.y < spikeBox.y + spikeBox.h
      ) {
        if (p.invulnerable <= 0) {
          this.handlePlayerDeath('스파크 감전!');
        }
      }
    });

    // 4. Enemy Bug Stomp & Damage
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      const bugBox = { x: enemy.x, y: enemy.y, w: 24, h: 20 };

      if (
        p.x + p.width > bugBox.x &&
        p.x < bugBox.x + bugBox.w &&
        p.y + p.height > bugBox.y &&
        p.y < bugBox.y + bugBox.h
      ) {
        // Stomp from above!
        if (p.vy > 0 && p.y + p.height <= bugBox.y + 14) {
          enemy.alive = false;
          enemy.squishTick = 20;
          p.vy = -8.5; // Bounce player up
          this.bugsDefeated++;
          this.combo++;
          const bugPoints = SCORE_VALUES.BUG_STOMP + (this.combo > 1 ? this.combo * SCORE_VALUES.COMBO_MULTIPLIER : 0);
          this.score += bugPoints;
          jerryAudio.playStomp();
          this.spawnSparkleParticles(enemy.x + 12, enemy.y + 10, '#E84545');
          this.addFloatingText(enemy.x + 12, enemy.y - 10, `+${bugPoints} STOMP!`, '#FF6B6B');
        } else if (p.invulnerable <= 0) {
          this.handlePlayerDeath('글리치 버그 접촉!');
        }
      }
    });

    // 5. Goal Cartridge Reached
    if (this.goal && this.goal.active) {
      const goalBox = { x: this.goal.x, y: this.goal.y, w: 24, h: 28 };
      if (
        p.x + p.width > goalBox.x &&
        p.x < goalBox.x + goalBox.w &&
        p.y + p.height > goalBox.y &&
        p.y < goalBox.y + goalBox.h
      ) {
        this.handleStageClear();
      }
    }
  }

  handlePlayerDeath(reason = '피격!') {
    this.player.dead = true;
    this.combo = 0;
    this.lives--;
    jerryAudio.playHurt();
    this.spawnSparkleParticles(this.player.x + 11, this.player.y + 14, '#FF2E63', 25);
    this.addFloatingText(this.player.x + 11, this.player.y - 20, reason, '#FF2E63');

    if (this.lives <= 0) {
      setTimeout(() => {
        this.isGameOver = true;
        jerryAudio.playGameOver();
      }, 700);
    } else {
      setTimeout(() => {
        this.resetPlayerPosition();
      }, 800);
    }
  }

  handleStageClear() {
    this.isStageCleared = true;
    const timeBonus = this.timeLeft * 5;
    const clearBonus = this.currentMode === 'ADVENTURE' ? SCORE_VALUES.STAGE_CLEAR : SCORE_VALUES.CUSTOM_LEVEL_CLEAR;
    this.score += clearBonus + timeBonus;

    jerryAudio.playLevelClear();
    this.spawnConfettiParticles(this.goal.x + 12, this.goal.y + 12);
    this.addFloatingText(this.goal.x + 12, this.goal.y - 25, `🏆 STAGE CLEAR! +${clearBonus + timeBonus}`, '#FFD700');

    // Check if next stage exists in adventure mode
    if (this.currentMode === 'ADVENTURE') {
      if (this.stageIndex + 1 < STAGE_PRESETS.length) {
        setTimeout(() => {
          this.loadStage(this.stageIndex + 1);
        }, 2200);
      } else {
        setTimeout(() => {
          this.isVictory = true;
          this.spawnConfettiParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80);
        }, 2000);
      }
    }
  }

  updateEnemies() {
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      enemy.animTick += 0.15;
      enemy.x += enemy.vx;

      // Check patrol bounds and solid collisions
      const frontX = enemy.vx > 0 ? enemy.x + 24 : enemy.x;
      const col = Math.floor(frontX / TILE_SIZE);
      const row = Math.floor((enemy.y + 10) / TILE_SIZE);
      const floorCol = Math.floor((enemy.x + 12) / TILE_SIZE);
      const floorRow = Math.floor((enemy.y + 24) / TILE_SIZE);

      // Turn around on wall hit or border
      if (
        enemy.x < 0 ||
        enemy.x + 24 > CANVAS_WIDTH ||
        (col >= 0 && col < COLS && row >= 0 && row < ROWS && this.grid[row][col] === TILES.SOLID)
      ) {
        enemy.vx *= -1;
        enemy.dir *= -1;
      }
      // Turn around if no floor ahead
      else if (
        floorRow < ROWS &&
        floorCol >= 0 &&
        floorCol < COLS &&
        this.grid[floorRow][floorCol] === TILES.EMPTY
      ) {
        enemy.vx *= -1;
        enemy.dir *= -1;
      }
    });
  }

  // Particle & FX Helpers
  spawnSparkleParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        life: 25 + Math.random() * 15,
        maxLife: 40
      });
    }
  }

  spawnDustParticles(x, y, color = '#E2E8F0') {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -0.8 - Math.random() * 1.5,
        size: 2 + Math.random() * 2,
        color,
        life: 18,
        maxLife: 18
      });
    }
  }

  spawnConfettiParticles(x, y, count = 50) {
    const colors = ['#FFD700', '#00ADB5', '#FF2E63', '#00FF66', '#FF9A00', '#A855F7'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 4,
        color: colors[i % colors.length],
        life: 45 + Math.random() * 30,
        maxLife: 75
      });
    }
  }

  addFloatingText(x, y, text, color = '#FFFFFF') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      vy: -1.2,
      opacity: 1,
      life: 45
    });
  }

  updateParticles() {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gentle gravity
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      ft.opacity = ft.life / 45;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Canvas Main Renderer
  render(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Background
    this.renderBackground(ctx);

    // 2. Draw Static Tiles (Solid, Platform, Spikes, Springs)
    this.renderTiles(ctx);

    // 3. Draw Dynamic Collectibles (Coins)
    this.renderCoins(ctx);

    // 4. Draw Goal Cartridge
    this.renderGoalCartridge(ctx);

    // 5. Draw Enemies
    this.renderEnemies(ctx);

    // 6. Draw Jerry Lawson Player Character
    if (!this.player.dead || this.player.invulnerable % 6 < 3) {
      this.renderPlayer(ctx);
    }

    // 7. Draw Particles and Floating Texts
    this.renderFX(ctx);
  }

  renderBackground(ctx) {
    const stage = STAGE_PRESETS[this.stageIndex % STAGE_PRESETS.length];
    const isLab = this.stageIndex < 2;
    const bgImg = isLab ? this.bgImages.lab : this.bgImages.arcade;

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(10, 15, 30, 0.45)'; // Semi-transparent contrast tint
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback Cyber Retro Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#101528');
      grad.addColorStop(1, '#050711');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Subtle 8-Bit Scanline / Pixel Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  renderTiles(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TILES.SOLID) {
          // 8-Bit Retro Woodgrain / Circuit Solid Brick
          ctx.fillStyle = '#654321';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#8B5A2B';
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.fillStyle = '#A0522D';
          ctx.fillRect(x + 4, y + 4, 10, 10);
          ctx.fillRect(x + 18, y + 18, 10, 10);
          ctx.strokeStyle = '#3E2723';
          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.PLATFORM) {
          // Glowing Circuit Semisolid Platform
          ctx.fillStyle = '#00ADB5';
          ctx.fillRect(x, y, TILE_SIZE, 8);
          ctx.fillStyle = '#00FFF5';
          ctx.fillRect(x + 4, y + 2, TILE_SIZE - 8, 3);
          ctx.fillStyle = '#EEEEEE';
          ctx.fillRect(x + 6, y + 10, 4, 4);
          ctx.fillRect(x + 22, y + 10, 4, 4);
        } else if (tile === TILES.SPIKE) {
          // Sparking High-Voltage Danger Spikes
          ctx.fillStyle = '#FF2E63';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + TILE_SIZE);
          ctx.lineTo(x + 10, y + 8);
          ctx.lineTo(x + 16, y + TILE_SIZE);
          ctx.lineTo(x + 22, y + 8);
          ctx.lineTo(x + 28, y + TILE_SIZE);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
        }
      }
    }

    // Springs
    this.springs.forEach(spring => {
      const isCompressed = spring.boingTick > 0;
      const sy = isCompressed ? spring.y + 18 : spring.y + 10;
      const sh = isCompressed ? 14 : 22;

      // Base
      ctx.fillStyle = '#4A5568';
      ctx.fillRect(spring.x + 2, spring.y + 24, 28, 8);
      // Coiled Spring (Green)
      ctx.fillStyle = '#00FF66';
      ctx.fillRect(spring.x + 6, sy, 20, 4);
      ctx.fillRect(spring.x + 10, sy + 6, 12, 4);
      // Top Cap
      ctx.fillStyle = '#10B981';
      ctx.fillRect(spring.x + 4, sy - 2, 24, 5);
    });
  }

  renderCoins(ctx) {
    const time = Date.now() * 0.005;
    this.coins.forEach(coin => {
      if (coin.collected) return;
      const bob = Math.sin(time + coin.bobTick) * 3;
      const cx = coin.x;
      const cy = coin.y + bob;

      // 8-Bit Gold ROM Cartridge / Chip
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(cx - 8, cy - 10, 16, 20);
      ctx.fillStyle = '#FFA500';
      ctx.fillRect(cx - 6, cy - 8, 12, 16);
      ctx.fillStyle = '#FFF9C4';
      ctx.fillRect(cx - 3, cy - 5, 6, 10);
      ctx.strokeStyle = '#B8860B';
      ctx.strokeRect(cx - 8, cy - 10, 16, 20);
    });
  }

  renderGoalCartridge(ctx) {
    if (!this.goal || !this.goal.active) return;
    const time = Date.now() * 0.004;
    const floatOffset = Math.sin(time) * 4;
    const gx = this.goal.x;
    const gy = this.goal.y + floatOffset;

    // Glowing Aura
    ctx.fillStyle = 'rgba(255, 184, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 14, 24, 0, Math.PI * 2);
    ctx.fill();

    // Fairchild Channel F Yellow Master Cartridge
    ctx.fillStyle = '#FFB800'; // Classic Fairchild Yellow
    ctx.fillRect(gx, gy, 24, 28);
    ctx.fillStyle = '#333333'; // Label Strip
    ctx.fillRect(gx + 2, gy + 6, 20, 12);
    ctx.fillStyle = '#00FF66'; // Label Text
    ctx.font = 'bold 8px monospace';
    ctx.fillText('CH.F', gx + 3, gy + 15);
    // Pin Connectors
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(gx + 4, gy + 26, 16, 3);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gx, gy, 24, 28);
  }

  renderEnemies(ctx) {
    this.enemies.forEach(enemy => {
      if (!enemy.alive) {
        // Squished animation
        if (enemy.squishTick > 0) {
          ctx.fillStyle = '#E84545';
          ctx.fillRect(enemy.x, enemy.y + 14, 24, 6);
        }
        return;
      }

      const ex = enemy.x;
      const ey = enemy.y;
      const legOffset = Math.sin(enemy.animTick) * 2;

      // Glitch Cyber Bug (8-Bit Red/Purple)
      ctx.fillStyle = '#E84545';
      ctx.fillRect(ex + 4, ey + 4, 16, 14);
      // Glowing Cyan Eyes
      ctx.fillStyle = '#00FFF5';
      ctx.fillRect(enemy.dir > 0 ? ex + 14 : ex + 6, ey + 6, 4, 4);
      // Antennae & Legs
      ctx.fillStyle = '#900C3F';
      ctx.fillRect(ex + 6, ey - 2, 3, 6);
      ctx.fillRect(ex + 15, ey - 2, 3, 6);
      ctx.fillRect(ex + 2, ey + 16 + legOffset, 4, 4);
      ctx.fillRect(ex + 18, ey + 16 - legOffset, 4, 4);
    });
  }

  renderPlayer(ctx) {
    const p = this.player;
    const px = p.x;
    const py = p.y;
    const walk = Math.sin(p.walkAnim) * 3;

    // 8-Bit Pixel Jerry Lawson
    // 1. Afro Hair
    ctx.fillStyle = '#1A1110';
    ctx.fillRect(px + 3, py, 16, 9);
    ctx.fillRect(px + 1, py + 2, 20, 6);

    // 2. Face (Skin tone)
    ctx.fillStyle = '#795548';
    ctx.fillRect(px + 4, py + 7, 14, 8);

    // 3. Iconic Glasses
    ctx.fillStyle = '#FFD700'; // Gold frames
    ctx.fillRect(p.facingRight ? px + 8 : px + 4, py + 8, 5, 4);
    ctx.fillRect(p.facingRight ? px + 14 : px + 10, py + 8, 5, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(p.facingRight ? px + 10 : px + 6, py + 9, 2, 2);
    ctx.fillRect(p.facingRight ? px + 16 : px + 12, py + 9, 2, 2);

    // 4. Warm Retro Jacket (Brown/Orange)
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(px + 3, py + 14, 16, 8);
    // Plaid Shirt Center
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(px + 9, py + 15, 4, 7);

    // 5. Blue Pants
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(px + 5, py + 22, 12, 6);

    // 6. Shoes (Walking Animation)
    ctx.fillStyle = '#111827';
    if (!p.isGrounded) {
      // Jump Pose
      ctx.fillRect(px + 2, py + 26, 6, 3);
      ctx.fillRect(px + 14, py + 26, 6, 3);
    } else {
      ctx.fillRect(px + 3 + walk, py + 26, 6, 3);
      ctx.fillRect(px + 13 - walk, py + 26, 6, 3);
    }
  }

  renderFX(ctx) {
    // Render Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // Render Floating Texts
    ctx.font = 'bold 12px monospace';
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.opacity;
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;
  }
}
