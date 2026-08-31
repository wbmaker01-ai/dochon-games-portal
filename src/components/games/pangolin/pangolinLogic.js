// Canvas 2D Physics and Procedural Terrain Engine for Dochon Pangolin Adventure
import { CANVAS_WIDTH, CANVAS_HEIGHT, PHYSICS, STAGES, ITEM_DEFS, OBSTACLE_DEFS } from './pangolinConstants';
import { pangolinAudio } from './pangolinAudio';

export class PangolinGameLogic {
  constructor() {
    this.stageIndex = 0;
    this.currentStage = STAGES[0];
    this.score = 0;
    this.totalCollected = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.timeLeft = this.currentStage.timeLimit;
    this.isGameOver = false;
    this.isStageCleared = false;
    this.isGameWon = false;

    this.resetPlayer();
    this.initStageWorld();
  }

  resetPlayer() {
    this.player = {
      worldX: 120,
      y: 350,
      vx: 0,
      vy: 0,
      radius: 22,
      angle: 0,
      angularVel: 0,
      isGrounded: false,
      isRolling: false,
      jumpCount: 0,
      maxJumps: 2,
      stunTimer: 0,
      boosterTimer: 0,
      walkAnimTimer: 0,
      facingRight: true
    };
  }

  initStageWorld() {
    this.currentStage = STAGES[this.stageIndex] || STAGES[0];
    this.timeLeft = this.currentStage.timeLimit;
    this.isStageCleared = false;
    this.combo = 0;

    // Entities
    this.items = [];
    this.obstacles = [];
    this.springs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.decorations = [];

    this.spawnStageEntities();
  }

  // Continuous Smooth Terrain Function
  getGroundHeight(worldX) {
    const sIdx = this.stageIndex;
    const wave1 = Math.sin(worldX * 0.0035) * 55;
    const wave2 = Math.sin(worldX * 0.008 + sIdx) * 30;
    const wave3 = Math.cos(worldX * 0.0015) * 40;
    return PHYSICS.GROUND_Y_BASE + wave1 + wave2 + wave3;
  }

  getGroundNormal(worldX) {
    const delta = 4;
    const y1 = this.getGroundHeight(worldX - delta);
    const y2 = this.getGroundHeight(worldX + delta);
    const slope = (y2 - y1) / (delta * 2);
    return Math.atan(slope);
  }

  spawnStageEntities() {
    const targetDist = this.currentStage.targetDistance;
    const step = 80;

    // 1. Spawning Collectibles
    for (let x = 300; x < targetDist - 150; x += step) {
      const groundY = this.getGroundHeight(x);
      const isHigh = Math.sin(x * 0.02) > 0.3;
      const itemY = isHigh ? groundY - 70 - Math.random() * 40 : groundY - 32;

      // Special items
      const rand = Math.random();
      let type = this.currentStage.itemType;
      if (rand < 0.08) {
        type = 'heart';
      } else if (rand < 0.14) {
        type = 'booster';
      }

      this.items.push({
        worldX: x + (Math.random() * 20 - 10),
        y: itemY,
        type: type,
        collected: false,
        floatOffset: Math.random() * Math.PI * 2
      });

      // 2. Spawning Springs occasionally
      if (x % 480 === 0 && x > 400 && x < targetDist - 300) {
        this.springs.push({
          worldX: x,
          y: groundY - 10,
          isPressed: false,
          pressTimer: 0
        });
      }

      // 3. Spawning Obstacles
      if (x % 320 === 0 && x > 500 && x < targetDist - 250) {
        const obsTypes = ['thorn', 'rock', 'mud'];
        const chosen = obsTypes[Math.floor(Math.random() * obsTypes.length)];
        const obsDef = OBSTACLE_DEFS[chosen];

        this.obstacles.push({
          worldX: x + 60,
          y: groundY - obsDef.height / 2,
          type: chosen,
          width: obsDef.width,
          height: obsDef.height,
          hit: false
        });
      }

      // 4. Background Trees/Flowers Decorations
      if (x % 160 === 0) {
        this.decorations.push({
          worldX: x,
          y: groundY,
          variant: Math.floor(Math.random() * 3)
        });
      }
    }
  }

  // Update Game Physics
  update(keys, isMobileLeft, isMobileRight, isMobileJump, isMobileRoll, dt = 16.66) {
    if (this.isGameOver || this.isStageCleared || this.isGameWon) return;

    const timeScale = Math.min(2.5, Math.max(0.2, dt / 16.666));
    const dtSeconds = dt / 1000;
    const p = this.player;

    // Time Countdown based on actual elapsed seconds
    this.timeLeft -= dtSeconds;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isGameOver = true;
      pangolinAudio.playHit();
      return;
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dtSeconds;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Booster / Stun Timers
    if (p.boosterTimer > 0) p.boosterTimer -= 1 * timeScale;
    if (p.stunTimer > 0) {
      p.stunTimer -= 1 * timeScale;
      p.vx *= Math.pow(0.92, timeScale);
    }

    // Input Handling
    const goLeft = keys['ArrowLeft'] || keys['KeyA'] || isMobileLeft;
    const goRight = keys['ArrowRight'] || keys['KeyD'] || isMobileRight;
    const rollPressed = keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyZ'] || keys['ControlLeft'] || isMobileRoll;

    // Automatic Rolling on High Speed or Explicit Roll Button
    const isMovingFast = Math.abs(p.vx) > 5.5;
    p.isRolling = (rollPressed || isMovingFast) && p.stunTimer <= 0;

    if (p.stunTimer <= 0) {
      if (goLeft) {
        p.facingRight = false;
        const accel = p.isRolling ? PHYSICS.ROLL_ACCEL * 1.5 : PHYSICS.ROLL_ACCEL;
        p.vx -= accel * timeScale;
      } else if (goRight) {
        p.facingRight = true;
        const accel = p.isRolling ? PHYSICS.ROLL_ACCEL * 1.5 : PHYSICS.ROLL_ACCEL;
        p.vx += accel * timeScale;
      } else {
        p.vx *= Math.pow(PHYSICS.FRICTION, timeScale);
      }
    }

    // Slope Physics & Gravity
    const groundY = this.getGroundHeight(p.worldX);
    const slopeAngle = this.getGroundNormal(p.worldX);

    if (p.isGrounded) {
      // Downhill acceleration & Uphill deceleration
      const slopeForce = Math.sin(slopeAngle) * PHYSICS.SLOPE_BOOST * 9.8;
      p.vx += slopeForce * timeScale;

      if (p.isRolling && Math.abs(p.vx) > 3.0) {
        pangolinAudio.playRoll();
        if (Math.random() < 0.4 * timeScale) {
          this.addDustParticle(p.worldX, p.y + p.radius, p.vx > 0 ? -1 : 1);
        }
      }
    }

    // Speed Caps
    const maxSpeed = p.boosterTimer > 0 ? PHYSICS.MAX_ROLL_SPEED * 1.4 : PHYSICS.MAX_ROLL_SPEED;
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));

    // Apply Velocity with timeScale
    p.worldX += p.vx * timeScale;
    p.y += p.vy * timeScale;
    p.vy += PHYSICS.GRAVITY * timeScale;

    // Angular Velocity for Rolling
    if (p.isRolling || !p.isGrounded) {
      p.angularVel = p.vx * 0.08;
      p.angle += p.angularVel * timeScale;
    } else {
      p.angle = slopeAngle;
      p.walkAnimTimer += Math.abs(p.vx) * 0.15 * timeScale;
    }

    // Ground Collision
    const currentGroundY = this.getGroundHeight(p.worldX);
    if (p.y + p.radius >= currentGroundY) {
      p.y = currentGroundY - p.radius;
      p.vy = 0;
      p.isGrounded = true;
      p.jumpCount = 0;
    } else {
      p.isGrounded = false;
    }

    // World X Bounds
    if (p.worldX < 50) {
      p.worldX = 50;
      p.vx = 0;
    }

    // Collectibles & Magnet
    const magnetRadius = p.boosterTimer > 0 ? 140 : 35;
    this.items.forEach(item => {
      if (item.collected) return;
      const dx = (p.worldX) - item.worldX;
      const dy = (p.y) - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnet pull when booster active
      if (p.boosterTimer > 0 && dist < magnetRadius) {
        item.worldX += (p.worldX - item.worldX) * 0.18;
        item.y += (p.y - item.y) * 0.18;
      }

      // Collect Check
      if (dist < p.radius + 16) {
        item.collected = true;
        this.totalCollected++;
        this.combo++;
        this.comboTimer = 2.5;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const def = ITEM_DEFS[item.type] || ITEM_DEFS.cocoa;
        const comboMultiplier = 1 + Math.min(this.combo * 0.1, 2.0);
        const gainedScore = Math.floor(def.baseScore * comboMultiplier);
        this.score += gainedScore;

        if (item.type === 'heart') {
          this.timeLeft = Math.min(this.currentStage.timeLimit, this.timeLeft + 10);
          this.addFloatingText(item.worldX, item.y, `+${gainedScore} ❤️ +10초!`, '#ef4444');
          pangolinAudio.playCollect(true);
        } else if (item.type === 'booster') {
          p.boosterTimer = 300; // 5 seconds
          this.addFloatingText(item.worldX, item.y, `슈퍼 롤링 부스터! ⚡`, '#a855f7');
          pangolinAudio.playCollect(true);
        } else {
          this.addFloatingText(item.worldX, item.y, `+${gainedScore} (x${comboMultiplier.toFixed(1)})`, '#fbbf24');
          if (this.combo > 1) {
            pangolinAudio.playCombo(this.combo);
          } else {
            pangolinAudio.playCollect(false);
          }
        }

        this.addSparkleParticles(item.worldX, item.y, def.color);
      }
    });

    // Spring Collision
    this.springs.forEach(sp => {
      const dx = Math.abs(p.worldX - sp.worldX);
      const dy = Math.abs(p.y + p.radius - sp.y);
      if (dx < 26 && dy < 20 && p.vy >= 0) {
        p.vy = PHYSICS.SPRING_FORCE;
        p.isGrounded = false;
        sp.isPressed = true;
        sp.pressTimer = 15;
        pangolinAudio.playSpring();
        this.addSparkleParticles(sp.worldX, sp.y, '#38bdf8');
      }
      if (sp.pressTimer > 0) sp.pressTimer--;
    });

    // Obstacle Collision
    this.obstacles.forEach(obs => {
      if (p.boosterTimer > 0) return; // Invincible during booster
      const dx = Math.abs(p.worldX - obs.worldX);
      const dy = Math.abs(p.y - obs.y);
      if (dx < p.radius + obs.width / 2 && dy < p.radius + obs.height / 2) {
        if (p.stunTimer <= 0) {
          const def = OBSTACLE_DEFS[obs.type];
          p.stunTimer = def.stunDuration;
          p.vx = p.facingRight ? -4.5 : 4.5;
          p.vy = -5.5;
          this.score = Math.max(0, this.score - def.penalty);
          this.combo = 0;
          this.addFloatingText(p.worldX, p.y - 30, `-${def.penalty}점 💥`, '#ef4444');
          pangolinAudio.playHit();
          this.addHitParticles(p.worldX, p.y);
        }
      }
    });

    // Goal Reached Check
    if (p.worldX >= this.currentStage.targetDistance) {
      p.worldX = this.currentStage.targetDistance;
      p.vx = 0;
      this.handleStageComplete();
    }

    // Update Particles & Floating Texts
    this.particles = this.particles.filter(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      return pt.life > 0;
    });

    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.y -= 1.2;
      ft.opacity -= 0.02;
      return ft.opacity > 0;
    });
  }

  jump() {
    const p = this.player;
    if (p.stunTimer > 0) return;

    if (p.isGrounded) {
      p.vy = PHYSICS.JUMP_FORCE;
      p.isGrounded = false;
      p.jumpCount = 1;
      pangolinAudio.playJump();
      this.addDustParticle(p.worldX, p.y + p.radius, 0);
    } else if (p.jumpCount < p.maxJumps) {
      p.vy = PHYSICS.DOUBLE_JUMP_FORCE;
      p.jumpCount++;
      pangolinAudio.playJump();
      this.addSparkleParticles(p.worldX, p.y + p.radius, '#60a5fa');
    }
  }

  handleStageComplete() {
    this.isStageCleared = true;
    const timeBonus = Math.floor(this.timeLeft * 30);
    this.score += timeBonus;
    this.addFloatingText(this.player.worldX, this.player.y - 50, `클리어! +${timeBonus}초 보너스!`, '#10b981');

    if (this.stageIndex >= STAGES.length - 1) {
      // Final 4-stage Victory!
      this.isGameWon = true;
      this.score += 5000; // Grand Victory Bonus
      pangolinAudio.playVictoryFanfare();
    } else {
      pangolinAudio.playStageClear();
    }
  }

  nextStage() {
    if (this.stageIndex < STAGES.length - 1) {
      this.stageIndex++;
      this.resetPlayer();
      this.initStageWorld();
    }
  }

  addDustParticle(x, y, dir) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: dir * (Math.random() * 2 + 1) + (Math.random() - 0.5),
        vy: -Math.random() * 2,
        radius: Math.random() * 4 + 2,
        color: '#d97706',
        life: 1.0,
        decay: 0.05
      });
    }
  }

  addSparkleParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const speed = Math.random() * 3 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color: color,
        life: 1.0,
        decay: 0.04
      });
    }
  }

  addHitParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 2,
        radius: Math.random() * 4 + 2,
        color: '#ef4444',
        life: 1.0,
        decay: 0.05
      });
    }
  }

  addFloatingText(worldX, y, text, color) {
    this.floatingTexts.push({
      worldX: worldX,
      y: y,
      text: text,
      color: color,
      opacity: 1.0
    });
  }

  // Draw 60FPS Scene onto Canvas
  draw(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const cameraX = this.player.worldX - CANVAS_WIDTH * 0.35;

    // 1. Sky & Parallax Background
    this.drawSkyAndParallax(ctx, cameraX);

    // 2. Terrain Hills & Ground
    this.drawTerrain(ctx, cameraX);

    // 3. Goal Arch
    this.drawGoalArch(ctx, cameraX);

    // 4. Springs & Obstacles
    this.drawEntities(ctx, cameraX);

    // 5. Pangolin Character
    this.drawPangolin(ctx, cameraX);

    // 6. Particles & Floating Text
    this.drawParticlesAndTexts(ctx, cameraX);
  }

  drawSkyAndParallax(ctx, cameraX) {
    const stage = this.currentStage;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, stage.skyGradient[0]);
    skyGrad.addColorStop(0.4, stage.skyGradient[1]);
    skyGrad.addColorStop(0.7, stage.skyGradient[2]);
    skyGrad.addColorStop(1, stage.skyGradient[3]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant Parallax Hills (Layer 1 - slow)
    ctx.fillStyle = stage.hillColors[0];
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let sx = 0; sx <= CANVAS_WIDTH; sx += 20) {
      const worldDistX = cameraX * 0.2 + sx;
      const hy = 280 + Math.sin(worldDistX * 0.003) * 60;
      ctx.lineTo(sx, hy);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Mid Parallax Hills (Layer 2 - medium)
    ctx.fillStyle = stage.hillColors[1];
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let sx = 0; sx <= CANVAS_WIDTH; sx += 20) {
      const worldDistX = cameraX * 0.5 + sx;
      const hy = 340 + Math.cos(worldDistX * 0.005) * 45;
      ctx.lineTo(sx, hy);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  drawTerrain(ctx, cameraX) {
    const stage = this.currentStage;
    ctx.fillStyle = stage.hillColors[2];

    // Main Foreground Ground Fill
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let sx = -20; sx <= CANVAS_WIDTH + 20; sx += 10) {
      const wx = cameraX + sx;
      const gy = this.getGroundHeight(wx);
      ctx.lineTo(sx, gy);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Ground Edge Grass Border
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let sx = -20; sx <= CANVAS_WIDTH + 20; sx += 10) {
      const wx = cameraX + sx;
      const gy = this.getGroundHeight(wx);
      if (sx === -20) ctx.moveTo(sx, gy);
      else ctx.lineTo(sx, gy);
    }
    ctx.stroke();
  }

  drawGoalArch(ctx, cameraX) {
    const goalX = this.currentStage.targetDistance - cameraX;
    const groundY = this.getGroundHeight(this.currentStage.targetDistance);

    // Two Pillar Posts
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(goalX - 45, groundY - 140, 12, 140);
    ctx.fillRect(goalX + 35, groundY - 140, 12, 140);

    // Goal Banner Banner Arch
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(goalX - 60, groundY - 165, 120, 36, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️ GOAL ❤️', goalX, groundY - 142);

    // Loved One Pangolin Waiting at Finish Line
    const loverX = goalX + 80;
    const loverY = groundY - 20;
    ctx.save();
    ctx.translate(loverX, loverY);
    // Draw Cute Pink Pangolin Companion
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head & Ribbon
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(-14, -6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('🎀', -14, -14);
    ctx.fillText('💖', 0, -26);
    ctx.restore();
  }

  drawEntities(ctx, cameraX) {
    // Springs
    this.springs.forEach(sp => {
      const sx = sp.worldX - cameraX;
      if (sx < -50 || sx > CANVAS_WIDTH + 50) return;
      const height = sp.pressTimer > 0 ? 12 : 22;

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sp.y - height, 36, height, 6);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx, sp.y - height, 16, Math.PI, 0);
      ctx.fill();
    });

    // Obstacles
    this.obstacles.forEach(obs => {
      const sx = obs.worldX - cameraX;
      if (sx < -50 || sx > CANVAS_WIDTH + 50) return;

      if (obs.type === 'thorn') {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(sx - 16, obs.y + 12);
        ctx.lineTo(sx - 8, obs.y - 12);
        ctx.lineTo(sx, obs.y + 12);
        ctx.lineTo(sx + 8, obs.y - 12);
        ctx.lineTo(sx + 16, obs.y + 12);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(sx, obs.y + 4, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(sx, obs.y + 10, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Collectible Items
    this.items.forEach(item => {
      if (item.collected) return;
      const sx = item.worldX - cameraX;
      if (sx < -50 || sx > CANVAS_WIDTH + 50) return;

      const floatY = item.y + Math.sin(item.floatOffset + Date.now() * 0.005) * 5;
      const def = ITEM_DEFS[item.type] || ITEM_DEFS.cocoa;

      ctx.save();
      ctx.translate(sx, floatY);

      // Outline glow for special items
      if (item.type === 'heart' || item.type === 'booster') {
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2;
      }

      ctx.fillStyle = def.color;
      if (item.type === 'cocoa') {
        // Oval Cocoa Bean
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-6, -1, 12, 2);
      } else if (item.type === 'flower') {
        // Flower Petals
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'note') {
        // Melody Note
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵', 0, 0);
      } else if (item.type === 'heart') {
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', 0, 0);
      } else if (item.type === 'booster') {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0);
      } else {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨', 0, 0);
      }

      ctx.restore();
    });
  }

  drawPangolin(ctx, cameraX) {
    const p = this.player;
    const sx = p.worldX - cameraX;
    const sy = p.y;

    ctx.save();
    ctx.translate(sx, sy);

    // Stun blink effect
    if (p.stunTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.restore();
      return;
    }

    // Booster Super Aura (Lightweight outline)
    if (p.boosterTimer > 0) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (p.isRolling) {
      // 1. Rolling Ball Form (데굴데굴 둥근 형태)
      ctx.rotate(p.angle);

      // Main Outer Body Shell
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Curved Pangolin Scale Segments
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius - 3, (i * Math.PI) / 2, (i * Math.PI) / 2 + Math.PI / 3);
        ctx.stroke();
      }

      // Inner Belly Core
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius - 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 2. Walking / Standing Form (귀여운 아장아장 걷기 모드)
      ctx.rotate(p.angle);
      if (!p.facingRight) ctx.scale(-1, 1);

      // Tail
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(-18, 4, 14, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Main Body
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scales Pattern on Back
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-4, -6, 6, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -6, 6, 0, Math.PI);
      ctx.fill();

      // Head & Snout
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(14, -2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cute Snout Nose
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(22, -1, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, -5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(17, -5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Little Walking Legs
      const legOffset = Math.sin(p.walkAnimTimer) * 4;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-8 + legOffset, 10, 5, 8);
      ctx.fillRect(6 - legOffset, 10, 5, 8);
    }

    ctx.restore();
  }

  drawParticlesAndTexts(ctx, cameraX) {
    // Particles
    this.particles.forEach(pt => {
      const sx = pt.x - cameraX;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.beginPath();
      ctx.arc(sx, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Floating Combo / Score Texts
    ctx.textAlign = 'center';
    this.floatingTexts.forEach(ft => {
      const sx = ft.worldX - cameraX;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.opacity;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(ft.text, sx, ft.y);
    });
    ctx.globalAlpha = 1.0;
  }
}
