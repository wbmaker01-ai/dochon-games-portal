// Dochon Brick Breaker Physics Engine, Canvas 2D Rendering & Collision System
import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_DEFAULT, BALL_DEFAULT, BRICK_TYPES, POWERUP_TYPES, POWERUP_DROP_CHANCE } from './brickBreakerConstants';
import { brickAudio } from './brickBreakerAudio';

// 1. Particle System for Shatter Effects & Sparkles
export class Particle {
  constructor(x, y, color, speedScale = 1) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 4 + 1.5) * speedScale;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 3.5 + 2;
    this.life = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
    this.gravity = 0.12;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.98;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 2. Floating Floating Score Text
export class FloatingText {
  constructor(x, y, text, color = '#FDE047') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.0;
    this.vy = -1.5;
  }

  update() {
    this.y += this.vy;
    this.life -= 0.025;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// 3. Laser Bullet Class
export class LaserBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = -14;
    this.width = 4;
    this.height = 16;
    this.isDead = false;
  }

  update() {
    this.y += this.vy;
    if (this.y < -20) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#FDE047';
    ctx.shadowColor = '#EAB308';
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.x - this.width / 4, this.y + 2, this.width / 2, this.height - 4);
    ctx.restore();
  }
}

// 4. Power-Up Capsule Drop
export class PowerUpCapsule {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.type = POWERUP_TYPES[typeKey];
    this.typeKey = typeKey;
    this.width = 30;
    this.height = 18;
    this.vy = 2.2;
    this.isDead = false;
    this.glowTimer = Math.random() * Math.PI * 2;
  }

  update() {
    this.y += this.vy;
    this.glowTimer += 0.08;
    if (this.y > CANVAS_HEIGHT + 30) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    const pulse = Math.sin(this.glowTimer) * 4 + 8;
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = pulse;

    // Capsule pill body
    const r = this.height / 2;
    const x = this.x - this.width / 2;
    const y = this.y - this.height / 2;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + this.width - r, y);
    ctx.arc(x + this.width - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + this.height);
    ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x, y + this.height);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, this.type.color);
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon Emoji
    ctx.shadowBlur = 0;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, this.x, this.y + 1);

    ctx.restore();
  }
}

// 5. Paddle Class
export class Paddle {
  constructor() {
    this.reset();
  }

  reset() {
    this.baseWidth = PADDLE_DEFAULT.WIDTH;
    this.width = this.baseWidth;
    this.height = PADDLE_DEFAULT.HEIGHT;
    this.x = CANVAS_WIDTH / 2 - this.width / 2;
    this.y = CANVAS_HEIGHT - PADDLE_DEFAULT.Y_OFFSET;
    this.targetX = this.x;
    this.speed = PADDLE_DEFAULT.SPEED;

    // Buff States
    this.isWide = false;
    this.wideTimer = 0;
    this.isLaserActive = false;
    this.laserTimer = 0;
    this.laserCooldown = 0;
  }

  setWide(durationMs) {
    this.isWide = true;
    this.wideTimer = Date.now() + durationMs;
    this.width = this.baseWidth * 1.45;
  }

  setLaser(durationMs) {
    this.isLaserActive = true;
    this.laserTimer = Date.now() + durationMs;
  }

  update(keys) {
    const now = Date.now();

    // Check Wide Buff expiration
    if (this.isWide && now > this.wideTimer) {
      this.isWide = false;
      this.width = this.baseWidth;
    }

    // Check Laser Buff expiration
    if (this.isLaserActive && now > this.laserTimer) {
      this.isLaserActive = false;
    }

    // Keyboard Smooth Movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.targetX -= this.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.targetX += this.speed;
    }

    // Clamp target
    if (this.targetX < 4) this.targetX = 4;
    if (this.targetX + this.width > CANVAS_WIDTH - 4) {
      this.targetX = CANVAS_WIDTH - 4 - this.width;
    }

    // Smooth Lerp to target
    this.x += (this.targetX - this.x) * 0.45;
  }

  shootLaser(bullets) {
    if (!this.isLaserActive) return;
    const now = Date.now();
    if (now - this.laserCooldown < 250) return; // 250ms cooldown
    this.laserCooldown = now;

    // Left cannon and right cannon
    bullets.push(new LaserBullet(this.x + 8, this.y - 2));
    bullets.push(new LaserBullet(this.x + this.width - 8, this.y - 2));
    brickAudio.playLaser();
  }

  draw(ctx) {
    ctx.save();
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = h / 2;

    // Paddle Outer Glow
    ctx.shadowColor = this.isLaserActive ? '#FBBF24' : (this.isWide ? '#38BDF8' : '#0284C7');
    ctx.shadowBlur = 12;

    // Rounded Paddle Bar
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (this.isLaserActive) {
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.5, '#EAB308');
      grad.addColorStop(1, '#A16207');
    } else if (this.isWide) {
      grad.addColorStop(0, '#BAE6FD');
      grad.addColorStop(0.5, '#0284C7');
      grad.addColorStop(1, '#0369A1');
    } else {
      grad.addColorStop(0, '#E0F2FE');
      grad.addColorStop(0.5, '#38BDF8');
      grad.addColorStop(1, '#0284C7');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center Grip Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(x + w / 2 - 12, y + 4, 24, h - 8);

    // Laser Cannons visuals
    if (this.isLaserActive) {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x + 4, y - 5, 8, 6);
      ctx.fillRect(x + w - 12, y - 5, 8, 6);
    }

    ctx.restore();
  }
}

// 6. Ball Class
export class Ball {
  constructor(x, y, vx, vy) {
    this.x = x || CANVAS_WIDTH / 2;
    this.y = y || CANVAS_HEIGHT - 65;
    this.radius = BALL_DEFAULT.RADIUS;
    this.baseSpeed = BALL_DEFAULT.BASE_SPEED;
    this.currentSpeed = this.baseSpeed;
    this.isFireball = false;
    this.fireballTimer = 0;
    this.isDead = false;
    this.trail = [];

    if (vx !== undefined && vy !== undefined) {
      this.vx = vx;
      this.vy = vy;
      this.isLaunched = true;
    } else {
      this.vx = 0;
      this.vy = 0;
      this.isLaunched = false;
    }
  }

  launch(angleRad = -Math.PI / 3) {
    if (this.isLaunched) return;
    this.isLaunched = true;
    this.vx = Math.cos(angleRad) * this.currentSpeed;
    this.vy = Math.sin(angleRad) * this.currentSpeed;
  }

  setFireball(durationMs) {
    this.isFireball = true;
    this.fireballTimer = Date.now() + durationMs;
  }

  setSlow(durationMs) {
    this.currentSpeed = Math.max(3.8, this.baseSpeed * 0.75);
    const angle = Math.atan2(this.vy, this.vx);
    this.vx = Math.cos(angle) * this.currentSpeed;
    this.vy = Math.sin(angle) * this.currentSpeed;
  }

  update(paddle, hasSafetyBarrier, onBarrierBreak) {
    const now = Date.now();

    // Check Fireball expiration
    if (this.isFireball && now > this.fireballTimer) {
      this.isFireball = false;
    }

    if (!this.isLaunched) {
      // Stuck to paddle center before launch
      this.x = paddle.x + paddle.width / 2;
      this.y = paddle.y - this.radius - 2;
      return;
    }

    // Trail updates
    this.trail.push({ x: this.x, y: this.y, isFire: this.isFireball });
    if (this.trail.length > (this.isFireball ? 9 : 5)) {
      this.trail.shift();
    }

    this.x += this.vx;
    this.y += this.vy;

    // Left Wall
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      brickAudio.playWallBounce();
    }
    // Right Wall
    if (this.x + this.radius > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.radius;
      this.vx = -Math.abs(this.vx);
      brickAudio.playWallBounce();
    }
    // Top Ceiling
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      brickAudio.playWallBounce();
    }

    // Bottom Wall & Safety Barrier
    if (this.y + this.radius > CANVAS_HEIGHT - 6) {
      if (hasSafetyBarrier) {
        this.y = CANVAS_HEIGHT - 6 - this.radius;
        this.vy = -Math.abs(this.vy);
        brickAudio.playPaddleBounce();
        if (onBarrierBreak) onBarrierBreak();
      } else if (this.y > CANVAS_HEIGHT + 20) {
        this.isDead = true;
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw Motion Trail
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const alpha = (i + 1) / this.trail.length * (this.isFireball ? 0.6 : 0.3);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.isFire ? '#F97316' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, this.radius * (0.4 + 0.6 * (i / this.trail.length)), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
    ctx.shadowColor = this.isFireball ? '#EF4444' : '#38BDF8';
    ctx.shadowBlur = this.isFireball ? 16 : 8;

    // Main Ball
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      1,
      this.x,
      this.y,
      this.radius
    );

    if (this.isFireball) {
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.4, '#F97316');
      grad.addColorStop(1, '#DC2626');
    } else {
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.5, '#BAE6FD');
      grad.addColorStop(1, '#0284C7');
    }

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

// 7. Brick Class
export class Brick {
  constructor(col, row, typeKey, gridWidth, gridHeight, offsetX, offsetY) {
    this.col = col;
    this.row = row;
    this.typeKey = typeKey;
    this.type = BRICK_TYPES[typeKey] || BRICK_TYPES.NORMAL_1;
    this.hp = this.type.hp;
    this.maxHp = this.type.hp;
    this.isDestroyed = false;

    this.width = gridWidth;
    this.height = gridHeight;
    this.x = offsetX + col * (this.width + 4);
    this.y = offsetY + row * (this.height + 4);
  }

  hit(damage = 1) {
    if (this.type.id === 'UNB') return false; // Unbreakable

    this.hp -= damage;
    if (this.hp <= 0) {
      this.isDestroyed = true;
      return true; // Destroyed
    }
    return false; // Damaged only
  }

  draw(ctx) {
    if (this.isDestroyed) return;
    ctx.save();

    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = 4;

    ctx.shadowColor = this.type.borderColor;
    ctx.shadowBlur = 4;

    // Rounded Box
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    ctx.closePath();

    // 3D Bevel Gradient Fill
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.2, this.type.color);
    grad.addColorStop(0.8, this.type.color);
    grad.addColorStop(1, this.type.borderColor);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = this.type.borderColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 2, y + 2, w - 4, h * 0.35);

    // Special Brick Icons
    if (this.type.id === 'BOMB') {
      ctx.shadowBlur = 0;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', x + w / 2, y + h / 2 + 1);
    } else if (this.type.id === 'STAR') {
      ctx.shadowBlur = 0;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', x + w / 2, y + h / 2 + 1);
    } else if (this.type.id === 'UNB') {
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(x + 6, y + h / 2 - 2, w - 12, 4);
    } else if (this.maxHp > 1) {
      // Crack indicators for damaged multi-hit bricks
      if (this.hp < this.maxHp) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + 2);
        ctx.lineTo(x + w * 0.5, y + h * 0.6);
        ctx.lineTo(x + w * 0.7, y + h - 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// 8. Main Physics & Game Session Engine
export class PhysicsEngine {
  constructor() {
    this.paddle = new Paddle();
    this.balls = [new Ball()];
    this.bricks = [];
    this.particles = [];
    this.floatingTexts = [];
    this.capsules = [];
    this.laserBullets = [];
    this.hasSafetyBarrier = false;
    this.barrierTimer = 0;
    this.activeStage = 1;
    this.keys = {};
  }

  loadStage(stageConfig) {
    this.paddle.reset();
    this.balls = [new Ball()];
    this.particles = [];
    this.floatingTexts = [];
    this.capsules = [];
    this.laserBullets = [];
    this.hasSafetyBarrier = false;
    this.activeStage = stageConfig.stage;

    const grid = stageConfig.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const padding = 16;
    const gap = 4;
    const availableWidth = CANVAS_WIDTH - padding * 2 - (cols - 1) * gap;
    const brickWidth = availableWidth / cols;
    const brickHeight = 18;
    const startY = 70;

    const typeCodeMap = {
      1: 'NORMAL_1',
      2: 'NORMAL_2',
      3: 'NORMAL_3',
      4: 'NORMAL_4',
      5: 'HARD_2',
      6: 'HARD_3',
      7: 'BOMB',
      8: 'STAR',
      9: 'UNBREAKABLE'
    };

    this.bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const code = grid[r][c];
        if (code > 0) {
          const typeKey = typeCodeMap[code] || 'NORMAL_1';
          const brick = new Brick(c, r, typeKey, brickWidth, brickHeight, padding, startY);
          this.bricks.push(brick);
        }
      }
    }
  }

  spawnParticles(x, y, color, count = 12, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, speedScale));
    }
  }

  spawnFloatingText(x, y, text, color) {
    this.floatingTexts.push(new FloatingText(x, y, text, color));
  }

  maybeDropPowerUp(x, y) {
    if (Math.random() < POWERUP_DROP_CHANCE) {
      const keys = Object.keys(POWERUP_TYPES);
      const chosenKey = keys[Math.floor(Math.random() * keys.length)];
      this.capsules.push(new PowerUpCapsule(x, y, chosenKey));
    }
  }

  activatePowerUp(typeKey, onExtraLife) {
    const power = POWERUP_TYPES[typeKey];
    if (!power) return;

    brickAudio.playPowerUpCollect();
    this.spawnFloatingText(this.paddle.x + this.paddle.width / 2, this.paddle.y - 15, `+ ${power.name}!`, power.color);

    switch (typeKey) {
      case 'MULTIBALL':
        // Duplicate each active ball into 3 balls
        const newBalls = [];
        this.balls.forEach(b => {
          if (b.isLaunched) {
            newBalls.push(new Ball(b.x, b.y, b.vx * 0.9 - 2, b.vy * 0.9));
            newBalls.push(new Ball(b.x, b.y, b.vx * 0.9 + 2, b.vy * 0.9));
          }
        });
        this.balls = [...this.balls, ...newBalls];
        break;

      case 'WIDE_PADDLE':
        this.paddle.setWide(power.duration);
        break;

      case 'LASER':
        this.paddle.setLaser(power.duration);
        break;

      case 'FIREBALL':
        this.balls.forEach(b => b.setFireball(power.duration));
        break;

      case 'SAFETY_BARRIER':
        this.hasSafetyBarrier = true;
        this.barrierTimer = Date.now() + power.duration;
        break;

      case 'SLOW':
        this.balls.forEach(b => b.setSlow(power.duration));
        break;

      case 'EXTRA_LIFE':
        if (onExtraLife) onExtraLife();
        break;

      default:
        break;
    }
  }

  explodeBomb(bombBrick, onScoreAdd) {
    brickAudio.playExplosion();
    this.spawnParticles(bombBrick.x + bombBrick.width / 2, bombBrick.y + bombBrick.height / 2, '#EF4444', 28, 2);

    // 3x3 surrounding radius
    const targetCol = bombBrick.col;
    const targetRow = bombBrick.row;

    this.bricks.forEach(b => {
      if (!b.isDestroyed && b.type.id !== 'UNB') {
        const dCol = Math.abs(b.col - targetCol);
        const dRow = Math.abs(b.row - targetRow);
        if (dCol <= 1 && dRow <= 1) {
          const destroyed = b.hit(99);
          if (destroyed) {
            if (onScoreAdd) onScoreAdd(b.type.score);
            this.spawnParticles(b.x + b.width / 2, b.y + b.height / 2, b.type.color, 8);
          }
        }
      }
    });
  }

  update(onScoreAdd, onExtraLife, onLifeLost, onStageClear) {
    const now = Date.now();

    // Check Safety Barrier Expiration
    if (this.hasSafetyBarrier && now > this.barrierTimer) {
      this.hasSafetyBarrier = false;
    }

    // 1. Update Paddle
    this.paddle.update(this.keys);

    // 2. Update Laser Bullets
    for (let i = this.laserBullets.length - 1; i >= 0; i--) {
      const bullet = this.laserBullets[i];
      bullet.update();
      if (bullet.isDead) {
        this.laserBullets.splice(i, 1);
        continue;
      }

      // Check bullet hit on bricks
      for (const brick of this.bricks) {
        if (!brick.isDestroyed && brick.type.id !== 'UNB') {
          if (
            bullet.x >= brick.x &&
            bullet.x <= brick.x + brick.width &&
            bullet.y >= brick.y &&
            bullet.y <= brick.y + brick.height
          ) {
            bullet.isDead = true;
            const destroyed = brick.hit(1);
            if (destroyed) {
              if (brick.type.id === 'BOMB') {
                this.explodeBomb(brick, onScoreAdd);
              } else {
                brickAudio.playBrickHit(true, brick.type.id);
                this.spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.type.color, 10);
                this.maybeDropPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
              }
              if (onScoreAdd) onScoreAdd(brick.type.score);
            } else {
              brickAudio.playBrickHit(false, brick.type.id);
            }
            break;
          }
        }
      }
    }

    // 3. Update Power-Up Capsules
    for (let i = this.capsules.length - 1; i >= 0; i--) {
      const cap = this.capsules[i];
      cap.update();
      if (cap.isDead) {
        this.capsules.splice(i, 1);
        continue;
      }

      // Check collection with Paddle
      if (
        cap.y + cap.height / 2 >= this.paddle.y &&
        cap.y - cap.height / 2 <= this.paddle.y + this.paddle.height &&
        cap.x + cap.width / 2 >= this.paddle.x &&
        cap.x - cap.width / 2 <= this.paddle.x + this.paddle.width
      ) {
        this.activatePowerUp(cap.typeKey, onExtraLife);
        this.capsules.splice(i, 1);
      }
    }

    // 4. Update Balls & Collision
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update(this.paddle, this.hasSafetyBarrier, () => {
        this.hasSafetyBarrier = false;
      });

      if (ball.isDead) {
        this.balls.splice(i, 1);
        continue;
      }

      if (!ball.isLaunched) continue;

      // Ball vs Paddle Collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= this.paddle.y &&
        ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
        ball.x >= this.paddle.x - ball.radius &&
        ball.x <= this.paddle.x + this.paddle.width + ball.radius
      ) {
        ball.y = this.paddle.y - ball.radius;

        // Calculate bounce angle based on hit position (-60 deg to +60 deg)
        const hitOffset = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));
        const maxAngle = (Math.PI / 180) * 60;
        const bounceAngle = clampedOffset * maxAngle - Math.PI / 2;

        ball.vx = Math.cos(bounceAngle) * ball.currentSpeed;
        ball.vy = Math.sin(bounceAngle) * ball.currentSpeed;

        brickAudio.playPaddleBounce();
        this.spawnParticles(ball.x, ball.y, '#38BDF8', 5);
      }

      // Ball vs Brick Collision (AABB Box with Circle)
      for (const brick of this.bricks) {
        if (brick.isDestroyed) continue;

        // Closest point on brick to ball center
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < ball.radius * ball.radius) {
          // Collision detected!
          const destroyed = brick.hit(ball.isFireball ? 99 : 1);

          if (destroyed) {
            if (brick.type.id === 'BOMB') {
              this.explodeBomb(brick, onScoreAdd);
            } else {
              brickAudio.playBrickHit(true, brick.type.id);
              this.spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.type.color, 12);
              this.maybeDropPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
            if (onScoreAdd) onScoreAdd(brick.type.score);
          } else {
            brickAudio.playBrickHit(false, brick.type.id);
            this.spawnParticles(closestX, closestY, brick.type.borderColor, 4);
          }

          // If not fireball, reflect ball velocity
          if (!ball.isFireball) {
            const overlapX = ball.radius - Math.abs(distX);
            const overlapY = ball.radius - Math.abs(distY);

            if (overlapX < overlapY) {
              ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
            } else {
              ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
            }
            break; // Handle one brick bounce per frame
          }
        }
      }
    }

    // 5. Check Life Lost Condition
    if (this.balls.length === 0) {
      brickAudio.playLifeLost();
      if (onLifeLost) onLifeLost();
      this.balls = [new Ball()]; // Respawn ball onto paddle
    }

    // 6. Check Stage Clear Condition
    const remainingBreakable = this.bricks.filter(b => !b.isDestroyed && b.type.id !== 'UNB').length;
    if (remainingBreakable === 0) {
      brickAudio.playStageClear();
      if (onStageClear) onStageClear();
    }

    // 7. Update Particles & Floating Text
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      if (this.floatingTexts[i].life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // 1. Clear & Background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Deep Neon Cyber Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(0.5, '#090D16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle Cyber Grid Pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Safety Barrier (if active)
    if (this.hasSafetyBarrier) {
      ctx.save();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#34D399';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 6);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 6);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Bricks
    this.bricks.forEach(b => b.draw(ctx));

    // 4. Draw Laser Bullets
    this.laserBullets.forEach(lb => lb.draw(ctx));

    // 5. Draw Power-Up Capsules
    this.capsules.forEach(cap => cap.draw(ctx));

    // 6. Draw Paddle
    this.paddle.draw(ctx);

    // 7. Draw Balls
    this.balls.forEach(ball => ball.draw(ctx));

    // 8. Draw Particles & Floating Text
    this.particles.forEach(p => p.draw(ctx));
    this.floatingTexts.forEach(ft => ft.draw(ctx));
  }
}
