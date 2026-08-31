// 2D Circle Physics Engine & Particle System for Fruit Merge (도촌 과일 합치기)
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_TOP,
  BOX_BOTTOM,
  BOX_WIDTH,
  BOX_HEIGHT,
  GRAVITY,
  AIR_RESISTANCE,
  WALL_RESTITUTION,
  FRICTION_GROUND,
  FRICTION_COLLISION,
  FRUITS,
  DEADLINE_GRACE_TIME_MS
} from './fruitMergeConstants';
import { fruitAudio } from './fruitMergeAudio';

let fruitIdCounter = 1;

// --- Fruit Entity Class ---
export class Fruit {
  constructor(level, x, y, vx = 0, vy = 0) {
    this.id = fruitIdCounter++;
    this.level = Math.min(Math.max(level, 0), FRUITS.length - 1);
    this.data = FRUITS[this.level];
    this.radius = this.data.radius;
    this.mass = this.data.mass;
    this.restitution = this.data.restitution;

    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    this.rotation = Math.random() * Math.PI * 2;
    this.vRot = (Math.random() - 0.5) * 0.05;

    // Visual animation states
    this.scale = 0.1; // Spawn pop-in animation
    this.targetScale = 1.0;
    this.squashX = 1.0;
    this.squashY = 1.0;

    // Cute Face Animation
    this.blinkTimer = Math.random() * 200 + 100;
    this.isBlinking = false;
    this.faceType = (this.id % 4); // 4 cute face variants

    this.isMerged = false;
    this.aboveDeadlineTime = 0; // ms spent above top line
  }

  update(dt = 1) {
    // Spawn pop animation
    if (this.scale < this.targetScale) {
      this.scale += (this.targetScale - this.scale) * 0.25;
      if (Math.abs(this.targetScale - this.scale) < 0.01) this.scale = this.targetScale;
    }

    // Squash & Stretch recovery
    this.squashX += (1.0 - this.squashX) * 0.18;
    this.squashY += (1.0 - this.squashY) * 0.18;

    // Physics movement
    this.vy += GRAVITY * dt;
    this.vx *= Math.pow(AIR_RESISTANCE, dt);
    this.vy *= Math.pow(AIR_RESISTANCE, dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Rolling rotation based on horizontal movement
    this.rotation += (this.vRot + (this.vx / (this.radius || 1)) * 0.5) * dt;
    this.vRot *= 0.98;

    // Facial blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -8) {
        this.isBlinking = false;
        this.blinkTimer = Math.random() * 240 + 120;
      }
    }
  }

  applySquash(sx, sy) {
    this.squashX = sx;
    this.squashY = sy;
  }
}

// --- Particle Burst on Fruit Merge ---
export class Particle {
  constructor(x, y, color, speedScale = 1) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 5 + 2) * speedScale;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5;
    this.radius = Math.random() * 5 + 3;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
    this.gravity = 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.radius *= 0.96;
    this.alpha -= this.decay;
    return this.alpha > 0 && this.radius > 0.5;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Floating Score Text Popup ---
export class FloatingText {
  constructor(x, y, text, color = '#FFD700', fontSize = 22) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.alpha = 1.0;
    this.vy = -2.2;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.94;
    this.alpha -= 0.025;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = `900 ${this.fontSize}px "Pretendard", "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Merge Shockwave Ripple ---
export class Shockwave {
  constructor(x, y, maxRadius, color) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.maxRadius = maxRadius;
    this.color = color;
    this.alpha = 0.8;
  }

  update() {
    this.radius += (this.maxRadius - this.radius) * 0.25;
    this.alpha -= 0.06;
    return this.alpha > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// --- Physics Simulation Engine ---
export class PhysicsEngine {
  constructor() {
    this.fruits = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.dangerIntensity = 0; // 0 ~ 1 for pulsating danger line
  }

  reset() {
    this.fruits = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.dangerIntensity = 0;
  }

  addFruit(fruit) {
    this.fruits.push(fruit);
  }

  // Emergency Box Shake Skill
  shakeBox() {
    fruitAudio.playShake();
    for (const f of this.fruits) {
      f.vx += (Math.random() - 0.5) * 14;
      f.vy -= Math.random() * 8 + 4;
      f.vRot += (Math.random() - 0.5) * 0.4;
      f.applySquash(0.8, 1.25);
    }
  }

  // Main Physics Step (Iterative Collision Resolution for Maximum Stability)
  update(onMerge, onScoreAdd, onGameOver) {
    const subSteps = 6;
    const dt = 1 / subSteps;

    // Combo Timer Decay
    if (this.comboCount > 0) {
      this.comboTimer -= 1;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Merge Event Queue
    const newMergedFruits = [];
    let hasDangerFruit = false;

    for (let step = 0; step < subSteps; step++) {
      // 1. Update entities
      for (const f of this.fruits) {
        f.update(dt);
      }

      // 2. Wall & Floor Collisions
      for (const f of this.fruits) {
        // Left Wall
        if (f.x - f.radius < BOX_LEFT) {
          f.x = BOX_LEFT + f.radius;
          if (f.vx < 0) {
            const impact = Math.abs(f.vx);
            f.vx = -f.vx * WALL_RESTITUTION;
            f.vRot += f.vy * 0.02;
            if (impact > 2) {
              f.applySquash(0.85, 1.15);
              fruitAudio.playBounce(impact * 0.3);
            }
          }
        }

        // Right Wall
        if (f.x + f.radius > BOX_RIGHT) {
          f.x = BOX_RIGHT - f.radius;
          if (f.vx > 0) {
            const impact = Math.abs(f.vx);
            f.vx = -f.vx * WALL_RESTITUTION;
            f.vRot -= f.vy * 0.02;
            if (impact > 2) {
              f.applySquash(0.85, 1.15);
              fruitAudio.playBounce(impact * 0.3);
            }
          }
        }

        // Bottom Floor
        if (f.y + f.radius > BOX_BOTTOM) {
          f.y = BOX_BOTTOM - f.radius;
          if (f.vy > 0) {
            const impact = Math.abs(f.vy);
            f.vy = -f.vy * f.restitution;
            f.vx *= Math.pow(FRICTION_GROUND, dt);
            f.vRot += f.vx * 0.04;
            if (impact > 1.5) {
              f.applySquash(1.2, 0.8);
              fruitAudio.playBounce(impact * 0.4);
            }
            if (Math.abs(f.vy) < 0.2) f.vy = 0;
          }
        }
      }

      // 3. Circle-Circle Collisions & Merge Detection
      const len = this.fruits.length;
      for (let i = 0; i < len; i++) {
        const a = this.fruits[i];
        if (a.isMerged) continue;

        for (let j = i + 1; j < len; j++) {
          const b = this.fruits[j];
          if (b.isMerged) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.radius + b.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);

            // Check if Same Fruit Level -> MERGE!
            if (a.level === b.level && !a.isMerged && !b.isMerged) {
              a.isMerged = true;
              b.isMerged = true;

              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              const nextLevel = a.level + 1;

              // Combo handling
              this.comboCount += 1;
              this.comboTimer = 140; // ~2.3 seconds combo window

              const mergedScore = (a.data.score * 2) * this.comboCount;
              if (onScoreAdd) onScoreAdd(mergedScore);

              // Audio & Fanfare
              if (nextLevel === 10) {
                fruitAudio.playWatermelon();
              } else {
                fruitAudio.playMerge(nextLevel, this.comboCount);
              }

              // Create next tier fruit (up to level 10: Watermelon)
              if (nextLevel < FRUITS.length) {
                const nextFruit = new Fruit(nextLevel, midX, midY, (a.vx + b.vx) * 0.3, (a.vy + b.vy) * 0.3 - 1.5);
                nextFruit.applySquash(1.3, 0.75);
                newMergedFruits.push(nextFruit);
              }

              // Visual Particles Burst
              const color = FRUITS[Math.min(nextLevel, FRUITS.length - 1)].color;
              for (let p = 0; p < 18; p++) {
                this.particles.push(new Particle(midX, midY, color, 1.2));
              }

              // Shockwave
              this.shockwaves.push(new Shockwave(midX, midY, a.radius * 2.2, color));

              // Floating Score Text
              const comboLabel = this.comboCount > 1 ? ` +${mergedScore} (x${this.comboCount} 콤보!)` : ` +${mergedScore}`;
              this.floatingTexts.push(new FloatingText(midX, midY - 15, comboLabel, '#FFEB3B', 20));

              if (onMerge) onMerge(nextLevel, this.comboCount);
              break;
            }

            // Normal Physical Collision
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            const totalMass = a.mass + b.mass;
            const aRatio = b.mass / totalMass;
            const bRatio = a.mass / totalMass;

            // Positional correction
            a.x -= nx * overlap * aRatio;
            a.y -= ny * overlap * aRatio;
            b.x += nx * overlap * bRatio;
            b.y += ny * overlap * bRatio;

            // Velocity impulse resolution
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              const restitution = Math.min(a.restitution, b.restitution);
              const impulseMag = -(1 + restitution) * velAlongNormal / (1 / a.mass + 1 / b.mass);

              const ix = impulseMag * nx;
              const iy = impulseMag * ny;

              a.vx -= ix / a.mass;
              a.vy -= iy / a.mass;
              b.vx += ix / b.mass;
              b.vy += iy / b.mass;

              // Tangent friction and rolling torque
              const tx = -ny;
              const ty = nx;
              const velAlongTangent = rvx * tx + rvy * ty;
              const frictionImpulse = -velAlongTangent * FRICTION_COLLISION / (1 / a.mass + 1 / b.mass);

              a.vx -= (frictionImpulse * tx) / a.mass;
              a.vy -= (frictionImpulse * ty) / a.mass;
              b.vx += (frictionImpulse * tx) / b.mass;
              b.vy += (frictionImpulse * ty) / b.mass;

              a.vRot += (frictionImpulse / (a.radius * a.mass)) * 0.05;
              b.vRot -= (frictionImpulse / (b.radius * b.mass)) * 0.05;

              // Gentle impact squash
              if (Math.abs(velAlongNormal) > 2.5) {
                a.applySquash(0.9, 1.1);
                b.applySquash(0.9, 1.1);
              }
            }
          }
        }
      }
    }

    // Filter out merged fruits and add new created fruits
    this.fruits = this.fruits.filter(f => !f.isMerged).concat(newMergedFruits);

    // 4. Update and filter particles, texts, shockwaves
    this.particles = this.particles.filter(p => p.update());
    this.floatingTexts = this.floatingTexts.filter(t => t.update());
    this.shockwaves = this.shockwaves.filter(s => s.update());

    // 5. Game Over / Danger Deadline Check
    for (const f of this.fruits) {
      // Check if top edge of fruit is above the danger line and fruit is relatively stable (not freshly dropped)
      if (f.y - f.radius < BOX_TOP && f.scale >= 0.95 && Math.abs(f.vy) < 1.2) {
        hasDangerFruit = true;
        f.aboveDeadlineTime += 16.6; // ~16.6ms per frame
        if (f.aboveDeadlineTime >= DEADLINE_GRACE_TIME_MS) {
          fruitAudio.playGameOver();
          if (onGameOver) onGameOver();
          break;
        }
      } else {
        f.aboveDeadlineTime = Math.max(0, f.aboveDeadlineTime - 8);
      }
    }

    // Danger intensity for visual warning animation
    if (hasDangerFruit) {
      this.dangerIntensity = Math.min(1.0, this.dangerIntensity + 0.08);
      if (Math.random() < 0.08) fruitAudio.playWarning();
    } else {
      this.dangerIntensity = Math.max(0, this.dangerIntensity - 0.04);
    }
  }

  // Draw All Physics & Visual Entities
  draw(ctx, aimX = null, currentDropFruit = null) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Container Background & Wooden/Arcade Style Walls
    this.drawContainerBox(ctx);

    // 2. Shockwaves & Particles (Behind or around fruits)
    for (const s of this.shockwaves) s.draw(ctx);
    for (const p of this.particles) p.draw(ctx);

    // 3. Fruits
    for (const f of this.fruits) {
      drawFruitEntity(ctx, f);
    }

    // 4. Danger Deadline Line (Pulsing Red / Amber)
    this.drawDeadline(ctx);

    // 5. Aim Guide Line & Top Cloud/Crane Drop Preview
    if (aimX !== null && currentDropFruit !== null) {
      this.drawAimGuide(ctx, aimX, currentDropFruit);
    }

    // 6. Floating Score Texts
    for (const t of this.floatingTexts) t.draw(ctx);
  }

  drawContainerBox(ctx) {
    // Inner Box Background Soft Gradient
    const bgGrad = ctx.createLinearGradient(0, BOX_TOP, 0, BOX_BOTTOM);
    bgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(BOX_LEFT, BOX_TOP, BOX_WIDTH, BOX_HEIGHT);

    // Box Walls (Left, Right, Bottom) with Glass/Neon Rim
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(BOX_LEFT, BOX_TOP);
    ctx.lineTo(BOX_LEFT, BOX_BOTTOM);
    ctx.lineTo(BOX_RIGHT, BOX_BOTTOM);
    ctx.lineTo(BOX_RIGHT, BOX_TOP);
    ctx.stroke();

    // Subtle Glowing Accent on Floor & Walls
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.stroke();
    ctx.restore();
  }

  drawDeadline(ctx) {
    ctx.save();
    const isDanger = this.dangerIntensity > 0.1;
    const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;

    ctx.setLineDash([8, 6]);
    ctx.lineWidth = isDanger ? 3 + pulse * 2 : 2;

    if (isDanger) {
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
    } else {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    }

    ctx.beginPath();
    ctx.moveTo(BOX_LEFT + 4, BOX_TOP);
    ctx.lineTo(BOX_RIGHT - 4, BOX_TOP);
    ctx.stroke();

    // Danger text tag if nearing deadline
    if (isDanger) {
      ctx.setLineDash([]);
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 12px "Pretendard", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚠️ 위험! 한계선 초과 주의', BOX_RIGHT - 12, BOX_TOP - 8);
    }
    ctx.restore();
  }

  drawAimGuide(ctx, aimX, fruitData) {
    const clampedX = Math.max(BOX_LEFT + fruitData.radius, Math.min(BOX_RIGHT - fruitData.radius, aimX));

    ctx.save();
    // Drop Projection Dotted Line
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(clampedX, 85);
    ctx.lineTo(clampedX, BOX_BOTTOM);
    ctx.stroke();

    // Top Cloud / Dropper Crane
    ctx.setLineDash([]);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☁️', clampedX, 42);

    // Dropping Fruit Preview
    const previewFruit = {
      level: fruitData.level,
      data: fruitData,
      radius: fruitData.radius,
      x: clampedX,
      y: 75,
      rotation: 0,
      scale: 1.0,
      squashX: 1.0,
      squashY: 1.0,
      isBlinking: false,
      faceType: 0
    };
    drawFruitEntity(ctx, previewFruit, 0.95);

    ctx.restore();
  }
}

// --- Procedural Kawaii Fruit Drawing Helper ---
export function drawFruitEntity(ctx, fruit, opacity = 1.0) {
  const data = fruit.data || FRUITS[fruit.level];
  if (!data) return;

  const r = data.radius * (fruit.scale || 1.0);
  if (r <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(fruit.x, fruit.y);
  ctx.rotate(fruit.rotation || 0);
  ctx.scale(fruit.squashX || 1.0, fruit.squashY || 1.0);

  // 1. Fruit Base Gradient Sphere
  const sphereGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  sphereGrad.addColorStop(0, data.highlightColor || '#FFFFFF');
  sphereGrad.addColorStop(0.35, data.color);
  sphereGrad.addColorStop(1, data.accentColor || data.color);

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Level-Specific Detailed Textures & Accessories
  drawFruitFeatures(ctx, fruit.level, r, data);

  // 4. Shiny Glossy Highlight Spot (Top-Left)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.25, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Expressive Cute Kawaii Face
  drawKawaiiFace(ctx, fruit, r);

  ctx.restore();
}

// Draw Unique Fruit Features (Leaves, Stripes, Seeds, Tops)
function drawFruitFeatures(ctx, level, r, data) {
  ctx.save();

  switch (level) {
    case 0: // 🍒 체리 (줄기와 작은 잎)
      ctx.strokeStyle = data.stemColor || '#78350F';
      ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.quadraticCurveTo(r * 0.4, -r * 1.5, r * 0.6, -r * 1.3);
      ctx.stroke();

      // 초록 잎사귀
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(r * 0.45, -r * 1.35, r * 0.25, r * 0.12, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 1: // 🍓 딸기 (초록 꼭지 & 콕콕 씨앗)
      ctx.fillStyle = '#10B981';
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * (r * 0.65), Math.sin(ang) * (r * 0.65) - r * 0.3, r * 0.22, r * 0.1, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      // 씨앗 패턴
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      const seedOffsets = [[-0.4, 0.2], [0.4, 0.2], [0, 0.5], [-0.3, -0.2], [0.3, -0.2]];
      seedOffsets.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, Math.max(1.2, r * 0.04), 0, Math.PI * 2);
        ctx.fill();
      });
      break;

    case 2: // 🍇 포도 (보랏빛 광택 & 꼭지)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(r * 0.35, r * 0.35, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 3: // 🍊 귤 (상단 잎사귀와 미세 오렌지 질감)
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.88, r * 0.22, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 4: // 🟠 감 (4갈래 초록 꼭지받침)
      ctx.fillStyle = '#15803D';
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * (r * 0.4), Math.sin(ang) * (r * 0.4) - r * 0.5, r * 0.22, r * 0.12, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 5: // 🍎 사과 (줄기와 싱그러운 잎사귀)
      ctx.strokeStyle = '#5B3A29';
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(r * 0.15, -r * 1.2);
      ctx.stroke();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(r * 0.25, -r * 1.05, r * 0.26, r * 0.12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 6: // 🍐 배 (꼭지 & 주근깨 패턴)
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.9, r * 0.2, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 7: // 🍑 복숭아 (상단 옴큼 하트 모양 굴곡)
      ctx.strokeStyle = 'rgba(219, 39, 119, 0.45)';
      ctx.lineWidth = Math.max(2, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.1, 0, 0, r * 0.85);
      ctx.stroke();
      break;

    case 8: // 🍍 파인애플 (사선 격자 패턴과 왕관 잎머리)
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.lineWidth = Math.max(1.5, r * 0.035);
      // 다이아몬드 격자선
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (r * 0.35) - r * 0.6, -r * 0.6);
        ctx.lineTo(i * (r * 0.35) + r * 0.6, r * 0.6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i * (r * 0.35) + r * 0.6, -r * 0.6);
        ctx.lineTo(i * (r * 0.35) - r * 0.6, r * 0.6);
        ctx.stroke();
      }
      break;

    case 9: // 🍈 멜론 (고급 그물망 네트 무늬)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = Math.max(1.8, r * 0.03);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, ang, ang + Math.PI / 4);
        ctx.stroke();
      }
      break;

    case 10: // 🍉 수박 (검은색 지그재그 줄무늬 & 왕관 스타)
      ctx.fillStyle = '#0F4725';
      for (let s = 0; s < 5; s++) {
        const baseAng = (s * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(baseAng) * (r * 0.95), Math.sin(baseAng) * (r * 0.95));
        for (let seg = 1; seg <= 6; seg++) {
          const ratio = 1 - seg / 6;
          const zig = (seg % 2 === 0 ? 0.15 : -0.15);
          const curAng = baseAng + zig;
          ctx.lineTo(Math.cos(curAng) * (r * ratio), Math.sin(curAng) * (r * ratio));
        }
        ctx.lineWidth = Math.max(3, r * 0.09);
        ctx.strokeStyle = '#0B381C';
        ctx.stroke();
      }

      // 수박 달성 황금 왕관 아이콘
      ctx.fillStyle = '#F59E0B';
      ctx.font = `${Math.floor(r * 0.45)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', 0, -r * 0.95);
      break;
  }

  ctx.restore();
}

// Draw Adorable Anime-Style Face
function drawKawaiiFace(ctx, fruit, r) {
  if (r < 14) return; // 체리 이하 너무 작은 과일은 간소화

  ctx.save();
  const eyeDistance = r * 0.32;
  const eyeY = -r * 0.05;
  const eyeRadius = Math.max(2, r * 0.08);

  // 1. Rosy Cheeks (Pink Blush)
  ctx.fillStyle = 'rgba(255, 99, 132, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-eyeDistance * 1.35, eyeY + r * 0.18, eyeRadius * 1.4, eyeRadius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(eyeDistance * 1.35, eyeY + r * 0.18, eyeRadius * 1.4, eyeRadius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Eyes (Blinking or Open with Sparkling Highlights)
  if (fruit.isBlinking) {
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(-eyeDistance, eyeY, eyeRadius * 1.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(eyeDistance, eyeY, eyeRadius * 1.2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(-eyeDistance, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(eyeDistance, eyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eye Sparkle Highlights
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-eyeDistance - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.4, 0, Math.PI * 2);
    ctx.arc(eyeDistance - eyeRadius * 0.3, eyeY - eyeRadius * 0.3, eyeRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Cute Happy Smile Mouth
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = Math.max(1.8, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();

  if (fruit.level >= 8) {
    // Excited open mouth for big fruits
    ctx.fillStyle = '#EF4444';
    ctx.arc(0, eyeY + r * 0.18, eyeRadius * 1.2, 0, Math.PI);
    ctx.fill();
    ctx.stroke();
  } else {
    // Sweet smile
    ctx.arc(0, eyeY + r * 0.15, eyeRadius * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}
