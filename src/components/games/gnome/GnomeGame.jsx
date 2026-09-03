import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PHYSICS_CONFIG,
  GNOME_CHARACTERS,
  TERRAIN_ITEM_TYPES
} from './gnomeConstants';
import {
  createTransparentSprite,
  generateGardenTerrain,
  ParticleSystem,
  drawParallaxGarden,
  drawTrebuchet,
  drawTerrainItem,
  drawGnome
} from './gnomeLogic';
import GnomeHowToPlayModal from './GnomeHowToPlayModal';
import { soundFx } from '../../../utils/audio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Trophy,
  Sparkles,
  Zap,
  Send,
  CheckCircle2,
  Users
} from 'lucide-react';
import './gnome.css';

// Base Asset Path Helper
const getAsset = (file) => `${import.meta.env.BASE_URL}assets/gnome/${file}`;

export default function GnomeGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const particleSystemRef = useRef(new ParticleSystem());

  // Image & Sprite Caches
  const assetsLoadedRef = useRef(false);
  const bgImgRef = useRef(null);
  const spriteCanvasesRef = useRef({});

  // =========================================================================
  // Stutter-Free Single-Source-of-Truth Refs for 60FPS Game Loop
  // =========================================================================
  // Game States: 'SELECT' | 'AIM_ANGLE' | 'AIM_POWER' | 'FLYING' | 'LANDED' | 'GAME_OVER'
  const gameStateRef = useRef('SELECT');
  const selectedCharRef = useRef(GNOME_CHARACTERS[0]);

  // Angle & Power Aiming
  const angleDegRef = useRef(30);
  const angleDirRef = useRef(1); // 1 = increasing, -1 = decreasing
  const powerPercentRef = useRef(0);
  const powerDirRef = useRef(1);
  const lastPhaseChangeTimeRef = useRef(0);

  // Gnome Physical State
  const gnomeRef = useRef({
    x: 80,
    y: GROUND_Y - 90,
    vx: 0,
    vy: 0,
    mass: 1.0,
    bounceCoeff: 0.75,
    drag: 0.996,
    dropSpeed: 10,
    hatColor: '#e53e3e',
    isAirDropping: false,
    isSliding: false,
    distance: 0,
    maxAltitude: 0,
    bouncesCount: 0,
    flowersPlanted: 0,
    bonusScore: 0,
  });

  // Camera State (Smooth FOV Zoom & Spring Tracking)
  const cameraXRef = useRef(0);
  const cameraYRef = useRef(0);
  const cameraZoomRef = useRef(1.0);

  // Terrain Items List
  const terrainItemsRef = useRef([]);

  // =========================================================================
  // React State for HUD & UI Overlays
  // =========================================================================
  const [gameState, setGameState] = useState('SELECT');
  const [selectedCharId, setSelectedCharId] = useState(GNOME_CHARACTERS[0].id);
  const [distance, setDistance] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // Aiming UI
  const [uiAngle, setUiAngle] = useState(30);
  const [uiPower, setUiPower] = useState(0);
  const [flowersPlanted, setFlowersPlanted] = useState(0);
  const lastFlowerXRef = useRef(0);
  const lastHudUpdateRef = useRef(0);

  // Feedback Toast & Modals
  const [toastAlert, setToastAlert] = useState(null);
  const [isMuted, setIsMuted] = useState(soundFx.muted);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Leaderboard Form State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Trigger temporary toast
  const showToast = (message) => {
    setToastAlert(message);
    setTimeout(() => {
      setToastAlert(null);
    }, 1600);
  };

  // =========================================================================
  // Load & Process Images into Transparent Sprites
  // =========================================================================
  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      // 1. Background
      const bg = new Image();
      bg.src = getAsset('bg_garden.jpg');
      bgImgRef.current = bg;

      // 2. Gnome Characters
      for (const char of GNOME_CHARACTERS) {
        const charImg = new Image();
        charImg.src = getAsset(char.spriteFile);
        charImg.onload = () => {
          if (!isMounted) return;
          const transparentCanvas = createTransparentSprite(charImg);
          spriteCanvasesRef.current[char.id] = transparentCanvas;
        };
      }
      assetsLoadedRef.current = true;
    }

    loadAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================================
  // Start Launch Sequence
  // =========================================================================
  const handleSelectCharacter = (char) => {
    selectedCharRef.current = char;
    setSelectedCharId(char.id);
  };

  const handleStartGame = () => {
    // Generate terrain
    terrainItemsRef.current = generateGardenTerrain(5500);
    particleSystemRef.current.reset();

    const char = selectedCharRef.current;
    gnomeRef.current = {
      x: 80,
      y: GROUND_Y - 90,
      vx: 0,
      vy: 0,
      mass: char.mass,
      bounceCoeff: char.bounceCoeff,
      drag: char.drag,
      dropSpeed: char.dropSpeed,
      hatColor: char.hatColor,
      isAirDropping: false,
      isSliding: false,
      distance: 0,
      maxAltitude: 0,
      bouncesCount: 0,
      flowersPlanted: 0,
      bonusScore: 0,
    };

    cameraXRef.current = 0;
    cameraYRef.current = 0;
    cameraZoomRef.current = 1.0;
    angleDegRef.current = 30;
    angleDirRef.current = 1;
    powerPercentRef.current = 0;
    powerDirRef.current = 1;
    lastPhaseChangeTimeRef.current = performance.now();
    lastFlowerXRef.current = 0;

    setUiAngle(30);
    setUiPower(0);
    setFlowersPlanted(0);

    gameStateRef.current = 'AIM_ANGLE';
    setGameState('AIM_ANGLE');
    setPlayerName('');
    setIsSubmitted(false);
    soundFx.playGnomeTension();
  };

  // =========================================================================
  // Primary Action Trigger (Spacebar / Click / Touch)
  // =========================================================================
  const handleActionInput = useCallback(() => {
    const state = gameStateRef.current;

    if (state === 'AIM_ANGLE') {
      // Lock angle, transition to power meter with clean reset
      powerPercentRef.current = 0;
      powerDirRef.current = 1;
      setUiPower(0);
      lastPhaseChangeTimeRef.current = performance.now();

      gameStateRef.current = 'AIM_POWER';
      setGameState('AIM_POWER');
      soundFx.playGnomeTension();
    } else if (state === 'AIM_POWER') {
      // Safety Debounce: Prevent instant click right after angle lock
      if (performance.now() - lastPhaseChangeTimeRef.current < 250) {
        return;
      }

      // Launch the Gnome!
      const angle = angleDegRef.current;
      const power = powerPercentRef.current / 100;
      const rad = (angle * Math.PI) / 180;

      const launchSpeed =
        PHYSICS_CONFIG.LAUNCH_POWER_MIN +
        power * (PHYSICS_CONFIG.LAUNCH_POWER_MAX - PHYSICS_CONFIG.LAUNCH_POWER_MIN);

      const isPerfect = power >= PHYSICS_CONFIG.PERFECT_POWER_THRESHOLD;

      const gnome = gnomeRef.current;
      gnome.vx = Math.cos(rad) * launchSpeed * (isPerfect ? 1.25 : 1.0);
      gnome.vy = -Math.sin(rad) * launchSpeed * (isPerfect ? 1.25 : 1.0);
      gnome.x = 90;
      gnome.y = GROUND_Y - 90;

      gameStateRef.current = 'FLYING';
      setGameState('FLYING');

      if (isPerfect) {
        soundFx.playGnomePerfectLaunch();
        showToast('🌟 PERFECT LAUNCH! 125% 무지개 부스트!');
        particleSystemRef.current.addBounceExplosion(gnome.x, gnome.y, '#ecc94b', 24);
      } else {
        soundFx.playGnomeLaunch();
        showToast(`🚀 ${Math.round(angle)}° 각도 / ${Math.round(power * 100)}% 파워 발사!`);
      }
    } else if (state === 'FLYING') {
      // Air Drop / Slam
      const gnome = gnomeRef.current;
      if (gnome.y < GROUND_Y - 30) {
        gnome.vy += gnome.dropSpeed;
        gnome.isAirDropping = true;
        soundFx.playGnomeDrop();
        particleSystemRef.current.addDiveWind(gnome.x, gnome.y);
      }
    }
  }, []);

  // Keyboard Space / Enter controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHowToPlayOpen) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleActionInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleActionInput, isHowToPlayOpen]);

  // =========================================================================
  // 30FPS Game Loop with TimeScale Normalization (50% GPU Reduction)
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const loop = (currentTime) => {
      try {
        const elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = currentTime - (elapsed % FRAME_INTERVAL);
          const dt = Math.min(elapsed / 1000, 0.08);

          const state = gameStateRef.current;
          const gnome = gnomeRef.current;
          const particles = particleSystemRef.current;

      // 1. AIM_ANGLE Update
      if (state === 'AIM_ANGLE') {
        const speed = 48; // deg per sec
        angleDegRef.current += angleDirRef.current * speed * dt;
        if (angleDegRef.current >= PHYSICS_CONFIG.MAX_LAUNCH_ANGLE) {
          angleDegRef.current = PHYSICS_CONFIG.MAX_LAUNCH_ANGLE;
          angleDirRef.current = -1;
        } else if (angleDegRef.current <= PHYSICS_CONFIG.MIN_LAUNCH_ANGLE) {
          angleDegRef.current = PHYSICS_CONFIG.MIN_LAUNCH_ANGLE;
          angleDirRef.current = 1;
        }
        setUiAngle(Math.round(angleDegRef.current));
      }

      // 2. AIM_POWER Update
      if (state === 'AIM_POWER') {
        const speed = 140; // percent per sec
        powerPercentRef.current += powerDirRef.current * speed * dt;
        if (powerPercentRef.current >= 100) {
          powerPercentRef.current = 100;
          powerDirRef.current = -1;
        } else if (powerPercentRef.current <= 0) {
          powerPercentRef.current = 0;
          powerDirRef.current = 1;
        }
        setUiPower(Math.round(powerPercentRef.current));
      }

      // 3. FLYING Physics Simulation
      if (state === 'FLYING') {
        const timeScale = Math.min(2.5, Math.max(0.2, dt / 16.666));

        // Position update with timeScale
        gnome.x += gnome.vx * timeScale;
        gnome.y += gnome.vy * timeScale;

        // Gravity & Drag with timeScale
        gnome.vy += PHYSICS_CONFIG.GRAVITY * gnome.mass * timeScale;
        gnome.vx *= Math.pow(gnome.drag, timeScale);
        gnome.vy *= Math.pow(gnome.drag, timeScale);

        // Velocity Soft Clamping (Prevents motion sickness / visual tearing)
        gnome.vx = Math.min(PHYSICS_CONFIG.MAX_HORIZONTAL_SPEED, Math.max(-10, gnome.vx));
        gnome.vy = Math.min(PHYSICS_CONFIG.MAX_VERTICAL_SPEED, Math.max(-PHYSICS_CONFIG.MAX_VERTICAL_SPEED, gnome.vy));

        // Current metrics
        const currentMeters = Math.max(0, Math.round(gnome.x / 10));
        const currentAlt = Math.max(0, Math.round((GROUND_Y - gnome.y) / 10));
        const currentSpeed = Math.round(Math.sqrt(gnome.vx * gnome.vx + gnome.vy * gnome.vy) * 4.2);

        gnome.distance = currentMeters;
        if (currentAlt > gnome.maxAltitude) {
          gnome.maxAltitude = currentAlt;
        }

        // Particle trail
        if (Math.abs(gnome.vx) > 12) {
          particles.addRainbowTrail(gnome.x, gnome.y);
        }

        // --- Interactive Terrain Collision Detection (Generous Hitbox & Dynamic Combos) ---
        const nowTime = currentTime;
        for (const item of terrainItemsRef.current) {
          if (!item.active) continue;
          if (item.lastHitTime && nowTime - item.lastHitTime < 280) continue;

          const isGroundItem =
            item.type === 'MUSHROOM' ||
            item.type === 'TRAMPOLINE' ||
            item.type === 'LOG' ||
            item.type === 'SUNFLOWER';

          const itemCenterX = item.x + item.width / 2;
          const itemCenterY = item.y + item.height / 2;

          let hit = false;
          if (isGroundItem) {
            // Ground Item: reliably triggers when gnome is near ground and item horizontally
            if (
              gnome.y >= GROUND_Y - 55 &&
              Math.abs(gnome.x - itemCenterX) < (item.width / 2 + 28)
            ) {
              hit = true;
            }
          } else {
            // Sky Item: generous radial collision zone (40~50px)
            const dx = gnome.x - itemCenterX;
            const dy = gnome.y - itemCenterY;
            const hitRadius = item.width / 2 + 36;
            if (dx * dx + dy * dy < hitRadius * hitRadius) {
              hit = true;
            }
          }

          if (hit) {
            item.lastHitTime = nowTime;
            const data = item.data;

            if (item.type === 'MUSHROOM') {
              gnome.vy = data.bounceBoostY;
              gnome.vx = Math.max(gnome.vx * data.bounceBoostX, 14);
              gnome.bouncesCount += 1;
              gnome.bonusScore += data.points;
              gnome.isAirDropping = false;
              soundFx.playGnomeMushroomBounce();
              showToast(data.message);
              particles.addBounceExplosion(itemCenterX, item.y, '#e53e3e', 22);
            } else if (item.type === 'TRAMPOLINE') {
              gnome.vy = data.bounceBoostY;
              gnome.vx = Math.max(gnome.vx * data.bounceBoostX, 16);
              gnome.bouncesCount += 1;
              gnome.bonusScore += data.points;
              gnome.isAirDropping = false;
              soundFx.playGnomeCloudBounce();
              showToast(data.message);
              particles.addBounceExplosion(itemCenterX, item.y, '#48bb78', 24);
            } else if (item.type === 'LOG') {
              gnome.vy = data.bounceBoostY;
              gnome.vx = Math.max(gnome.vx * data.bounceBoostX, data.minSpeedX);
              gnome.bouncesCount += 1;
              gnome.bonusScore += data.points;
              gnome.isAirDropping = false;
              soundFx.playGnomeLogBoost();
              showToast(data.message);
              particles.addLogSparks(itemCenterX, item.y, 16);
            } else if (item.type === 'SUNFLOWER') {
              gnome.vx = Math.max(gnome.vx * 1.05, 13);
              gnome.vy = -4;
              gnome.bonusScore += data.points;
              soundFx.playGnomeFlowerSeed();
              showToast(data.message);
              particles.addFlower(item.x, item.y + 10, '#ecc94b');
            } else if (item.type === 'CLOUD') {
              gnome.vy = data.bounceBoostY;
              gnome.vx = Math.max(gnome.vx * data.bounceBoostX, 12);
              gnome.bonusScore += data.points;
              soundFx.playGnomeCloudBounce();
              showToast(data.message);
              particles.addBounceExplosion(itemCenterX, item.y, '#63b3ed', 18);
            } else if (item.type === 'RAINBOW') {
              gnome.vy = data.bounceBoostY;
              gnome.vx += data.boostSpeedX;
              gnome.bonusScore += data.points;
              soundFx.playGnomeRainbowBoost();
              showToast(data.message);
              particles.addRainbowTrail(item.x, item.y);
            } else if (item.type === 'BUTTERFLY_SWARM') {
              gnome.vy = data.bounceBoostY;
              gnome.vx += data.boostSpeedX;
              gnome.bonusScore += data.points;
              soundFx.playGnomeRainbowBoost();
              showToast(data.message);
              particles.addRainbowTrail(item.x, item.y);
            } else if (item.type === 'SEED') {
              item.active = false;
              gnome.bonusScore += data.points;
              soundFx.playGnomeFlowerSeed();
              particles.addBounceExplosion(item.x, item.y, '#ecc94b', 8);
            }
          }
        }

        // --- Ground Collision & Bounce ---
        if (gnome.y >= GROUND_Y - 24) {
          gnome.y = GROUND_Y - 24;
          gnome.isAirDropping = false;

          // Continuous Flower Planting along the ground turf
          if (gnome.x - lastFlowerXRef.current >= 15) {
            lastFlowerXRef.current = gnome.x;
            particles.addFlower(gnome.x, GROUND_Y - 4);
            gnome.flowersPlanted += 1;
            soundFx.playGnomeFlowerSeed();
          }

          if (Math.abs(gnome.vy) > 2.5) {
            // Bounce up
            gnome.vy = -gnome.vy * gnome.bounceCoeff;
            gnome.vx *= 0.88;
            gnome.bouncesCount += 1;
            soundFx.playGnomeLand();
            particles.addBounceExplosion(gnome.x, GROUND_Y - 4, '#48bb78', 8);
          } else {
            // Sliding along the ground with steady turf deceleration
            gnome.vy = 0;
            gnome.vx *= Math.pow(0.86, timeScale);
            gnome.vx = Math.max(0, gnome.vx - 0.35 * timeScale);

            // Full Stop Detection
            if (gnome.vx <= 0.6) {
              gnome.vx = 0;
              gameStateRef.current = 'GAME_OVER';
              setGameState('GAME_OVER');

              const finalScore = gnome.distance + gnome.bonusScore + gnome.flowersPlanted * 5;
              setTotalScore(finalScore);

              soundFx.playGnomeCelebration();
              showToast('🏆 멋진 비행 완료! 꽃밭이 완성되었습니다!');
            }
          }
        }

        // Dynamic Camera Zoom Calculation based on Speed & Altitude
        const speedRatio = Math.min(1, Math.abs(gnome.vx) / PHYSICS_CONFIG.MAX_HORIZONTAL_SPEED);
        const altRatio = Math.min(1, Math.max(0, -gnome.y) / 800);
        const targetZoom = Math.max(
          PHYSICS_CONFIG.MIN_CAMERA_ZOOM,
          1.0 - (speedRatio * 0.16 + altRatio * 0.10)
        );
        cameraZoomRef.current += (targetZoom - cameraZoomRef.current) * Math.min(1, 0.06 * timeScale);

        // Sync React HUD (Throttled to 75ms to remove CPU lag on Chromebooks)
        if (currentTime - lastHudUpdateRef.current > 75) {
          lastHudUpdateRef.current = currentTime;
          setDistance(gnome.distance);
          setAltitude(currentAlt);
          setSpeedKmh(currentSpeed);
          setBonusScore(gnome.bonusScore);
          setFlowersPlanted(gnome.flowersPlanted);
        }
      } else {
        // Reset zoom smoothly when not flying
        cameraZoomRef.current += (1.0 - cameraZoomRef.current) * 0.08;
      }

      // 4. Smooth Dynamic Camera Tracking with Forward Look-Ahead & Spring Damping
      const currentGnomeVx = gameStateRef.current === 'FLYING' ? gnomeRef.current.vx : 0;
      const forwardLookAhead = Math.min(currentGnomeVx * 4.0, 120);
      const targetCamX = Math.max(0, gnomeRef.current.x + forwardLookAhead - 260);
      const targetCamY = Math.min(0, gnomeRef.current.y - 230);
      cameraXRef.current += (targetCamX - cameraXRef.current) * 0.10;
      cameraYRef.current += (targetCamY - cameraYRef.current) * 0.10;

      // 5. Update Particles
      particles.update();

      // 6. Draw Canvas Frame with Dynamic Camera Zoom Scaling
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      const curZoom = cameraZoomRef.current;
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.scale(curZoom, curZoom);
      ctx.translate(-CANVAS_WIDTH / 2, -CANVAS_HEIGHT / 2);

      // Draw Multi-layer Parallax Garden Background
      drawParallaxGarden(ctx, cameraXRef.current, cameraYRef.current, bgImgRef.current);

      // Draw Trebuchet
      drawTrebuchet(
        ctx,
        cameraXRef.current,
        cameraYRef.current,
        angleDegRef.current,
        powerPercentRef.current / 100
      );

      // Draw Terrain Items
      for (const item of terrainItemsRef.current) {
        drawTerrainItem(ctx, item, cameraXRef.current, cameraYRef.current);
      }

      // Draw Planted Flowers & Dynamic Particles
      particles.draw(ctx, cameraXRef.current, cameraYRef.current);

      // Draw Gnome Character
      const spriteCanvas = spriteCanvasesRef.current[selectedCharRef.current.id];
      drawGnome(
        ctx,
        gnomeRef.current,
        spriteCanvas,
        gnomeRef.current.isAirDropping,
        cameraXRef.current,
        cameraYRef.current
      );

      ctx.restore();
        }
      } catch (err) {
        console.error('[Gnome Loop Error]', err);
      } finally {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    lastRenderTime = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // =========================================================================
  // Hall of Fame Leaderboard Submission
  // =========================================================================
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('gnome', playerName.trim(), totalScore);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="gnome-game-container">
      {/* Header Bar */}
      <div className="gnome-header">
        <div className="gnome-title-wrap">
          <span className="gnome-logo-icon">🌿</span>
          <h1 className="gnome-main-title">도촌 정원 요정 (Garden Gnomes)</h1>
        </div>
        <div className="gnome-actions">
          <button
            className="gnome-btn-icon"
            onClick={() => setIsHowToPlayOpen(true)}
            title="게임 가이드 및 조작법"
          >
            <HelpCircle style={{ width: '20px', height: '20px' }} />
          </button>
          <button
            className="gnome-btn-icon"
            onClick={toggleSound}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? (
              <VolumeX style={{ width: '20px', height: '20px', color: '#f56565' }} />
            ) : (
              <Volume2 style={{ width: '20px', height: '20px', color: '#68d391' }} />
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="gnome-canvas-wrapper" onClick={handleActionInput}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="gnome-canvas"
        />

        {/* Top HUD Banner (During Flight) */}
        {gameState === 'FLYING' && (
          <div className="gnome-hud-top">
            <div className="gnome-hud-stat-pill">
              <span className="gnome-hud-stat-label">비행 거리</span>
              <span className="gnome-hud-stat-value">{distance} m</span>
            </div>
            <div className="gnome-hud-stat-pill">
              <span className="gnome-hud-stat-label">고도</span>
              <span className="gnome-hud-stat-value green">{altitude} m</span>
            </div>
            <div className="gnome-hud-stat-pill">
              <span className="gnome-hud-stat-label">속도</span>
              <span className="gnome-hud-stat-value pink">{speedKmh} km/h</span>
            </div>
            <div className="gnome-hud-stat-pill">
              <span className="gnome-hud-stat-label">🌸 심은 꽃</span>
              <span className="gnome-hud-stat-value purple">{flowersPlanted} 송이</span>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastAlert && <div className="gnome-toast-alert">{toastAlert}</div>}

        {/* Aiming Step 1: Angle Meter */}
        {gameState === 'AIM_ANGLE' && (
          <div className="gnome-aim-overlay">
            <div className="gnome-meter-header">
              <div className="gnome-meter-title">
                <span>📐 발사 각도 조절: {uiAngle}°</span>
              </div>
              <div
                className={`gnome-meter-status-tag ${
                  uiAngle >= 42 && uiAngle <= 52 ? 'golden' : ''
                }`}
              >
                {uiAngle >= 42 && uiAngle <= 52 ? '🎯 황금 각도!' : '각도 조절 중...'}
              </div>
            </div>

            <div className="gnome-meter-bar-track">
              <div className="gnome-meter-bar-fill-container">
                <div
                  className="gnome-meter-bar-fill"
                  style={{
                    width: `${((uiAngle - PHYSICS_CONFIG.MIN_LAUNCH_ANGLE) / (PHYSICS_CONFIG.MAX_LAUNCH_ANGLE - PHYSICS_CONFIG.MIN_LAUNCH_ANGLE)) * 100}%`
                  }}
                />
              </div>

              {/* Ticks */}
              <div className="gnome-meter-tick" style={{ left: '25%' }} />
              <div className="gnome-meter-tick" style={{ left: '50%' }} />
              <div className="gnome-meter-tick" style={{ left: '75%' }} />

              {/* Real-time Oscillating Needle */}
              <div
                className="gnome-meter-needle"
                style={{
                  left: `${((uiAngle - PHYSICS_CONFIG.MIN_LAUNCH_ANGLE) / (PHYSICS_CONFIG.MAX_LAUNCH_ANGLE - PHYSICS_CONFIG.MIN_LAUNCH_ANGLE)) * 100}%`
                }}
              />
            </div>

            <div className="gnome-meter-action-hint">
              <kbd>Space</kbd> 또는 화면을 클릭하여 각도 확정!
            </div>
          </div>
        )}

        {/* Aiming Step 2: Power Meter */}
        {gameState === 'AIM_POWER' && (
          <div className="gnome-aim-overlay">
            <div className="gnome-meter-header">
              <div className="gnome-meter-title">
                <span>⚡ 발사 파워 충전: {uiPower}%</span>
              </div>
              <div
                className={`gnome-meter-status-tag ${
                  uiPower >= 92 ? 'perfect' : uiPower >= 75 ? 'golden' : ''
                }`}
              >
                {uiPower >= 92
                  ? '🌟 PERFECT! (125%)'
                  : uiPower >= 75
                  ? '🔥 슈퍼 파워'
                  : uiPower >= 40
                  ? '⚡ 부스트 파워'
                  : '🟢 기본 파워'}
              </div>
            </div>

            <div className="gnome-meter-bar-track">
              <div className="gnome-meter-bar-fill-container">
                <div
                  className="gnome-meter-bar-fill"
                  style={{ width: `${uiPower}%` }}
                />
              </div>

              {/* Ticks */}
              <div className="gnome-meter-tick" style={{ left: '25%' }} />
              <div className="gnome-meter-tick" style={{ left: '50%' }} />
              <div className="gnome-meter-tick" style={{ left: '75%' }} />

              {/* Perfect Zone */}
              <div className="gnome-meter-perfect-zone">PERFECT</div>

              {/* Real-time Oscillating Needle */}
              <div
                className="gnome-meter-needle"
                style={{ left: `${uiPower}%` }}
              />
            </div>

            <div className="gnome-meter-action-hint">
              <kbd>Space</kbd> 또는 화면을 클릭하여 완벽한 타이밍에 발사!
            </div>
          </div>
        )}

        {/* Character Selection Screen */}
        {gameState === 'SELECT' && (
          <div className="gnome-select-overlay" onClick={(e) => e.stopPropagation()}>
            <h2 className="gnome-select-title">정원 요정을 선택하세요</h2>
            <p className="gnome-select-subtitle">요정마다 고유한 무게, 탄성 및 비행 능력을 가지고 있습니다.</p>

            <div className="gnome-cards-grid">
              {GNOME_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  className={`gnome-select-card ${selectedCharId === char.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCharacter(char)}
                >
                  <span className="gnome-card-badge">{char.avatarBadge}</span>
                  <span className="gnome-card-name">{char.name}</span>
                  <span className="gnome-card-sub" style={{ color: char.hatColor }}>
                    {char.subtitle}
                  </span>
                  <p className="gnome-card-desc">{char.description}</p>

                  <div className="gnome-card-stats-mini">
                    <div className="gnome-mini-stat">
                      <span>파워</span>
                      <div className="gnome-mini-stat-bar">
                        <div
                          className="gnome-mini-stat-fill"
                          style={{ width: `${char.stats.power}%`, background: '#f56565' }}
                        />
                      </div>
                    </div>
                    <div className="gnome-mini-stat">
                      <span>탄성</span>
                      <div className="gnome-mini-stat-bar">
                        <div
                          className="gnome-mini-stat-fill"
                          style={{ width: `${char.stats.bounce}%`, background: '#ecc94b' }}
                        />
                      </div>
                    </div>
                    <div className="gnome-mini-stat">
                      <span>활공</span>
                      <div className="gnome-mini-stat-bar">
                        <div
                          className="gnome-mini-stat-fill"
                          style={{ width: `${char.stats.glide}%`, background: '#48bb78' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="gnome-start-launch-btn" onClick={handleStartGame}>
              투석기 장착 & 발사 준비 완료 🎯
            </button>
          </div>
        )}

        {/* Game Over / Results Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="gnome-results-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="gnome-results-box">
              <div className="gnome-results-title">
                <Trophy style={{ width: '28px', height: '28px', color: '#ecc94b' }} />
                <span>비행 기록 달성!</span>
              </div>

              <div className="gnome-results-dist-hero">
                <span className="gnome-results-dist-num">{distance}</span>
                <span className="gnome-results-dist-unit">m</span>
              </div>

              <div className="gnome-results-grid">
                <div className="gnome-res-item">
                  <div className="gnome-res-label">최고 고도</div>
                  <div className="gnome-res-val">{gnomeRef.current.maxAltitude} m</div>
                </div>
                <div className="gnome-res-item">
                  <div className="gnome-res-label">바운스 횟수</div>
                  <div className="gnome-res-val">{gnomeRef.current.bouncesCount} 회</div>
                </div>
                <div className="gnome-res-item">
                  <div className="gnome-res-label">심은 꽃</div>
                  <div className="gnome-res-val">{gnomeRef.current.flowersPlanted} 송이</div>
                </div>
              </div>

              {/* Hall of Fame Form (STRICT RULE: Only show when score > 100) */}
              {totalScore > 100 && (
                <form className="gnome-leaderboard-form" onSubmit={handleSubmitScore}>
                  <div className="gnome-form-title">
                    <Sparkles style={{ width: '15px', height: '15px' }} />
                    <span>명예의 전당 등록 (최종 점수: {totalScore}점)</span>
                  </div>
                  {isSubmitted ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#68d391',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                      <span>명예의 전당에 성공적으로 등록되었습니다!</span>
                    </div>
                  ) : (
                    <div className="gnome-form-row">
                      <input
                        type="text"
                        className="gnome-name-input"
                        placeholder="예: 홍길동"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        maxLength={10}
                        required
                      />
                      <button
                        type="submit"
                        className="gnome-submit-score-btn"
                        disabled={isSubmitting || !playerName.trim()}
                      >
                        <Send style={{ width: '14px', height: '14px' }} />
                        <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Action Buttons */}
              <div className="gnome-res-actions">
                <button
                  className="gnome-btn-action primary"
                  onClick={handleStartGame}
                >
                  <RotateCcw style={{ width: '18px', height: '18px' }} />
                  <span>다시 날리기</span>
                </button>
                <button
                  className="gnome-btn-action secondary"
                  onClick={() => {
                    gameStateRef.current = 'SELECT';
                    setGameState('SELECT');
                  }}
                >
                  <Users style={{ width: '18px', height: '18px' }} />
                  <span>요정 변경</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How to Play Guide Modal */}
      <GnomeHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
