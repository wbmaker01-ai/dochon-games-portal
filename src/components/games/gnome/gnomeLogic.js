// =========================================================================
// Physics Simulation, Terrain Generation & Canvas Renderer for Garden Gnomes
// =========================================================================

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PHYSICS_CONFIG,
  TERRAIN_ITEM_TYPES
} from './gnomeConstants';

/**
 * Creates a transparent sprite from an image by removing the bright white background.
 * Uses soft alpha edge feathering for smooth cartoon outlines.
 */
export function createTransparentSprite(img) {
  if (!img || !img.width || !img.height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detect white / near-white background pixels
    if (r > 225 && g > 225 && b > 225) {
      const minVal = Math.min(r, g, b);
      if (minVal > 245) {
        data[i + 3] = 0; // Fully transparent
      } else {
        // Smooth edge feathering
        const alphaFactor = (245 - minVal) / 20;
        data[i + 3] = Math.floor(255 * Math.max(0, Math.min(1, alphaFactor)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Generates interactive garden objects and collectibles across the 5000m path.
 */
export function generateGardenTerrain(maxDistance = 5500) {
  const items = [];
  let nextGroundX = 220;

  // Ground items distribution
  while (nextGroundX < maxDistance) {
    const gap = 120 + Math.random() * 180;
    nextGroundX += gap;

    const rand = Math.random();
    let type;
    if (rand < 0.40) {
      type = TERRAIN_ITEM_TYPES.MUSHROOM;
    } else if (rand < 0.70) {
      type = TERRAIN_ITEM_TYPES.LOG;
    } else {
      type = TERRAIN_ITEM_TYPES.SUNFLOWER;
    }

    items.push({
      id: `item_${items.length}`,
      type: type.id,
      name: type.name,
      x: nextGroundX,
      y: GROUND_Y - type.height,
      width: type.width,
      height: type.height,
      active: true,
      data: type
    });
  }

  // Sky items (Clouds, Rainbow Rings, Airborne Seeds)
  let nextSkyX = 350;
  while (nextSkyX < maxDistance) {
    const gap = 180 + Math.random() * 260;
    nextSkyX += gap;

    const rand = Math.random();
    const skyY = 120 + Math.random() * 200; // Heights between 120 and 320

    if (rand < 0.35) {
      items.push({
        id: `sky_${items.length}`,
        type: TERRAIN_ITEM_TYPES.CLOUD.id,
        name: TERRAIN_ITEM_TYPES.CLOUD.name,
        x: nextSkyX,
        y: skyY,
        width: TERRAIN_ITEM_TYPES.CLOUD.width,
        height: TERRAIN_ITEM_TYPES.CLOUD.height,
        active: true,
        data: TERRAIN_ITEM_TYPES.CLOUD
      });
    } else if (rand < 0.65) {
      items.push({
        id: `sky_${items.length}`,
        type: TERRAIN_ITEM_TYPES.RAINBOW.id,
        name: TERRAIN_ITEM_TYPES.RAINBOW.name,
        x: nextSkyX,
        y: skyY - 20,
        width: TERRAIN_ITEM_TYPES.RAINBOW.width,
        height: TERRAIN_ITEM_TYPES.RAINBOW.height,
        active: true,
        data: TERRAIN_ITEM_TYPES.RAINBOW
      });
    } else {
      // Golden seed arc / cluster
      for (let s = 0; s < 3; s++) {
        items.push({
          id: `seed_${items.length}_${s}`,
          type: TERRAIN_ITEM_TYPES.SEED.id,
          name: TERRAIN_ITEM_TYPES.SEED.name,
          x: nextSkyX + s * 45,
          y: skyY - Math.sin((s / 2) * Math.PI) * 30,
          width: TERRAIN_ITEM_TYPES.SEED.width,
          height: TERRAIN_ITEM_TYPES.SEED.height,
          active: true,
          data: TERRAIN_ITEM_TYPES.SEED
        });
      }
    }
  }

  return items;
}

/**
 * High Performance Particle System for magical trails, explosions and flower blooms
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.plantedFlowers = []; // Persistent flowers along the ground
  }

  reset() {
    this.particles = [];
    this.plantedFlowers = [];
  }

  addFlower(x, y, color) {
    if (this.plantedFlowers.length > 300) {
      this.plantedFlowers.shift();
    }
    const colors = ['#f56565', '#ed64a6', '#9f7aea', '#ecc94b', '#48bb78', '#ed8936', '#4299e1'];
    this.plantedFlowers.push({
      x,
      y: y || GROUND_Y - 4,
      size: 6 + Math.random() * 8,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      petals: Math.floor(4 + Math.random() * 3),
      stemHeight: 10 + Math.random() * 12
    });
  }

  addRainbowTrail(x, y) {
    const hues = [0, 45, 120, 200, 280];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    this.particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: -(2 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 1.5,
      size: 5 + Math.random() * 7,
      color: `hsla(${hue}, 95%, 65%, 0.85)`,
      life: 1.0,
      decay: 0.035,
      type: 'sparkle'
    });
  }

  addDiveWind(x, y) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 20 - Math.random() * 20,
        vx: -(1 + Math.random() * 2),
        vy: -(4 + Math.random() * 4),
        size: 3 + Math.random() * 4,
        color: 'rgba(255, 255, 255, 0.75)',
        life: 1.0,
        decay: 0.06,
        type: 'wind'
      });
    }
  }

  addBounceExplosion(x, y, color = '#e53e3e', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 3 + Math.random() * 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        color,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        type: 'burst'
      });
    }
  }

  addLogSparks(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.2) * 8,
        vy: -(2 + Math.random() * 5),
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ecc94b' : '#ed8936',
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03,
        type: 'burst'
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.size = Math.max(0, p.size * 0.98);

      if (p.type === 'burst') {
        p.vy += 0.2; // gravity on bursts
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, cameraX, cameraY) {
    // 1. Draw Persistent Planted Flowers
    for (const f of this.plantedFlowers) {
      if (f.x < cameraX - 100 || f.x > cameraX + CANVAS_WIDTH + 100) continue;
      const screenX = f.x - cameraX;
      const screenY = f.y - cameraY;

      // Stem
      ctx.strokeStyle = '#38a169';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY + 4);
      ctx.lineTo(screenX, screenY - f.stemHeight);
      ctx.stroke();

      // Flower Head
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY - f.stemHeight, f.size, 0, Math.PI * 2);
      ctx.fill();

      // Center Eye
      ctx.fillStyle = '#fff566';
      ctx.beginPath();
      ctx.arc(screenX, screenY - f.stemHeight, f.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Dynamic Particles
    for (const p of this.particles) {
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;
      if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;

      if (p.type === 'sparkle') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'wind') {
        ctx.fillRect(screenX, screenY, p.size * 3, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/**
 * Draws the rich multi-layered Parallax Garden Background
 */
export function drawParallaxGarden(ctx, cameraX, cameraY, bgImg) {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Sky Gradient Background (if image not loaded or high altitude)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#70c5ff');
  skyGrad.addColorStop(0.55, '#c2e9fb');
  skyGrad.addColorStop(0.85, '#e0f7fa');
  skyGrad.addColorStop(1, '#9ae6b4');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Sun with gentle halo
  const sunScreenX = 760 - (cameraX * 0.02) % (width + 200);
  const sunScreenY = 90 - (cameraY * 0.02);
  const sunHalo = ctx.createRadialGradient(sunScreenX, sunScreenY, 15, sunScreenX, sunScreenY, 85);
  sunHalo.addColorStop(0, 'rgba(255, 236, 128, 0.95)');
  sunHalo.addColorStop(0.4, 'rgba(255, 215, 0, 0.45)');
  sunHalo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, 85, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffea60';
  ctx.beginPath();
  ctx.arc(sunScreenX, sunScreenY, 32, 0, Math.PI * 2);
  ctx.fill();

  // 3. Parallax Image Layer (if loaded)
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    const bgScale = height / bgImg.height;
    const scaledWidth = bgImg.width * bgScale;
    const parallaxOffset = -(cameraX * 0.25) % scaledWidth;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(bgImg, parallaxOffset, 0, scaledWidth, height);
    if (parallaxOffset + scaledWidth < width) {
      ctx.drawImage(bgImg, parallaxOffset + scaledWidth, 0, scaledWidth, height);
    }
    if (parallaxOffset > 0) {
      ctx.drawImage(bgImg, parallaxOffset - scaledWidth, 0, scaledWidth, height);
    }
    ctx.restore();
  }

  // 4. Wooden Picket Fence Layer (Parallax 0.5)
  const fenceOffset = (cameraX * 0.5) % 60;
  ctx.fillStyle = '#fbd38d';
  ctx.strokeStyle = '#c05621';
  ctx.lineWidth = 1.5;
  const fenceBaseY = GROUND_Y - 30 - cameraY;

  for (let x = -60 - fenceOffset; x < width + 60; x += 28) {
    ctx.fillRect(x, fenceBaseY - 32, 14, 32);
    ctx.strokeRect(x, fenceBaseY - 32, 14, 32);

    // Fence tip triangle
    ctx.beginPath();
    ctx.moveTo(x, fenceBaseY - 32);
    ctx.lineTo(x + 7, fenceBaseY - 42);
    ctx.lineTo(x + 14, fenceBaseY - 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Fence cross rails
  ctx.fillRect(-60, fenceBaseY - 24, width + 120, 5);
  ctx.strokeRect(-60, fenceBaseY - 24, width + 120, 5);
  ctx.fillRect(-60, fenceBaseY - 10, width + 120, 5);
  ctx.strokeRect(-60, fenceBaseY - 10, width + 120, 5);

  // 5. Lush Main Ground Baseline
  const groundScreenY = GROUND_Y - cameraY;
  const groundGrad = ctx.createLinearGradient(0, groundScreenY, 0, height);
  groundGrad.addColorStop(0, '#48bb78'); // Top grass
  groundGrad.addColorStop(0.12, '#38a169');
  groundGrad.addColorStop(0.3, '#744210'); // Earth soil
  groundGrad.addColorStop(1, '#4a2503');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundScreenY, width, height - groundScreenY + 200);

  // Grass tufts along the ground top
  ctx.fillStyle = '#68d391';
  const tuftOffset = (cameraX * 1.0) % 24;
  for (let x = -24 - tuftOffset; x < width + 24; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, groundScreenY);
    ctx.lineTo(x + 4, groundScreenY - 8);
    ctx.lineTo(x + 8, groundScreenY);
    ctx.fill();
  }
}

/**
 * Draws the Medieval Wooden Catapult / Trebuchet at start area (X: 60)
 */
export function drawTrebuchet(ctx, cameraX, cameraY, angleDeg = 45, tension = 0) {
  const baseX = 80 - cameraX;
  const baseY = GROUND_Y - cameraY;

  if (baseX < -150 || baseX > CANVAS_WIDTH + 150) return;

  ctx.save();

  // 1. Catapult Frame Structure (Heavy timber wood)
  ctx.fillStyle = '#975a16';
  ctx.strokeStyle = '#5f370e';
  ctx.lineWidth = 3;

  // Base platform
  ctx.fillRect(baseX - 45, baseY - 24, 90, 16);
  ctx.strokeRect(baseX - 45, baseY - 24, 90, 16);

  // Wheels
  const wheelRadius = 14;
  [-30, 30].forEach((wx) => {
    ctx.fillStyle = '#744210';
    ctx.beginPath();
    ctx.arc(baseX + wx, baseY - 10, wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hub
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(baseX + wx, baseY - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // A-Frame Main Support
  ctx.beginPath();
  ctx.moveTo(baseX - 35, baseY - 24);
  ctx.lineTo(baseX, baseY - 90);
  ctx.lineTo(baseX + 35, baseY - 24);
  ctx.lineTo(baseX + 22, baseY - 24);
  ctx.lineTo(baseX, baseY - 78);
  ctx.lineTo(baseX - 22, baseY - 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pivot axle pin
  const pivotX = baseX;
  const pivotY = baseY - 84;
  ctx.fillStyle = '#4a5568';
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 2. Launch Arm Rotating with Launch Angle
  ctx.save();
  ctx.translate(pivotX, pivotY);

  const rad = (angleDeg * Math.PI) / 180;
  // Arm angle offset with tension
  ctx.rotate(-rad + tension * 0.15);

  // Wooden throwing beam
  ctx.fillStyle = '#d69e2e';
  ctx.strokeStyle = '#744210';
  ctx.lineWidth = 2.5;

  ctx.fillRect(-22, -6, 95, 12);
  ctx.strokeRect(-22, -6, 95, 12);

  // Counterweight block
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(-32, -14, 20, 28);
  ctx.strokeRect(-32, -14, 20, 28);

  // Cup/Sling at end of arm
  ctx.fillStyle = '#b7791f';
  ctx.beginPath();
  ctx.arc(74, 0, 15, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  // "START LAUNCH" wooden signpost
  ctx.fillStyle = '#ecc94b';
  ctx.strokeStyle = '#744210';
  ctx.lineWidth = 2;
  ctx.fillRect(baseX - 90, baseY - 70, 48, 26);
  ctx.strokeRect(baseX - 90, baseY - 70, 48, 26);

  ctx.fillStyle = '#744210';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('0m 출발', baseX - 66, baseY - 53);

  // Signpost stick
  ctx.fillStyle = '#975a16';
  ctx.fillRect(baseX - 69, baseY - 44, 6, 44);

  ctx.restore();
}

/**
 * Draws an interactive terrain item (Mushroom, Log, Cloud, Rainbow, Sunflower, Seed)
 */
export function drawTerrainItem(ctx, item, cameraX, cameraY) {
  if (!item.active) return;
  const screenX = item.x - cameraX;
  const screenY = item.y - cameraY;

  if (screenX < -100 || screenX > CANVAS_WIDTH + 100 || screenY < -100 || screenY > CANVAS_HEIGHT + 100) return;

  ctx.save();

  switch (item.type) {
    case 'MUSHROOM': {
      // Bouncy Red Polka-dot Spring Mushroom
      // Stem
      ctx.fillStyle = '#feebc8';
      ctx.strokeStyle = '#dd6b20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(screenX + item.width / 2, screenY + item.height - 12, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cap
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.arc(screenX + item.width / 2, screenY + 18, 24, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // White polka dots
      ctx.fillStyle = '#ffffff';
      [
        [-10, 8],
        [0, 2],
        [10, 8],
        [-4, 14],
        [6, 14]
      ].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(screenX + item.width / 2 + dx, screenY + dy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'LOG': {
      // Speed Booster Log
      ctx.fillStyle = '#8b5a2b';
      ctx.strokeStyle = '#503114';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.roundRect(screenX, screenY + 4, item.width, item.height - 4, 8);
      ctx.fill();
      ctx.stroke();

      // Tree rings on side
      ctx.fillStyle = '#d69e2e';
      ctx.beginPath();
      ctx.ellipse(screenX + 10, screenY + item.height / 2 + 2, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Green moss on top
      ctx.fillStyle = '#48bb78';
      ctx.beginPath();
      ctx.ellipse(screenX + item.width / 2, screenY + 4, item.width * 0.4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'SUNFLOWER': {
      // Radiant Sunflower Patch
      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;

      // Yellow petals
      ctx.fillStyle = '#ecc94b';
      const petals = 10;
      for (let p = 0; p < petals; p++) {
        const angle = (p / petals) * Math.PI * 2;
        const px = cx + Math.cos(angle) * 20;
        const py = cy + Math.sin(angle) * 16;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brown center
      ctx.fillStyle = '#744210';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'CLOUD': {
      // Fluffy Smiling Spring Cloud
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#90cdf4';
      ctx.lineWidth = 2;

      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;

      ctx.beginPath();
      ctx.arc(cx - 18, cy + 2, 16, 0, Math.PI * 2);
      ctx.arc(cx, cy - 6, 20, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy + 2, 16, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cute smile
      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 5, 0, Math.PI);
      ctx.stroke();
      break;
    }

    case 'RAINBOW': {
      // Rainbow Speed Booster Ring
      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;
      const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#4299e1', '#9f7aea'];

      colors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 26 - i * 3, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Shimmering stars around ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + 18, cy - 18, 4, 0, Math.PI * 2);
      ctx.arc(cx - 18, cy + 18, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'SEED': {
      // Golden Flower Seed / Star
      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;

      ctx.fillStyle = '#ecc94b';
      ctx.strokeStyle = '#d69e2e';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sparkle cross
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Draws the Gnome Character with smooth rotation and dive particles
 */
export function drawGnome(ctx, gnome, spriteCanvas, isDropping = false, cameraX = 0, cameraY = 0) {
  const screenX = gnome.x - cameraX;
  const screenY = gnome.y - cameraY;

  ctx.save();
  ctx.translate(screenX, screenY);

  // Rotation aligns with velocity direction
  let angle = Math.atan2(gnome.vy, gnome.vx);
  if (isDropping) {
    angle = Math.PI / 3; // Steep dive angle
  }
  ctx.rotate(angle);

  const drawSize = 64;

  if (spriteCanvas) {
    // Draw Transparent Processed Sprite
    ctx.drawImage(spriteCanvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  } else {
    // High-quality vector fallback gnome
    const hatColor = gnome.hatColor || '#e53e3e';

    // Body
    ctx.fillStyle = '#3182ce';
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beard
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(4, 8, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face / Nose
    ctx.fillStyle = '#fbd38d';
    ctx.beginPath();
    ctx.arc(6, 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Pointy Hat
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(24, -20);
    ctx.lineTo(2, 6);
    ctx.closePath();
    ctx.fill();
  }

  // Diving speed streaks
  if (isDropping) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-35, -10);
    ctx.lineTo(-65, -10);
    ctx.moveTo(-35, 10);
    ctx.lineTo(-65, 10);
    ctx.stroke();
  }

  ctx.restore();
}
