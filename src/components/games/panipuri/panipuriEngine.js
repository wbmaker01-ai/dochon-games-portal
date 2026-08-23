// Dochon Pani Puri Master - Canvas 2D Rendering Engine

import { CANVAS_WIDTH, CANVAS_HEIGHT, PANI_FLAVORS, FLAVOR_LIST } from './panipuriConstants';

export class PaniPuriEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.floatingTexts = [];
    this.animTime = 0;
  }

  // Add crispy shell or liquid splash particles
  addParticle(x, y, color, count = 8, speed = 4, type = 'liquid') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const velocity = speed * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (type === 'liquid' ? 2 : 1),
        gravity: 0.18,
        radius: type === 'liquid' ? 2.5 + Math.random() * 2.5 : 2 + Math.random() * 2,
        color,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        type
      });
    }
  }

  // Add floating celebration text
  addFloatingText(text, x, y, color = '#FBBF24', size = 18) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.8,
      color,
      size,
      alpha: 1.0,
      decay: 0.025
    });
  }

  // Main Render Loop
  render(gameState) {
    if (!this.ctx) return;
    this.animTime += 0.03;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Vibrant Festival Stall Background
    this.drawBackground(ctx, gameState.isFever);

    // 2. Draw Current Customer & Order Speech Bubble
    if (gameState.currentCustomer) {
      this.drawCustomer(ctx, gameState.currentCustomer, gameState.customerPatience, gameState.isFever);
    }

    // 3. Draw Chef's Serving Counter & Clay Pots (Matkas)
    this.drawCounterAndPots(ctx, gameState.isFever);

    // 4. Draw Center Serving Plate with Prepared Puris
    this.drawPrepPlate(ctx, gameState.preparedPuris, gameState.isFever);

    // 5. Update & Draw Particles & Floating Texts
    this.updateParticles(ctx);
    this.updateFloatingTexts(ctx);

    // 6. Draw Fever Mode Golden Vignette & Sparkles
    if (gameState.isFever) {
      this.drawFeverOverlay(ctx);
    }
  }

  // 1. Background Stall
  drawBackground(ctx, isFever) {
    // Warm gradient wall
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    if (isFever) {
      bgGrad.addColorStop(0, '#FEF08A');
      bgGrad.addColorStop(0.5, '#FDE047');
      bgGrad.addColorStop(1, '#CA8A04');
    } else {
      bgGrad.addColorStop(0, '#FFFBEB');
      bgGrad.addColorStop(0.4, '#FEF3C7');
      bgGrad.addColorStop(1, '#FDE68A');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Festival Awning / Canopy Roof (Striped Marigold & Crimson)
    ctx.save();
    const stripeWidth = 50;
    const awningHeight = 55;
    for (let i = 0; i < CANVAS_WIDTH; i += stripeWidth) {
      const isRed = (i / stripeWidth) % 2 === 0;
      ctx.fillStyle = isRed ? '#DC2626' : '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + stripeWidth, 0);
      ctx.lineTo(i + stripeWidth, awningHeight);
      ctx.quadraticCurveTo(i + stripeWidth / 2, awningHeight + 15, i, awningHeight);
      ctx.closePath();
      ctx.fill();

      // Shadow under awning
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(i, awningHeight, stripeWidth, 4);
    }

    // Hanging Festive Garland / Lights
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, awningHeight + 12);
    for (let x = 0; x <= CANVAS_WIDTH; x += 100) {
      ctx.quadraticCurveTo(x + 50, awningHeight + 32, x + 100, awningHeight + 12);
    }
    ctx.stroke();

    // Little hanging golden marigold bells
    for (let x = 50; x < CANVAS_WIDTH; x += 100) {
      const bellY = awningHeight + 28 + Math.sin(this.animTime * 2 + x) * 2;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(x, bellY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(x, bellY - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Customer Character & Speech Bubble
  drawCustomer(ctx, customer, patiencePercent, isFever) {
    ctx.save();
    const cx = 180;
    const cy = 200;

    // Customer floating bobbing animation
    const bob = Math.sin(this.animTime * 3) * 3;

    // Body / Shirt
    ctx.fillStyle = customer.shirtColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 70 + bob, 45, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = customer.skinColor;
    ctx.fillRect(cx - 12, cy + 30 + bob, 24, 20);

    // Head / Face
    ctx.fillStyle = customer.skinColor;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, 38, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(cx - 38, cy + bob, 8, 0, Math.PI * 2);
    ctx.arc(cx + 38, cy + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Turban
    if (customer.turban) {
      ctx.fillStyle = customer.turbanColor || '#EF4444';
      ctx.beginPath();
      ctx.arc(cx, cy - 14 + bob, 42, Math.PI, 0);
      ctx.fill();
      // Turban Jewel
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(cx, cy - 26 + bob, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = customer.hairColor;
      if (customer.hairStyle === 'bun') {
        ctx.beginPath();
        ctx.arc(cx, cy - 16 + bob, 40, Math.PI * 0.8, Math.PI * 0.2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - 44 + bob, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (customer.hairStyle === 'pigtails') {
        ctx.beginPath();
        ctx.arc(cx, cy - 16 + bob, 40, Math.PI * 0.8, Math.PI * 0.2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - 42, cy - 10 + bob, 14, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy - 10 + bob, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy - 14 + bob, 40, Math.PI * 0.85, Math.PI * 0.15);
        ctx.fill();
      }
    }

    // Eyes
    const eyeOffsetX = 14;
    const eyeOffsetY = -2 + bob;
    ctx.fillStyle = '#1E293B';
    if (patiencePercent < 0.25) {
      // Impatient / Teary eyes
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(cx - eyeOffsetX, cy + eyeOffsetY, 5, Math.PI, 0);
      ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, 5, Math.PI, 0);
      ctx.stroke();
    } else {
      // Happy / Normal blinking eyes
      const blink = Math.sin(this.animTime * 1.5) > 0.96;
      if (blink) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(cx - eyeOffsetX - 6, cy + eyeOffsetY);
        ctx.lineTo(cx - eyeOffsetX + 6, cy + eyeOffsetY);
        ctx.moveTo(cx + eyeOffsetX - 6, cy + eyeOffsetY);
        ctx.lineTo(cx + eyeOffsetX + 6, cy + eyeOffsetY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(cx - eyeOffsetX, cy + eyeOffsetY, 4.5, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        // Eye Sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - eyeOffsetX - 1.5, cy + eyeOffsetY - 1.5, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffsetX - 1.5, cy + eyeOffsetY - 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glasses if equipped
    if (customer.glasses) {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - eyeOffsetX, cy + eyeOffsetY, 10, 0, Math.PI * 2);
      ctx.arc(cx + eyeOffsetX, cy + eyeOffsetY, 10, 0, Math.PI * 2);
      ctx.moveTo(cx - eyeOffsetX + 10, cy + eyeOffsetY);
      ctx.lineTo(cx + eyeOffsetX - 10, cy + eyeOffsetY);
      ctx.stroke();
    }

    // Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(cx - 24, cy + 10 + bob, 6, 0, Math.PI * 2);
    ctx.arc(cx + 24, cy + 10 + bob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Smile / Mouth
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (patiencePercent < 0.25) {
      // Wavy anxious mouth
      ctx.arc(cx, cy + 22 + bob, 6, Math.PI, 0);
    } else {
      // Big happy smile
      ctx.arc(cx, cy + 12 + bob, 9, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // Customer Name Tag Plate
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(cx - 55, cy + 110 + bob, 110, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${customer.name} (${customer.role})`, cx, cy + 125 + bob);

    ctx.restore();

    // 3. Draw Order Speech Bubble
    this.drawSpeechBubble(ctx, customer, patiencePercent, cx + 55, cy - 35 + bob);
  }

  // Draw Speech Bubble showing required Pani Puris
  drawSpeechBubble(ctx, customer, patiencePercent, bx, by) {
    const bubbleW = 380;
    const bubbleH = 105;

    ctx.save();
    // Bubble shadow
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Bubble Background
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = patiencePercent < 0.3 ? '#EF4444' : '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 16);
    ctx.fill();
    ctx.stroke();

    // Speech Tail pointing to Customer
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(bx, by + 40);
    ctx.lineTo(bx - 16, by + 50);
    ctx.lineTo(bx, by + 60);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = patiencePercent < 0.3 ? '#EF4444' : '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(bx, by + 40);
    ctx.lineTo(bx - 16, by + 50);
    ctx.lineTo(bx, by + 60);
    ctx.stroke();

    // Patience Bar inside Speech Bubble
    const barX = bx + 16;
    const barY = by + 12;
    const barW = bubbleW - 32;
    const barH = 6;

    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    const fillW = Math.max(0, barW * Math.min(patiencePercent, 1.0));
    ctx.fillStyle = patiencePercent > 0.5 ? '#10B981' : patiencePercent > 0.25 ? '#F59E0B' : '#EF4444';
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 3);
    ctx.fill();

    // Order Header Text
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`주문: "${customer.catchphrase}"`, bx + 16, by + 32);

    // Required Pani Puri Items in Order
    const order = customer.order || [];
    const itemStartX = bx + 16;
    const itemY = by + 65;
    const itemGap = 88;

    order.forEach((item, index) => {
      const ix = itemStartX + index * itemGap;
      const flavor = PANI_FLAVORS[item.flavorKey.toUpperCase()] || PANI_FLAVORS.MINT;

      // Item container card
      ctx.fillStyle = flavor.bgColor;
      ctx.strokeStyle = flavor.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(ix, itemY - 24, 78, 48, 10);
      ctx.fill();
      ctx.stroke();

      // Mini Puri with Liquid
      this.drawPuriMini(ctx, ix + 18, itemY - 2, flavor);

      // Flavor Name Tag
      ctx.fillStyle = flavor.deepColor;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${flavor.icon} ${flavor.shortName}`, ix + 39, itemY + 18);

      // Quantity Badge
      ctx.fillStyle = '#1E293B';
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`x${item.count}`, ix + 42, itemY + 3);
    });

    ctx.restore();
  }

  // Hit-testing for clicking clay pots on canvas
  getClickedPot(x, y) {
    const tableY = 320;
    const potStartX = 80;
    const potGap = 130;
    const potY = tableY + 55;

    for (let idx = 0; idx < FLAVOR_LIST.length; idx++) {
      const px = potStartX + idx * potGap;
      const dx = x - px;
      const dy = y - (potY + 10);
      // Ellipse hit test for pot
      if ((dx * dx) / (48 * 48) + (dy * dy) / (40 * 40) <= 1) {
        return FLAVOR_LIST[idx];
      }
    }
    return null;
  }

  // Mini Puri icon for UI/Bubbles
  drawPuriMini(ctx, x, y, flavor) {
    ctx.save();
    // Golden shell
    const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, 14);
    grad.addColorStop(0, '#FDE68A');
    grad.addColorStop(0.7, '#D97706');
    grad.addColorStop(1, '#92400E');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Center Hole with Liquid
    ctx.fillStyle = flavor.liquidColor;
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. Chef's Table Counter & Clay Pots (Matkas)
  drawCounterAndPots(ctx, isFever) {
    ctx.save();
    const tableY = 320;
    const tableH = CANVAS_HEIGHT - tableY;

    // Wooden Counter Base
    const woodGrad = ctx.createLinearGradient(0, tableY, 0, CANVAS_HEIGHT);
    woodGrad.addColorStop(0, '#B45309');
    woodGrad.addColorStop(0.1, '#78350F');
    woodGrad.addColorStop(0.9, '#451A03');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, tableY, CANVAS_WIDTH, tableH);

    // Countertop Stainless Trim
    const trimGrad = ctx.createLinearGradient(0, tableY - 10, 0, tableY);
    trimGrad.addColorStop(0, '#E2E8F0');
    trimGrad.addColorStop(0.5, '#FFFFFF');
    trimGrad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = trimGrad;
    ctx.fillRect(0, tableY - 12, CANVAS_WIDTH, 14);

    // Draw 4 Big Matka Pots (Flavors: Mint, Tamarind, Chili, Mango)
    const potStartX = 80;
    const potGap = 130;
    const potY = tableY + 55;

    FLAVOR_LIST.forEach((flavor, idx) => {
      const px = potStartX + idx * potGap;
      this.drawClayPot(ctx, px, potY, flavor, isFever);
    });

    ctx.restore();
  }

  // Draw Clay Pot with Waving Liquid
  drawClayPot(ctx, x, y, flavor, isFever) {
    ctx.save();

    // Terracotta Clay Pot Body
    const potGrad = ctx.createRadialGradient(x - 10, y - 5, 5, x, y, 45);
    potGrad.addColorStop(0, '#D97706');
    potGrad.addColorStop(0.6, '#B45309');
    potGrad.addColorStop(1, '#78350F');

    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 42, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pot Rim
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.ellipse(x, y - 20, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Liquid Surface with Wobble Animation
    const wobble = Math.sin(this.animTime * 4 + x) * 2;
    ctx.fillStyle = isFever ? PANI_FLAVORS.GOLDEN.liquidColor : flavor.liquidColor;
    ctx.beginPath();
    ctx.ellipse(x, y - 20 + wobble, 32, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Liquid Surface Highlight
    ctx.fillStyle = isFever ? PANI_FLAVORS.GOLDEN.surfaceColor : flavor.surfaceColor;
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 22 + wobble, 12, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pot Label & Icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${flavor.icon} ${flavor.shortName}`, x, y + 20);

    ctx.restore();
  }

  // 4. Center Prep Plate with Puris
  drawPrepPlate(ctx, preparedPuris, isFever) {
    ctx.save();
    const plateX = 660;
    const plateY = 410;

    // Steel Serving Thali (Large Tray)
    const steelGrad = ctx.createRadialGradient(plateX, plateY, 30, plateX, plateY, 110);
    steelGrad.addColorStop(0, '#F8FAFC');
    steelGrad.addColorStop(0.7, '#CBD5E1');
    steelGrad.addColorStop(1, '#64748B');

    ctx.fillStyle = steelGrad;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, 105, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plate Inner Rim
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(plateX, plateY, 95, 66, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Prepared Puris on Plate (up to 6 arranged in circle)
    const count = preparedPuris.length;
    if (count === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('단지를 클릭하여', plateX, plateY - 6);
      ctx.fillText('파니 푸리를 담으세요!', plateX, plateY + 12);
    } else {
      const radius = count === 1 ? 0 : 38;
      preparedPuris.forEach((puri, idx) => {
        const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
        const px = plateX + Math.cos(angle) * radius;
        const py = plateY + Math.sin(angle) * (radius * 0.7);
        const flavor = PANI_FLAVORS[puri.flavorKey.toUpperCase()] || PANI_FLAVORS.MINT;
        this.drawSingleCrispyPuri(ctx, px, py, flavor, isFever);
      });
    }

    ctx.restore();
  }

  // Draw Full Sized Crispy Pani Puri Ball
  drawSingleCrispyPuri(ctx, x, y, flavor, isFever) {
    ctx.save();
    const puriR = 24;

    // Puri Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + puriR * 0.8, puriR * 0.9, puriR * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crispy Fried Shell (Golden Brown Sphere)
    const shellGrad = ctx.createRadialGradient(x - 6, y - 6, 4, x, y, puriR);
    if (isFever) {
      shellGrad.addColorStop(0, '#FEF08A');
      shellGrad.addColorStop(0.6, '#FACC15');
      shellGrad.addColorStop(1, '#CA8A04');
    } else {
      shellGrad.addColorStop(0, '#FEF3C7');
      shellGrad.addColorStop(0.4, '#F59E0B');
      shellGrad.addColorStop(0.85, '#D97706');
      shellGrad.addColorStop(1, '#78350F');
    }

    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(x, y, puriR, 0, Math.PI * 2);
    ctx.fill();

    // Shell Crack details
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, puriR - 2, 0.5, 2.2);
    ctx.stroke();

    // Center Cracked Top Hole
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Delicious Pani Liquid Inside Hole
    const liquidColor = isFever ? PANI_FLAVORS.GOLDEN.liquidColor : flavor.liquidColor;
    ctx.fillStyle = liquidColor;
    ctx.beginPath();
    ctx.ellipse(x, y - 2, 10, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shiny Liquid Glint
    const surfaceColor = isFever ? PANI_FLAVORS.GOLDEN.surfaceColor : flavor.surfaceColor;
    ctx.fillStyle = surfaceColor;
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 4, 4, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. Update & Draw Particles
  updateParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Update & Draw Floating Texts
  updateFloatingTexts(ctx) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.font = `900 ${ft.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // 6. Fever Overlay
  drawFeverOverlay(ctx) {
    ctx.save();
    // Golden border glow
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Floating Golden Stars
    const starCount = 6;
    for (let i = 0; i < starCount; i++) {
      const sx = (CANVAS_WIDTH / starCount) * i + Math.sin(this.animTime * 3 + i) * 20;
      const sy = 40 + Math.cos(this.animTime * 2 + i) * 15;
      ctx.fillStyle = '#FEF08A';
      ctx.font = '16px sans-serif';
      ctx.fillText('✨', sx, sy);
    }
    ctx.restore();
  }
}
