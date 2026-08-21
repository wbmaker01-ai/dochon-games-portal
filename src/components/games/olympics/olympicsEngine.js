// Olympics Canvas 2D Vector Rendering Engine for Dochon Mini Olympics

export class OlympicsRenderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.waterOffsets = [0, 10, 20, 30];
  }

  // Clear Screen with Base Background
  clear(width, height, bgColor = '#0F172A') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  // -------------------------------------------------------------
  // 1. HURDLES EVENT RENDERER
  // -------------------------------------------------------------
  renderHurdles({
    width,
    height,
    distance,
    speed,
    playerY,
    isJumping,
    legPhase,
    hurdles,
    team,
    trackLength,
    isStumbled,
    time
  }) {
    const ctx = this.ctx;

    // A. Sky & Olympic Stadium Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    skyGrad.addColorStop(0, '#0284C7');
    skyGrad.addColorStop(1, '#38BDF8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudOffset = (distance * 2) % width;
    ctx.beginPath();
    ctx.arc((width * 0.2 - cloudOffset * 0.2 + width) % width, height * 0.12, 28, 0, Math.PI * 2);
    ctx.arc((width * 0.25 - cloudOffset * 0.2 + width) % width, height * 0.1, 35, 0, Math.PI * 2);
    ctx.arc((width * 0.3 - cloudOffset * 0.2 + width) % width, height * 0.12, 24, 0, Math.PI * 2);
    ctx.fill();

    // Stadium Grandstand with Crowds
    const standY = height * 0.26;
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, standY, width, height * 0.2);

    // Animated Crowds (Colorful Dots with Wave)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < width; col += 14) {
        const bounce = Math.sin(time * 6 + col * 0.05 + row) * 3;
        const colors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];
        ctx.fillStyle = colors[(col + row * 3) % colors.length];
        ctx.beginPath();
        ctx.arc(col + 6, standY + 12 + row * 14 + bounce, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Olympic Banners on Stadium Wall
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, height * 0.42, width, height * 0.06);
    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOCHON MINI OLYMPICS 2026 · 100M HURDLES DASH', width * 0.5, height * 0.46);

    // B. Athletic Running Track (Mondo Red Track)
    const trackY = height * 0.48;
    const trackH = height * 0.52;
    const trackGrad = ctx.createLinearGradient(0, trackY, 0, height);
    trackGrad.addColorStop(0, '#B91C1C');
    trackGrad.addColorStop(1, '#991B1B');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, trackY, width, trackH);

    // Track Lane White Stripes (Moving with player distance)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, trackY + 30);
    ctx.lineTo(width, trackY + 30);
    ctx.moveTo(0, trackY + 110);
    ctx.lineTo(width, trackY + 110);
    ctx.stroke();

    // Track Distance Markers (Lines on ground every 10m)
    const pixelsPerMeter = 45;
    const screenCenterPlayerX = width * 0.28;
    const playerWorldX = distance * pixelsPerMeter;

    for (let m = 0; m <= trackLength; m += 10) {
      const markerWorldX = m * pixelsPerMeter;
      const markerScreenX = markerWorldX - playerWorldX + screenCenterPlayerX;
      if (markerScreenX >= -50 && markerScreenX <= width + 50) {
        ctx.strokeStyle = m === trackLength ? '#FBBF24' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = m === trackLength ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(markerScreenX, trackY + 15);
        ctx.lineTo(markerScreenX, trackY + 125);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(m === trackLength ? '🏁 FINISH' : `${m}m`, markerScreenX, trackY + 145);
      }
    }

    // C. Render Hurdles
    hurdles.forEach(h => {
      const hurdleWorldX = h.pos * pixelsPerMeter;
      const hurdleScreenX = hurdleWorldX - playerWorldX + screenCenterPlayerX;

      if (hurdleScreenX >= -60 && hurdleScreenX <= width + 60) {
        const baseHurdleY = trackY + 105;
        const hurdleHeight = 46;

        ctx.save();
        if (h.isCleared) {
          // Cleared / Perfect spark
          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          ctx.arc(hurdleScreenX, baseHurdleY - hurdleHeight - 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        if (h.isFallen) {
          // Knocked down hurdle
          ctx.translate(hurdleScreenX, baseHurdleY);
          ctx.rotate(0.9);
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(-4, -hurdleHeight, 8, hurdleHeight);
          // Top bar
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(-20, -hurdleHeight, 40, 9);
        } else {
          // Upright Olympic Hurdle
          // Left & Right Metal Legs
          ctx.fillStyle = '#94A3B8';
          ctx.fillRect(hurdleScreenX - 16, baseHurdleY - hurdleHeight, 5, hurdleHeight);
          ctx.fillRect(hurdleScreenX + 11, baseHurdleY - hurdleHeight, 5, hurdleHeight);

          // Base feet
          ctx.fillRect(hurdleScreenX - 22, baseHurdleY - 4, 38, 5);

          // Top Striped Bar (Yellow / Black or White / Blue)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(hurdleScreenX - 20, baseHurdleY - hurdleHeight, 40, 11);
          ctx.fillStyle = '#0284C7';
          ctx.fillRect(hurdleScreenX - 12, baseHurdleY - hurdleHeight, 8, 11);
          ctx.fillRect(hurdleScreenX + 4, baseHurdleY - hurdleHeight, 8, 11);
        }
        ctx.restore();
      }
    });

    // D. Render Athlete Runner Character
    const playerScreenX = screenCenterPlayerX;
    const groundY = trackY + 95;
    const currentY = groundY - playerY;

    this.drawRunnerAthlete({
      ctx,
      x: playerScreenX,
      y: currentY,
      team,
      legPhase,
      isJumping,
      isStumbled,
      speed
    });

    // E. Speed Wind Particles Behind Player
    if (speed > 4.5 && !isStumbled) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const lineY = currentY - 10 - i * 12;
        const lineX = playerScreenX - 25 - (time * 80 + i * 20) % 50;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX - 20, lineY);
        ctx.stroke();
      }
    }
  }

  // Runner Character Drawing
  drawRunnerAthlete({ ctx, x, y, team, legPhase, isJumping, isStumbled, speed }) {
    ctx.save();
    ctx.translate(x, y);

    if (isStumbled) {
      ctx.rotate(0.35); // Leaning forward when stumbled
    }

    const primaryColor = team ? team.primary : '#EF4444';
    const skinColor = team ? team.skin : '#FCD34D';

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 18, isJumping ? 10 : 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Running Limb Offsets
    const swing = isJumping ? 0.6 : Math.sin(legPhase) * 0.75;

    // Back Leg
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(Math.sin(-swing) * 16, 12);
    ctx.lineTo(Math.sin(-swing) * 22, 22);
    ctx.stroke();

    // Torso (Team Uniform Jersey)
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(-7, -22, 14, 24, [4, 4, 2, 2]);
    ctx.fill();

    // Number on Jersey
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1', 0, -8);

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, -30, 9, 0, Math.PI * 2);
    ctx.fill();

    // Headband
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-9, -34, 18, 4);

    // Front Leg
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(Math.sin(swing) * 16, 12);
    ctx.lineTo(Math.sin(swing) * 24, 22);
    ctx.stroke();

    // Front Arm (Pumping)
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.lineTo(Math.sin(-swing) * 14, -10);
    ctx.lineTo(Math.sin(-swing) * 18, -4);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 2. BASKETBALL SHOOTOUT RENDERER
  // -------------------------------------------------------------
  renderBasketball({
    width,
    height,
    ball,
    ballNumber,
    totalBalls,
    gaugePos,
    isShooting,
    streak,
    team,
    time
  }) {
    const ctx = this.ctx;

    // A. Indoor Arena Background
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    wallGrad.addColorStop(0, '#0F172A');
    wallGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Arena Spotlight Glow
    const spotGrad = ctx.createRadialGradient(width * 0.75, height * 0.28, 20, width * 0.75, height * 0.28, 220);
    spotGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    // B. Hardwood Basketball Floor
    const floorY = height * 0.6;
    const floorH = height * 0.4;
    const woodGrad = ctx.createLinearGradient(0, floorY, 0, height);
    woodGrad.addColorStop(0, '#D97706');
    woodGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, floorY, width, floorH);

    // Floor Parquet Wood Plank Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1.5;
    for (let y = floorY; y < height; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3-Point Arc Line on Floor
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(width * 0.76, floorY + 40, 160, 60, 0, 0, Math.PI * 2);
    ctx.stroke();

    // C. Basketball Hoop & Backboard (Right Side)
    const hoopX = width * 0.78;
    const hoopY = height * 0.32;
    const rimWidth = 42;

    // Backboard Pole & Support
    ctx.fillStyle = '#475569';
    ctx.fillRect(hoopX + 38, hoopY - 80, 12, height * 0.6);
    ctx.fillRect(hoopX + 10, hoopY - 30, 30, 6);

    // Glass Backboard
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 3;
    ctx.fillRect(hoopX + 24, hoopY - 70, 14, 76);
    ctx.strokeRect(hoopX + 24, hoopY - 70, 14, 76);

    // Target Square on Backboard
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(hoopX + 22, hoopY - 45, 8, 30);

    // Orange Rim
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(hoopX, hoopY, rimWidth * 0.5, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // White Net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hoopX - rimWidth * 0.45, hoopY + 2);
    ctx.lineTo(hoopX - 10, hoopY + 36);
    ctx.lineTo(hoopX + 10, hoopY + 36);
    ctx.lineTo(hoopX + rimWidth * 0.45, hoopY + 2);
    ctx.moveTo(hoopX - rimWidth * 0.2, hoopY + 2);
    ctx.lineTo(hoopX - 4, hoopY + 36);
    ctx.moveTo(hoopX + rimWidth * 0.2, hoopY + 2);
    ctx.lineTo(hoopX + 4, hoopY + 36);
    ctx.stroke();

    // D. Shooter Athlete (Left Side)
    const shooterX = width * 0.22;
    const shooterY = height * 0.68;
    this.drawBasketballShooter({
      ctx,
      x: shooterX,
      y: shooterY,
      team,
      isShooting,
      ballVisible: !ball.isActive
    });

    // E. Flying Basketball Projectile
    if (ball.isActive) {
      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.rotate(ball.rot || 0);

      // Ball Body
      const isMoneyBall = ballNumber === totalBalls;
      ctx.fillStyle = isMoneyBall ? '#3B82F6' : '#EA580C';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Black Ribs
      ctx.strokeStyle = isMoneyBall ? '#EF4444' : '#1E293B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.moveTo(-14, 0);
      ctx.lineTo(14, 0);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.stroke();

      ctx.restore();
    }

    // F. Streak Flame Overlay
    if (streak >= 2) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 ${streak} 콤보 연속 득점!`, width * 0.5, height * 0.16);
    }

    // G. Timing Power Gauge at Bottom
    this.renderShotGauge({
      ctx,
      x: width * 0.5,
      y: height * 0.88,
      width: Math.min(width * 0.7, 340),
      height: 24,
      gaugePos
    });
  }

  // Draw Shooter Pose
  drawBasketballShooter({ ctx, x, y, team, isShooting, ballVisible }) {
    ctx.save();
    ctx.translate(x, y);

    const primary = team ? team.primary : '#EF4444';
    const skin = team ? team.skin : '#FCD34D';

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-8, 22);
    ctx.moveTo(6, 0);
    ctx.lineTo(8, 22);
    ctx.stroke();

    // Torso Jersey
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.roundRect(-10, -28, 20, 30, [4, 4, 2, 2]);
    ctx.fill();

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -38, 10, 0, Math.PI * 2);
    ctx.fill();

    // Shooting Arms & Held Ball
    ctx.strokeStyle = skin;
    ctx.lineWidth = 5;
    ctx.beginPath();
    if (isShooting) {
      // Released high
      ctx.moveTo(-4, -22);
      ctx.lineTo(10, -42);
      ctx.lineTo(18, -52);
    } else {
      // Set shot position
      ctx.moveTo(-4, -22);
      ctx.lineTo(12, -32);
      ctx.lineTo(16, -42);
    }
    ctx.stroke();

    // Held ball before shot
    if (ballVisible) {
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(isShooting ? 22 : 18, isShooting ? -56 : -44, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw Timing Gauge Bar
  renderShotGauge({ ctx, x, y, width, height, gaugePos }) {
    ctx.save();
    ctx.translate(x - width * 0.5, y);

    // Gauge Container Frame
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Zones (Red / Yellow / Green Perfect / Yellow / Red)
    // Red Left & Right
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(3, 3, width - 6, height - 6);

    // Yellow Good Zone
    const goodW = width * 0.44;
    const goodX = (width - goodW) * 0.5;
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(goodX, 3, goodW, height - 6);

    // Green Perfect Zone
    const perfectW = width * 0.22;
    const perfectX = (width - perfectW) * 0.5;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(perfectX, 3, perfectW, height - 6);

    // Indicator Needle / Pointer
    const pointerX = 4 + (width - 8) * (gaugePos * 0.01);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pointerX - 4, -4, 8, height + 8, 4);
    ctx.fill();
    ctx.stroke();

    // Center Perfect Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PERFECT ZONE', width * 0.5, height + 16);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 3. CANOE SLALOM RENDERER
  // -------------------------------------------------------------
  renderCanoe({
    width,
    height,
    playerX,
    playerAngle,
    paddlePhase,
    riverScroll,
    gates,
    obstacles,
    team,
    courseLength,
    distanceTraveled
  }) {
    const ctx = this.ctx;

    // A. Riverbed Bank Sides (Forest / Mountain Rocks)
    ctx.fillStyle = '#065F46'; // Pine Green Forest Banks
    ctx.fillRect(0, 0, width, height);

    // Trees on Left & Right Banks
    ctx.fillStyle = '#047857';
    for (let y = -40; y < height + 40; y += 50) {
      const treeY = (y + riverScroll * 0.5) % (height + 80) - 40;
      // Left Bank Tree
      ctx.beginPath();
      ctx.arc(25, treeY, 18, 0, Math.PI * 2);
      ctx.fill();
      // Right Bank Tree
      ctx.beginPath();
      ctx.arc(width - 25, treeY + 20, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // B. Fast Flowing Whitewater River
    const bankWidth = Math.min(width * 0.12, 60);
    const riverWidth = width - bankWidth * 2;
    const riverX = bankWidth;

    const riverGrad = ctx.createLinearGradient(riverX, 0, riverX + riverWidth, 0);
    riverGrad.addColorStop(0, '#0284C7');
    riverGrad.addColorStop(0.5, '#0EA5E9');
    riverGrad.addColorStop(1, '#0369A1');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(riverX, 0, riverWidth, height);

    // Animated Whitewater Foam Streams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const streamX = riverX + 30 + i * (riverWidth / 8);
      const streamOffset = (riverScroll * 2.2 + i * 90) % height;
      ctx.beginPath();
      ctx.moveTo(streamX, streamOffset);
      ctx.lineTo(streamX + Math.sin(streamOffset * 0.05) * 12, streamOffset + 35);
      ctx.stroke();
    }

    // C. River Obstacles (Rocks & Logs)
    obstacles.forEach(obs => {
      const screenY = obs.y - distanceTraveled;
      if (screenY >= -50 && screenY <= height + 50) {
        ctx.save();
        ctx.translate(obs.x, screenY);

        if (obs.type === 'rock') {
          // Gray Granite Boulder
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.ellipse(0, 0, obs.radius || 18, (obs.radius || 18) * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.arc(-4, -3, 6, 0, Math.PI * 2);
          ctx.fill();

          // Water splash around rock
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, (obs.radius || 18) * 0.5, obs.radius || 18, 0, Math.PI);
          ctx.stroke();
        } else {
          // Wooden Log
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.roundRect(-24, -8, 48, 16, 4);
          ctx.fill();
        }

        ctx.restore();
      }
    });

    // D. Slalom Gates (Green / White Striped Hanging Poles)
    gates.forEach(gate => {
      const screenY = gate.y - distanceTraveled;
      if (screenY >= -60 && screenY <= height + 60) {
        ctx.save();
        ctx.translate(gate.x, screenY);

        // Gate Span Cable across river
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-gate.width * 0.5 - 30, 0);
        ctx.lineTo(gate.width * 0.5 + 30, 0);
        ctx.stroke();

        // Left & Right Gate Poles
        [-gate.width * 0.5, gate.width * 0.5].forEach(poleX => {
          // Hanging pole stripes
          ctx.fillStyle = gate.isPassed ? '#10B981' : '#FFFFFF';
          ctx.fillRect(poleX - 4, -15, 8, 30);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(poleX - 4, -7, 8, 8);
          ctx.fillRect(poleX - 4, 7, 8, 8);

          // Pole tip bulb
          ctx.fillStyle = gate.isPassed ? '#FDE047' : '#EF4444';
          ctx.beginPath();
          ctx.arc(poleX, 15, 5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Gate Number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GATE ${gate.num}`, 0, -6);

        ctx.restore();
      }
    });

    // E. Canoe & Paddler Character (Player)
    const playerScreenY = height * 0.72;
    this.drawCanoeKayak({
      ctx,
      x: playerX,
      y: playerScreenY,
      angle: playerAngle,
      paddlePhase,
      team
    });
  }

  // Draw Top-down Canoe Kayak & Paddler
  drawCanoeKayak({ ctx, x, y, angle, paddlePhase, team }) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const primary = team ? team.primary : '#EF4444';
    const secondary = team ? team.secondary : '#FCA5A5';
    const skin = team ? team.skin : '#FCD34D';

    // Water Wake behind boat
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(-12, 58);
    ctx.lineTo(12, 58);
    ctx.closePath();
    ctx.fill();

    // Sleek Fiberglass Canoe Hull
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(0, -36); // Bow (front tip)
    ctx.bezierCurveTo(12, -18, 12, 18, 0, 36); // Right curve
    ctx.bezierCurveTo(-12, 18, -12, -18, 0, -36); // Left curve
    ctx.fill();

    // Deck Trim Stripe
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 32);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    // Cockpit Rim
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paddler Athlete (Top-down)
    // Shoulders
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.roundRect(-9, -6, 18, 12, 4);
    ctx.fill();

    // Helmet Head
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -1, 7, 0, Math.PI * 2);
    ctx.fill();

    // Double-blade Paddle with dynamic stroke animation
    const paddleTilt = Math.sin(paddlePhase) * 26;
    ctx.save();
    ctx.translate(0, 0);

    // Paddle Shaft
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-28, paddleTilt);
    ctx.lineTo(28, -paddleTilt);
    ctx.stroke();

    // Paddle Left & Right Blades
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(-28, paddleTilt, 5, 8, 0.4, 0, Math.PI * 2);
    ctx.ellipse(28, -paddleTilt, 5, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}
