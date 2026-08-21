// Dochon Bubble Tea Cafe - 2D Canvas Procedural Rendering & Physics Engine
import { CUP_CONFIG, RATING_CONFIG, STEP_PEARLS, STEP_TEA, STEP_SYRUP, STEP_SERVE } from './bubbleTeaConstants';

export class BubbleTeaEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Physics entities
    this.pearls = [];
    this.liquidParticles = [];
    this.floatingTexts = [];
    this.sparkles = [];

    // Liquid wave properties
    this.wavePhase = 0;
    this.waveAmp = 0;

    // Animation timers
    this.time = 0;
    this.strawY = 0;
    this.isStrawPlunged = false;
    this.serveProgress = 0; // 0: in position, 1: served to customer
  }

  reset() {
    this.pearls = [];
    this.liquidParticles = [];
    this.floatingTexts = [];
    this.sparkles = [];
    this.wavePhase = 0;
    this.waveAmp = 0;
    this.strawY = 0;
    this.isStrawPlunged = false;
    this.serveProgress = 0;
  }

  // Spawn falling boba pearls
  spawnPearl(recipe, targetFillPct) {
    const cup = CUP_CONFIG;
    const targetY = cup.y - cup.height * targetFillPct;
    
    // Spawn near top center
    const x = cup.x + (Math.random() - 0.5) * 24;
    const y = cup.y - cup.height - 30;

    this.pearls.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 4 + Math.random() * 2,
      radius: 9 + Math.random() * 2,
      color: recipe.pearlColor,
      targetY: targetY + (Math.random() - 0.5) * 16,
      settled: false,
      bounce: 0.35
    });
  }

  // Spawn liquid pouring droplet particles
  spawnLiquidStream(recipe, step) {
    const cup = CUP_CONFIG;
    const isSyrup = step === STEP_SYRUP;
    const color = isSyrup ? recipe.syrupColor : recipe.teaColor;

    for (let i = 0; i < 3; i++) {
      this.liquidParticles.push({
        x: cup.x + (Math.random() - 0.5) * 14,
        y: cup.y - cup.height - 35,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 8 + Math.random() * 4,
        radius: isSyrup ? 4 : 5,
        color,
        life: 1.0
      });
    }
  }

  // Trigger floating rating / score feedback
  addFloatingText(text, x, y, color = '#FBBF24', fontSize = 26) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.8,
      opacity: 1.0,
      color,
      fontSize,
      scale: 1.3
    });
  }

  // Add celebratory sparkle burst
  addSparkles(x, y, count = 20, colors = ['#FDE047', '#F472B6', '#38BDF8', '#4ADE80']) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  // Update physics frame
  update(isPouring, currentStep, recipe, fillProgress) {
    this.time += 0.016;

    // 1. Wave amplitude dynamics
    if (isPouring) {
      this.waveAmp = Math.min(this.waveAmp + 0.3, 4.5);
    } else {
      this.waveAmp = Math.max(this.waveAmp - 0.15, 0);
    }
    this.wavePhase += 0.12;

    // 2. Update Pearls
    const cup = CUP_CONFIG;
    this.pearls.forEach(p => {
      if (!p.settled) {
        p.vy += 0.35; // gravity
        p.x += p.vx;
        p.y += p.vy;

        // Cup bounds collision
        const currentCupY = p.y;
        const progressFromBottom = Math.max(0, (cup.y - currentCupY) / cup.height);
        const currentHalfWidth = (cup.bottomWidth + (cup.topWidth - cup.bottomWidth) * progressFromBottom) / 2 - 10;

        if (p.x < cup.x - currentHalfWidth) {
          p.x = cup.x - currentHalfWidth;
          p.vx = Math.abs(p.vx) * p.bounce;
        } else if (p.x > cup.x + currentHalfWidth) {
          p.x = cup.x + currentHalfWidth;
          p.vx = -Math.abs(p.vx) * p.bounce;
        }

        // Settling at target bottom
        const bottomLimit = cup.y - p.radius - 4;
        if (p.y >= p.targetY || p.y >= bottomLimit) {
          p.y = Math.min(p.targetY, bottomLimit);
          p.vy = -p.vy * p.bounce;
          if (Math.abs(p.vy) < 0.6) {
            p.settled = true;
            p.vy = 0;
            p.vx = 0;
          }
        }
      }
    });

    // 3. Update Liquid Stream Particles
    for (let i = this.liquidParticles.length - 1; i >= 0; i--) {
      const lp = this.liquidParticles[i];
      lp.y += lp.vy;
      lp.x += lp.vx;
      lp.life -= 0.03;

      // Hit surface
      const surfaceY = cup.y - cup.height * fillProgress;
      if (lp.y >= surfaceY && surfaceY < cup.y) {
        this.liquidParticles.splice(i, 1);
        continue;
      }

      if (lp.life <= 0 || lp.y > cup.y) {
        this.liquidParticles.splice(i, 1);
      }
    }

    // 4. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.opacity -= 0.015;
      if (ft.scale > 1.0) ft.scale -= 0.02;
      if (ft.opacity <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 5. Update Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.1; // gravity
      sp.life -= sp.decay;
      if (sp.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  // ================= RENDER METHODS ================= //

  render(gameState) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Cafe Background
    this.drawBackground(ctx);

    // 2. Draw Customer Character (Right Side)
    this.drawCustomer(ctx, gameState.customer, gameState.customerEmotion);

    // 3. Draw Barista Mascot (Left Side)
    this.drawBarista(ctx);

    // 4. Draw Cafe Counter Table
    this.drawCounter(ctx);

    // 5. Draw Bubble Tea Cup & Contents
    this.drawCup(ctx, gameState);

    // 6. Draw Pouring Spout & Stream
    if (gameState.isPouring && gameState.currentStep <= STEP_SYRUP) {
      this.drawPouringStream(ctx, gameState);
    }

    // 7. Draw Visual Target Lines & Labels
    this.drawTargetLines(ctx, gameState);

    // 8. Draw Speech Bubble / Customer Request
    this.drawSpeechBubble(ctx, gameState);

    // 9. Draw Straw (When serving)
    if (gameState.currentStep === STEP_SERVE || gameState.isServing) {
      this.drawStraw(ctx, gameState);
    }

    // 10. Draw Floating Texts & Particles
    this.drawEffects(ctx);
  }

  // 1. Cozy Pastel Cafe Interior Background
  drawBackground(ctx) {
    // Pastel Gradient Wall
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#FFF5EB');
    grad.addColorStop(0.55, '#FED7AA');
    grad.addColorStop(1, '#FDBA74');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Cafe Wall Wooden Slats / Paneling
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    for (let x = 30; x < this.width; x += 60) {
      ctx.fillRect(x, 0, 30, 420);
    }

    // Cute Cafe Garland / Flags at Top
    this.drawGarland(ctx);

    // Floating Ambient Steam / Sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 6; i++) {
      const sx = 100 + i * 110 + Math.sin(this.time + i) * 15;
      const sy = 80 + Math.cos(this.time * 0.8 + i) * 20;
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGarland(ctx) {
    const flagColors = ['#F43F5E', '#FBBF24', '#34D399', '#38BDF8', '#A855F7', '#FB7185'];
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(this.width / 2, 65, this.width, 30);
    ctx.stroke();

    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const fx = t * (this.width - 60) + 30;
      const fy = 30 + Math.sin(t * Math.PI) * 25;
      const color = flagColors[i % flagColors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(fx - 14, fy);
      ctx.lineTo(fx + 14, fy);
      ctx.lineTo(fx, fy + 22);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 2. Draw Customer Animal (Right Side)
  drawCustomer(ctx, customer, emotion = 'normal') {
    if (!customer) return;

    ctx.save();
    const cx = 650;
    const cy = 280;

    // Body Bobbing animation
    const bobY = Math.sin(this.time * 3) * 4;

    // Render by animal type
    if (customer.id === 'bear') {
      this.drawBearCustomer(ctx, cx, cy + bobY, emotion);
    } else if (customer.id === 'shiba') {
      this.drawShibaCustomer(ctx, cx, cy + bobY, emotion);
    } else if (customer.id === 'cat') {
      this.drawCatCustomer(ctx, cx, cy + bobY, emotion);
    } else if (customer.id === 'rabbit') {
      this.drawRabbitCustomer(ctx, cx, cy + bobY, emotion);
    } else if (customer.id === 'fox') {
      this.drawFoxCustomer(ctx, cx, cy + bobY, emotion);
    } else {
      this.drawPenguinCustomer(ctx, cx, cy + bobY, emotion);
    }

    ctx.restore();
  }

  // Formosan Black Bear Customer
  drawBearCustomer(ctx, cx, cy, emotion) {
    // Ears
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.arc(cx - 52, cy - 65, 24, 0, Math.PI * 2);
    ctx.arc(cx + 52, cy - 65, 24, 0, Math.PI * 2);
    ctx.fill();

    // Inner Ears
    ctx.fillStyle = '#FFAAA6';
    ctx.beginPath();
    ctx.arc(cx - 52, cy - 65, 12, 0, Math.PI * 2);
    ctx.arc(cx + 52, cy - 65, 12, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // White V Crescent Collar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy + 30);
    ctx.lineTo(cx, cy + 68);
    ctx.lineTo(cx + 38, cy + 30);
    ctx.lineTo(cx + 25, cy + 30);
    ctx.lineTo(cx, cy + 54);
    ctx.lineTo(cx - 25, cy + 30);
    ctx.closePath();
    ctx.fill();

    // Snout
    ctx.fillStyle = '#D4A373';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Expression
    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Shiba Inu Customer
  drawShibaCustomer(ctx, cx, cy, emotion) {
    // Pointy Ears
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 30);
    ctx.lineTo(cx - 40, cy - 90);
    ctx.lineTo(cx - 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 55, cy - 30);
    ctx.lineTo(cx + 40, cy - 90);
    ctx.lineTo(cx + 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.fill();

    // White Cheeks / Muzzle
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(cx - 28, cy + 20, 32, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy + 20, 32, 0, Math.PI * 2);
    ctx.fill();

    // White Eyebrow Dots
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - 25, cy - 30, 8, 0, Math.PI * 2);
    ctx.arc(cx + 25, cy - 30, 8, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 8, 0, Math.PI * 2);
    ctx.fill();

    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Calico Cat Customer
  drawCatCustomer(ctx, cx, cy, emotion) {
    // Cat Ears
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 25);
    ctx.lineTo(cx - 40, cy - 85);
    ctx.lineTo(cx - 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#262626';
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy - 25);
    ctx.lineTo(cx + 40, cy - 85);
    ctx.lineTo(cx + 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();

    // Orange Patch
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(cx - 28, cy - 20, 35, 0, Math.PI);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 15); ctx.lineTo(cx - 65, cy + 10);
    ctx.moveTo(cx - 30, cy + 22); ctx.lineTo(cx - 65, cy + 25);
    ctx.moveTo(cx + 30, cy + 15); ctx.lineTo(cx + 65, cy + 10);
    ctx.moveTo(cx + 30, cy + 22); ctx.lineTo(cx + 65, cy + 25);
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Rabbit Customer
  drawRabbitCustomer(ctx, cx, cy, emotion) {
    // Long Ears with Wiggle
    const earWiggle = Math.sin(this.time * 4) * 0.08;
    ctx.save();
    ctx.translate(cx - 25, cy - 50);
    ctx.rotate(earWiggle);
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.ellipse(0, -45, 16, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(0, -45, 8, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx + 25, cy - 50);
    ctx.rotate(-earWiggle);
    ctx.fillStyle = '#FBCFE8';
    ctx.beginPath();
    ctx.ellipse(0, -45, 16, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(0, -45, 8, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(cx - 30, cy + 18, 12, 0, Math.PI * 2);
    ctx.arc(cx + 30, cy + 18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Fox Customer
  drawFoxCustomer(ctx, cx, cy, emotion) {
    // Fox Ears
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 25);
    ctx.lineTo(cx - 45, cy - 90);
    ctx.lineTo(cx - 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 55, cy - 25);
    ctx.lineTo(cx + 40, cy - 90);
    ctx.lineTo(cx + 15, cy - 45);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();

    // White Cheeks
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(cx - 28, cy + 22, 30, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy + 22, 30, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 7, 0, Math.PI * 2);
    ctx.fill();

    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Penguin Customer
  drawPenguinCustomer(ctx, cx, cy, emotion) {
    // Body / Head
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 58, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Belly
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 42, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 6);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.lineTo(cx, cy + 24);
    ctx.closePath();
    ctx.fill();

    this.drawAnimalFace(ctx, cx, cy, emotion);
  }

  // Shared Eye / Mouth Expression Handler
  drawAnimalFace(ctx, cx, cy, emotion) {
    ctx.fillStyle = '#171717';
    ctx.strokeStyle = '#171717';
    ctx.lineWidth = 3;

    if (emotion === 'happy' || emotion === 'perfect') {
      // Heart or Joy Closed Eyes ^ ^
      ctx.beginPath();
      ctx.arc(cx - 24, cy - 8, 10, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 24, cy - 8, 10, Math.PI, 0);
      ctx.stroke();

      // Big Happy Open Mouth
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(cx, cy + 26, 12, 0, Math.PI);
      ctx.fill();
    } else if (emotion === 'miss') {
      // Sad / Surprised Eyes O_O with sweat drop
      ctx.beginPath();
      ctx.arc(cx - 24, cy - 8, 8, 0, Math.PI * 2);
      ctx.arc(cx + 24, cy - 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Wavy Sad Mouth
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + 26);
      ctx.quadraticCurveTo(cx, cy + 18, cx + 14, cy + 26);
      ctx.stroke();

      // Blue Sweat Drop
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(cx + 45, cy - 25, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal Cute Blinking Eyes
      const blink = Math.sin(this.time * 2) > 0.96;
      if (blink) {
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 8); ctx.lineTo(cx - 16, cy - 8);
        ctx.moveTo(cx + 16, cy - 8); ctx.lineTo(cx + 30, cy - 8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(cx - 24, cy - 8, 7, 0, Math.PI * 2);
        ctx.arc(cx + 24, cy - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        // Eye Sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - 26, cy - 10, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cute Smile
      ctx.strokeStyle = '#171717';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 22, 6, 0, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 6, cy + 22, 6, 0.2 * Math.PI, Math.PI);
      ctx.stroke();
    }
  }

  // 3. Draw Friendly Barista Mascot (Left Side)
  drawBarista(ctx) {
    ctx.save();
    const bx = 130;
    const by = 300;
    const bob = Math.sin(this.time * 2.5 + 1) * 3;

    // Green Barista Apron Body
    ctx.fillStyle = '#065F46';
    ctx.beginPath();
    ctx.ellipse(bx, by + 50 + bob, 55, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Apron Badge
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(bx, by + 40 + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('도촌', bx, by + 43 + bob);

    // Cute Bear Head
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(bx - 36, by - 40 + bob, 18, 0, Math.PI * 2);
    ctx.arc(bx + 36, by - 40 + bob, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.arc(bx - 36, by - 40 + bob, 9, 0, Math.PI * 2);
    ctx.arc(bx + 36, by - 40 + bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(bx, by + bob, 50, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.ellipse(bx, by + 12 + bob, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(bx, by + 6 + bob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.arc(bx - 18, by - 8 + bob, 5, 0, Math.PI * 2);
    ctx.arc(bx + 18, by - 8 + bob, 5, 0, Math.PI * 2);
    ctx.fill();

    // Barista Cap
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.ellipse(bx, by - 44 + bob, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. Cafe Counter Wood Table
  drawCounter(ctx) {
    const tableY = 440;
    // Wood Table Top Layer
    const woodGrad = ctx.createLinearGradient(0, tableY, 0, this.height);
    woodGrad.addColorStop(0, '#92400E');
    woodGrad.addColorStop(0.08, '#B45309');
    woodGrad.addColorStop(0.3, '#78350F');
    woodGrad.addColorStop(1, '#451A03');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, tableY, this.width, this.height - tableY);

    // Counter Edge Highlight
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.fillRect(0, tableY, this.width, 5);

    // Cup Coaster
    const cup = CUP_CONFIG;
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y + 4, cup.bottomWidth / 2 + 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y + 4, cup.bottomWidth / 2 + 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Draw Bubble Tea Cup & Contents
  drawCup(ctx, gameState) {
    const cup = CUP_CONFIG;
    const recipe = gameState.recipe;
    const fillProgress = gameState.fillProgress; // 0 to 1

    ctx.save();

    // Path for the inner trapezoid cup content clipping
    ctx.beginPath();
    ctx.moveTo(cup.x - cup.topWidth / 2 + cup.wallThickness, cup.y - cup.height);
    ctx.lineTo(cup.x + cup.topWidth / 2 - cup.wallThickness, cup.y - cup.height);
    ctx.lineTo(cup.x + cup.bottomWidth / 2 - cup.wallThickness, cup.y);
    ctx.lineTo(cup.x - cup.bottomWidth / 2 + cup.wallThickness, cup.y);
    ctx.closePath();

    ctx.save();
    ctx.clip(); // Clip everything inside the cup

    // --- A. Fill Liquid Layers ---
    if (fillProgress > 0) {
      const surfaceY = cup.y - cup.height * fillProgress;

      // 1. Tea Layer (Base to surface)
      const teaGrad = ctx.createLinearGradient(0, surfaceY, 0, cup.y);
      teaGrad.addColorStop(0, recipe.teaGradient ? recipe.teaGradient[0] : recipe.teaColor);
      teaGrad.addColorStop(1, recipe.teaGradient ? recipe.teaGradient[1] : recipe.teaColor);
      ctx.fillStyle = teaGrad;

      ctx.beginPath();
      ctx.moveTo(cup.x - cup.topWidth, cup.y);
      ctx.lineTo(cup.x + cup.topWidth, cup.y);

      // Liquid top surface with sine wave animation
      const startX = cup.x + cup.topWidth;
      const endX = cup.x - cup.topWidth;
      for (let x = startX; x >= endX; x -= 10) {
        const wave = Math.sin((x + this.time * 80) * 0.04 + this.wavePhase) * this.waveAmp;
        ctx.lineTo(x, surfaceY + wave);
      }
      ctx.closePath();
      ctx.fill();

      // 2. Syrup Layer (if reached Step 3 or syrup poured)
      if (gameState.syrupFill > 0) {
        const syrupSurfaceY = cup.y - cup.height * fillProgress;
        const syrupBottomY = cup.y - cup.height * (fillProgress - gameState.syrupFill);

        ctx.fillStyle = recipe.syrupColor;
        ctx.beginPath();
        ctx.moveTo(cup.x - cup.topWidth, syrupBottomY);
        ctx.lineTo(cup.x + cup.topWidth, syrupBottomY);
        for (let x = cup.x + cup.topWidth; x >= cup.x - cup.topWidth; x -= 10) {
          const wave = Math.sin((x + this.time * 90) * 0.05 + this.wavePhase) * this.waveAmp * 0.7;
          ctx.lineTo(x, syrupSurfaceY + wave);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Foam / Bubble Top Ring
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let x = cup.x - cup.topWidth / 2 + 15; x <= cup.x + cup.topWidth / 2 - 15; x += 18) {
        const wave = Math.sin((x + this.time * 80) * 0.04 + this.wavePhase) * this.waveAmp;
        ctx.beginPath();
        ctx.arc(x, surfaceY + wave + 2, 4 + Math.sin(x) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- B. Draw Settled / Dropping Boba Pearls ---
    this.pearls.forEach(p => {
      ctx.save();
      // Pearl 3D Gradient
      const pGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 1, p.x, p.y, p.radius);
      pGrad.addColorStop(0, '#555555');
      pGrad.addColorStop(0.3, p.color);
      pGrad.addColorStop(1, '#050505');

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Pearl Glossy Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore(); // Exit Cup Content Clipping

    // --- C. Draw Glass Cup Body & Reflection ---
    // Glass Cup Outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = cup.wallThickness;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cup.x - cup.topWidth / 2, cup.y - cup.height);
    ctx.lineTo(cup.x - cup.bottomWidth / 2, cup.y);
    ctx.lineTo(cup.x + cup.bottomWidth / 2, cup.y);
    ctx.lineTo(cup.x + cup.topWidth / 2, cup.y - cup.height);
    ctx.stroke();

    // Cup Rim (Top Oval)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y - cup.height, cup.topWidth / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glass White Curved Reflection Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cup.x - cup.topWidth / 2 + 14, cup.y - cup.height + 25);
    ctx.lineTo(cup.x - cup.bottomWidth / 2 + 10, cup.y - 15);
    ctx.stroke();

    ctx.restore();
  }

  // 6. Draw Pouring Stream & Spout
  drawPouringStream(ctx, gameState) {
    const cup = CUP_CONFIG;
    const recipe = gameState.recipe;
    const step = gameState.currentStep;

    const isPearl = step === STEP_PEARLS;
    const isSyrup = step === STEP_SYRUP;
    const streamColor = isPearl ? recipe.pearlColor : isSyrup ? recipe.syrupColor : recipe.teaColor;

    // Spout at top
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(cup.x - 22, cup.y - cup.height - 70, 44, 25, [6, 6, 2, 2]);
    ctx.fill();

    // Pouring Stream Flow
    const surfaceY = cup.y - cup.height * gameState.fillProgress;
    ctx.fillStyle = streamColor;
    ctx.beginPath();
    ctx.moveTo(cup.x - 8, cup.y - cup.height - 45);
    ctx.lineTo(cup.x + 8, cup.y - cup.height - 45);
    ctx.lineTo(cup.x + 6, surfaceY);
    ctx.lineTo(cup.x - 6, surfaceY);
    ctx.closePath();
    ctx.fill();

    // Stream Glow Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(cup.x - 2, cup.y - cup.height - 45, 4, surfaceY - (cup.y - cup.height - 45));

    // Liquid Droplets
    this.liquidParticles.forEach(lp => {
      ctx.fillStyle = lp.color;
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, lp.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. Draw Visual Target Lines & Step Indicators
  drawTargetLines(ctx, gameState) {
    const cup = CUP_CONFIG;
    const recipe = gameState.recipe;
    const step = gameState.currentStep;

    const lines = [
      { step: STEP_PEARLS, pct: recipe.line1Pct, label: '1. 펄 정량선', icon: '🧋', color: '#F59E0B' },
      { step: STEP_TEA, pct: recipe.line2Pct, label: '2. 밀크티 정량선', icon: '🥛', color: '#38BDF8' },
      { step: STEP_SYRUP, pct: recipe.line3Pct, label: '3. 시럽 정량선', icon: '🍯', color: '#A855F7' }
    ];

    lines.forEach(l => {
      const lineY = cup.y - cup.height * l.pct;
      const isCurrent = step === l.step;

      // Dotted horizontal guide line inside cup
      ctx.save();
      ctx.setLineDash(isCurrent ? [6, 4] : [3, 4]);
      ctx.strokeStyle = isCurrent ? l.color : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isCurrent ? 3 : 1.5;

      const progress = l.pct;
      const halfW = (cup.bottomWidth + (cup.topWidth - cup.bottomWidth) * progress) / 2 - 4;

      ctx.beginPath();
      ctx.moveTo(cup.x - halfW, lineY);
      ctx.lineTo(cup.x + halfW, lineY);
      ctx.stroke();

      // Right Side Tag Badge
      const tagX = cup.x + halfW + 14;
      ctx.fillStyle = isCurrent ? l.color : 'rgba(15, 23, 42, 0.6)';
      ctx.beginPath();
      ctx.roundRect(tagX, lineY - 12, 110, 24, 12);
      ctx.fill();

      if (isCurrent) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = isCurrent ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${l.icon} ${l.label}`, tagX + 8, lineY + 4);

      ctx.restore();
    });
  }

  // 8. Draw Customer Speech Bubble & Order Guide
  drawSpeechBubble(ctx, gameState) {
    const customer = gameState.customer;
    const recipe = gameState.recipe;
    const step = gameState.currentStep;
    if (!customer || !recipe) return;

    ctx.save();
    const bx = 450;
    const by = 85;
    const bw = 310;
    const bh = 75;

    // Glassmorphic Speech Bubble Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.fill();
    ctx.stroke();

    // Bubble Tail pointing to customer
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.moveTo(bx + bw - 30, by + bh);
    ctx.lineTo(bx + bw - 10, by + bh + 16);
    ctx.lineTo(bx + bw - 10, by + bh);
    ctx.closePath();
    ctx.fill();

    // Step Prompt Text
    let promptTitle = '';
    let promptDesc = '';

    if (step === STEP_PEARLS) {
      promptTitle = `[1단계] ${recipe.pearlName} 넣기! 🧋`;
      promptDesc = '화면을 꾹 눌러 1번 노란색 정량선까지 채워주세요!';
    } else if (step === STEP_TEA) {
      promptTitle = `[2단계] ${recipe.teaName} 붓기! 🥛`;
      promptDesc = '화면을 꾹 눌러 2번 하늘색 정량선까지 채워주세요!';
    } else if (step === STEP_SYRUP) {
      promptTitle = `[3단계] ${recipe.syrupName} 토핑! 🍯`;
      promptDesc = '화면을 꾹 눌러 3번 보라색 정량선까지 맞춰주세요!';
    } else {
      promptTitle = `✨ ${recipe.name} 완성! ✨`;
      promptDesc = '빨대를 꽂아 손님께 맛있게 서빙합니다!';
    }

    ctx.fillStyle = '#FBBF24';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(promptTitle, bx + 16, by + 28);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 11px sans-serif';
    ctx.fillText(promptDesc, bx + 16, by + 52);

    ctx.restore();
  }

  // 9. Draw Straw & Sealing Film
  drawStraw(ctx, gameState) {
    const cup = CUP_CONFIG;
    const recipe = gameState.recipe;

    ctx.save();
    // Plastic Sealing Film Top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cup.x, cup.y - cup.height, cup.topWidth / 2 + 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Straw Plunge
    const strawX = cup.x;
    const strawTopY = cup.y - cup.height - 90;
    const strawBottomY = cup.y - 20;

    ctx.save();
    ctx.translate(strawX, strawTopY);
    ctx.rotate(cup.strawAngle);

    // Straw Body
    ctx.fillStyle = recipe.strawColor || '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(-cup.strawWidth / 2, 0, cup.strawWidth, cup.strawHeight, 6);
    ctx.fill();

    // Straw White Striping
    ctx.fillStyle = '#FFFFFF';
    for (let sy = 15; sy < cup.strawHeight; sy += 30) {
      ctx.beginPath();
      ctx.roundRect(-cup.strawWidth / 2, sy, cup.strawWidth, 8, 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // 10. Draw Floating Texts & Sparkles
  drawEffects(ctx) {
    // Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.opacity);
      ctx.font = `900 ${ft.fontSize * ft.scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // Sparkles
    this.sparkles.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
