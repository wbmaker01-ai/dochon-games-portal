// Dochon Games Portal - Micro Kart Racing Track Systems
// 3 Unique Circuits: 1) Classroom Wood Desk, 2) Science Lab Bench, 3) Art Room Neon Sketchbook
// Optimized 0-Cost 2D Canvas Procedural Rendering for Chromebooks (30FPS)

import { WORLD_WIDTH, WORLD_HEIGHT } from './microKartConstants.js';

export const TRACK_CONFIGS = {
  1: {
    id: 1,
    name: '교실 책상 서킷',
    englishName: 'Classroom Wood Speedway',
    theme: 'wood',
    bannerText: 'DOCHON SPEEDWAY',
    startPos: { x: 500, y: 1950, angle: 0 },
    bgTheme: {
      baseColor: '#C29B38',
      plankColor: 'rgba(130, 85, 20, 0.25)',
      scratchColor: 'rgba(255, 255, 255, 0.08)',
      curbPrimary: '#DC2626',
      curbSecondary: '#FFFFFF',
      roadBorder: '#F8FAFC',
      asphalt: '#334155',
      centerLine: '#FBBF24'
    },
    waypoints: [
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
    ],
    obstacles: [
      { type: 'circle', x: 2250, y: 1150, radius: 65, color: '#1E1B4B', label: '잉크병' },
      { type: 'rect', x: 1280, y: 750, width: 320, height: 110, angle: 0.15, color: '#047857', label: '필통' },
      { type: 'circle', x: 820, y: 1450, radius: 80, color: '#B45309', label: '머그잔' },
      { type: 'rect', x: 2100, y: 920, width: 140, height: 75, angle: -0.2, color: '#F43F5E', isBouncy: true, label: '도촌 지우개' },
      { type: 'rect', x: 1450, y: 1420, width: 130, height: 70, angle: 0.35, color: '#F1F5F9', isBouncy: true, label: '지우개' },
      { type: 'circle', x: 1850, y: 700, radius: 50, color: '#475569', label: '콤파스' },
      { type: 'rect', x: 2350, y: 1850, width: 180, height: 85, angle: -0.4, color: '#4338CA', label: '스테이플러' }
    ],
    spills: [
      { x: 2650, y: 1400, radius: 75, color: 'rgba(56, 189, 248, 0.45)' },
      { x: 1900, y: 500, radius: 70, color: 'rgba(234, 179, 8, 0.45)' },
      { x: 950, y: 1000, radius: 65, color: 'rgba(239, 68, 68, 0.45)' }
    ],
    boostPads: [
      { x: 1250, y: 1940, angle: 0, width: 90, length: 110 },
      { x: 1850, y: 460, angle: -Math.PI, width: 90, length: 110 },
      { x: 1750, y: 1400, angle: Math.PI * 0.4, width: 90, length: 110 }
    ],
    itemBoxSpawns: [
      { id: 0, x: 1650, y: 1900 },
      { id: 1, x: 2700, y: 900 },
      { id: 2, x: 1350, y: 480 },
      { id: 3, x: 850, y: 1000 },
      { id: 4, x: 1450, y: 1200 },
      { id: 5, x: 1000, y: 1650 }
    ]
  },
  2: {
    id: 2,
    name: '과학실 실험대 서킷',
    englishName: 'Science Lab Circuit',
    theme: 'lab',
    bannerText: 'SCIENCE LAB GRAND PRIX',
    startPos: { x: 500, y: 2000, angle: 0 },
    bgTheme: {
      baseColor: '#064E3B', // Dark chemical resistant lab slate
      tileColor: 'rgba(16, 185, 129, 0.18)',
      scratchColor: 'rgba(52, 211, 153, 0.1)',
      curbPrimary: '#059669',
      curbSecondary: '#F8FAFC',
      roadBorder: '#E2E8F0',
      asphalt: '#0F172A',
      centerLine: '#34D399'
    },
    waypoints: [
      { x: 500, y: 2000, width: 220 },  // 0: Start / Finish Line
      { x: 1000, y: 2000, width: 220 }, // 1: Lab Main Straight
      { x: 1550, y: 1960, width: 220 }, // 2
      { x: 2050, y: 1750, width: 220 }, // 3: Chicane In
      { x: 2450, y: 1380, width: 220 }, // 4: Chemical Alley
      { x: 2750, y: 920, width: 220 },  // 5: Hairpin Apex
      { x: 2500, y: 520, width: 220 },  // 6: North Sweeper
      { x: 1950, y: 460, width: 220 },  // 7: Lab North Straight
      { x: 1450, y: 580, width: 210 },  // 8: Microscope Chicane 1
      { x: 1180, y: 450, width: 210 },  // 9: Microscope Chicane 2
      { x: 800, y: 640, width: 220 },   // 10: West Bend
      { x: 580, y: 1100, width: 220 },  // 11: West Loop
      { x: 880, y: 1460, width: 220 },  // 12: Lab S-Curve In
      { x: 1350, y: 1360, width: 220 }, // 13: Central Bench Crossing
      { x: 1780, y: 1180, width: 220 }, // 14: Bunsen Burner Loop
      { x: 2100, y: 1420, width: 220 }, // 15
      { x: 1750, y: 1760, width: 220 }, // 16: South Hairpin
      { x: 950, y: 1760, width: 220 }   // 17: Final Corner onto Main Straight
    ],
    obstacles: [
      { type: 'circle', x: 1680, y: 520, radius: 72, color: '#0284C7', label: '삼각플라스크' },
      { type: 'circle', x: 2250, y: 1560, radius: 75, color: '#0D9488', label: '유리 비커' },
      { type: 'rect', x: 1250, y: 1000, width: 250, height: 115, angle: 0.2, color: '#334155', label: '현미경' },
      { type: 'rect', x: 860, y: 850, width: 280, height: 85, angle: -0.3, color: '#B45309', label: '시험관대' },
      { type: 'circle', x: 2550, y: 1120, radius: 68, color: '#EA580C', label: '알코올 램프' },
      { type: 'rect', x: 1380, y: 1580, width: 170, height: 90, angle: 0.4, color: '#DC2626', isBouncy: true, label: '말굽 자석' }
    ],
    spills: [
      { x: 1280, y: 520, radius: 75, color: 'rgba(74, 222, 128, 0.55)' }, // Green acid
      { x: 2580, y: 720, radius: 70, color: 'rgba(168, 85, 247, 0.55)' }, // Purple reagent
      { x: 1520, y: 1260, radius: 65, color: 'rgba(6, 182, 212, 0.55)' }, // Cyan liquid
      { x: 780, y: 1300, radius: 65, color: 'rgba(249, 115, 22, 0.55)' }  // Warm orange solution
    ],
    boostPads: [
      { x: 1300, y: 1990, angle: 0, width: 90, length: 110 },
      { x: 1720, y: 470, angle: -Math.PI, width: 90, length: 110 },
      { x: 620, y: 920, angle: Math.PI * 0.5, width: 90, length: 110 },
      { x: 1500, y: 1760, angle: -Math.PI, width: 90, length: 110 }
    ],
    itemBoxSpawns: [
      { id: 0, x: 1750, y: 1940 },
      { id: 1, x: 2680, y: 720 },
      { id: 2, x: 1300, y: 520 },
      { id: 3, x: 650, y: 1250 },
      { id: 4, x: 1550, y: 1260 },
      { id: 5, x: 1950, y: 1350 },
      { id: 6, x: 1250, y: 1760 }
    ]
  },
  3: {
    id: 3,
    name: '미술실 스케치북 서킷',
    englishName: 'Art Room Neon Circuit',
    theme: 'art',
    bannerText: 'ART STUDIO NEON CIRCUIT',
    startPos: { x: 600, y: 2050, angle: 0 },
    bgTheme: {
      baseColor: '#FAF8F5', // Heavy watercolor sketchbook paper
      gridColor: 'rgba(226, 232, 240, 0.8)',
      curbPrimary: '#EC4899', // Neon pink
      curbSecondary: '#06B6D4', // Cyan
      roadBorder: '#CBD5E1',
      asphalt: '#1E1B4B', // Deep indigo canvas asphalt
      centerLine: '#FACC15' // Golden brush line
    },
    waypoints: [
      { x: 600, y: 2050, width: 220 },  // 0: Start / Finish Line
      { x: 1150, y: 2050, width: 220 }, // 1: Sketchbook Straight
      { x: 1700, y: 2050, width: 220 }, // 2
      { x: 2300, y: 1950, width: 220 }, // 3: Hairpin Entry
      { x: 2700, y: 1600, width: 220 }, // 4
      { x: 2800, y: 1050, width: 220 }, // 5: East Hairpin
      { x: 2450, y: 600, width: 220 },  // 6
      { x: 1900, y: 480, width: 220 },  // 7: Palette Straight
      { x: 1400, y: 480, width: 220 },  // 8
      { x: 820, y: 560, width: 210 },   // 9: Crayon Chicane In
      { x: 560, y: 960, width: 210 },   // 10: West Outer Turn
      { x: 960, y: 1260, width: 210 },  // 11: Infield Hairpin
      { x: 1520, y: 1100, width: 220 }, // 12: Palette Bypass
      { x: 2100, y: 1260, width: 220 }, // 13: Neon Sweeper
      { x: 2150, y: 1660, width: 220 }, // 14: Downhill Flick
      { x: 1400, y: 1760, width: 220 }, // 15: Lower Straight
      { x: 720, y: 1760, width: 220 }   // 16: Final Turn
    ],
    obstacles: [
      { type: 'rect', x: 2100, y: 820, width: 330, height: 130, angle: -0.22, color: '#D97706', label: '크레파스 24색' },
      { type: 'circle', x: 1150, y: 860, radius: 80, color: '#0284C7', label: '물통' },
      { type: 'circle', x: 1760, y: 1420, radius: 85, color: '#92400E', label: '나무 파레트' },
      { type: 'rect', x: 1100, y: 1460, width: 145, height: 80, angle: 0.3, color: '#94A3B8', isBouncy: true, label: '떡지우개' },
      { type: 'circle', x: 2520, y: 1360, radius: 70, color: '#475569', label: '붓통' },
      { type: 'circle', x: 1150, y: 1860, radius: 65, color: '#DC2626', label: '포스터물감' }
    ],
    spills: [
      { x: 2650, y: 850, radius: 80, color: 'rgba(236, 72, 153, 0.55)' },  // Neon Magenta
      { x: 1650, y: 500, radius: 75, color: 'rgba(56, 189, 248, 0.55)' },  // Cyan Acrylic
      { x: 760, y: 1100, radius: 70, color: 'rgba(132, 204, 22, 0.55)' },  // Lime Green Paint
      { x: 1800, y: 1660, radius: 75, color: 'rgba(139, 92, 246, 0.55)' }  // Vivid Violet Gouache
    ],
    boostPads: [
      { x: 1350, y: 2040, angle: 0, width: 90, length: 110 },
      { x: 1650, y: 490, angle: -Math.PI, width: 90, length: 110 },
      { x: 1800, y: 1140, angle: Math.PI * 0.15, width: 90, length: 110 },
      { x: 1100, y: 1760, angle: -Math.PI, width: 90, length: 110 }
    ],
    itemBoxSpawns: [
      { id: 0, x: 1850, y: 2020 },
      { id: 1, x: 2750, y: 800 },
      { id: 2, x: 1250, y: 490 },
      { id: 3, x: 620, y: 1100 },
      { id: 4, x: 1300, y: 1160 },
      { id: 5, x: 2150, y: 1450 },
      { id: 6, x: 950, y: 1760 }
    ]
  }
};

export function getTrackConfig(trackId = 1) {
  return TRACK_CONFIGS[trackId] || TRACK_CONFIGS[1];
}

// Backward Compatibility Exports for Track 1
export const TRACK_WAYPOINTS = TRACK_CONFIGS[1].waypoints;
export const DESK_OBSTACLES = TRACK_CONFIGS[1].obstacles;
export const PAINT_SPILLS = TRACK_CONFIGS[1].spills;
export const BOOST_PADS = TRACK_CONFIGS[1].boostPads;
export const ITEM_BOX_SPAWNS = TRACK_CONFIGS[1].itemBoxSpawns;

// Helper to calculate distance from point to line segment
export function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Check if a point (kart) is within track boundaries for given trackId
export function isPointOnTrack(x, y, trackId = 1) {
  const cfg = getTrackConfig(trackId);
  const pts = cfg.waypoints;
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

  return minDist <= (trackWidth / 2) + 22;
}

// Draw the Desk Background & Track Circuit dynamically by Track ID
export function renderTrack(ctx, viewport, animTick = 0, itemBoxes = [], trackId = 1) {
  const { left, top, width, height } = viewport;
  const cfg = getTrackConfig(trackId);
  const bg = cfg.bgTheme;
  const pts = cfg.waypoints;

  // 1. Render Specific Theme Background
  ctx.save();
  ctx.fillStyle = bg.baseColor;
  ctx.fillRect(left, top, width, height);

  if (cfg.theme === 'wood') {
    // Pine Wood Planks
    ctx.strokeStyle = bg.plankColor;
    ctx.lineWidth = 4;
    const plankHeight = 180;
    const startPlankY = Math.floor(top / plankHeight) * plankHeight;
    for (let py = startPlankY; py < top + height + plankHeight; py += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + width, py);
      ctx.stroke();
    }
    // Grain scratches
    ctx.strokeStyle = bg.scratchColor;
    ctx.lineWidth = 2;
    for (let py = startPlankY + 50; py < top + height + plankHeight; py += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + width, py);
      ctx.stroke();
    }
  } else if (cfg.theme === 'lab') {
    // Lab Stone Grid Tiles
    ctx.strokeStyle = bg.tileColor;
    ctx.lineWidth = 2;
    const tileSize = 140;
    const startX = Math.floor(left / tileSize) * tileSize;
    const startY = Math.floor(top / tileSize) * tileSize;
    for (let px = startX; px < left + width + tileSize; px += tileSize) {
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, top + height);
      ctx.stroke();
    }
    for (let py = startY; py < top + height + tileSize; py += tileSize) {
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + width, py);
      ctx.stroke();
    }
  } else if (cfg.theme === 'art') {
    // Sketchbook Grid & Subtle Watercolor Texture
    ctx.strokeStyle = bg.gridColor;
    ctx.lineWidth = 1.5;
    const gridSize = 100;
    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;
    for (let px = startX; px < left + width + gridSize; px += gridSize) {
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, top + height);
      ctx.stroke();
    }
    for (let py = startY; py < top + height + gridSize; py += gridSize) {
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(left + width, py);
      ctx.stroke();
    }
    // Colorful ambient paint flecks
    const fleckSeed = [
      { x: 400, y: 300, r: 60, c: 'rgba(236, 72, 153, 0.08)' },
      { x: 1800, y: 800, r: 90, c: 'rgba(6, 182, 212, 0.08)' },
      { x: 2600, y: 1800, r: 80, c: 'rgba(250, 204, 21, 0.08)' },
      { x: 1200, y: 2100, r: 75, c: 'rgba(168, 85, 247, 0.08)' }
    ];
    fleckSeed.forEach(f => {
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();

  // 2. Track Base Path Rendering
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

  // Primary Kerbs
  ctx.strokeStyle = bg.curbPrimary;
  ctx.lineWidth = 240;
  ctx.stroke();

  // Secondary Striped Kerbs
  ctx.strokeStyle = bg.curbSecondary;
  ctx.lineWidth = 240;
  ctx.setLineDash([30, 30]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road Border Accent
  ctx.strokeStyle = bg.roadBorder;
  ctx.lineWidth = 210;
  ctx.stroke();

  // Road Asphalt Surface
  ctx.strokeStyle = bg.asphalt;
  ctx.lineWidth = 196;
  ctx.stroke();

  // Center Neon / Golden Lane Marker
  ctx.strokeStyle = bg.centerLine;
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 24]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Start / Finish Line Checkered Pattern at Waypoint 0
  const p0 = pts[0];
  ctx.save();
  ctx.translate(p0.x, p0.y);
  ctx.rotate(Math.PI / 2); // Perpendicular to start direction
  const checkWidth = 200;
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
  ctx.fillText(cfg.bannerText, 0, -28);
  ctx.restore();

  // 4. Spills (Paint / Chemical puddles)
  cfg.spills.forEach(spill => {
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
  cfg.boostPads.forEach(pad => {
    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.rotate(pad.angle);
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

  // 6. Obstacles (Theme Props - 0-Cost 2D Shadows for Chromebooks)
  cfg.obstacles.forEach(obs => {
    ctx.save();
    if (obs.type === 'circle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(obs.x + 4, obs.y + 6, obs.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.label, obs.x, obs.y);
    } else if (obs.type === 'rect') {
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.angle || 0);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2 + 4, -obs.height / 2 + 6, obs.width, obs.height, 12);
      ctx.fill();

      ctx.fillStyle = obs.color;
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 12);
      ctx.fill();

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

    const floatY = Math.sin(animTick * 0.08 + box.id) * 6;
    ctx.translate(0, floatY);

    const rot = animTick * 0.05;
    ctx.rotate(rot);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(-22, -22, 44, 44);

    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeRect(-20, -20, 40, 40);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 1);
    ctx.restore();
  });
}
