import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BEE_CONFIG,
  FLOWER_TYPES,
  ECO_LEVELS
} from './earthBeeConstants';

export class EarthBeeEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // High DPI Handling
    this.dpr = window.devicePixelRatio || 1;
    this.setupCanvas();

    // Bee Character State
    this.bee = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      targetX: CANVAS_WIDTH / 2,
      targetY: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      targetAngle: 0,
      wingCycle: 0,
      pollenCount: 0,
      maxPollen: BEE_CONFIG.MAX_POLLEN,
      carryingType: null, // flower type carrying
      trailTimer: 0
    };

    // World & Camera
    this.camera = { x: 0, y: 0 };
    this.gardenWidth = 2400; // Large 2D open field
    this.gardenHeight = 1500;

    // Entities
    this.flowers = [];
    this.particles = [];
    this.floatingTexts = [];
    this.butterflies = [];
    this.grassBlades = [];
    this.clouds = [];

    // Ecosystem & Combo
    this.totalBlooms = 0;
    this.ecoLevel = 1;
    this.combo = 0;
    this.comboTimer = 0;

    // Visual time
    this.time = 0;

    // Callbacks
    this.onBloomCallback = null;
    this.onPollenCollectCallback = null;
    this.onLevelUpCallback = null;

    // Control Mode: 'pointer' | 'keyboard'
    this.controlMode = 'pointer';
    this.keyVelocity = { dx: 0, dy: 0 };

    this.initWorld();
  }

  setupCanvas() {
    this.canvas.width = CANVAS_WIDTH * this.dpr;
    this.canvas.height = CANVAS_HEIGHT * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initWorld() {
    this.flowers = [];
    this.particles = [];
    this.floatingTexts = [];
    this.butterflies = [];
    this.grassBlades = [];
    this.clouds = [];
    this.totalBlooms = 0;
    this.ecoLevel = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.controlMode = 'pointer';
    this.keyVelocity = { dx: 0, dy: 0 };

    this.bee.x = this.gardenWidth / 2;
    this.bee.y = this.gardenHeight / 2;
    this.bee.targetX = this.bee.x;
    this.bee.targetY = this.bee.y;
    this.bee.vx = 0;
    this.bee.vy = 0;
    this.bee.pollenCount = 20; // Start with a little starter pollen
    this.bee.carryingType = FLOWER_TYPES.DAISY;

    // Generate Clouds
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.gardenWidth,
        y: Math.random() * (this.gardenHeight * 0.4),
        scale: 0.8 + Math.random() * 0.8,
        speed: 8 + Math.random() * 12,
        opacity: 0.25 + Math.random() * 0.25
      });
    }

    // Generate Grass Blades for rich field texture
    for (let i = 0; i < 180; i++) {
      this.grassBlades.push({
        x: Math.random() * this.gardenWidth,
        y: Math.random() * this.gardenHeight,
        height: 12 + Math.random() * 16,
        color: i % 3 === 0 ? '#15803D' : i % 2 === 0 ? '#16A34A' : '#22C55E',
        swayOffset: Math.random() * Math.PI * 2
      });
    }

    // Generate Butterflies
    for (let i = 0; i < 7; i++) {
      this.butterflies.push({
        x: Math.random() * this.gardenWidth,
        y: Math.random() * this.gardenHeight,
        color: ['#F43F5E', '#A855F7', '#38BDF8', '#FBBF24'][i % 4],
        wingAngle: 0,
        speed: 30 + Math.random() * 25,
        targetX: Math.random() * this.gardenWidth,
        targetY: Math.random() * this.gardenHeight,
        timer: 0
      });
    }

    // Spawn Initial Flower Field
    this.spawnFlowerField();
  }

  spawnFlowerField() {
    const activeLevelConfig = ECO_LEVELS.find(l => l.level === this.ecoLevel) || ECO_LEVELS[0];
    const availableTypeKeys = activeLevelConfig.flowerTypes;

    const count = 45;
    for (let i = 0; i < count; i++) {
      const typeKey = availableTypeKeys[Math.floor(Math.random() * availableTypeKeys.length)];
      const fType = FLOWER_TYPES[typeKey];

      const x = 100 + Math.random() * (this.gardenWidth - 200);
      const y = 100 + Math.random() * (this.gardenHeight - 200);

      // Half start as bloomed (for pollen harvest) and half as buds (waiting for pollination)
      const isBloomed = i % 2 === 0;

      this.flowers.push({
        id: `flower_${Date.now()}_${i}_${Math.random()}`,
        x,
        y,
        type: fType,
        state: isBloomed ? 'BLOOMED' : 'BUD',
        bloomScale: isBloomed ? 1 : 0.35,
        targetScale: isBloomed ? 1 : 0.35,
        pollenAvailable: isBloomed,
        bloomProgress: isBloomed ? 1 : 0,
        swayPhase: Math.random() * Math.PI * 2,
        pulsingAura: false
      });
    }
  }

  // Smoothly steer Bee towards mouse/touch world position
  setTargetPosition(screenX, screenY) {
    this.controlMode = 'pointer';
    this.keyVelocity.dx = 0;
    this.keyVelocity.dy = 0;
    const worldX = screenX + this.camera.x;
    const worldY = screenY + this.camera.y;
    this.bee.targetX = Math.max(30, Math.min(this.gardenWidth - 30, worldX));
    this.bee.targetY = Math.max(30, Math.min(this.gardenHeight - 30, worldY));
  }

  // Directional steering for Keyboard WASD / Arrows
  setKeyboardInput(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.controlMode = 'keyboard';
      this.keyVelocity.dx = dx;
      this.keyVelocity.dy = dy;
    } else if (this.controlMode === 'keyboard') {
      this.keyVelocity.dx = 0;
      this.keyVelocity.dy = 0;
    }
  }

  setDirection(dx, dy) {
    this.setKeyboardInput(dx, dy);
  }

  update(dt) {
    this.time += dt;

    // 1. Bee Physics & Steering (Keyboard Mode vs Pointer Mode)
    if (this.controlMode === 'keyboard') {
      const kdx = this.keyVelocity.dx;
      const kdy = this.keyVelocity.dy;
      const isMoving = kdx !== 0 || kdy !== 0;

      if (isMoving) {
        // Direct target heading angle from keyboard arrow inputs
        const targetAngle = Math.atan2(kdy, kdx);
        let angleDiff = targetAngle - this.bee.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.bee.angle += angleDiff * Math.min(dt * 15, 1);

        const moveSpeed = BEE_CONFIG.SPEED;
        this.bee.vx = Math.cos(this.bee.angle) * moveSpeed;
        this.bee.vy = Math.sin(this.bee.angle) * moveSpeed;
      } else {
        // Inertial deceleration on key release
        this.bee.vx *= Math.pow(0.02, dt);
        this.bee.vy *= Math.pow(0.02, dt);
      }

      this.bee.x += this.bee.vx * dt;
      this.bee.y += this.bee.vy * dt;

      // Clamp inside garden bounds
      this.bee.x = Math.max(30, Math.min(this.gardenWidth - 30, this.bee.x));
      this.bee.y = Math.max(30, Math.min(this.gardenHeight - 30, this.bee.y));

      // Keep target position synced
      this.bee.targetX = this.bee.x;
      this.bee.targetY = this.bee.y;
    } else {
      // Pointer Mode (Mouse & Touch)
      const dx = this.bee.targetX - this.bee.x;
      const dy = this.bee.targetY - this.bee.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3) {
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - this.bee.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.bee.angle += angleDiff * Math.min(dt * 10, 1);

        const moveSpeed = Math.min(BEE_CONFIG.SPEED, dist * 5.5);
        this.bee.vx = Math.cos(this.bee.angle) * moveSpeed;
        this.bee.vy = Math.sin(this.bee.angle) * moveSpeed;

        this.bee.x += this.bee.vx * dt;
        this.bee.y += this.bee.vy * dt;
      } else {
        this.bee.vx *= 0.8;
        this.bee.vy *= 0.8;
      }
    }

    // Wing flapping
    this.bee.wingCycle += dt * BEE_CONFIG.WING_FLAP_SPEED;

    // Bee pollen trail sparkles
    this.bee.trailTimer += dt;
    if (this.bee.trailTimer >= 0.05) {
      this.bee.trailTimer = 0;
      if (this.bee.pollenCount > 0) {
        this.spawnPollenParticle(
          this.bee.x - Math.cos(this.bee.angle) * 14 + (Math.random() - 0.5) * 8,
          this.bee.y - Math.sin(this.bee.angle) * 14 + (Math.random() - 0.5) * 8,
          this.bee.carryingType ? this.bee.carryingType.petalColor : '#FDE047'
        );
      }
    }

    // 2. Camera Smooth Follow (Centered on Bee)
    const targetCamX = this.bee.x - CANVAS_WIDTH / 2;
    const targetCamY = this.bee.y - CANVAS_HEIGHT / 2;
    this.camera.x += (Math.max(0, Math.min(this.gardenWidth - CANVAS_WIDTH, targetCamX)) - this.camera.x) * Math.min(dt * 6, 1);
    this.camera.y += (Math.max(0, Math.min(this.gardenHeight - CANVAS_HEIGHT, targetCamY)) - this.camera.y) * Math.min(dt * 6, 1);

    // 3. Flower Interactions (Harvest Pollen & Bloom Buds)
    this.updateFlowers(dt);

    // 4. Update Combo Timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // 5. Update Clouds
    this.clouds.forEach(cloud => {
      cloud.x += cloud.speed * dt;
      if (cloud.x > this.gardenWidth + 100) {
        cloud.x = -150;
        cloud.y = Math.random() * (this.gardenHeight * 0.5);
      }
    });

    // 6. Update Butterflies
    this.butterflies.forEach(b => {
      b.timer += dt;
      b.wingAngle = Math.sin(b.timer * 18);
      const bdx = b.targetX - b.x;
      const bdy = b.targetY - b.y;
      const bDist = Math.hypot(bdx, bdy);
      if (bDist < 20 || b.timer > 5) {
        b.targetX = Math.random() * this.gardenWidth;
        b.targetY = Math.random() * this.gardenHeight;
        b.timer = 0;
      } else {
        b.x += (bdx / bDist) * b.speed * dt;
        b.y += (bdy / bDist) * b.speed * dt;
      }
    });

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size = Math.max(0, p.initialSize * (p.life / p.maxLife));
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= ft.speed * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / ft.maxLife);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  updateFlowers(dt) {
    let bloomedCount = 0;

    this.flowers.forEach(flower => {
      // Bloom animation scaling
      if (flower.bloomScale < flower.targetScale) {
        flower.bloomScale = Math.min(flower.targetScale, flower.bloomScale + dt * 3.5);
      }

      if (flower.state === 'BLOOMED') {
        bloomedCount++;
      }

      // Check distance with Bee
      const fDist = Math.hypot(this.bee.x - flower.x, this.bee.y - flower.y);

      // A. Harvest Pollen from Bloomed Flowers
      if (flower.state === 'BLOOMED' && flower.pollenAvailable && fDist < BEE_CONFIG.POLLEN_COLLECT_RADIUS) {
        if (this.bee.pollenCount < this.bee.maxPollen) {
          const addAmount = flower.type.pollenReward;
          this.bee.pollenCount = Math.min(this.bee.maxPollen, this.bee.pollenCount + addAmount);
          this.bee.carryingType = flower.type;
          flower.pollenAvailable = false;

          // Spawn sparkling harvest particles
          this.spawnPollenBurst(flower.x, flower.y, flower.type.petalColor, 12);
          this.addFloatingText(flower.x, flower.y - 20, `+꽃가루 ✨`, '#FDE047');

          if (this.onPollenCollectCallback) {
            this.onPollenCollectCallback(flower.type);
          }

          // Flower regrows pollen after 8 seconds
          setTimeout(() => {
            if (flower.state === 'BLOOMED') {
              flower.pollenAvailable = true;
            }
          }, 8000);
        }
      }

      // B. Pollinate & Bloom Buds
      if (flower.state === 'BUD' && fDist < BEE_CONFIG.POLLEN_DELIVER_RADIUS) {
        if (this.bee.pollenCount >= 15) {
          this.bee.pollenCount = Math.max(0, this.bee.pollenCount - 15);
          flower.state = 'BLOOMED';
          flower.targetScale = 1.0;
          flower.pollenAvailable = true;
          this.totalBlooms++;

          // Combo Calculation
          this.combo++;
          this.comboTimer = 3.8; // 3.8s window to maintain combo

          const comboMultiplier = Math.min(this.combo, 5);
          const earnedScore = flower.type.score * comboMultiplier;
          const timeBonus = flower.type.timeBonus;

          // Bloom Explosion Particles
          this.spawnBloomFireworks(flower.x, flower.y, flower.type.petalColor, flower.type.centerColor);

          // Floating Score Text
          this.addFloatingText(
            flower.x,
            flower.y - 25,
            `+${earnedScore}점! ${this.combo > 1 ? `(x${comboMultiplier} 콤보)` : ''}`,
            this.combo > 2 ? '#F43F5E' : '#22C55E'
          );

          if (timeBonus > 0) {
            this.addFloatingText(flower.x, flower.y - 45, `+${timeBonus}초 ⏰`, '#38BDF8');
          }

          // Check Ecosystem Level Progression
          this.checkEcosystemLevel();

          // Chain reaction: check nearby buds and give them a mini bloom boost
          this.triggerNearbyPollenDispersion(flower.x, flower.y);

          if (this.onBloomCallback) {
            this.onBloomCallback({
              flowerType: flower.type,
              score: earnedScore,
              timeBonus,
              combo: this.combo,
              totalBlooms: this.totalBlooms,
              ecoLevel: this.ecoLevel
            });
          }
        }
      }
    });

    // Ensure garden always has at least 15 unbloomed buds to pollinate
    const budCount = this.flowers.filter(f => f.state === 'BUD').length;
    if (budCount < 12) {
      this.spawnMoreBuds(10);
    }
  }

  triggerNearbyPollenDispersion(x, y) {
    this.flowers.forEach(other => {
      if (other.state === 'BUD') {
        const d = Math.hypot(other.x - x, other.y - y);
        if (d < 160 && Math.random() < 0.4) {
          // Chain pollination for close flowers!
          setTimeout(() => {
            if (other.state === 'BUD') {
              other.state = 'BLOOMED';
              other.targetScale = 1.0;
              other.pollenAvailable = true;
              this.totalBlooms++;
              this.spawnPollenBurst(other.x, other.y, other.type.petalColor, 8);
              this.addFloatingText(other.x, other.y - 20, `연쇄 개화! 🌸`, '#EC4899');
            }
          }, 300 + Math.random() * 200);
        }
      }
    });
  }

  spawnMoreBuds(amount = 8) {
    const activeLevelConfig = ECO_LEVELS.find(l => l.level === this.ecoLevel) || ECO_LEVELS[0];
    const availableTypeKeys = activeLevelConfig.flowerTypes;

    for (let i = 0; i < amount; i++) {
      const typeKey = availableTypeKeys[Math.floor(Math.random() * availableTypeKeys.length)];
      const fType = FLOWER_TYPES[typeKey];

      const x = 120 + Math.random() * (this.gardenWidth - 240);
      const y = 120 + Math.random() * (this.gardenHeight - 240);

      this.flowers.push({
        id: `flower_spawn_${Date.now()}_${i}`,
        x,
        y,
        type: fType,
        state: 'BUD',
        bloomScale: 0.3,
        targetScale: 0.3,
        pollenAvailable: false,
        bloomProgress: 0,
        swayPhase: Math.random() * Math.PI * 2,
        pulsingAura: false
      });
    }
  }

  checkEcosystemLevel() {
    const nextLevel = ECO_LEVELS.slice().reverse().find(l => this.totalBlooms >= l.requiredBlooms);
    if (nextLevel && nextLevel.level > this.ecoLevel) {
      this.ecoLevel = nextLevel.level;

      // Celebrate Level Up!
      this.spawnRainbowShower();
      this.addFloatingText(this.bee.x, this.bee.y - 60, `🎉 [생태계 Lv.${this.ecoLevel}] ${nextLevel.name}!`, '#FBBF24');

      if (this.onLevelUpCallback) {
        this.onLevelUpCallback(this.ecoLevel, nextLevel.name);
      }
    }
  }

  // Particle Generators
  spawnPollenParticle(x, y, color) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 15,
      life: 0.6,
      maxLife: 0.6,
      alpha: 1,
      size: 3 + Math.random() * 3,
      initialSize: 3 + Math.random() * 3,
      color
    });
  }

  spawnPollenBurst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.0,
        alpha: 1,
        size: 4 + Math.random() * 4,
        initialSize: 4 + Math.random() * 4,
        color
      });
    }
  }

  spawnBloomFireworks(x, y, petalColor, centerColor) {
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 70 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.9 + Math.random() * 0.5,
        maxLife: 1.2,
        alpha: 1,
        size: 5 + Math.random() * 5,
        initialSize: 5 + Math.random() * 5,
        color: i % 2 === 0 ? petalColor : centerColor
      });
    }
  }

  spawnRainbowShower() {
    const rainbowColors = ['#F43F5E', '#FB923C', '#FBBF24', '#4ADE80', '#38BDF8', '#A855F7'];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.camera.x + Math.random() * CANVAS_WIDTH,
        y: this.camera.y - 20,
        vx: (Math.random() - 0.5) * 60,
        vy: 100 + Math.random() * 140,
        life: 1.8,
        maxLife: 1.8,
        alpha: 1,
        size: 6 + Math.random() * 5,
        initialSize: 6 + Math.random() * 5,
        color: rainbowColors[i % rainbowColors.length]
      });
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      speed: 35,
      life: 1.2,
      maxLife: 1.2,
      alpha: 1
    });
  }

  // 60FPS Render Pipeline
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Field Background & Grass Texture
    this.drawGardenBackground(ctx);

    // 2. Draw Clouds (Parallax Sky)
    this.drawClouds(ctx);

    // 3. Draw Flowers
    this.drawFlowers(ctx);

    // 4. Draw Butterflies
    this.drawButterflies(ctx);

    // 5. Draw Particles (Pollen & Petals)
    this.drawParticles(ctx);

    // 6. Draw Bee Hero
    this.drawBee(ctx);

    // 7. Draw Floating Texts
    this.drawFloatingTexts(ctx);

    // 8. World Border Vines
    this.drawWorldBorders(ctx);

    ctx.restore();
  }

  drawGardenBackground(ctx) {
    // Rich Green Spring Grass Field Gradient
    const grad = ctx.createRadialGradient(
      this.gardenWidth / 2, this.gardenHeight / 2, 200,
      this.gardenWidth / 2, this.gardenHeight / 2, this.gardenWidth * 0.8
    );
    grad.addColorStop(0, '#86EFAC'); // Light Spring Green Center
    grad.addColorStop(0.5, '#4ADE80'); // Lush Green
    grad.addColorStop(1, '#22C55E'); // Deep Grass Green Edge

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.gardenWidth, this.gardenHeight);

    // Swaying Grass Blades
    this.grassBlades.forEach(blade => {
      const sway = Math.sin(this.time * 2 + blade.swayOffset) * 4;
      ctx.strokeStyle = blade.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(blade.x + sway * 0.5, blade.y - blade.height * 0.6, blade.x + sway, blade.y - blade.height);
      ctx.stroke();
    });
  }

  drawClouds(ctx) {
    ctx.save();
    this.clouds.forEach(cloud => {
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 35 * cloud.scale, 0, Math.PI * 2);
      ctx.arc(cloud.x + 30 * cloud.scale, cloud.y - 10 * cloud.scale, 28 * cloud.scale, 0, Math.PI * 2);
      ctx.arc(cloud.x + 60 * cloud.scale, cloud.y, 32 * cloud.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawFlowers(ctx) {
    this.flowers.forEach(flower => {
      // Cull offscreen flowers for performance
      if (
        flower.x < this.camera.x - 60 ||
        flower.x > this.camera.x + CANVAS_WIDTH + 60 ||
        flower.y < this.camera.y - 60 ||
        flower.y > this.camera.y + CANVAS_HEIGHT + 60
      ) {
        return;
      }

      ctx.save();
      ctx.translate(flower.x, flower.y);

      // Subtle breeze sway
      const swayAngle = Math.sin(this.time * 2.5 + flower.swayPhase) * 0.08;
      ctx.rotate(swayAngle);

      const scale = flower.bloomScale;
      ctx.scale(scale, scale);

      // Flower Stem & Leaves
      ctx.strokeStyle = flower.type.stemColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, 15, 0, 30);
      ctx.stroke();

      // Leaf
      ctx.fillStyle = flower.type.stemColor;
      ctx.beginPath();
      ctx.ellipse(8, 18, 9, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      if (flower.state === 'BUD') {
        // Closed Flower Bud (Waiting for Pollen)
        ctx.fillStyle = flower.type.stemColor;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flower.type.petalColor;
        ctx.beginPath();
        ctx.arc(0, -3, 7, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Pollen Indicator Halo if Bee has pollen
        if (this.bee.pollenCount >= 15) {
          const haloPulse = 14 + Math.sin(this.time * 6) * 3;
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, haloPulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Bloomed Flower
        const petals = flower.type.petals;
        const petalDist = flower.type.id === 'sunflower' ? 18 : 14;

        // Draw Petals
        ctx.fillStyle = flower.type.petalColor;
        for (let p = 0; p < petals; p++) {
          const pAngle = (p / petals) * Math.PI * 2;
          ctx.save();
          ctx.rotate(pAngle);
          ctx.beginPath();
          ctx.ellipse(0, -petalDist, 7, 13, 0, 0, Math.PI * 2);
          ctx.fill();

          // Petal edge shine
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }

        // Flower Center
        ctx.fillStyle = flower.type.centerColor;
        ctx.beginPath();
        ctx.arc(0, 0, flower.type.id === 'sunflower' ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();

        // Pollen Dust indicator if harvestable
        if (flower.pollenAvailable) {
          ctx.fillStyle = '#FDE047';
          for (let d = 0; d < 5; d++) {
            const dAngle = (d / 5) * Math.PI * 2 + this.time * 2;
            const dx = Math.cos(dAngle) * 4;
            const dy = Math.sin(dAngle) * 4;
            ctx.beginPath();
            ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    });
  }

  drawButterflies(ctx) {
    this.butterflies.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);

      const wingScale = Math.abs(b.wingAngle);
      ctx.fillStyle = b.color;

      // Left Wing
      ctx.beginPath();
      ctx.ellipse(-7 * wingScale, -4, 9 * wingScale, 6, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Right Wing
      ctx.beginPath();
      ctx.ellipse(7 * wingScale, -4, 9 * wingScale, 6, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Tiny Body
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawBee(ctx) {
    ctx.save();
    ctx.translate(this.bee.x, this.bee.y);
    ctx.rotate(this.bee.angle);

    // 1. Pollen Carrying Aura / Halo
    if (this.bee.pollenCount > 0) {
      const auraRatio = this.bee.pollenCount / this.bee.maxPollen;
      const auraRadius = 24 + auraRatio * 10 + Math.sin(this.time * 8) * 3;

      ctx.save();
      ctx.strokeStyle = this.bee.carryingType ? this.bee.carryingType.petalColor : '#FDE047';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 10) * 0.2;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting pollen sparks
      for (let i = 0; i < 4; i++) {
        const oAngle = (i / 4) * Math.PI * 2 + this.time * 5;
        const ox = Math.cos(oAngle) * auraRadius;
        const oy = Math.sin(oAngle) * auraRadius;
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Translucent Flapping Wings (Top & Bottom)
    const wingFlap = Math.sin(this.bee.wingCycle);
    const wingLength = 18;
    const wingWidth = 10 * Math.abs(wingFlap);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
    ctx.lineWidth = 1.5;

    // Left Wing
    ctx.beginPath();
    ctx.ellipse(-2, -14 * Math.abs(wingFlap), wingWidth, wingLength, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.ellipse(-2, 14 * Math.abs(wingFlap), wingWidth, wingLength, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Bee Body (Yellow with Dark Brown Stripes)
    // Stinger
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-24, -2);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fill();

    // Yellow Oval Body
    ctx.fillStyle = '#FBBF24'; // Golden Bee Yellow
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark Brown Stripes
    ctx.fillStyle = '#451A03';
    [-6, 2].forEach(offset => {
      ctx.beginPath();
      ctx.ellipse(offset, 0, 4, 12.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Bee Head & Cute Face
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(14, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Cheerful Eyes
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(16, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(16, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkles
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(17, -5, 1, 0, Math.PI * 2);
    ctx.arc(17, 3, 1, 0, Math.PI * 2);
    ctx.fill();

    // Pink Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.beginPath();
    ctx.arc(14, -6, 2, 0, Math.PI * 2);
    ctx.arc(14, 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Antennae with Bobbing Tips
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    const antBob = Math.sin(this.time * 12) * 2;

    // Top Antenna
    ctx.beginPath();
    ctx.moveTo(18, -3);
    ctx.quadraticCurveTo(24, -10 + antBob, 27, -8);
    ctx.stroke();
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(27, -8, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Antenna
    ctx.beginPath();
    ctx.moveTo(18, 3);
    ctx.quadraticCurveTo(24, 10 - antBob, 27, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(27, 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawFloatingTexts(ctx) {
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  drawWorldBorders(ctx) {
    // Elegant wooden fence / green hedge border around garden
    ctx.save();
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, this.gardenWidth - 16, this.gardenHeight - 16);
    ctx.restore();
  }
}
