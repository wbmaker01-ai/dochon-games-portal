// Core Game Physics, Entity Management & Canvas 2D Renderer for Dochon Magic Cat Academy

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SYMBOLS,
  STAGES,
  PLAYER_MAX_HP,
  COMBO_TIMEOUT_MS
} from './magicConstants';
import { magicAudio } from './magicAudio';

export class MagicGameLogic {
  constructor() {
    this.bgImages = {};
    this.loadBackgroundImages();
    this.reset();
  }

  loadBackgroundImages() {
    STAGES.forEach((stage) => {
      if (stage.bgImage) {
        const img = new Image();
        img.src = stage.bgImage;
        this.bgImages[stage.stage] = img;
      }
    });
  }

  reset() {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 65,
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      wandAngle: -Math.PI / 4,
      targetWandAngle: -Math.PI / 4,
      isCasting: false,
      castTimer: 0,
      invulnerableTimer: 0,
      hurtAnimTimer: 0,
      blinkTimer: 0,
      isBlinking: false
    };

    this.stageIndex = 0;
    this.currentStage = STAGES[0];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastMatchTime = 0;
    this.purifiedCount = 0;
    this.stageKills = 0;

    this.ghosts = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenFlash = 0;
    this.hurtFlash = 0;
    this.screenShake = 0;

    // Boss state (Stage 5)
    this.boss = null;

    this.spawnTimer = 0;
    this.gameState = 'PLAYING'; // 'PLAYING', 'STAGE_CLEAR', 'VICTORY', 'GAME_OVER'
    this.stageClearTimer = 0;
    this.victoryTimer = 0;

    this.currentStroke = []; // Live drawing points [{x, y, t}]
  }

  startStage(index) {
    if (index >= STAGES.length) {
      this.gameState = 'VICTORY';
      magicAudio.playBossDefeat();
      return;
    }

    this.stageIndex = index;
    this.currentStage = STAGES[index];
    this.stageKills = 0;
    this.ghosts = [];
    this.projectiles = [];
    this.spawnTimer = 40; // Initial delay before spawning
    this.gameState = 'PLAYING';

    if (this.currentStage.isBossStage) {
      this.initBoss();
    } else {
      this.boss = null;
    }
  }

  initBoss() {
    this.boss = {
      x: CANVAS_WIDTH / 2,
      y: 130,
      width: 140,
      height: 140,
      hp: this.currentStage.bossMaxHp || 8,
      maxHp: this.currentStage.bossMaxHp || 8,
      hoverOffset: 0,
      phaseTimer: 0,
      symbols: this.generateBossSymbols(),
      hitTimer: 0,
      minionSpawnTimer: 180
    };
  }

  generateBossSymbols() {
    const pool = ['HORIZONTAL', 'VERTICAL', 'UP_V', 'DOWN_V'];
    const count = 3 + Math.min(3, Math.floor((this.boss ? (this.boss.maxHp - this.boss.hp) : 0) / 2));
    const syms = [];
    for (let i = 0; i < count; i++) {
      syms.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return syms;
  }

  // Update Game Loop (60 FPS)
  update() {
    if (this.gameState === 'GAME_OVER' || this.gameState === 'VICTORY') {
      this.updateParticles();
      return;
    }

    if (this.gameState === 'STAGE_CLEAR') {
      this.stageClearTimer++;
      this.updateParticles();
      if (this.stageClearTimer > 120) {
        this.stageClearTimer = 0;
        this.startStage(this.stageIndex + 1);
      }
      return;
    }

    // Player timers
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;
    if (this.player.hurtAnimTimer > 0) this.player.hurtAnimTimer--;
    if (this.player.castTimer > 0) {
      this.player.castTimer--;
      if (this.player.castTimer === 0) {
        this.player.targetWandAngle = -Math.PI / 4;
      }
    }
    this.player.wandAngle += (this.player.targetWandAngle - this.player.wandAngle) * 0.25;

    // Player blinking animation
    this.player.blinkTimer++;
    if (this.player.blinkTimer > 180) {
      this.player.isBlinking = true;
      if (this.player.blinkTimer > 192) {
        this.player.isBlinking = false;
        this.player.blinkTimer = 0;
      }
    }

    // Screen effects decay
    if (this.screenFlash > 0) this.screenFlash -= 0.05;
    if (this.hurtFlash > 0) this.hurtFlash -= 0.035;
    if (this.screenShake > 0) this.screenShake *= 0.85;
    if (this.screenShake < 0.2) this.screenShake = 0;

    // Combo timeout check
    if (this.combo > 0 && Date.now() - this.lastMatchTime > COMBO_TIMEOUT_MS) {
      this.combo = 0;
    }

    // Spawn logic
    this.updateSpawns();

    // Update Entities
    this.updateGhosts();
    this.updateBoss();
    this.updateProjectiles();
    this.updateParticles();
    this.updateFloatingTexts();

    // Check Stage Clear condition
    if (!this.currentStage.isBossStage) {
      if (this.stageKills >= this.currentStage.targetKills && this.ghosts.length === 0) {
        this.onStageClear();
      }
    }
  }

  onStageClear() {
    this.gameState = 'STAGE_CLEAR';
    this.stageClearTimer = 0;
    magicAudio.playStageClear();

    // Stage Clear bonus score
    const hpBonus = this.player.hp * 300;
    const stageBonus = 1000 + (this.stageIndex + 1) * 500;
    this.addScore(stageBonus + hpBonus, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, `스테이지 클리어! +${stageBonus + hpBonus}`);

    // Celebration fireworks particles
    for (let i = 0; i < 40; i++) {
      this.createSparkleParticle(
        CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 300,
        CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 150,
        ['#F59E0B', '#10B981', '#38BDF8', '#EC4899', '#A855F7'][Math.floor(Math.random() * 5)]
      );
    }
  }

  updateSpawns() {
    if (this.currentStage.isBossStage) {
      // In boss stage, minions spawn periodically from the sides
      if (this.boss && this.ghosts.length < 3) {
        this.boss.minionSpawnTimer--;
        if (this.boss.minionSpawnTimer <= 0) {
          this.boss.minionSpawnTimer = 160;
          this.spawnGhost(true);
        }
      }
      return;
    }

    if (this.stageKills + this.ghosts.length < this.currentStage.targetKills) {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = Math.max(45, this.currentStage.spawnInterval - Math.floor(this.stageKills * 1.5));
        this.spawnGhost(false);
      }
    }
  }

  spawnGhost(isMinion = false) {
    // Spawn from top left, top right, left or right
    const side = Math.random();
    let startX = 0, startY = 0;
    if (side < 0.3) {
      startX = 80 + Math.random() * (CANVAS_WIDTH - 160);
      startY = -40;
    } else if (side < 0.65) {
      startX = -40;
      startY = 80 + Math.random() * (CANVAS_HEIGHT * 0.4);
    } else {
      startX = CANVAS_WIDTH + 40;
      startY = 80 + Math.random() * (CANVAS_HEIGHT * 0.4);
    }

    // Determine symbols
    const count = isMinion ? 1 : Math.min(
      this.currentStage.maxSymbolsPerGhost,
      1 + Math.floor(Math.random() * (this.currentStage.maxSymbolsPerGhost))
    );

    const symbols = [];
    const pool = [...this.currentStage.symbolsPool];
    for (let i = 0; i < count; i++) {
      const sym = pool[Math.floor(Math.random() * pool.length)];
      symbols.push(sym);
    }

    // Special chance to spawn a Heart symbol ghost if player is damaged
    if (this.player.hp < this.player.maxHp && this.currentStage.allowHeart && Math.random() < 0.18) {
      symbols[symbols.length - 1] = 'HEART';
    }

    this.ghosts.push({
      x: startX,
      y: startY,
      targetX: this.player.x,
      targetY: this.player.y,
      speed: (this.currentStage.ghostSpeed + (Math.random() * 0.3 - 0.15)) * (isMinion ? 0.9 : 1.0),
      size: 44,
      symbols: symbols,
      wobbleTimer: Math.random() * Math.PI * 2,
      colorVariant: Math.floor(Math.random() * 3), // 0: White/Cyan, 1: Blue/Lilac, 2: Yellowish
      hitFlash: 0
    });
  }

  updateGhosts() {
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i];
      g.wobbleTimer += 0.06;
      if (g.hitFlash > 0) g.hitFlash--;

      // Move toward player Momo
      const dx = this.player.x - g.x;
      const dy = this.player.y - g.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        g.x += (dx / dist) * g.speed;
        g.y += (dy / dist) * g.speed;
      }

      // Wobble perpendicular to movement
      const perpX = -dy / dist;
      const perpY = dx / dist;
      g.currentX = g.x + perpX * Math.sin(g.wobbleTimer) * 12;
      g.currentY = g.y + perpY * Math.sin(g.wobbleTimer) * 8;

      // Check collision with player
      if (dist < 46) {
        const hitTaken = this.onPlayerHit();
        if (hitTaken) {
          // Attacking ghost explodes upon dealing damage
          this.createPurifiedBurst(g.x, g.y, '#EF4444');
          this.ghosts.splice(i, 1);
        } else {
          // Player is in temporary immune flash: bounce ghost back slightly
          const pushAngle = Math.atan2(g.y - this.player.y, g.x - this.player.x);
          g.x = this.player.x + Math.cos(pushAngle) * 55;
          g.y = this.player.y + Math.sin(pushAngle) * 55;
        }
      }
    }
  }

  updateBoss() {
    if (!this.boss) return;
    this.boss.phaseTimer += 0.04;
    this.boss.hoverOffset = Math.sin(this.boss.phaseTimer) * 14;
    if (this.boss.hitTimer > 0) this.boss.hitTimer--;
  }

  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life--;

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20 || p.life <= 0) {
        // Hit explosion
        this.createPurifiedBurst(p.targetX, p.targetY, p.color);
        this.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
        // Sparkle trail
        if (Math.random() < 0.7) {
          this.createSparkleParticle(p.x, p.y, p.color);
        }
      }
    }
  }

  // Handle Gesture Drawing Match
  onGestureRecognized(symbolKey) {
    if (this.gameState !== 'PLAYING') return false;
    if (!symbolKey) return false;

    let matched = false;

    // 1. Check Lightning (⚡ AOE)
    if (symbolKey === 'LIGHTNING') {
      let lightningHits = 0;
      this.ghosts.forEach((g) => {
        if (g.symbols.length > 0 && g.symbols[0] === 'LIGHTNING') {
          this.castSpellOnGhost(g, 'LIGHTNING');
          lightningHits++;
        }
      });
      if (this.boss && this.boss.symbols.length > 0 && this.boss.symbols[0] === 'LIGHTNING') {
        this.castSpellOnBoss('LIGHTNING');
        lightningHits++;
      }

      if (lightningHits > 0) {
        matched = true;
        this.screenFlash = 0.8;
        this.screenShake = 12;
        magicAudio.playThunderZap();
      }
    }

    // 2. Check Heart (❤️ Heal)
    if (symbolKey === 'HEART') {
      let heartHit = false;
      this.ghosts.forEach((g) => {
        if (g.symbols.length > 0 && g.symbols[0] === 'HEART') {
          this.castSpellOnGhost(g, 'HEART');
          heartHit = true;
        }
      });

      if (heartHit) {
        if (this.player.hp < this.player.maxHp) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          this.addFloatingText(this.player.x, this.player.y - 70, '+1 HP ❤️ 회복!', '#10B981');
          magicAudio.playHeartHeal();
        }
        matched = true;
      }
    }

    // 3. Find closest ghost matching symbol at head of symbols array
    let closestGhost = null;
    let minDistance = Infinity;

    this.ghosts.forEach((g) => {
      if (g.symbols.length > 0 && g.symbols[0] === symbolKey) {
        const dist = Math.hypot(this.player.x - g.x, this.player.y - g.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestGhost = g;
        }
      }
    });

    if (closestGhost) {
      this.castSpellOnGhost(closestGhost, symbolKey);
      matched = true;
    } else if (this.boss && this.boss.symbols.length > 0 && this.boss.symbols[0] === symbolKey) {
      this.castSpellOnBoss(symbolKey);
      matched = true;
    }

    if (matched) {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.lastMatchTime = Date.now();
      magicAudio.playComboUp(this.combo);
      this.player.isCasting = true;
      this.player.castTimer = 16;
      return true;
    } else {
      // Missed stroke
      this.combo = 0;
      return false;
    }
  }

  castSpellOnGhost(ghost, symbolKey) {
    const symInfo = SYMBOLS[symbolKey] || SYMBOLS.HORIZONTAL;
    ghost.symbols.shift(); // Remove matched symbol
    ghost.hitFlash = 12;

    // Aim wand at target
    this.player.targetWandAngle = Math.atan2(ghost.y - this.player.y, ghost.x - this.player.x);

    // Fire projectile
    this.projectiles.push({
      x: this.player.x,
      y: this.player.y - 30,
      targetX: ghost.x,
      targetY: ghost.y,
      speed: 28,
      life: 30,
      color: symInfo.color
    });

    magicAudio.playCastSuccess(symbolKey);

    const matchScore = 100 + (this.combo * 25);
    this.addScore(matchScore, ghost.x, ghost.y - 20, `+${matchScore}`);

    // If all symbols on ghost cleared -> Purified!
    if (ghost.symbols.length === 0) {
      const idx = this.ghosts.indexOf(ghost);
      if (idx !== -1) {
        this.ghosts.splice(idx, 1);
        this.purifiedCount++;
        this.stageKills++;
        this.createPurifiedBurst(ghost.x, ghost.y, symInfo.color);
        magicAudio.playGhostPurified();
        this.addScore(200, ghost.x, ghost.y - 40, '정화 완료! +200');
      }
    }
  }

  castSpellOnBoss(symbolKey) {
    if (!this.boss) return;
    const symInfo = SYMBOLS[symbolKey] || SYMBOLS.HORIZONTAL;
    this.boss.symbols.shift();
    this.boss.hitTimer = 14;
    this.screenShake = 8;

    this.player.targetWandAngle = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);

    this.projectiles.push({
      x: this.player.x,
      y: this.player.y - 30,
      targetX: this.boss.x,
      targetY: this.boss.y,
      speed: 32,
      life: 30,
      color: symInfo.color
    });

    magicAudio.playCastSuccess(symbolKey);
    const matchScore = 150 + (this.combo * 30);
    this.addScore(matchScore, this.boss.x, this.boss.y - 30, `보스 타격! +${matchScore}`);

    // If current combo line completed
    if (this.boss.symbols.length === 0) {
      this.boss.hp--;
      this.createPurifiedBurst(this.boss.x, this.boss.y, '#F43F5E');
      this.screenFlash = 0.5;

      if (this.boss.hp <= 0) {
        // Victory!
        this.gameState = 'VICTORY';
        magicAudio.playBossDefeat();
        this.addScore(5000, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '대마법서 탈환! 보스 퇴치 +5000');
      } else {
        // Next phase symbols
        this.boss.symbols = this.generateBossSymbols();
      }
    }
  }

  onPlayerHit() {
    if (this.player.invulnerableTimer > 0) return false;
    this.player.hp = Math.max(0, this.player.hp - 1);
    this.player.invulnerableTimer = 35;
    this.player.hurtAnimTimer = 30;
    this.combo = 0;
    this.screenFlash = 0.5;
    this.hurtFlash = 0.85;
    this.screenShake = 14;
    magicAudio.playPlayerHurt();

    // Floating damage text directly above Momo
    this.addFloatingText(this.player.x, this.player.y - 75, '-1 HP 💔 피격!', '#EF4444');

    // Red spark particles around Momo
    for (let i = 0; i < 16; i++) {
      this.createSparkleParticle(
        this.player.x + (Math.random() - 0.5) * 36,
        this.player.y + (Math.random() - 0.5) * 30,
        '#EF4444'
      );
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameState = 'GAME_OVER';
      magicAudio.playGameOver();
    }
    return true;
  }

  addScore(points, x, y, label = '') {
    this.score += points;
    if (label) {
      this.addFloatingText(x, y, label, '#FBBF24');
    }
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y,
      text: text,
      color: color,
      alpha: 1.0,
      life: 45
    });
  }

  updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.life--;
      ft.alpha = ft.life / 45;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  createSparkleParticle(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: 3 + Math.random() * 4,
      color: color,
      alpha: 1.0,
      decay: 0.04 + Math.random() * 0.03
    });
  }

  createPurifiedBurst(x, y, color) {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        color: color,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.02
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.96;
      if (p.alpha <= 0 || p.size < 0.5) {
        this.particles.splice(i, 1);
      }
    }
  }

  // =========================================================
  // Canvas 2D Rendering Pipeline
  // =========================================================
  render(ctx) {
    ctx.save();

    // Screen shake offset
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Background
    this.renderBackground(ctx);

    // 2. Draw Boss (if Stage 5)
    if (this.boss && this.gameState !== 'VICTORY') {
      this.renderBoss(ctx);
    }

    // 3. Draw Ghosts
    this.renderGhosts(ctx);

    // 4. Draw Projectiles
    this.renderProjectiles(ctx);

    // 5. Draw Particles
    this.renderParticles(ctx);

    // 6. Draw Player Momo
    this.renderPlayerMomo(ctx);

    // 7. Draw Drawing Stroke (Live user gesture)
    this.renderDrawingStroke(ctx);

    // 8. Draw Floating Score Texts
    this.renderFloatingTexts(ctx);

    // 9. Draw Red Damage Hurt Vignette
    if (this.hurtFlash > 0) {
      const hurtGrad = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.25,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
      );
      hurtGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      hurtGrad.addColorStop(1, `rgba(239, 68, 68, ${Math.min(0.6, this.hurtFlash)})`);
      ctx.fillStyle = hurtGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 10. Draw Screen Flash Overlay
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.screenFlash)})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }

  renderBackground(ctx) {
    const bgImg = this.bgImages[this.currentStage.stage];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Procedural Fantasy Night Sky Fallback
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#1E1B4B');
      grad.addColorStop(0.6, '#312E81');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Ambient Magic Vignette
    const vignette = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  renderPlayerMomo(ctx) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Hurt invulnerability flash
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Floating Mini HP Hearts directly above Momo's Hat (Always visible for clear HP awareness)
    const heartSpacing = 16;
    const startX = -((p.maxHp - 1) * heartSpacing) / 2;
    const heartY = -72;

    for (let i = 0; i < p.maxHp; i++) {
      const hx = startX + i * heartSpacing;
      ctx.save();
      ctx.translate(hx, heartY);
      if (i < p.hp) {
        // Active Red Glowing Heart
        ctx.fillStyle = '#F43F5E';
        ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
        ctx.shadowBlur = 6;
      } else {
        // Depleted Dark Heart
        ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.bezierCurveTo(-4.5, -2, -7.5, 2.5, 0, 8);
      ctx.bezierCurveTo(7.5, 2.5, 4.5, -2, 0, 3);
      ctx.fill();
      ctx.restore();
    }

    // Soft Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Momo Body (Black Cat)
    ctx.fillStyle = p.hurtAnimTimer > 0 ? '#450A0A' : '#18181B';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cat Ears
    ctx.fillStyle = p.hurtAnimTimer > 0 ? '#450A0A' : '#18181B';
    // Left Ear
    ctx.beginPath();
    ctx.moveTo(-18, -12);
    ctx.lineTo(-24, -30);
    ctx.lineTo(-6, -18);
    ctx.fill();
    // Left Ear Pink Inside
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(-21, -26);
    ctx.lineTo(-8, -18);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = p.hurtAnimTimer > 0 ? '#450A0A' : '#18181B';
    ctx.beginPath();
    ctx.moveTo(6, -18);
    ctx.lineTo(24, -30);
    ctx.lineTo(18, -12);
    ctx.fill();
    // Right Ear Pink Inside
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(8, -18);
    ctx.lineTo(21, -26);
    ctx.lineTo(16, -14);
    ctx.fill();

    // Wizard Robe Collar & Gold Amulet
    ctx.fillStyle = '#6366F1';
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(0, 16);
    ctx.lineTo(16, 4);
    ctx.lineTo(0, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cat Eyes: Normal / Blinking / Hurt (> <)
    if (p.hurtAnimTimer > 0) {
      // Hurt > < Eyes in fiery amber
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      // Left eye >
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-12, 0);
      ctx.stroke();
      // Right eye <
      ctx.beginPath();
      ctx.moveTo(12, -8);
      ctx.lineTo(6, -4);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // Sweat drop
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(18, -12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (!p.isBlinking) {
      ctx.fillStyle = '#FDE047';
      // Left Eye
      ctx.beginPath();
      ctx.ellipse(-9, -4, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right Eye
      ctx.beginPath();
      ctx.ellipse(9, -4, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black Pupils
      ctx.fillStyle = '#09090B';
      ctx.beginPath();
      ctx.arc(-8, -4, 3.5, 0, Math.PI * 2);
      ctx.arc(10, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye White Sparkles
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-10, -6, 2, 0, Math.PI * 2);
      ctx.arc(8, -6, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cute Closed Blink Eye Curves
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-9, -4, 5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.arc(9, -4, 5, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    // Cute Nose & Whiskers
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(0, 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-12, 3); ctx.lineTo(-24, 0);
    ctx.moveTo(-12, 6); ctx.lineTo(-24, 8);
    ctx.moveTo(12, 3); ctx.lineTo(24, 0);
    ctx.moveTo(12, 6); ctx.lineTo(24, 8);
    ctx.stroke();

    // Wizard Hat
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.ellipse(0, -18, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4338CA';
    ctx.beginPath();
    ctx.moveTo(-20, -18);
    ctx.quadraticCurveTo(0, -56, 16, -58);
    ctx.lineTo(20, -18);
    ctx.closePath();
    ctx.fill();

    // Hat Gold Ribbon
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(0, -20, 20, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Magic Wand in Paw
    ctx.save();
    ctx.translate(14, 6);
    ctx.rotate(p.wandAngle);

    // Wand Stick
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(36, 0);
    ctx.stroke();

    // Wand Tip Star Gem
    ctx.fillStyle = '#FBBF24';
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(38, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  renderGhosts(ctx) {
    this.ghosts.forEach((g) => {
      ctx.save();
      ctx.translate(g.currentX || g.x, g.currentY || g.y);

      // Hit flash
      if (g.hitFlash > 0) {
        ctx.fillStyle = '#FFFFFF';
      } else {
        // Translucent Ghost Gradient
        const grad = ctx.createLinearGradient(0, -24, 0, 24);
        if (g.colorVariant === 0) {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          grad.addColorStop(1, 'rgba(186, 230, 253, 0.85)');
        } else if (g.colorVariant === 1) {
          grad.addColorStop(0, 'rgba(243, 232, 255, 0.95)');
          grad.addColorStop(1, 'rgba(216, 180, 254, 0.85)');
        } else {
          grad.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
          grad.addColorStop(1, 'rgba(253, 224, 71, 0.85)');
        }
        ctx.fillStyle = grad;
      }

      ctx.shadowColor = 'rgba(125, 211, 252, 0.5)';
      ctx.shadowBlur = 12;

      // Cute Ghost Body with wavy tail
      ctx.beginPath();
      ctx.arc(0, -8, 20, Math.PI, 0, false);
      ctx.lineTo(20, 16);
      // 3 Wave tails
      ctx.quadraticCurveTo(13, 24, 6, 16);
      ctx.quadraticCurveTo(0, 24, -6, 16);
      ctx.quadraticCurveTo(-13, 24, -20, 16);
      ctx.closePath();
      ctx.fill();

      // Ghost Eyes
      ctx.fillStyle = '#0F172A';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(-7, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(7, -8, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Ghost Cute Blushing Cheeks
      ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
      ctx.beginPath();
      ctx.arc(-12, -2, 3, 0, Math.PI * 2);
      ctx.arc(12, -2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Render Symbols Above Ghost Head
      this.renderSymbolQueue(ctx, g.symbols, 0, -42);

      ctx.restore();
    });
  }

  renderBoss(ctx) {
    const b = this.boss;
    ctx.save();
    ctx.translate(b.x, b.y + b.hoverOffset);

    // Boss Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 160, 100, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giant Dark/Purple Ghost Body
    if (b.hitTimer > 0) {
      ctx.fillStyle = '#FFFFFF';
    } else {
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 90);
      grad.addColorStop(0, '#7E22CE');
      grad.addColorStop(0.7, '#4C1D95');
      grad.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = grad;
    }

    ctx.shadowColor = '#C084FC';
    ctx.shadowBlur = 24;

    // Giant Ghost Head and Wings
    ctx.beginPath();
    ctx.arc(0, -20, 60, Math.PI, 0, false);
    ctx.lineTo(60, 60);
    // Wavy giant tails
    ctx.quadraticCurveTo(30, 85, 0, 60);
    ctx.quadraticCurveTo(-30, 85, -60, 60);
    ctx.closePath();
    ctx.fill();

    // Giant Glowing Red Eyes
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#F87171';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-24, -20, 14, 18, -0.2, 0, Math.PI * 2);
    ctx.ellipse(24, -20, 14, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Boss Master Spellbook in hands
    ctx.fillStyle = '#B45309';
    ctx.fillRect(-35, 20, 70, 48);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(-30, 24, 60, 40);
    // Magic Star on book
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(0, 44, 10, 0, Math.PI * 2);
    ctx.fill();

    // Boss HP Bar
    const barW = 200;
    const barH = 14;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(-barW / 2, -100, barW, barH);
    ctx.fillStyle = '#EF4444';
    const hpRatio = Math.max(0, b.hp / b.maxHp);
    ctx.fillRect(-barW / 2, -100, barW * hpRatio, barH);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.strokeRect(-barW / 2, -100, barW, barH);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`대마법서 보스 HP (${b.hp}/${b.maxHp})`, 0, -104);

    // Symbols Queue Above Boss
    this.renderSymbolQueue(ctx, b.symbols, 0, -65, true);

    ctx.restore();
  }

  renderSymbolQueue(ctx, symbols, centerX, centerY, isLarge = false) {
    if (!symbols || symbols.length === 0) return;

    const badgeSize = isLarge ? 28 : 22;
    const spacing = isLarge ? 34 : 26;
    const startX = centerX - ((symbols.length - 1) * spacing) / 2;

    symbols.forEach((symKey, idx) => {
      const sym = SYMBOLS[symKey] || SYMBOLS.HORIZONTAL;
      const x = startX + idx * spacing;
      const y = centerY;

      // Badge Background
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = sym.color;
      ctx.lineWidth = idx === 0 ? 2.5 : 1.5;
      ctx.shadowColor = sym.glowColor;
      ctx.shadowBlur = idx === 0 ? 10 : 4;

      ctx.beginPath();
      ctx.arc(x, y, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Symbol Icon
      ctx.fillStyle = sym.color;
      ctx.font = `bold ${isLarge ? 16 : 13}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sym.char, x, y + 1);

      ctx.restore();
    });
  }

  renderProjectiles(ctx) {
    this.projectiles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderDrawingStroke(ctx) {
    if (!this.currentStroke || this.currentStroke.length < 2) return;

    ctx.save();
    ctx.strokeStyle = '#FDE047';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(this.currentStroke[0].x, this.currentStroke[0].y);
    for (let i = 1; i < this.currentStroke.length; i++) {
      ctx.lineTo(this.currentStroke[i].x, this.currentStroke[i].y);
    }
    ctx.stroke();

    // Sparkle at current cursor point
    const latest = this.currentStroke[this.currentStroke.length - 1];
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFloatingTexts(ctx) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = '900 15px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}
