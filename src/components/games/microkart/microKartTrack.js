// Dochon Games Portal - Micro Kart Desk Track & Stationery Circuit
// Procedural Canvas 2D Graphics for School Desk Theme

import { WORLD_WIDTH, WORLD_HEIGHT } from './microKartConstants.js';

// 16 Sequential Waypoints for Track Path & AI Navigation
export const TRACK_WAYPOINTS = [
  { x: 500, y: 1950, width: 220 }, // 0: Start / Finish Line
  { x: 950, y: 1950, width: 220 }, // 1: Main Straight
  { x: 1400, y: 1920, width: 220 }, // 2
  { x: 1950, y: 1850, width: 230 }, // 3: Turn 1 Entry
  { x: 2500, y: 1600, width: 240 }, // 4: East Sweeper
  { x: 2750, y: 1150, width: 240 }, // 5: East Hairpin
  { x: 2600, y: 700, width: 230 },  // 6: North-East Bend
  { x: 2150, y: 480, width: 220 },  // 7: Upper Straight
  { x: 1600, y: 450, width: 220 },  // 8: Ruler Bridge
  { x: 1100, y: 550, width: 230 },  // 9: Chicane Entry
  { x: 750, y: 850, width: 220 },   // 10: Chicane Exit
  { x: 1150, y: 1150, width: 230 }, // 11: Infield S-Curve 1
  { x: 1650, y: 1250, width: 240 }, // 12: Infield S-Curve 2
  { x: 1800, y: 1550, width: 220 }, // 13: South-Bound Transition
  { x: 1300, y: 1600, width: 220 }, // 14: Final Hairpin Entry
  { x: 600, y: 1700, width: 220 }   // 15: Final Corner onto Main Straight
];

// Desk Obstacles (Static Solid Colliders)
export const DESK_OBSTACLES = [
  // 1. Ink Bottle (Round cylinder)
  { type: 'circle', x: 2250, y: 1150, radius: 65, color: '#1E1B4B', label: '잉크병' },
  // 2. Pencil Case (Large rounded rect)
  { type: 'rect', x: 1280, y: 750, width: 320, height: 110, angle: 0.15, color: '#047857', label: '필통' },
  // 3. Mug Cup (Round cylinder with handle)
  { type: 'circle', x: 820, y: 1450, radius: 80, color: '#B45309', label: '머그잔' },
  // 4. Large Pink Eraser (Soft bounce cushion)
  { type: 'rect', x: 2100, y: 920, width: 140, height: 75, angle: -0.2, color: '#F43F5E', isBouncy: true, label: '도촌 지우개' },
  // 5. White Eraser
  { type: 'rect', x: 1450, y: 1420, width: 130, height: 70, angle: 0.35, color: '#F1F5F9', isBouncy: true, label: '지우개' },
  // 6. Compass / Protractor
  { type: 'circle', x: 1850, y: 700, radius: 50, color: '#475569', label: '콤파스' },
  // 7. Stapler
  { type: 'rect', x: 2350, y: 1850, width: 180, height: 85, angle: -0.4, color: '#4338CA', label: '스테이플러' }
];

// Paint Spills (Slow down zones)
export const PAINT_SPILLS = [
  { x: 2650, y: 1400, radius: 75, color: 'rgba(56, 189, 248, 0.45)' }, // Blue paint
  { x: 1900, y: 500, radius: 70, color: 'rgba(234, 179, 8, 0.45)' },   // Yellow paint
  { x: 950, y: 1000, radius: 65, color: 'rgba(239, 68, 68, 0.45)' }    // Red paint
];

// Turbo Boost Pads on Track (Instant propulsion forward)
export const BOOST_PADS = [
  { x: 1250, y: 1940, angle: 0, width: 90, length: 110 },
  { x: 1850, y: 460, angle: -Math.PI, width: 90, length: 110 },
  { x: 1750, y: 1400, angle: Math.PI * 0.4, width: 90, length: 110 }
];

// Item Mystery Cube Spawn Locations
export const ITEM_BOX_SPAWNS = [
  { id: 0, x: 1650, y: 1900 },
  { id: 1, x: 2700, y: 900 },
  { id: 2, x: 1350, y: 480 },
  { id: 3, x: 850, y: 1000 },
  { id: 4, x: 1450, y: 1200 },
  { id: 5, x: 1000, y: 1650 }
];

// Helper to calculate distance from point to line segment
export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Check if a point (kart) is within track boundaries
export function isPointOnTrack(x, y) {
  const pts = TRACK_WAYPOINTS;
  let minDist = Infinity;
  let trackWidth = 220;

  for (let i = 0; i < pts.length; i++) {
    const nextIdx = (i + 1) % pts.length;
    const d = distToSegment(x, y, pts[i].x, pts[i].y, pts[nextIdx].x, pts[nextIdx].y);
    if (d < minDist) {
      minDist = d;
      trackWidth = pts[i].width;
    }
  }

  return minDist <= (trackWidth / 2) + 20;
}

// Draw the Desk Background & Track Circuit
export function renderTrack(ctx, viewport, animTick = 0, itemBoxes = []) {
  const { left, top, width, height } = viewport;

  // 1. Desk Wood Planks Background
  ctx.save();
  ctx.fillStyle = '#C29B38'; // Warm natural classroom desk pine wood
  ctx.fillRect(left, top, width, height);

  // Subtle wood planks lines
  ctx.strokeStyle = 'rgba(130, 85, 20, 0.25)';
  ctx.lineWidth = 4;
  const plankHeight = 180;
  const startPlankY = Math.floor(top / plankHeight) * plankHeight;
  for (let py = startPlankY; py < top + height + plankHeight; py += plankHeight) {
    ctx.beginPath();
    ctx.moveTo(left, py);
    ctx.lineTo(left + width, py);
    ctx.stroke();
  }

  // Subtle desk grain scratches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  for (let py = startPlankY + 50; py < top + height + plankHeight; py += plankHeight) {
    ctx.beginPath();
    ctx.moveTo(left, py);
    ctx.lineTo(left + width, py);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Track Base (Graph Paper / Notebook Paper Circuit with Grid)
  const pts = TRACK_WAYPOINTS;

  // Track Outer Border / Curb (Red/White Striped Kerb)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();

  // Outer curb shadow (Chromebook-optimized 0-cost 2D offset without expensive shadowBlur)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 254;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Red & White kerbs
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 240;
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 240;
  ctx.setLineDash([30, 30]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Track Road Surface (Crisp Notebook White & Graph Paper Grid)
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 210;
  ctx.stroke();

  // Road Surface Inner Slate (Smooth Racing Asphalt on Paper)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 196;
  ctx.stroke();

  // Center Dash Lines (Golden Yellow Neon Lane Marker)
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 24]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Start / Finish Line (Checkered Pattern at Waypoint 0)
  const p0 = pts[0];
  ctx.save();
  ctx.translate(p0.x, p0.y);
  ctx.rotate(Math.PI / 2); // Perpendicular to track
  const checkWidth = 200;
  const checkHeight = 36;
  const sq = 18;
  for (let r = 0; r < 2; r++) {
    for (let c = -checkWidth / 2; c < checkWidth / 2; c += sq) {
      ctx.fillStyle = ((Math.floor(c / sq) + r) % 2 === 0) ? '#FFFFFF' : '#0F172A';
      ctx.fillRect(c, (r - 1) * sq, sq, sq);
    }
  }
  // Start Banner Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DOCHON SPEEDWAY', 0, -28);
  ctx.restore();

  // 4. Paint Spills
  PAINT_SPILLS.forEach(spill => {
    ctx.save();
    ctx.fillStyle = spill.color;
    ctx.beginPath();
    ctx.arc(spill.x, spill.y, spill.radius, 0, Math.PI * 2);
    ctx.fill();
    // Splatter droplets
    for (let a = 0; a < 6; a++) {
      const dropAngle = (a * Math.PI) / 3;
      const dropDist = spill.radius + 18;
      ctx.beginPath();
      ctx.arc(
        spill.x + Math.cos(dropAngle) * dropDist,
        spill.y + Math.sin(dropAngle) * dropDist,
        8, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  });

  // 5. Boost Turbo Arrow Pads
  BOOST_PADS.forEach(pad => {
    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.rotate(pad.angle);
    // Pad glow
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(-pad.width / 2, -pad.length / 2, pad.width, pad.length);

    // Glowing Neon Chevrons (Animated)
    const offset = (animTick * 4) % 30;
    ctx.fillStyle = '#FDE047';
    for (let y = -pad.length / 2 + offset; y < pad.length / 2; y += 30) {
      ctx.beginPath();
      ctx.moveTo(-pad.width / 2 + 15, y + 15);
      ctx.lineTo(0, y - 10);
      ctx.lineTo(pad.width / 2 - 15, y + 15);
      ctx.lineTo(0, y + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });

  // 6. Desk Obstacles (Stationery Props - 0-Cost 2D Shadows for Chromebooks)
  DESK_OBSTACLES.forEach(obs => {
    ctx.save();

    if (obs.type === 'circle') {
      // Fast 2D Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(obs.x + 4, obs.y + 6, obs.radius, 0, Math.PI * 2);
      ctx.fill();

      // Main Circle
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();

      // Top rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.label, obs.x, obs.y);
    } else if (obs.type === 'rect') {
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.angle || 0);

      // Fast 2D Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2 + 4, -obs.height / 2 + 6, obs.width, obs.height, 12);
      ctx.fill();

      // Main Rounded Rect
      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 12);
      ctx.fill();

      // Edge detail
      ctx.strokeStyle = obs.isBouncy ? '#FFE4E6' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = obs.isBouncy ? '#881337' : '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.label, 0, 0);
    }
    ctx.restore();
  });

  // 7. Rotating Item Mystery Boxes
  itemBoxes.forEach(box => {
    if (!box.active) return;
    ctx.save();
    ctx.translate(box.x, box.y);

    // Floating bobbing effect
    const floatY = Math.sin(animTick * 0.08 + box.id) * 6;
    ctx.translate(0, floatY);

    // Rotating 3D style diamond cube
    const rot = animTick * 0.05;
    ctx.rotate(rot);

    // Outer Crisp Glow Ring (Zero GPU overhead)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(-22, -22, 44, 44);

    // Box outer
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeRect(-20, -20, 40, 40);

    // Question mark
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 1);
    ctx.restore();
  });
}
