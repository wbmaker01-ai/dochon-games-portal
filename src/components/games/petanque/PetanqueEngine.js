// Dochon Pétanque Master Physics & 2.5D Perspective Canvas Render Engine

import {
  FIELD_CONFIG,
  PHYSICS_CONFIG,
  TEAMS,
  SHOT_TYPES
} from './petanqueConstants';
import { petanqueAudio } from './petanqueAudio';

export class PetanqueEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.width = FIELD_CONFIG.WIDTH;
    this.height = FIELD_CONFIG.HEIGHT;
    
    // Virtual Field Boundary
    this.fieldMinX = 70;
    this.fieldMaxX = 730;
    this.fieldMinY = FIELD_CONFIG.FIELD_TOP_Y;
    this.fieldMaxY = FIELD_CONFIG.FIELD_BOTTOM_Y;

    // Entities
    this.cochonnet = null;
    this.boules = [];
    this.particles = [];
    this.floatingTexts = [];
    
    // Background Pattern Cache
    this.bgPattern = null;
    this.createBackgroundPattern();
  }

  createBackgroundPattern() {
    // Generate gravel & sand texture offscreen
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 120;
    patternCanvas.height = 120;
    const pctx = patternCanvas.getContext('2d');

    pctx.fillStyle = '#d97706';
    pctx.fillRect(0, 0, 120, 120);

    // Add sand/gravel speckles
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 120;
      const y = Math.random() * 120;
      const r = Math.random() * 1.6 + 0.4;
      const isDark = Math.random() > 0.45;
      pctx.fillStyle = isDark ? 'rgba(120, 53, 15, 0.22)' : 'rgba(254, 243, 199, 0.35)';
      pctx.beginPath();
      pctx.arc(x, y, r, 0, Math.PI * 2);
      pctx.fill();
    }

    this.bgPattern = this.ctx.createPattern(patternCanvas, 'repeat');
  }

  // Convert Y coordinate to 2.5D depth scale (0.45 at top horizon, 1.05 at throw line)
  getScaleAtY(y) {
    const range = this.fieldMaxY - this.fieldMinY;
    const ratio = Math.max(0, Math.min(1, (y - this.fieldMinY) / range));
    return FIELD_CONFIG.MIN_SCALE + ratio * (FIELD_CONFIG.MAX_SCALE - FIELD_CONFIG.MIN_SCALE);
  }

  // Spawn New End Round (Resets field and places Cochonnet)
  initEndRound(roundNumber = 1) {
    this.boules = [];
    this.particles = [];
    this.floatingTexts = [];

    // Target Cochonnet placement: Far side with realistic slight organic offset
    const targetY = this.fieldMinY + (this.fieldMaxY - this.fieldMinY) * (0.28 + (roundNumber % 3) * 0.08);
    const targetX = 400 + (Math.sin(roundNumber * 1.7) * 90);

    this.cochonnet = {
      id: 'cochonnet',
      x: targetX,
      y: targetY,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: PHYSICS_CONFIG.COCHONNET_RADIUS_REAL,
      mass: PHYSICS_CONFIG.COCHONNET_MASS,
      isMoving: false,
      color: PHYSICS_CONFIG.COCHONNET_COLOR,
      glow: PHYSICS_CONFIG.COCHONNET_GLOW
    };
  }

  // Launch a boule with designated shot angle, power and shot type
  launchBoule({ team, shotType, angleDeg, powerPercent }) {
    petanqueAudio.playThrowRelease();

    const powerRatio = Math.max(0.1, Math.min(1.0, powerPercent / 100));
    
    // 90 deg is straight forward (-Y direction), <90 is left, >90 is right
    const offsetRad = (angleDeg - 90) * (Math.PI / 180);
    const dirX = Math.sin(offsetRad);
    const dirY = -Math.cos(offsetRad);

    // Initial launch coordinates (near bottom center throw circle)
    const startX = FIELD_CONFIG.LAUNCH_X;
    const startY = FIELD_CONFIG.LAUNCH_Y;

    // Physics parameters adjusted by Shot Type
    let forwardSpeed = 0;
    let verticalSpeed = 0;

    if (shotType === SHOT_TYPES.POINTER) {
      // Pointer: Low arc, smooth forward momentum for rolling precision
      forwardSpeed = 4.2 + powerRatio * 6.5;
      verticalSpeed = 3.5 + powerRatio * 4.5;
    } else {
      // Tirer: High trajectory lob for direct aerial smash
      forwardSpeed = 3.8 + powerRatio * 6.8;
      verticalSpeed = 6.8 + powerRatio * 7.5;
    }

    const vx = dirX * forwardSpeed * 1.1;
    const vy = dirY * forwardSpeed * 0.95; // Moving upward towards target (-Y)

    const newBoule = {
      id: `boule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      team: team,
      shotType: shotType,
      x: startX,
      y: startY,
      z: 15,
      vx: vx,
      vy: vy,
      vz: verticalSpeed,
      radius: PHYSICS_CONFIG.BOULE_RADIUS_REAL,
      mass: PHYSICS_CONFIG.BOULE_MASS,
      isMoving: true,
      hasLandedOnce: false,
      stoppedTimer: 0
    };

    this.boules.push(newBoule);
    return newBoule;
  }

  // Update loop for all physical entities
  updatePhysics(dt = 1 / 60) {
    let anyMoving = false;

    const allBalls = [this.cochonnet, ...this.boules].filter(Boolean);

    // 1. Update Position & Velocity for each ball
    for (const ball of allBalls) {
      if (!ball.isMoving) continue;

      // In air flight physics
      if (ball.z > 0) {
        ball.vz -= PHYSICS_CONFIG.GRAVITY * dt * 1.5;
        ball.x += ball.vx * 60 * dt;
        ball.y += ball.vy * 60 * dt;
        ball.z += ball.vz * 60 * dt;

        // Ground Impact detection
        if (ball.z <= 0) {
          ball.z = 0;
          ball.vz = -ball.vz * (ball.id === 'cochonnet' ? PHYSICS_CONFIG.COCHONNET_RESTITUTION : PHYSICS_CONFIG.RESTITUTION);

          // Impact ground friction
          ball.vx *= 0.82;
          ball.vy *= 0.82;

          const impactSpeed = Math.abs(ball.vz);
          if (impactSpeed > 0.6) {
            petanqueAudio.playGroundThud(Math.min(1.0, impactSpeed / 4.0));
            this.createDustParticles(ball.x, ball.y, 8);
          }

          // Transition to pure rolling
          if (Math.abs(ball.vz) < 0.75) {
            ball.vz = 0;
            ball.z = 0;
          }
        }
      } else {
        // Ground Rolling Physics
        ball.x += ball.vx * 60 * dt;
        ball.y += ball.vy * 60 * dt;

        // Sand & gravel rolling deceleration
        ball.vx *= PHYSICS_CONFIG.GROUND_FRICTION;
        ball.vy *= PHYSICS_CONFIG.GROUND_FRICTION;

        // Stop threshold
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed < PHYSICS_CONFIG.MIN_VELOCITY_STOP) {
          ball.vx = 0;
          ball.vy = 0;
          ball.isMoving = false;
        }
      }

      // Boundary Clamping with elastic rebound
      if (ball.x - ball.radius < this.fieldMinX) {
        ball.x = this.fieldMinX + ball.radius;
        ball.vx = -ball.vx * 0.5;
      } else if (ball.x + ball.radius > this.fieldMaxX) {
        ball.x = this.fieldMaxX - ball.radius;
        ball.vx = -ball.vx * 0.5;
      }

      if (ball.y < this.fieldMinY) {
        ball.y = this.fieldMinY;
        ball.vy = -ball.vy * 0.4;
      } else if (ball.y > this.fieldMaxY) {
        ball.y = this.fieldMaxY;
        ball.vy = -ball.vy * 0.4;
      }

      if (ball.isMoving) {
        anyMoving = true;
      }
    }

    // 2. Elastic Collision Resolution between all pairs of balls
    for (let i = 0; i < allBalls.length; i++) {
      for (let j = i + 1; j < allBalls.length; j++) {
        const b1 = allBalls[i];
        const b2 = allBalls[j];

        // Check if both balls are on or near ground (z < 25)
        if (b1.z < 25 && b2.z < 25) {
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);
          const s1 = this.getScaleAtY(b1.y);
          const s2 = this.getScaleAtY(b2.y);
          const minDist = b1.radius * s1 + b2.radius * s2;

          if (dist < minDist && dist > 0.001) {
            // Collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping balls
            const overlap = minDist - dist;
            b1.x -= nx * overlap * 0.5;
            b1.y -= ny * overlap * 0.5;
            b2.x += nx * overlap * 0.5;
            b2.y += ny * overlap * 0.5;

            // Relative velocity
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

            // Audio & Spark feedback
            const impactEnergy = Math.abs(p);
            if (impactEnergy > 0.2) {
              petanqueAudio.playMetalClank(Math.min(1.2, impactEnergy / 3.0));
              this.createSparkParticles((b1.x + b2.x) / 2, (b1.y + b2.y) / 2, 6);
            }

            // Apply elastic impulse
            b1.vx -= p * b2.mass * nx * PHYSICS_CONFIG.RESTITUTION;
            b1.vy -= p * b2.mass * ny * PHYSICS_CONFIG.RESTITUTION;
            b2.vx += p * b1.mass * nx * PHYSICS_CONFIG.RESTITUTION;
            b2.vy += p * b1.mass * ny * PHYSICS_CONFIG.RESTITUTION;

            b1.isMoving = true;
            b2.isMoving = true;
            anyMoving = true;
          }
        }
      }
    }

    // 3. Update Particles
    this.updateParticles(dt);

    return anyMoving;
  }

  createDustParticles(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 1.8 - 0.5,
        radius: Math.random() * 4 + 2,
        alpha: 0.6,
        color: 'rgba(217, 119, 6, ',
        decay: 0.03 + Math.random() * 0.02
      });
    }
  }

  createSparkParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.5 + 1,
        alpha: 1.0,
        color: 'rgba(254, 240, 138, ',
        decay: 0.06 + Math.random() * 0.03
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.alpha -= p.decay;
      p.radius *= 0.96;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Calculate distances from all boules to the Cochonnet
  calculateDistances() {
    if (!this.cochonnet) return [];

    return this.boules.map(boule => {
      const dx = boule.x - this.cochonnet.x;
      const dy = boule.y - this.cochonnet.y;
      const pixelDist = Math.hypot(dx, dy);

      // Convert pixel distance to virtual centimeters based on field scale
      const cmDist = Math.round(pixelDist * 0.85);

      return {
        boule,
        pixelDist,
        cmDist,
        team: boule.team
      };
    }).sort((a, b) => a.cmDist - b.cmDist);
  }

  // Render main canvas scene
  render({ isAiming, aimAngle, aimPower, shotType, currentTeam, isMeasuring, showGuide = true }) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Field & Scenic Background
    this.renderField(ctx);

    // 2. Draw Aiming Guideline when user is aiming
    if (isAiming && showGuide) {
      this.renderAimGuide(ctx, aimAngle, aimPower, shotType, currentTeam);
    }

    // 3. Collect and Sort Entities by Y-depth for proper 2.5D z-sorting
    const renderEntities = [];
    if (this.cochonnet) {
      renderEntities.push({ type: 'cochonnet', entity: this.cochonnet, y: this.cochonnet.y });
    }
    for (const b of this.boules) {
      renderEntities.push({ type: 'boule', entity: b, y: b.y });
    }
    renderEntities.sort((a, b) => a.y - b.y);

    // 4. Render Ball Shadows First
    for (const item of renderEntities) {
      this.renderShadow(ctx, item.entity);
    }

    // 5. Render Distance Measurement Lines if in Measuring phase
    if (isMeasuring && this.cochonnet) {
      this.renderMeasurementTape(ctx);
    }

    // 6. Render Balls with Metallic Shading & Highlights
    for (const item of renderEntities) {
      if (item.type === 'cochonnet') {
        this.renderCochonnet(ctx, item.entity);
      } else {
        this.renderBoule(ctx, item.entity);
      }
    }

    // 7. Render Particles
    this.renderParticles(ctx);
  }

  renderField(ctx) {
    // Top Provence Sky & Distant Park Trees
    const skyGradient = ctx.createLinearGradient(0, 0, 0, FIELD_CONFIG.HORIZON_Y);
    skyGradient.addColorStop(0, '#38bdf8');
    skyGradient.addColorStop(0.7, '#bae6fd');
    skyGradient.addColorStop(1, '#f0fdf4');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.width, FIELD_CONFIG.HORIZON_Y);

    // Sun & Soft Clouds
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.beginPath();
    ctx.arc(680, 45, 38, 0, Math.PI * 2);
    ctx.fill();

    // Distant Green Foliage / Provence Trees
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 9; i++) {
      const tx = i * 95 - 20;
      const ty = FIELD_CONFIG.HORIZON_Y;
      ctx.beginPath();
      ctx.arc(tx + 40, ty - 10, 42, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden Border & Court Sand/Gravel Ground
    // Court Ground Polygon with 2.5D perspective
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.fieldMinX + 40, FIELD_CONFIG.FIELD_TOP_Y);
    ctx.lineTo(this.fieldMaxX - 40, FIELD_CONFIG.FIELD_TOP_Y);
    ctx.lineTo(this.fieldMaxX, FIELD_CONFIG.FIELD_BOTTOM_Y);
    ctx.lineTo(this.fieldMinX, FIELD_CONFIG.FIELD_BOTTOM_Y);
    ctx.closePath();

    // Fill Sand/Gravel Pattern
    ctx.fillStyle = '#b45309';
    ctx.fill();
    if (this.bgPattern) {
      ctx.fillStyle = this.bgPattern;
      ctx.fill();
    }

    // Perspective depth gradient overlay (Darker in far background)
    const depthGrad = ctx.createLinearGradient(0, FIELD_CONFIG.FIELD_TOP_Y, 0, FIELD_CONFIG.FIELD_BOTTOM_Y);
    depthGrad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
    depthGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)');
    depthGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = depthGrad;
    ctx.fill();

    // Wooden Boundary Rails
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();
    ctx.restore();

    // Throwing Circle at Bottom (Official 50cm diameter circle in Pétanque)
    ctx.save();
    const cx = FIELD_CONFIG.LAUNCH_X;
    const cy = FIELD_CONFIG.LAUNCH_Y + 12;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 22, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.fill();

    // Throw circle label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fef3c7';
    ctx.textAlign = 'center';
    ctx.fillText('투구 구역 (Rond)', cx, cy + 4);
    ctx.restore();
  }

  renderAimGuide(ctx, angleDeg, powerPercent, shotType, team) {
    ctx.save();
    // 90 deg is straight forward (-Y direction), <90 is left, >90 is right
    const offsetRad = (angleDeg - 90) * (Math.PI / 180);
    const dirX = Math.sin(offsetRad);
    const dirY = -Math.cos(offsetRad);

    const startX = FIELD_CONFIG.LAUNCH_X;
    const startY = FIELD_CONFIG.LAUNCH_Y;

    const powerRatio = powerPercent / 100;
    const distancePx = 150 + powerRatio * 280;

    // Target landing point (moving forward towards top)
    const targetX = startX + dirX * distancePx;
    const targetY = startY + dirY * distancePx;

    // Projected parabolic curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2 - (shotType === SHOT_TYPES.TIRER ? 120 : 50) * powerRatio;

    ctx.quadraticCurveTo(midX, midY, targetX, targetY);

    ctx.lineWidth = 3;
    ctx.strokeStyle = team === TEAMS.PLAYER.id ? 'rgba(96, 165, 250, 0.8)' : 'rgba(248, 113, 113, 0.8)';
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target reticle
    ctx.beginPath();
    const scale = this.getScaleAtY(targetY);
    ctx.ellipse(targetX, targetY, 20 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.fill();

    // Aim Guide Text
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const modeName = shotType === SHOT_TYPES.POINTER ? '🎯 포앵테 (정밀 롤링)' : '💥 티레 (타격 샷)';
    ctx.fillText(`${modeName} [${Math.round(powerPercent)}%]`, targetX, targetY - 16);

    ctx.restore();
  }

  renderShadow(ctx, ball) {
    const scale = this.getScaleAtY(ball.y);
    const radius = ball.radius * scale;
    const shadowY = ball.y;
    const shadowHeight = radius * 0.45;

    // If ball is high in the air, shadow becomes larger and fainter
    const heightFactor = Math.max(0, Math.min(1, ball.z / 180));
    const shadowRadius = radius * (1 + heightFactor * 0.6);
    const alpha = Math.max(0.08, 0.45 * (1 - heightFactor * 0.7));

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ball.x, shadowY, shadowRadius, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30, 20, 10, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  renderCochonnet(ctx, cochonnet) {
    const scale = this.getScaleAtY(cochonnet.y);
    const r = cochonnet.radius * scale;
    const renderY = cochonnet.y - cochonnet.z * scale;

    ctx.save();
    // Radial gradient for glossy wooden yellow cochonnet
    const grad = ctx.createRadialGradient(
      cochonnet.x - r * 0.35,
      renderY - r * 0.4,
      r * 0.1,
      cochonnet.x,
      renderY,
      r
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.4, '#f59e0b');
    grad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(cochonnet.x, renderY, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();

    // Specular Highlight Dot
    ctx.beginPath();
    ctx.arc(cochonnet.x - r * 0.3, renderY - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fill();

    // Little Crown Tag above Cochonnet
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('⭐ 뷔슈', cochonnet.x, renderY - r - 4);

    ctx.restore();
  }

  renderBoule(ctx, boule) {
    const scale = this.getScaleAtY(boule.y);
    const r = boule.radius * scale;
    const renderY = boule.y - boule.z * scale;
    const isPlayer = boule.team === TEAMS.PLAYER.id;

    ctx.save();
    // Metal Gradient Base
    const grad = ctx.createRadialGradient(
      boule.x - r * 0.35,
      renderY - r * 0.4,
      r * 0.1,
      boule.x,
      renderY,
      r
    );

    if (isPlayer) {
      // Blue Chromium Metallic Sphere
      grad.addColorStop(0, '#e0f2fe');
      grad.addColorStop(0.25, '#60a5fa');
      grad.addColorStop(0.65, '#2563eb');
      grad.addColorStop(1, '#1e3a8a');
    } else {
      // Red Chrome Metallic Sphere
      grad.addColorStop(0, '#ffe4e6');
      grad.addColorStop(0.25, '#f87171');
      grad.addColorStop(0.65, '#dc2626');
      grad.addColorStop(1, '#881337');
    }

    ctx.beginPath();
    ctx.arc(boule.x, renderY, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Engraved Groove Stripes (Standard Pétanque Ball Stripe Pattern)
    ctx.lineWidth = 1.8 * scale;
    ctx.strokeStyle = isPlayer ? 'rgba(147, 197, 253, 0.7)' : 'rgba(254, 205, 211, 0.7)';

    ctx.beginPath();
    ctx.arc(boule.x, renderY, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(boule.x, renderY, r * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Metal Rim Contour
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.stroke();

    // Crisp Specular Reflection Highlight
    ctx.beginPath();
    ctx.ellipse(boule.x - r * 0.35, renderY - r * 0.4, r * 0.35, r * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fill();

    // Team Badge icon above boule
    ctx.font = `bold ${Math.max(9, Math.round(11 * scale))}px sans-serif`;
    ctx.fillStyle = isPlayer ? '#93c5fd' : '#fca5a5';
    ctx.textAlign = 'center';
    ctx.fillText(isPlayer ? '🔵 도촌' : '🔴 AI', boule.x, renderY - r - 3);

    ctx.restore();
  }

  renderMeasurementTape(ctx) {
    if (!this.cochonnet) return;
    const distances = this.calculateDistances();
    if (distances.length === 0) return;

    ctx.save();
    distances.forEach((d, idx) => {
      const b = d.boule;
      const isClosest = idx === 0;

      // Draw dashed laser line
      ctx.beginPath();
      ctx.moveTo(this.cochonnet.x, this.cochonnet.y);
      ctx.lineTo(b.x, b.y);

      ctx.lineWidth = isClosest ? 2.8 : 1.4;
      ctx.strokeStyle = isClosest
        ? '#10b981' // Green for winning distance
        : 'rgba(255, 255, 255, 0.45)';
      ctx.setLineDash(isClosest ? [4, 3] : [3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance Badge in Middle of Line
      const midX = (this.cochonnet.x + b.x) / 2;
      const midY = (this.cochonnet.y + b.y) / 2;

      ctx.font = 'bold 11px sans-serif';
      const text = `${d.cmDist}cm ${isClosest ? '👑 1위' : ''}`;
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = isClosest ? 'rgba(16, 185, 129, 0.92)' : 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);
      ctx.strokeStyle = isClosest ? '#34d399' : '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(text, midX, midY + 4);
    });
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
