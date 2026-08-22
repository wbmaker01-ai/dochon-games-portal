// Dochon Pizza Master - 2D Canvas Procedural Rendering & Geometric Slicing Engine
import {
  PIZZA_CENTER,
  PIZZA_RADIUS,
  CRUST_WIDTH,
  TOPPING_TYPES,
  TOPPING_INFO
} from './pizzaConstants';

export class PizzaEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Cut lines array: [ { x1, y1, x2, y2, a, b, c } ] where ax + by + c = 0
    this.cuts = [];

    // Visual particles & effects
    this.particles = [];
    this.sparkles = [];
    this.sliceOffsetAnim = 0; // 0 to 1 when serving

    // Dragging cut state
    this.dragStart = null;
    this.dragCurrent = null;
    this.isDragging = false;
  }

  reset() {
    this.cuts = [];
    this.particles = [];
    this.sparkles = [];
    this.sliceOffsetAnim = 0;
    this.dragStart = null;
    this.dragCurrent = null;
    this.isDragging = false;
  }

  // Add a cutting segment from (x1, y1) to (x2, y2) with smart center & boundary snapping
  addCut(p1, p2) {
    let p1x = p1.x;
    let p1y = p1.y;
    let p2x = p2.x;
    let p2y = p2.y;

    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const len = Math.hypot(dx, dy);
    if (len < 25) return false; // Too short to be a valid slice

    const cx = PIZZA_CENTER.x;
    const cy = PIZZA_CENTER.y;
    const r = PIZZA_RADIUS;

    // 1. Center snap: If either point is near center (within 35px), snap to exact center
    const dist1ToCenter = Math.hypot(p1x - cx, p1y - cy);
    const dist2ToCenter = Math.hypot(p2x - cx, p2y - cy);

    if (dist1ToCenter <= 35) {
      p1x = cx;
      p1y = cy;
    }
    if (dist2ToCenter <= 35) {
      p2x = cx;
      p2y = cy;
    }

    // 2. Crust/Outer boundary snap: If endpoint reaches near outer crust (within 28px of radius), extend cleanly to boundary
    const updatedDist1 = Math.hypot(p1x - cx, p1y - cy);
    if (updatedDist1 >= r - 28 && updatedDist1 > 0) {
      const scale = (r + 10) / updatedDist1;
      p1x = cx + (p1x - cx) * scale;
      p1y = cy + (p1y - cy) * scale;
    }

    const updatedDist2 = Math.hypot(p2x - cx, p2y - cy);
    if (updatedDist2 >= r - 28 && updatedDist2 > 0) {
      const scale = (r + 10) / updatedDist2;
      p2x = cx + (p2x - cx) * scale;
      p2y = cy + (p2y - cy) * scale;
    }

    this.cuts.push({
      x1: p1x,
      y1: p1y,
      x2: p2x,
      y2: p2y,
      len: Math.hypot(p2x - p1x, p2y - p1y)
    });

    // Spawn cut particles along the cut segment
    this.spawnCutParticles({ x: p1x, y: p1y }, { x: p2x, y: p2y });
    return true;
  }

  spawnCutParticles(p1, p2) {
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;

      // Check if point is inside pizza
      if (Math.hypot(px - PIZZA_CENTER.x, py - PIZZA_CENTER.y) <= PIZZA_RADIUS) {
        this.particles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#FFF9C4' : '#FFE082', // Cheese crumble colors
          life: 1.0,
          decay: 0.04 + Math.random() * 0.03
        });
      }
    }
  }

  spawnSparkles(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: ['#FFD700', '#FFA000', '#FFECB3', '#FFFFFF'][Math.floor(Math.random() * 4)],
        life: 1.0,
        decay: 0.03 + Math.random() * 0.02
      });
    }
  }

  // Robust 2D Line Segment Intersection Helper
  static doSegmentsIntersect(p1, p2, p3, p4) {
    function orientation(p, q, r) {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (Math.abs(val) < 1e-7) return 0; // colinear
      return val > 0 ? 1 : 2; // clock or counterclock
    }

    function onSegment(p, q, r) {
      return (
        q.x <= Math.max(p.x, r.x) + 1e-7 &&
        q.x >= Math.min(p.x, r.x) - 1e-7 &&
        q.y <= Math.max(p.y, r.y) + 1e-7 &&
        q.y >= Math.min(p.y, r.y) - 1e-7
      );
    }

    const o1 = orientation(p1, p2, p3);
    const o2 = orientation(p1, p2, p4);
    const o3 = orientation(p3, p4, p1);
    const o4 = orientation(p3, p4, p2);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Colinear edge cases
    if (o1 === 0 && onSegment(p1, p3, p2)) return true;
    if (o2 === 0 && onSegment(p1, p4, p2)) return true;
    if (o3 === 0 && onSegment(p3, p1, p4)) return true;
    if (o4 === 0 && onSegment(p3, p2, p4)) return true;

    return false;
  }

  // Analyze all slices using 2D Raster Wall Flood-Fill over active cut segments
  analyzeSlices(stageToppings, targetSlices) {
    const STEP = 4; // High precision grid cell step in pixels
    const cx = PIZZA_CENTER.x;
    const cy = PIZZA_CENTER.y;
    const r = PIZZA_RADIUS;
    const rSq = r * r;

    const minX = cx - r;
    const maxX = cx + r;
    const minY = cy - r;
    const maxY = cy + r;

    const cols = Math.ceil((maxX - minX) / STEP) + 1;
    const rows = Math.ceil((maxY - minY) / STEP) + 1;

    // Grid: -1 = outside pizza, 0 = unvisited pizza cell, -2 = cut wall, >0 = regionId
    const grid = Array.from({ length: rows }, () => new Int32Array(cols));
    let totalSamples = 0;

    for (let ry = 0; ry < rows; ry++) {
      const y = minY + ry * STEP;
      for (let rx = 0; rx < cols; rx++) {
        const x = minX + rx * STEP;
        const dSq = (x - cx) ** 2 + (y - cy) ** 2;
        if (dSq <= rSq) {
          grid[ry][rx] = 0;
          totalSamples++;
        } else {
          grid[ry][rx] = -1;
        }
      }
    }

    if (totalSamples === 0) {
      return { sliceCount: 1, validRegions: [], regionToppings: {}, uniformityScore: 0 };
    }

    // Helper: Distance squared from point (px, py) to line segment (x1, y1)-(x2, y2)
    function distSqToSegment(px, py, x1, y1, x2, y2) {
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2;
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return (px - projX) ** 2 + (py - projY) ** 2;
    }

    // 1. Mark cut segments as WALL cells (-2) with safe barrier radius
    const wallDistSq = (STEP * 0.75) ** 2;
    const cuts = this.cuts;

    for (let cIdx = 0; cIdx < cuts.length; cIdx++) {
      const cut = cuts[cIdx];
      for (let ry = 0; ry < rows; ry++) {
        const y = minY + ry * STEP;
        for (let rx = 0; rx < cols; rx++) {
          if (grid[ry][rx] === 0) {
            const x = minX + rx * STEP;
            if (distSqToSegment(x, y, cut.x1, cut.y1, cut.x2, cut.y2) <= wallDistSq) {
              grid[ry][rx] = -2; // Mark as Cut Wall
            }
          }
        }
      }
    }

    // 2. Flood Fill BFS across non-wall cells
    let currentRegionId = 1;
    const regionCounts = {};

    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        if (grid[ry][rx] === 0) {
          const regionId = currentRegionId++;
          regionCounts[regionId] = 0;

          const queue = [[rx, ry]];
          grid[ry][rx] = regionId;

          let head = 0;
          while (head < queue.length) {
            const [cx_idx, cy_idx] = queue[head++];
            regionCounts[regionId]++;

            const neighbors = [
              [cx_idx + 1, cy_idx],
              [cx_idx, cy_idx + 1],
              [cx_idx - 1, cy_idx],
              [cx_idx, cy_idx - 1]
            ];

            for (let i = 0; i < neighbors.length; i++) {
              const [nx, ny] = neighbors[i];
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
                grid[ny][nx] = regionId;
                queue.push([nx, ny]);
              }
            }
          }
        }
      }
    }

    // 3. Filter regions with significant area (>= 3.5% of total pizza)
    const validRegions = Object.entries(regionCounts).filter(([_, count]) => count / totalSamples >= 0.035);
    const sliceCount = validRegions.length;

    // Calculate Area Uniformity (Score from 0 to 100%)
    const expectedRatio = 1 / targetSlices;
    let totalVariance = 0;
    const validTotalSamples = validRegions.reduce((sum, [_, count]) => sum + count, 0);

    validRegions.forEach(([_, count]) => {
      const ratio = count / (validTotalSamples || 1);
      totalVariance += Math.abs(ratio - expectedRatio);
    });

    const countPenalty = Math.abs(sliceCount - targetSlices) * 25;
    const uniformityScore = Math.max(0, Math.min(100, Math.round((1 - totalVariance / 2) * 100 - countPenalty)));

    // Map stage toppings to their containing or nearest regionId
    const regionToppings = {};
    validRegions.forEach(([key]) => {
      regionToppings[key] = [];
    });

    stageToppings.forEach(top => {
      const rx = Math.max(0, Math.min(cols - 1, Math.round((top.x - minX) / STEP)));
      const ry = Math.max(0, Math.min(rows - 1, Math.round((top.y - minY) / STEP)));
      
      let nearestReg = null;
      let minDist = Infinity;
      validRegions.forEach(([vRegId]) => {
        const vId = Number(vRegId);
        for (let yIdx = Math.max(0, ry - 8); yIdx <= Math.min(rows - 1, ry + 8); yIdx++) {
          for (let xIdx = Math.max(0, rx - 8); xIdx <= Math.min(cols - 1, rx + 8); xIdx++) {
            if (grid[yIdx][xIdx] === vId) {
              const cellX = minX + xIdx * STEP;
              const cellY = minY + yIdx * STEP;
              const dist = Math.hypot(cellX - top.x, cellY - top.y);
              if (dist < minDist) {
                minDist = dist;
                nearestReg = vRegId;
              }
            }
          }
        }
      });
      if (nearestReg && regionToppings[nearestReg]) {
        regionToppings[nearestReg].push(top);
      }
    });

    return {
      sliceCount,
      validRegions,
      regionToppings,
      uniformityScore
    };
  }

  // Validate requirements against slice analysis
  validateStage(stage) {
    const analysis = this.analyzeSlices(stage.toppings, stage.targetSlices);
    const { sliceCount, validRegions, regionToppings, uniformityScore } = analysis;

    if (sliceCount !== stage.targetSlices) {
      return {
        isSuccess: false,
        stars: 0,
        message: `조각 수가 맞지 않아요! (목표: ${stage.targetSlices}조각, 현재: ${sliceCount}조각)`,
        uniformityScore,
        sliceCount
      };
    }

    // Check each requirement
    for (const req of stage.requirements) {
      if (req.requiredTotalSlices !== undefined) {
        // Slices that have this topping >= countPerSlice
        let qualifiedSlices = 0;
        for (const [_, toppings] of Object.entries(regionToppings)) {
          const matchCount = toppings.filter(t => t.type === req.type).length;
          if (matchCount >= (req.countPerSlice || 1)) {
            qualifiedSlices++;
          }
        }
        if (qualifiedSlices !== req.requiredTotalSlices) {
          return {
            isSuccess: false,
            stars: 0,
            message: `${TOPPING_INFO[req.type].name} 조각이 ${req.requiredTotalSlices}개여야 해요! (현재: ${qualifiedSlices}개)`,
            uniformityScore,
            sliceCount
          };
        }
      } else if (req.minTotalSlices !== undefined) {
        let qualifiedSlices = 0;
        for (const [_, toppings] of Object.entries(regionToppings)) {
          if (toppings.some(t => t.type === req.type)) {
            qualifiedSlices++;
          }
        }
        if (qualifiedSlices < req.minTotalSlices) {
          return {
            isSuccess: false,
            stars: 0,
            message: `${TOPPING_INFO[req.type].name}이 들어간 조각이 ${req.minTotalSlices}개 이상이어야 해요!`,
            uniformityScore,
            sliceCount
          };
        }
      } else if (req.countPerSlice !== undefined) {
        // Every single slice must have exact count of this topping
        for (const [_, toppings] of Object.entries(regionToppings)) {
          const matchCount = toppings.filter(t => t.type === req.type).length;
          if (matchCount !== req.countPerSlice) {
            return {
              isSuccess: false,
              stars: 0,
              message: `${TOPPING_INFO[req.type].name} 분배가 맞지 않아요! (각 조각에 ${req.countPerSlice}개 필요)`,
              uniformityScore,
              sliceCount
            };
          }
        }
      }
    }

    // Determine Stars based on Uniformity & Accuracy
    let stars = 1;
    if (uniformityScore >= 88) stars = 3;
    else if (uniformityScore >= 68) stars = 2;

    return {
      isSuccess: true,
      stars,
      message: stars === 3 ? '🎉 완벽한 황금 비율 컷팅!' : stars === 2 ? '👍 훌륭하게 등분했어요!' : '✨ 통과! 조금 더 정확하게 잘라보세요!',
      uniformityScore,
      sliceCount
    };
  }

  // Main Render Frame
  render(stage, options = {}) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Wooden Pizza Board / Countertop Mat
    this.drawPizzaBoard(ctx);

    // 2. Draw Pizza Base (Crust, Sauce, Cheese Layer)
    this.drawPizzaBase(ctx);

    // 3. Draw Stage Toppings
    if (stage && stage.toppings) {
      stage.toppings.forEach(top => {
        this.drawTopping(ctx, top);
      });
    }

    // 4. Draw Cut Lines & Cheese separation seams
    this.drawCuts(ctx);

    // 5. Draw Active Dragging Laser Guide
    if (this.isDragging && this.dragStart && this.dragCurrent) {
      this.drawDragLine(ctx, this.dragStart, this.dragCurrent);
    }

    // 6. Update and Draw Particles & Sparkles
    this.updateParticles(ctx);
  }

  drawPizzaBoard(ctx) {
    const cx = PIZZA_CENTER.x;
    const cy = PIZZA_CENTER.y;
    const boardRadius = PIZZA_RADIUS + 38;

    // Wood Board Outer Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, boardRadius, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;

    // Wood Board Gradient
    const boardGrad = ctx.createRadialGradient(cx - 50, cy - 50, 40, cx, cy, boardRadius);
    boardGrad.addColorStop(0, '#D7A76C');
    boardGrad.addColorStop(0.7, '#B88246');
    boardGrad.addColorStop(1, '#8C5824');
    ctx.fillStyle = boardGrad;
    ctx.fill();
    ctx.restore();

    // Wood Grain Ring Details
    ctx.save();
    ctx.strokeStyle = 'rgba(92, 51, 14, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, boardRadius - 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, boardRadius - 22, 0, Math.PI * 2);
    ctx.stroke();

    // Board Handle (Bottom Center)
    ctx.fillStyle = '#8C5824';
    ctx.beginPath();
    ctx.roundRect(cx - 24, cy + boardRadius - 8, 48, 45, [6, 6, 12, 12]);
    ctx.fill();

    // Handle Hole
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(cx, cy + boardRadius + 16, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPizzaBase(ctx) {
    const cx = PIZZA_CENTER.x;
    const cy = PIZZA_CENTER.y;
    const r = PIZZA_RADIUS;

    // 1. Crust Layer (Golden Baked Bread)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;

    const crustGrad = ctx.createRadialGradient(cx - 30, cy - 30, r * 0.7, cx, cy, r);
    crustGrad.addColorStop(0, '#F5B041');
    crustGrad.addColorStop(0.85, '#D68910');
    crustGrad.addColorStop(1, '#935116');
    ctx.fillStyle = crustGrad;
    ctx.fill();
    ctx.restore();

    // 2. Tomato Sauce Layer
    ctx.save();
    const sauceR = r - CRUST_WIDTH;
    ctx.beginPath();
    ctx.arc(cx, cy, sauceR, 0, Math.PI * 2);
    const sauceGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, sauceR);
    sauceGrad.addColorStop(0, '#C0392B');
    sauceGrad.addColorStop(0.9, '#922B21');
    sauceGrad.addColorStop(1, '#78281F');
    ctx.fillStyle = sauceGrad;
    ctx.fill();

    // 3. Mozzarella Cheese Layer (Melted & Rich)
    const cheeseR = sauceR - 6;
    ctx.beginPath();
    ctx.arc(cx, cy, cheeseR, 0, Math.PI * 2);
    const cheeseGrad = ctx.createRadialGradient(cx - 25, cy - 25, 10, cx, cy, cheeseR);
    cheeseGrad.addColorStop(0, '#FFF9C4');
    cheeseGrad.addColorStop(0.5, '#FFF176');
    cheeseGrad.addColorStop(0.85, '#FFD54F');
    cheeseGrad.addColorStop(1, '#FFB74D');
    ctx.fillStyle = cheeseGrad;
    ctx.fill();

    // Baked Cheese Bubbles / Browning Spots
    ctx.fillStyle = 'rgba(211, 84, 0, 0.25)';
    const spots = [
      { x: cx - 60, y: cy - 40, r: 12 },
      { x: cx + 50, y: cy - 70, r: 10 },
      { x: cx + 70, y: cy + 40, r: 14 },
      { x: cx - 40, y: cy + 60, r: 11 },
      { x: cx, y: cy, r: 16 }
    ];
    spots.forEach(sp => {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawTopping(ctx, top) {
    const { type, x, y } = top;
    ctx.save();
    ctx.translate(x, y);

    // Subtle drop shadow for 3D depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    if (type === TOPPING_TYPES.PEPPERONI) {
      // Pepperoni Slice
      const r = TOPPING_INFO.pepperoni.radius;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const pepGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
      pepGrad.addColorStop(0, '#E53935');
      pepGrad.addColorStop(0.8, '#C62828');
      pepGrad.addColorStop(1, '#8E0000');
      ctx.fillStyle = pepGrad;
      ctx.fill();

      // Seasoning dots & fat spots
      ctx.fillStyle = 'rgba(255, 235, 238, 0.4)';
      ctx.beginPath();
      ctx.arc(-6, -5, 2, 0, Math.PI * 2);
      ctx.arc(4, -7, 1.8, 0, Math.PI * 2);
      ctx.arc(-3, 6, 2.2, 0, Math.PI * 2);
      ctx.arc(6, 4, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#B71C1C';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

    } else if (type === TOPPING_TYPES.OLIVE) {
      // Black Olive Ring
      const r = TOPPING_INFO.olive.radius;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#212121';
      ctx.fill();

      // Center hole
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE082'; // Cheese showing through
      ctx.fill();

      // Shiny highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, Math.PI * 1.1, Math.PI * 1.6);
      ctx.stroke();

    } else if (type === TOPPING_TYPES.MUSHROOM) {
      // Mushroom Slice (Cap + Stem)
      ctx.fillStyle = '#F5EBE0';
      ctx.strokeStyle = '#BCAAA4';
      ctx.lineWidth = 1.5;

      // Stem
      ctx.beginPath();
      ctx.roundRect(-4, 0, 8, 11, [2, 2, 4, 4]);
      ctx.fill();
      ctx.stroke();

      // Cap
      ctx.beginPath();
      ctx.arc(0, 0, 14, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gills texture
      ctx.strokeStyle = 'rgba(109, 76, 65, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-4, 3);
      ctx.moveTo(10, 0); ctx.lineTo(4, 3);
      ctx.moveTo(0, 0); ctx.lineTo(0, 4);
      ctx.stroke();

    } else if (type === TOPPING_TYPES.PAPRIKA) {
      // Green Paprika / Bell Pepper Ring Segment
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0.2, Math.PI * 1.4);
      ctx.stroke();

      // Inner lighter pulp
      ctx.strokeStyle = '#81C784';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0.3, Math.PI * 1.3);
      ctx.stroke();

    } else if (type === TOPPING_TYPES.BASIL) {
      // Fresh Basil Leaf
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Leaf vein
      ctx.strokeStyle = '#C8E6C9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -9);
      ctx.lineTo(9, 9);
      ctx.stroke();

    } else if (type === TOPPING_TYPES.TOMATO) {
      // Cherry Tomato Slice
      const r = TOPPING_INFO.tomato.radius;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#E53935';
      ctx.fill();

      // Pulp & seeds
      ctx.fillStyle = '#FF8A80';
      ctx.beginPath();
      ctx.arc(-4, -2, 4, 0, Math.PI * 2);
      ctx.arc(4, -2, 4, 0, Math.PI * 2);
      ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF59D'; // Seeds
      ctx.beginPath();
      ctx.arc(-4, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawCuts(ctx) {
    if (this.cuts.length === 0) return;

    ctx.save();
    this.cuts.forEach((cut, idx) => {
      const p1x = cut.x1;
      const p1y = cut.y1;
      const p2x = cut.x2;
      const p2y = cut.y2;

      // 1. Cut Shadow & Cheese Seam
      ctx.strokeStyle = 'rgba(120, 40, 31, 0.75)';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      // 2. Bright Sharp Knife Cut Line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      // 3. Cut Start/End Dot Pins
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(p1x, p1y, 3, 0, Math.PI * 2);
      ctx.arc(p2x, p2y, 3, 0, Math.PI * 2);
      ctx.fill();

      // 4. Cut Index Badge
      const midX = (cut.x1 + cut.x2) / 2;
      const midY = (cut.y1 + cut.y2) / 2;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(midX, midY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), midX, midY);
    });
    ctx.restore();
  }

  drawDragLine(ctx, start, current) {
    ctx.save();
    // Glowing Laser Guide
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();

    // Start point pin
    ctx.setLineDash([]);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cutter Wheel Icon at current drag head
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(current.x, current.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  updateParticles(ctx) {
    // 1. Cheese Crumbles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Star Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;

      if (s.life <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
