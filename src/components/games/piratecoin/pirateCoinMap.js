// Dochon Games Portal - Dochon Pirate Coin Heist Map & Arena Renderer
// Procedural Sea, Golden Treasure Island, Reefs, Team Docks, Whirlpools & Minimap

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ISLAND_CENTER,
  ISLAND_RADIUS,
  TEAM_BASES,
  REEFS,
  WHIRLPOOLS
} from './pirateCoinConstants.js';

export class PirateCoinMap {
  constructor() {
    this.waveOffsets = [0, 45, 90, 135];
  }

  // Draw Arena Floor, Island, Bases, Obstacles
  draw(ctx, camera, timeSec = 0) {
    const left = camera.x - camera.viewportWidth / 2;
    const top = camera.y - camera.viewportHeight / 2;
    const right = left + camera.viewportWidth;
    const bottom = top + camera.viewportHeight;

    // 1. Deep Ocean Base
    ctx.fillStyle = '#0284C7'; // Vibrant Caribbean Blue
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 2. Procedural Gentle Water Waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    const gridSize = 140;
    const startX = Math.floor(Math.max(0, left) / gridSize) * gridSize;
    const endX = Math.min(WORLD_WIDTH, right + gridSize);
    const startY = Math.floor(Math.max(0, top) / gridSize) * gridSize;
    const endY = Math.min(WORLD_HEIGHT, bottom + gridSize);

    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        const waveShift = Math.sin(timeSec * 2 + (x + y) * 0.01) * 8;
        ctx.beginPath();
        ctx.arc(x + 50 + waveShift, y + 40, 24, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
    }

    // 3. Central Treasure Island (Shallow waters + Sandy Beach + Green Palm Grove)
    // Shallow water halo
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(ISLAND_CENTER.x, ISLAND_CENTER.y, ISLAND_RADIUS + 70, 0, Math.PI * 2);
    ctx.fill();

    // Sandy Beach
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(ISLAND_CENTER.x, ISLAND_CENTER.y, ISLAND_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Wet sand rim
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(ISLAND_CENTER.x, ISLAND_CENTER.y, ISLAND_RADIUS - 7, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Green Jungle / Palm Grove
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(ISLAND_CENTER.x, ISLAND_CENTER.y, ISLAND_RADIUS * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Jungle core
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(ISLAND_CENTER.x, ISLAND_CENTER.y, ISLAND_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Island Center Landmark: Skull Cave / Treasure Temple
    ctx.save();
    ctx.translate(ISLAND_CENTER.x, ISLAND_CENTER.y);
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, -10, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-22, -10, 44, 32);

    // Skull eyes & nose
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(-12, -14, 8, 0, Math.PI * 2);
    ctx.arc(12, -14, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-5, 4);
    ctx.lineTo(5, 4);
    ctx.closePath();
    ctx.fill();

    // Skull teeth
    ctx.fillStyle = '#FDE68A';
    for (let t = -14; t <= 14; t += 8) {
      ctx.fillRect(t - 2, 10, 5, 8);
    }

    // Island Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏝️ 황금 보물섬', 0, 48);
    ctx.restore();

    // 4. Whirlpools (Swirling vortex)
    WHIRLPOOLS.forEach((wp) => {
      ctx.save();
      ctx.translate(wp.x, wp.y);
      ctx.rotate(timeSec * 3);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        ctx.arc(0, 0, wp.radius * 0.8, (arm * 2 * Math.PI) / 3, (arm * 2 * Math.PI) / 3 + 1.2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(2, 132, 199, 0.7)';
      ctx.beginPath();
      ctx.arc(0, 0, wp.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Reefs (Dark Jagged Rocks with Sea Foam)
    REEFS.forEach((reef) => {
      // Foam ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(reef.x, reef.y, reef.radius + 6, 0, Math.PI * 2);
      ctx.stroke();

      // Rock body
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(reef.x, reef.y, reef.radius, 0, Math.PI * 2);
      ctx.fill();

      // Rock highlights
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(reef.x - reef.radius * 0.25, reef.y - reef.radius * 0.25, reef.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Team Base Docks (4 Corners)
    TEAM_BASES.forEach((base) => {
      ctx.save();
      ctx.translate(base.x, base.y);

      // Safe Zone Perimeter Ring (pulsing dotted outline)
      const pulse = Math.sin(timeSec * 4) * 4;
      ctx.strokeStyle = base.color;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, base.radius + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Safe Zone Water Fill
      ctx.fillStyle = `${base.color}26`; // 15% opacity
      ctx.beginPath();
      ctx.arc(0, 0, base.radius, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Dock Pier
      ctx.save();
      ctx.rotate(base.dockAngle);
      ctx.fillStyle = '#92400E';
      ctx.fillRect(-24, -base.radius * 0.85, 48, base.radius * 0.85);

      // Wood Planks
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      for (let py = -base.radius * 0.8; py < 0; py += 16) {
        ctx.beginPath();
        ctx.moveTo(-24, py);
        ctx.lineTo(24, py);
        ctx.stroke();
      }
      ctx.restore();

      // Mooring Fortress Base Center
      ctx.fillStyle = base.color;
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Base Flag & Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(base.icon, 0, -4);

      ctx.font = 'bold 13px "Pretendard", sans-serif';
      ctx.fillText(base.name, 0, 68);

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 11px "Pretendard", sans-serif';
      ctx.fillText('⚓ 입금 안전지대', 0, 84);

      ctx.restore();
    });

    // 7. World Boundary Walls
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WORLD_WIDTH - 10, WORLD_HEIGHT - 10);
  }

  // Draw Minimap (160 x 160)
  drawMinimap(miniCtx, players = [], coins = []) {
    const w = miniCtx.canvas.width;
    const h = miniCtx.canvas.height;
    const scaleX = w / WORLD_WIDTH;
    const scaleY = h / WORLD_HEIGHT;

    // Ocean BG
    miniCtx.fillStyle = '#0284C7';
    miniCtx.fillRect(0, 0, w, h);

    // Center Island
    miniCtx.fillStyle = '#FDE68A';
    miniCtx.beginPath();
    miniCtx.arc(ISLAND_CENTER.x * scaleX, ISLAND_CENTER.y * scaleY, ISLAND_RADIUS * scaleX, 0, Math.PI * 2);
    miniCtx.fill();

    miniCtx.fillStyle = '#10B981';
    miniCtx.beginPath();
    miniCtx.arc(ISLAND_CENTER.x * scaleX, ISLAND_CENTER.y * scaleY, ISLAND_RADIUS * 0.6 * scaleX, 0, Math.PI * 2);
    miniCtx.fill();

    // Team Bases
    TEAM_BASES.forEach((b) => {
      miniCtx.fillStyle = `${b.color}88`;
      miniCtx.beginPath();
      miniCtx.arc(b.x * scaleX, b.y * scaleY, b.radius * scaleX, 0, Math.PI * 2);
      miniCtx.fill();
      miniCtx.strokeStyle = b.color;
      miniCtx.lineWidth = 1;
      miniCtx.stroke();
    });

    // Reefs
    miniCtx.fillStyle = '#1E293B';
    REEFS.forEach((r) => {
      miniCtx.beginPath();
      miniCtx.arc(r.x * scaleX, r.y * scaleY, r.radius * scaleX, 0, Math.PI * 2);
      miniCtx.fill();
    });

    // Big Treasure Chests (represented as little gold stars)
    coins.forEach((c) => {
      if (c.type === 'chest') {
        miniCtx.fillStyle = '#F59E0B';
        miniCtx.fillRect(c.x * scaleX - 2, c.y * scaleY - 2, 4, 4);
      }
    });

    // Players
    players.forEach((p) => {
      if (!p.alive) return;
      const px = p.x * scaleX;
      const py = p.y * scaleY;

      // Base color dot
      miniCtx.fillStyle = p.teamColor || '#FFFFFF';
      miniCtx.beginPath();
      miniCtx.arc(px, py, p.isMe ? 5 : 3.5, 0, Math.PI * 2);
      miniCtx.fill();

      // Border for player
      miniCtx.strokeStyle = p.isMe ? '#FFFFFF' : '#000000';
      miniCtx.lineWidth = p.isMe ? 2 : 1;
      miniCtx.stroke();
    });
  }
}
