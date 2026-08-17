// Gesture Recognition Engine for Dochon Magic Cat Academy
// Classifies mouse & touch strokes into 6 Magic Symbols:
// HORIZONTAL (—), VERTICAL (│), UP_V (∧), DOWN_V (∨), LIGHTNING (⚡), HEART (❤️)

export class GestureRecognizer {
  static recognize(rawPoints) {
    if (!rawPoints || rawPoints.length < 4) {
      return null;
    }

    // Step 1: Filter out duplicate or jittery points
    const points = [];
    for (let i = 0; i < rawPoints.length; i++) {
      const p = rawPoints[i];
      if (i === 0) {
        points.push(p);
      } else {
        const prev = points[points.length - 1];
        const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
        if (dist >= 3) {
          points.push(p);
        }
      }
    }

    if (points.length < 4) return null;

    // Step 2: Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }

    // Minimum meaningful stroke length
    if (totalLength < 18) return null;

    // Step 3: Bounding box & key extrema points
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minXIdx = 0, maxXIdx = 0;
    let minYIdx = 0, maxYIdx = 0;

    points.forEach((p, idx) => {
      if (p.x < minX) { minX = p.x; minXIdx = idx; }
      if (p.x > maxX) { maxX = p.x; maxXIdx = idx; }
      if (p.y < minY) { minY = p.y; minYIdx = idx; }
      if (p.y > maxY) { maxY = p.y; maxYIdx = idx; }
    });

    const boxW = Math.max(1, maxX - minX);
    const boxH = Math.max(1, maxY - minY);
    const startP = points[0];
    const endP = points[points.length - 1];
    const startEndDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);

    // Step 4: Direction changes (Zigzag / Inflections)
    let xDirectionChanges = 0;
    let yDirectionChanges = 0;
    let lastSignX = 0;
    let lastSignY = 0;

    for (let i = 2; i < points.length; i++) {
      const dx = points[i].x - points[i - 2].x;
      const dy = points[i].y - points[i - 2].y;

      if (Math.abs(dx) > 4) {
        const signX = Math.sign(dx);
        if (lastSignX !== 0 && signX !== lastSignX) {
          xDirectionChanges++;
        }
        lastSignX = signX;
      }

      if (Math.abs(dy) > 4) {
        const signY = Math.sign(dy);
        if (lastSignY !== 0 && signY !== lastSignY) {
          yDirectionChanges++;
        }
        lastSignY = signY;
      }
    }

    // ==============================================
    // ⚡ 1. LIGHTNING (번개): Z-stroke / Zigzag / N-stroke
    // ==============================================
    // Z-shape: Right -> Down-Left -> Right (xDirectionChanges >= 1 and y goes down)
    // or N-shape: Up -> Down-Right -> Up
    // or any stroke with 2 or more inflection points in X or Y
    const isZShape = (xDirectionChanges >= 1 && yDirectionChanges >= 1 && boxH > 18 && boxW > 18);
    const isZigzag = (xDirectionChanges >= 2 || yDirectionChanges >= 2);

    if (isZShape || isZigzag) {
      // Ensure it's not a closed loop (heart)
      if (startEndDist > Math.min(boxW, boxH) * 0.4) {
        return 'LIGHTNING';
      }
    }

    // ==============================================
    // ❤️ 2. HEART (하트): Loop or double-arch stroke
    // ==============================================
    // Highly forgiving for mouse:
    // 1) Closed or semi-closed loop (start & end within 70% of box size) with both X and Y turns
    // 2) Top dip with bottom tip (classic heart)
    const isNearlyClosedLoop = (startEndDist < Math.max(boxW, boxH) * 0.7 && totalLength > 45 && boxW > 20 && boxH > 20);
    const hasLoopCurve = (xDirectionChanges >= 1 && yDirectionChanges >= 1);

    if (isNearlyClosedLoop && hasLoopCurve) {
      return 'HEART';
    }

    // Classic Heart with 2 top bumps
    if (minYIdx > 0 && minYIdx < points.length - 1 && maxYIdx > 0 && maxYIdx < points.length - 1) {
      if (boxW > 25 && boxH > 25 && startEndDist < boxW * 0.65) {
        return 'HEART';
      }
    }

    // ==============================================
    // ∧ 3. UP_V (산 모양 / Caret): Goes UP then DOWN
    // ==============================================
    const peakRelativePos = minYIdx / points.length;
    const isUpVPeakInMiddle = peakRelativePos >= 0.12 && peakRelativePos <= 0.88;
    const startBelowPeak = startP.y - minY > boxH * 0.35;
    const endBelowPeak = endP.y - minY > boxH * 0.35;

    if (isUpVPeakInMiddle && startBelowPeak && endBelowPeak && boxH >= 16 && boxW >= 14) {
      if (boxW > boxH * 0.3 && xDirectionChanges <= 1) {
        return 'UP_V';
      }
    }

    // ==============================================
    // ∨ 4. DOWN_V (골 모양 / V-shape): Goes DOWN then UP
    // ==============================================
    const valleyRelativePos = maxYIdx / points.length;
    const isDownVInMiddle = valleyRelativePos >= 0.12 && valleyRelativePos <= 0.88;
    const startAboveValley = maxY - startP.y > boxH * 0.35;
    const endAboveValley = maxY - endP.y > boxH * 0.35;

    if (isDownVInMiddle && startAboveValley && endAboveValley && boxH >= 16 && boxW >= 14) {
      if (boxW > boxH * 0.3 && xDirectionChanges <= 1) {
        return 'DOWN_V';
      }
    }

    // ==============================================
    // — 5. HORIZONTAL (가로선): Wide aspect ratio, low Y change
    // ==============================================
    if (boxW > boxH * 1.4 && boxW >= 24 && xDirectionChanges === 0) {
      return 'HORIZONTAL';
    }

    // ==============================================
    // │ 6. VERTICAL (세로선): Tall aspect ratio, low X change
    // ==============================================
    if (boxH > boxW * 1.4 && boxH >= 24 && yDirectionChanges === 0) {
      return 'VERTICAL';
    }

    // Fallback classification based on dominant aspect ratio & end-to-end vector
    if (boxW > boxH * 1.8 && boxW >= 25) {
      return 'HORIZONTAL';
    }
    if (boxH > boxW * 1.8 && boxH >= 25) {
      return 'VERTICAL';
    }

    // Caret / V fallback
    if (startBelowPeak && endBelowPeak && boxH >= 20 && boxW >= 15) {
      return 'UP_V';
    }
    if (startAboveValley && endAboveValley && boxH >= 20 && boxW >= 15) {
      return 'DOWN_V';
    }

    return null;
  }
}
