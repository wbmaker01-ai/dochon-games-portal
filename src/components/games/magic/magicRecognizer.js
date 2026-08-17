// Gesture Recognition Engine for Dochon Magic Cat Academy
// Classifies mouse & touch strokes into 6 Magic Symbols:
// HORIZONTAL (—), VERTICAL (│), UP_V (∧), DOWN_V (∨), LIGHTNING (⚡), HEART (❤️)

export class GestureRecognizer {
  static recognize(rawPoints) {
    if (!rawPoints || rawPoints.length < 5) {
      return null;
    }

    // Step 1: Filter out duplicate or extremely close points
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

    if (points.length < 5) return null;

    // Step 2: Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }

    // Must have drawn at least a meaningful distance (e.g. 24px)
    if (totalLength < 24) return null;

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

      if (Math.abs(dx) > 6) {
        const signX = Math.sign(dx);
        if (lastSignX !== 0 && signX !== lastSignX) {
          xDirectionChanges++;
        }
        lastSignX = signX;
      }

      if (Math.abs(dy) > 6) {
        const signY = Math.sign(dy);
        if (lastSignY !== 0 && signY !== lastSignY) {
          yDirectionChanges++;
        }
        lastSignY = signY;
      }
    }

    // ==============================================
    // ⚡ 1. LIGHTNING (번개): Multiple direction reversals (Zigzag / Z-stroke)
    // ==============================================
    if (xDirectionChanges >= 2 || (xDirectionChanges >= 1 && yDirectionChanges >= 2)) {
      if (boxH > 25 && boxW > 20) {
        return 'LIGHTNING';
      }
    }

    // ==============================================
    // ❤️ 2. HEART (하트): Loop or double-arch stroke
    // ==============================================
    // Heart features: start and end are close or meet at bottom tip, or has 2 distinct top humps and 1 bottom tip
    const isClosedOrNearlyClosed = (startEndDist < boxW * 0.45 && startEndDist < boxH * 0.45 && totalLength > 80);
    if (isClosedOrNearlyClosed && yDirectionChanges >= 2 && boxW > 30 && boxH > 30) {
      return 'HEART';
    }

    // ==============================================
    // ∧ 3. UP_V (산 모양 / Caret): Goes UP then DOWN
    // ==============================================
    // The highest point (minY) is in the middle 20%~80% of the stroke
    // Start and End are both significantly lower (greater Y) than the peak
    const peakRelativePos = minYIdx / points.length;
    const isUpVPeakInMiddle = peakRelativePos >= 0.15 && peakRelativePos <= 0.85;
    const startBelowPeak = startP.y - minY > boxH * 0.4;
    const endBelowPeak = endP.y - minY > boxH * 0.4;

    if (isUpVPeakInMiddle && startBelowPeak && endBelowPeak && boxH >= 20 && boxW >= 15) {
      // Ensure it's not a closed loop or vertical line
      if (boxW > boxH * 0.35 && xDirectionChanges <= 1) {
        return 'UP_V';
      }
    }

    // ==============================================
    // ∨ 4. DOWN_V (골 모양 / V-shape): Goes DOWN then UP
    // ==============================================
    // The lowest point (maxY) is in the middle 20%~80% of the stroke
    // Start and End are both significantly higher (smaller Y) than the valley
    const valleyRelativePos = maxYIdx / points.length;
    const isDownVInMiddle = valleyRelativePos >= 0.15 && valleyRelativePos <= 0.85;
    const startAboveValley = maxY - startP.y > boxH * 0.4;
    const endAboveValley = maxY - endP.y > boxH * 0.4;

    if (isDownVInMiddle && startAboveValley && endAboveValley && boxH >= 20 && boxW >= 15) {
      if (boxW > boxH * 0.35 && xDirectionChanges <= 1) {
        return 'DOWN_V';
      }
    }

    // ==============================================
    // — 5. HORIZONTAL (가로선): Wide aspect ratio, low Y change
    // ==============================================
    if (boxW > boxH * 1.5 && boxW >= 30 && xDirectionChanges === 0) {
      return 'HORIZONTAL';
    }

    // ==============================================
    // │ 6. VERTICAL (세로선): Tall aspect ratio, low X change
    // ==============================================
    if (boxH > boxW * 1.5 && boxH >= 30 && yDirectionChanges === 0) {
      return 'VERTICAL';
    }

    // Fallback classification based on dominant aspect ratio & end-to-end vector
    if (boxW > boxH * 2.0 && boxW >= 30) {
      return 'HORIZONTAL';
    }
    if (boxH > boxW * 2.0 && boxH >= 30) {
      return 'VERTICAL';
    }

    // Caret / V fallback if peak is strong
    if (startBelowPeak && endBelowPeak && boxH >= 25 && boxW >= 20) {
      return 'UP_V';
    }
    if (startAboveValley && endAboveValley && boxH >= 25 && boxW >= 20) {
      return 'DOWN_V';
    }

    return null;
  }
}
