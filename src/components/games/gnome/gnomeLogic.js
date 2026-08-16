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
 * Generates rich interactive garden objects and collectibles across the 5000m path (Super High Density).
 */
export function generateGardenTerrain(maxDistance = 5500) {
  const items = [];
  let nextGroundX = 120;

  // Ground items distribution (3x+ Higher Density: Every 30~65px)
  while (nextGroundX < maxDistance) {
    const gap = 32 + Math.random() * 36;
    nextGroundX += gap;

    const rand = Math.random();
    let type;
    if (rand < 0.30) {
      type = TERRAIN_ITEM_TYPES.MUSHROOM;
    } else if (rand < 0.55) {
      type = TERRAIN_ITEM_TYPES.TRAMPOLINE;
    } else if (rand < 0.80) {
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
      lastHitTime: 0,
      data: type
    });
  }

  // Sky items (Clouds, Rainbow Rings, Butterfly Swarms, Airborne Seeds) across all altitude bands (3x+ Density)
  let nextSkyX = 150;
  while (nextSkyX < maxDistance) {
    const gap = 28 + Math.random() * 38;
    nextSkyX += gap;

    // Spawn across multiple altitude layers (Low: 80~250, Mid: -180~60, High: -550~-160)
    const altLayers = [
      80 + Math.random() * 160,  // Low sky
      -160 + Math.random() * 200, // Mid sky
      -520 + Math.random() * 320  // High sky
    ];

    // Pick 1~2 altitude layers per column
    const layerIndices = Math.random() > 0.4 ? [0, 1] : [Math.floor(Math.random() * 3)];

    for (const layerIdx of layerIndices) {
      const skyY = altLayers[layerIdx];
      const rand = Math.random();

      if (rand < 0.28) {
        items.push({
          id: `sky_${items.length}`,
          type: TERRAIN_ITEM_TYPES.CLOUD.id,
          name: TERRAIN_ITEM_TYPES.CLOUD.name,
          x: nextSkyX + (Math.random() - 0.5) * 15,
          y: skyY,
          width: TERRAIN_ITEM_TYPES.CLOUD.width,
          height: TERRAIN_ITEM_TYPES.CLOUD.height,
          active: true,
          lastHitTime: 0,
          data: TERRAIN_ITEM_TYPES.CLOUD
        });
      } else if (rand < 0.54) {
        items.push({
          id: `sky_${items.length}`,
          type: TERRAIN_ITEM_TYPES.RAINBOW.id,
          name: TERRAIN_ITEM_TYPES.RAINBOW.name,
          x: nextSkyX + (Math.random() - 0.5) * 15,
          y: skyY - 20,
          width: TERRAIN_ITEM_TYPES.RAINBOW.width,
          height: TERRAIN_ITEM_TYPES.RAINBOW.height,
          active: true,
          lastHitTime: 0,
          data: TERRAIN_ITEM_TYPES.RAINBOW
        });
      } else if (rand < 0.74) {
        items.push({
          id: `sky_${items.length}`,
          type: TERRAIN_ITEM_TYPES.BUTTERFLY_SWARM.id,
          name: TERRAIN_ITEM_TYPES.BUTTERFLY_SWARM.name,
          x: nextSkyX + (Math.random() - 0.5) * 15,
          y: skyY - 15,
          width: TERRAIN_ITEM_TYPES.BUTTERFLY_SWARM.width,
          height: TERRAIN_ITEM_TYPES.BUTTERFLY_SWARM.height,
          active: true,
          lastHitTime: 0,
          data: TERRAIN_ITEM_TYPES.BUTTERFLY_SWARM
        });
      } else {
        // Golden seed cluster
        for (let s = 0; s < 3; s++) {
          items.push({
            id: `seed_${items.length}_${s}`,
            type: TERRAIN_ITEM_TYPES.SEED.id,
            name: TERRAIN_ITEM_TYPES.SEED.name,
            x: nextSkyX + s * 34,
            y: skyY - Math.sin((s / 2) * Math.PI) * 24,
            width: TERRAIN_ITEM_TYPES.SEED.width,
            height: TERRAIN_ITEM_TYPES.SEED.height,
            active: true,
            lastHitTime: 0,
            data: TERRAIN_ITEM_TYPES.SEED
          });
        }
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
    if (this.plantedFlowers.length > 400) {
      this.plantedFlowers.shift();
    }
    const colors = ['#ff4081', '#f50057', '#e040fb', '#7c4dff', '#ff5252', '#ffab00', '#00e676', '#00b0ff'];
    const chosenColor = color || colors[Math.floor(Math.random() * colors.length)];
    const stemHeight = 12 + Math.random() * 14;

    // 1. Add persistent blooming flower object
    this.plantedFlowers.push({
      x,
      y: y || GROUND_Y - 4,
      size: 8 + Math.random() * 6,
      color: chosenColor,
      petals: 5,
      stemHeight,
      growth: 0.1,
      maxGrowth: 1.0
    });

    // 2. Add sparkling pollen particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: (y || GROUND_Y - 4) - stemHeight,
        vx: (Math.random() - 0.5) * 3,
        vy: -(1.5 + Math.random() * 2.5),
        size: 3 + Math.random() * 3,
        color: '#ffeb3b',
        life: 1.0,
        decay: 0.04,
        type: 'sparkle'
      });
    }

    // 3. Add visible floating "+1 🌸" Text Particle
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: (y || GROUND_Y - 4) - stemHeight - 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -1.6,
      text: '+1 🌸',
      color: '#ff69b4',
      size: 14,
      life: 1.0,
      decay: 0.028,
      type: 'floating_text'
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
    // 1. Draw Persistent Planted Flowers with Beautiful Blooming & Leaves
    for (const f of this.plantedFlowers) {
      if (f.x < cameraX - 100 || f.x > cameraX + CANVAS_WIDTH + 100) continue;
      const screenX = f.x - cameraX;
      const screenY = f.y - cameraY;

      // Sprouting growth animation
      if (f.growth < f.maxGrowth) {
        f.growth += (f.maxGrowth - f.growth) * 0.25;
      }
      const curStemHeight = f.stemHeight * f.growth;
      const curSize = f.size * f.growth;

      // Leafy green stem
      ctx.strokeStyle = '#2f855a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY + 4);
      ctx.lineTo(screenX, screenY - curStemHeight);
      ctx.stroke();

      // Stem leaves
      ctx.fillStyle = '#48bb78';
      ctx.beginPath();
      ctx.ellipse(screenX - 5, screenY - curStemHeight * 0.4, 5, 2.5, -Math.PI / 6, 0, Math.PI * 2);
      ctx.ellipse(screenX + 5, screenY - curStemHeight * 0.6, 5, 2.5, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // 5 Petal Lobes
      ctx.fillStyle = f.color;
      const headY = screenY - curStemHeight;
      const petalDist = curSize * 0.65;
      for (let p = 0; p < 5; p++) {
        const pAngle = (p / 5) * Math.PI * 2;
        const px = screenX + Math.cos(pAngle) * petalDist;
        const py = headY + Math.sin(pAngle) * petalDist;
        ctx.beginPath();
        ctx.arc(px, py, curSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden Center Pistil
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(screenX, headY, curSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw Dynamic Particles & Floating Text
    for (const p of this.particles) {
      const screenX = p.x - cameraX;
      const screenY = p.y - cameraY;
      if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'floating_text') {
        ctx.font = `900 ${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.strokeText(p.text, screenX, screenY);
        ctx.fillText(p.text, screenX, screenY);
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'wind') {
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX, screenY, p.size * 3, p.size);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/**
 * Draws the rich multi-layered Parallax Garden Background with dynamic high-altitude sky
 */
export function drawParallaxGarden(ctx, cameraX, cameraY, bgImg) {
  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;

  // 1. Dynamic Altitude Sky Gradient Background
  const altitude = Math.max(0, -cameraY);
  const altitudeRatio = Math.min(1, altitude / 1200);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (altitudeRatio > 0.1) {
    // High Altitude Stratosphere (Deep Azure -> Sky Blue -> Radiant Cyan)
    skyGrad.addColorStop(0, `hsl(215, 90%, ${Math.max(25, 48 - altitudeRatio * 20)}%)`);
    skyGrad.addColorStop(0.5, `hsl(205, 85%, ${Math.max(45, 62 - altitudeRatio * 15)}%)`);
    skyGrad.addColorStop(1, `hsl(195, 80%, ${Math.max(60, 78 - altitudeRatio * 15)}%)`);
  } else {
    // Normal Garden Sky
    skyGrad.addColorStop(0, '#56b6ff');
    skyGrad.addColorStop(0.5, '#bae6fd');
    skyGrad.addColorStop(0.85, '#e0f2fe');
    skyGrad.addColorStop(1, '#86efac');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. High Altitude Celestial Elements (Stars / Sun)
  const sunScreenX = 760 - (cameraX * 0.02) % (width + 200);
  const sunScreenY = 90 - cameraY * 0.15;

  if (sunScreenY > -100 && sunScreenY < height + 100) {
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
  }

  // 3. High Altitude Drifting Atmospheric Clouds (when in sky)
  if (altitude > 100) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.7, altitudeRatio * 0.85);
    ctx.fillStyle = '#ffffff';

    const cloudBaseX = -(cameraX * 0.12) % 600;
    for (let cx = cloudBaseX - 600; cx < width + 600; cx += 320) {
      const cy = 80 + Math.sin(cx * 0.01) * 40;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.arc(cx + 32, cy - 14, 46, 0, Math.PI * 2);
      ctx.arc(cx + 70, cy, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Parallax Image Layer (Attached to Garden Ground level)
  const groundScreenY = GROUND_Y - cameraY;

  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0 && groundScreenY > -200) {
    const bgScale = height / bgImg.height;
    const scaledWidth = bgImg.width * bgScale;
    const parallaxOffset = -(cameraX * 0.25) % scaledWidth;
    const bgY = groundScreenY - height + 40;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(bgImg, parallaxOffset, bgY, scaledWidth, height);
    if (parallaxOffset + scaledWidth < width) {
      ctx.drawImage(bgImg, parallaxOffset + scaledWidth, bgY, scaledWidth, height);
    }
    if (parallaxOffset > 0) {
      ctx.drawImage(bgImg, parallaxOffset - scaledWidth, bgY, scaledWidth, height);
    }
    ctx.restore();
  }

  // 5. Wooden Picket Fence Layer (Only visible when near ground)
  if (groundScreenY > -60 && groundScreenY < height + 100) {
    const fenceOffset = (cameraX * 0.5) % 60;
    ctx.fillStyle = '#fbd38d';
    ctx.strokeStyle = '#c05621';
    ctx.lineWidth = 1.5;
    const fenceBaseY = groundScreenY - 30;

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
  }

  // 6. Lush Main Ground Baseline (Only rendered when in viewport)
  if (groundScreenY < height) {
    const groundGrad = ctx.createLinearGradient(0, groundScreenY, 0, Math.max(height, groundScreenY + 120));
    groundGrad.addColorStop(0, '#48bb78'); // Top grass
    groundGrad.addColorStop(0.12, '#38a169');
    groundGrad.addColorStop(0.3, '#744210'); // Earth soil
    groundGrad.addColorStop(1, '#4a2503');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundScreenY, width, Math.max(height - groundScreenY + 200, 200));

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

    case 'TRAMPOLINE': {
      // Spring Trampoline (Super Rocket Bounce)
      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;

      // Sturdy steel legs
      ctx.strokeStyle = '#718096';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenX + 8, screenY + item.height);
      ctx.lineTo(screenX + 16, screenY + 8);
      ctx.lineTo(screenX + item.width - 16, screenY + 8);
      ctx.lineTo(screenX + item.width - 8, screenY + item.height);
      ctx.stroke();

      // Middle support
      ctx.beginPath();
      ctx.moveTo(cx, screenY + item.height);
      ctx.lineTo(cx, screenY + 8);
      ctx.stroke();

      // Glowing spring mat
      ctx.fillStyle = '#48bb78';
      ctx.strokeStyle = '#276749';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(screenX + 4, screenY + 2, item.width - 8, 12, 6);
      ctx.fill();
      ctx.stroke();

      // Upward bounce arrow
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.moveTo(cx, screenY - 4);
      ctx.lineTo(cx - 8, screenY + 4);
      ctx.lineTo(cx + 8, screenY + 4);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'BUTTERFLY_SWARM': {
      // Magical Butterfly Swarm in Sky
      const cx = screenX + item.width / 2;
      const cy = screenY + item.height / 2;
      const butterflyColors = ['#ed64a6', '#4299e1', '#ecc94b'];

      [-18, 0, 18].forEach((offset, idx) => {
        const bx = cx + offset;
        const by = cy + (idx % 2 === 0 ? -6 : 6);
        const bColor = butterflyColors[idx];

        ctx.fillStyle = bColor;
        // Left & Right Wings
        ctx.beginPath();
        ctx.ellipse(bx - 6, by - 4, 7, 10, -Math.PI / 5, 0, Math.PI * 2);
        ctx.ellipse(bx + 6, by - 4, 7, 10, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.ellipse(bx, by, 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by - 7, 2, 0, Math.PI * 2);
        ctx.fill();
      });
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
