// Olympics Canvas 2D Vector Rendering Engine for Dochon Mini Olympics (High-Agency Redesign)

export class OlympicsRenderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }

  // Clear Screen with Base Background
  clear(width, height, bgColor = '#0B1120') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  // -------------------------------------------------------------
  // 1. HURDLES EVENT RENDERER (Enhanced Typography & Visuals)
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
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.42);
    skyGrad.addColorStop(0, '#0369A1');
    skyGrad.addColorStop(0.6, '#0284C7');
    skyGrad.addColorStop(1, '#38BDF8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.42);

    // Fluffy Clouds with subtle shading
    const cloudOffset = (distance * 1.5) % width;
    this.drawCloud(ctx, (width * 0.2 - cloudOffset * 0.2 + width) % width, height * 0.12, 38);
    this.drawCloud(ctx, (width * 0.65 - cloudOffset * 0.2 + width) % width, height * 0.08, 48);

    // Stadium Grandstand Wall
    const standY = height * 0.22;
    const standH = height * 0.2;
    const standGrad = ctx.createLinearGradient(0, standY, 0, standY + standH);
    standGrad.addColorStop(0, '#334155');
    standGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = standGrad;
    ctx.fillRect(0, standY, width, standH);

    // Stadium Tier Dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.moveTo(0, standY + r * 18);
      ctx.lineTo(width, standY + r * 18);
      ctx.stroke();
    }

    // Animated Cheering Crowds (Vibrant & Expressive)
    const crowdColors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#C084FC', '#F472B6', '#38BDF8'];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < width; col += 12) {
        const bounce = Math.sin(time * 7 + col * 0.08 + row * 1.5) * 4;
        const colorIdx = (Math.floor(col / 12) + row * 4) % crowdColors.length;
        ctx.fillStyle = crowdColors[colorIdx];
        ctx.beginPath();
        ctx.arc(col + 6, standY + 10 + row * 18 + bounce, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Olympic Electronic Jumbotron Billboard (High Contrast & Clear Typography)
    const boardY = height * 0.38;
    const boardH = 32;
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, boardY, width, boardH);

    // Gold Neon Accent Border
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, boardY, width, 2);
    ctx.fillRect(0, boardY + boardH - 2, width, 2);

    // Billboard Text (Bold, Crisp, High-Contrast Gold)
    ctx.fillStyle = '#FDE047';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(253, 224, 71, 0.6)';
    ctx.shadowBlur = 8;
    ctx.fillText('DOCHON MINI OLYMPICS 2026 · 100M HURDLES DASH', width * 0.5, boardY + boardH * 0.5);
    ctx.shadowBlur = 0; // reset

    // B. Running Track (High Quality Mondo Red Athletic Track)
    const trackY = height * 0.46;
    const trackH = height * 0.54;
    const trackGrad = ctx.createLinearGradient(0, trackY, 0, height);
    trackGrad.addColorStop(0, '#DC2626');
    trackGrad.addColorStop(0.3, '#B91C1C');
    trackGrad.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, trackY, width, trackH);

    // Track Lane White Stripes
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, trackY + 25);
    ctx.lineTo(width, trackY + 25);
    ctx.moveTo(0, trackY + 115);
    ctx.lineTo(width, trackY + 115);
    ctx.stroke();

    // Track Lane Markers & Distance Badges
    const pixelsPerMeter = 48;
    const screenCenterPlayerX = width * 0.26;
    const playerWorldX = distance * pixelsPerMeter;

    for (let m = 0; m <= trackLength; m += 10) {
      const markerWorldX = m * pixelsPerMeter;
      const markerScreenX = markerWorldX - playerWorldX + screenCenterPlayerX;
      if (markerScreenX >= -60 && markerScreenX <= width + 60) {
        // Ground line
        ctx.strokeStyle = m === trackLength ? '#FBBF24' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = m === trackLength ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(markerScreenX, trackY + 10);
        ctx.lineTo(markerScreenX, trackY + 125);
        ctx.stroke();

        // High-Contrast Distance Pill Badge (Black Background + Bright Text)
        const isFinish = m === trackLength;
        const badgeW = isFinish ? 96 : 48;
        const badgeH = 24;
        const badgeY = trackY + 132;

        ctx.fillStyle = isFinish ? '#F59E0B' : '#0F172A';
        ctx.strokeStyle = isFinish ? '#FFFFFF' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(markerScreenX - badgeW * 0.5, badgeY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.stroke();

        // Badge Text
        ctx.fillStyle = isFinish ? '#0F172A' : '#FFFFFF';
        ctx.font = '900 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isFinish ? '🏁 FINISH' : `${m}m`, markerScreenX, badgeY + badgeH * 0.5);
      }
    }

    // C. Render Hurdles
    hurdles.forEach(h => {
      const hurdleWorldX = h.pos * pixelsPerMeter;
      const hurdleScreenX = hurdleWorldX - playerWorldX + screenCenterPlayerX;

      if (hurdleScreenX >= -60 && hurdleScreenX <= width + 60) {
        const baseHurdleY = trackY + 110;
        const hurdleHeight = 52;

        ctx.save();
        if (h.isCleared) {
          // Cleared Sparkle Badge
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(hurdleScreenX, baseHurdleY - hurdleHeight - 16, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PASS', hurdleScreenX, baseHurdleY - hurdleHeight - 16);
        }

        if (h.isFallen) {
          // Knocked down hurdle
          ctx.translate(hurdleScreenX, baseHurdleY);
          ctx.rotate(1.1);
          ctx.fillStyle = '#64748B';
          ctx.fillRect(-4, -hurdleHeight, 8, hurdleHeight);
          // Top bar
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(-22, -hurdleHeight, 44, 12);
        } else {
          // Upright Olympic Hurdle
          // Legs
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(hurdleScreenX - 18, baseHurdleY - hurdleHeight, 6, hurdleHeight);
          ctx.fillRect(hurdleScreenX + 12, baseHurdleY - hurdleHeight, 6, hurdleHeight);

          // Base feet
          ctx.fillStyle = '#475569';
          ctx.fillRect(hurdleScreenX - 24, baseHurdleY - 5, 48, 6);

          // Striped Top Bar (White / Royal Blue with Black Outline)
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(hurdleScreenX - 22, baseHurdleY - hurdleHeight, 44, 14, 3);
          ctx.fill();
          ctx.stroke();

          // Stripes
          ctx.fillStyle = '#0284C7';
          ctx.fillRect(hurdleScreenX - 14, baseHurdleY - hurdleHeight + 1, 8, 12);
          ctx.fillRect(hurdleScreenX + 6, baseHurdleY - hurdleHeight + 1, 8, 12);
        }
        ctx.restore();
      }
    });

    // D. Render Athlete Runner Character (Scaled Up & Expressive)
    const playerScreenX = screenCenterPlayerX;
    const groundY = trackY + 98;
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

    // E. Speed Trail FX
    if (speed > 4.5 && !isStumbled) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const lineY = currentY - 14 - i * 14;
        const lineX = playerScreenX - 30 - (time * 90 + i * 25) % 60;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX - 25, lineY);
        ctx.stroke();
      }
    }
  }

  // Draw Cloud Helper
  drawCloud(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Runner Character Drawing (Pro Scale & Clean Lines)
  drawRunnerAthlete({ ctx, x, y, team, legPhase, isJumping, isStumbled, speed }) {
    ctx.save();
    ctx.translate(x, y);

    if (isStumbled) {
      ctx.rotate(0.4);
    }

    const primaryColor = team ? team.primary : '#EF4444';
    const secondaryColor = team ? team.secondary : '#FCA5A5';
    const skinColor = team ? team.skin : '#FCD34D';

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 22, isJumping ? 12 : 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leg Motion Swing
    const swing = isJumping ? 0.7 : Math.sin(legPhase) * 0.9;

    // Back Leg & Shoe
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(Math.sin(-swing) * 20, 14);
    ctx.lineTo(Math.sin(-swing) * 26, 26);
    ctx.stroke();

    // Back Shoe
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(Math.sin(-swing) * 26, 26, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Torso Jersey (Solid with Outline)
    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-9, -28, 18, 30, [6, 6, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Number 1 on Jersey
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 0, -13);

    // Head
    ctx.fillStyle = skinColor;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -38, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(4, -38, 2, 0, Math.PI * 2);
    ctx.fill();

    // Gold Athletic Headband
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-11, -44, 22, 5);

    // Front Leg & Shoe
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(Math.sin(swing) * 20, 14);
    ctx.lineTo(Math.sin(swing) * 28, 26);
    ctx.stroke();

    // Front Shoe
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(Math.sin(swing) * 28, 26, 6, 0, Math.PI * 2);
    ctx.fill();

    // Front Arm Pumping
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-5, -22);
    ctx.lineTo(Math.sin(-swing) * 16, -12);
    ctx.lineTo(Math.sin(-swing) * 22, -4);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 2. BASKETBALL SHOOTOUT RENDERER (High-End Polish)
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

    // A. Indoor Olympic Arena Wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height * 0.58);
    wallGrad.addColorStop(0, '#0F172A');
    wallGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height * 0.58);

    // Spotlight Arc
    const spotGrad = ctx.createRadialGradient(width * 0.78, height * 0.28, 10, width * 0.78, height * 0.28, 240);
    spotGrad.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, width, height * 0.58);

    // B. Hardwood Parquet Basketball Floor
    const floorY = height * 0.58;
    const floorH = height * 0.42;
    const woodGrad = ctx.createLinearGradient(0, floorY, 0, height);
    woodGrad.addColorStop(0, '#EA580C');
    woodGrad.addColorStop(0.5, '#D97706');
    woodGrad.addColorStop(1, '#B45309');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, floorY, width, floorH);

    // Floor Plank Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1.5;
    for (let y = floorY; y < height; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3-Point Arc Line on Floor
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(width * 0.78, floorY + 45, 170, 65, 0, 0, Math.PI * 2);
    ctx.stroke();

    // C. Basketball Hoop & Glass Backboard (Right Side)
    const hoopX = width * 0.8;
    const hoopY = height * 0.3;
    const rimWidth = 46;

    // Heavy Metal Pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(hoopX + 44, hoopY - 90, 14, height * 0.65);
    ctx.fillRect(hoopX + 12, hoopY - 35, 34, 8);

    // Glass Backboard
    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(hoopX + 26, hoopY - 80, 16, 88, 4);
    ctx.fill();
    ctx.stroke();

    // Red Target Square on Backboard
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(hoopX + 24, hoopY - 50, 10, 34);

    // Orange Heavy Rim
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(hoopX, hoopY, rimWidth * 0.5, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // White Net with Depth
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hoopX - rimWidth * 0.45, hoopY + 2);
    ctx.lineTo(hoopX - 12, hoopY + 42);
    ctx.lineTo(hoopX + 12, hoopY + 42);
    ctx.lineTo(hoopX + rimWidth * 0.45, hoopY + 2);
    ctx.moveTo(hoopX - rimWidth * 0.2, hoopY + 2);
    ctx.lineTo(hoopX - 5, hoopY + 42);
    ctx.moveTo(hoopX + rimWidth * 0.2, hoopY + 2);
    ctx.lineTo(hoopX + 5, hoopY + 42);
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

      const isMoneyBall = ballNumber === totalBalls;
      ctx.fillStyle = isMoneyBall ? '#3B82F6' : '#EA580C';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Ball Ribs
      ctx.strokeStyle = isMoneyBall ? '#EF4444' : '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.moveTo(-16, 0);
      ctx.lineTo(16, 0);
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.stroke();

      ctx.restore();
    }

    // F. Streak Combo Overlay
    if (streak >= 2) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillText(`🔥 ${streak} 콤보 연속 클린 득점!`, width * 0.5, height * 0.15);
      ctx.shadowBlur = 0;
    }

    // G. Timing Power Gauge at Bottom
    this.renderShotGauge({
      ctx,
      x: width * 0.5,
      y: height * 0.86,
      width: Math.min(width * 0.72, 360),
      height: 28,
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-9, 24);
    ctx.moveTo(7, 0);
    ctx.lineTo(9, 24);
    ctx.stroke();

    // Torso Jersey
    ctx.fillStyle = primary;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-11, -32, 22, 34, [6, 6, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = skin;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -44, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shooting Arms
    ctx.strokeStyle = skin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (isShooting) {
      ctx.moveTo(-5, -26);
      ctx.lineTo(12, -48);
      ctx.lineTo(22, -60);
    } else {
      ctx.moveTo(-5, -26);
      ctx.lineTo(14, -36);
      ctx.lineTo(18, -48);
    }
    ctx.stroke();

    // Held ball before shot
    if (ballVisible) {
      ctx.fillStyle = '#EA580C';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(isShooting ? 26 : 20, isShooting ? -64 : -50, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Timing Gauge Bar with Enhanced Visibility
  renderShotGauge({ ctx, x, y, width, height, gaugePos }) {
    ctx.save();
    ctx.translate(x - width * 0.5, y);

    // Gauge Container Frame
    ctx.fillStyle = '#090D16';
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 10);
    ctx.fill();
    ctx.stroke();

    // Zones
    // Red Base
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(4, 4, width - 8, height - 8);

    // Yellow Good Zone
    const goodW = width * 0.44;
    const goodX = (width - goodW) * 0.5;
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(goodX, 4, goodW, height - 8);

    // Green Perfect Zone
    const perfectW = width * 0.24;
    const perfectX = (width - perfectW) * 0.5;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(perfectX, 4, perfectW, height - 8);

    // Center Perfect Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ PERFECT ⚡', width * 0.5, height * 0.5);

    // Pointer Needle
    const pointerX = 4 + (width - 8) * (gaugePos * 0.01);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(pointerX - 5, -5, 10, height + 10, 5);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 3. CANOE SLALOM RENDERER (Forward Whitewater Physics)
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
    const playerScreenY = height * 0.72; // Player fixed at Y = 288px
    const pixelsPerMeter = 1.6;

    // A. Forest Riverbank Sides
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(0, 0, width, height);

    // Bank Trees scrolling down
    ctx.fillStyle = '#047857';
    for (let y = -40; y < height + 40; y += 45) {
      const treeY = (y + riverScroll * 0.8) % (height + 80) - 40;
      ctx.beginPath();
      ctx.arc(24, treeY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 24, treeY + 20, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // B. Fast Whitewater River
    const bankWidth = Math.min(width * 0.12, 60);
    const riverWidth = width - bankWidth * 2;
    const riverX = bankWidth;

    const riverGrad = ctx.createLinearGradient(riverX, 0, riverX + riverWidth, 0);
    riverGrad.addColorStop(0, '#0369A1');
    riverGrad.addColorStop(0.5, '#0284C7');
    riverGrad.addColorStop(1, '#075985');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(riverX, 0, riverWidth, height);

    // Whitewater Waves & Foam flowing from Top to Bottom
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const streamX = riverX + 30 + i * (riverWidth / 8);
      const streamOffset = (riverScroll * 3 + i * 85) % height;
      ctx.beginPath();
      ctx.moveTo(streamX, streamOffset);
      ctx.lineTo(streamX + Math.sin(streamOffset * 0.05) * 14, streamOffset + 38);
      ctx.stroke();
    }

    // C. River Obstacles (Coming from Top towards Player)
    obstacles.forEach(obs => {
      const distAhead = obs.targetDist - distanceTraveled;
      const screenY = playerScreenY - distAhead * pixelsPerMeter;

      if (screenY >= -50 && screenY <= height + 50) {
        ctx.save();
        ctx.translate(obs.x, screenY);

        if (obs.type === 'rock') {
          ctx.fillStyle = '#64748B';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, obs.radius || 20, (obs.radius || 20) * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Highlight
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.arc(-5, -4, 7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Log
          ctx.fillStyle = '#78350F';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-26, -9, 52, 18, 5);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    // D. Slalom Gates (Gate 1 to Gate 10 coming from Top towards Player)
    gates.forEach(gate => {
      const distAhead = gate.targetDist - distanceTraveled;
      const screenY = playerScreenY - distAhead * pixelsPerMeter;

      if (screenY >= -60 && screenY <= height + 60) {
        ctx.save();
        ctx.translate(gate.x, screenY);

        // Span Cable
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-gate.width * 0.5 - 30, 0);
        ctx.lineTo(gate.width * 0.5 + 30, 0);
        ctx.stroke();

        // Gate Poles
        [-gate.width * 0.5, gate.width * 0.5].forEach(poleX => {
          ctx.fillStyle = gate.isPassed ? '#10B981' : '#FFFFFF';
          ctx.fillRect(poleX - 5, -16, 10, 32);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(poleX - 5, -8, 10, 8);
          ctx.fillRect(poleX - 5, 8, 10, 8);
        });

        // Gate Badge
        ctx.fillStyle = gate.isPassed ? '#10B981' : '#0F172A';
        ctx.strokeStyle = gate.isPassed ? '#6EE7B7' : '#FBBF24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-34, -12, 68, 24, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gate.isPassed ? '✓ PASS' : `GATE ${gate.num}`, 0, 0);

        ctx.restore();
      }
    });

    // E. Canoe & Paddler
    this.drawCanoeKayak({
      ctx,
      x: playerX,
      y: playerScreenY,
      angle: playerAngle,
      paddlePhase,
      team
    });
  }

  // Draw Canoe & Paddler
  drawCanoeKayak({ ctx, x, y, angle, paddlePhase, team }) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const primary = team ? team.primary : '#EF4444';
    const secondary = team ? team.secondary : '#FCA5A5';
    const skin = team ? team.skin : '#FCD34D';

    // Water Wake
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(-14, 62);
    ctx.lineTo(14, 62);
    ctx.closePath();
    ctx.fill();

    // Canoe Hull
    ctx.fillStyle = primary;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.bezierCurveTo(14, -20, 14, 20, 0, 38);
    ctx.bezierCurveTo(-14, 20, -14, -20, 0, -38);
    ctx.fill();
    ctx.stroke();

    // Deck Stripe
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 34);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    // Paddler Shoulders
    ctx.fillStyle = primary;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -7, 20, 14, 4);
    ctx.fill();
    ctx.stroke();

    // Helmet Head
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -1, 8, 0, Math.PI * 2);
    ctx.fill();

    // Double-blade Paddle
    const paddleTilt = Math.sin(paddlePhase) * 28;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, paddleTilt);
    ctx.lineTo(30, -paddleTilt);
    ctx.stroke();

    // Blades
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-30, paddleTilt, 6, 9, 0.4, 0, Math.PI * 2);
    ctx.ellipse(30, -paddleTilt, 6, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
