import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PAN_CENTER_X,
  PAN_CENTER_Y,
  PAN_RADIUS,
  PLAYER_CLASSES,
  STAGE_CONFIGS,
  ITEM_TYPES,
  GRAZE_DISTANCE,
  GRAZE_SCORE
} from './popcornConstants';
import {
  soundManager,
  Particle,
  Bullet,
  GameItem,
  createRingPattern,
  createSpiralPattern,
  createAimedSpread,
  clampToPanArena,
  generateRandomItem
} from './popcornLogic';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import PopcornHowToPlayModal from './PopcornHowToPlayModal';
import './popcorn.css';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Trophy,
  Flame,
  Award,
  Crown,
  Play,
  Pause
} from 'lucide-react';

export default function PopcornGame({ onScoreSubmitted }) {
  // Game Setup & Selection
  const [selectedClass, setSelectedClass] = useState(PLAYER_CLASSES.KNIGHT);
  const [gameState, setGameState] = useState('select'); // 'select' | 'playing' | 'paused' | 'gameover' | 'victory'
  const [isMuted, setIsMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // HUD & Game Metrics
  const [score, setScore] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [hp, setHp] = useState(PLAYER_CLASSES.KNIGHT.maxHp);
  const [maxHp, setMaxHp] = useState(PLAYER_CLASSES.KNIGHT.maxHp);
  const [survivalSeconds, setSurvivalSeconds] = useState(0);
  const [grazeCount, setGrazeCount] = useState(0);
  const [skillCooldownRemaining, setSkillCooldownRemaining] = useState(0);
  const [isSkillActive, setIsSkillActive] = useState(false);
  const [bossInfo, setBossInfo] = useState({ active: false, name: '', hp: 100, maxHp: 100 });

  // Leaderboard Submission
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Refs for Game Loop & Physics
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const keysPressed = useRef({});
  const isTouchDragging = useRef(false);

  // Game Engine Entities (Stored in Refs for 60fps performance)
  const playerRef = useRef({
    x: PAN_CENTER_X,
    y: PAN_CENTER_Y + 100,
    radius: 20,
    vx: 0,
    vy: 0,
    invincibleTimer: 0,
    skillActiveTimer: 0,
    lastSkillUsed: 0
  });

  const bulletsRef = useRef([]);
  const itemsRef = useRef([]);
  const particlesRef = useRef([]);
  const bossRef = useRef({
    active: false,
    type: null,
    x: PAN_CENTER_X,
    y: PAN_CENTER_Y - 90,
    radius: 38,
    hp: 100,
    maxHp: 100,
    angle: 0,
    moveTimer: 0,
    shootTimer: 0
  });

  const stageTimerRef = useRef(0);
  const lastItemSpawnRef = useRef(0);
  const freezeTimerRef = useRef(0);
  const spiralAngleRef = useRef(0);

  // Preload Asset Images
  const imagesRef = useRef({});

  useEffect(() => {
    soundManager.init();
    const assets = {
      bgPan: '/assets/popcorn/bg_pan.jpg',
      cornIdle: '/assets/popcorn/corn_idle.jpg',
      cornShield: '/assets/popcorn/corn_shield.jpg',
      cornHeal: '/assets/popcorn/corn_heal.jpg',
      cornPopped: '/assets/popcorn/corn_popped.jpg',
      bossButter: '/assets/popcorn/boss_butter.jpg',
      bossFlame: '/assets/popcorn/boss_flame.jpg'
    };

    Object.entries(assets).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      imagesRef.current[key] = img;
    });
  }, []);

  // Handle Mute Toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;

      if (e.code === 'Space' && gameState === 'playing') {
        activateSkill();
      }
      if ((e.code === 'KeyP' || e.code === 'Escape') && (gameState === 'playing' || gameState === 'paused')) {
        setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'));
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, selectedClass]);

  // Start / Restart Game
  const startGame = (classConfig = selectedClass) => {
    soundManager.init();
    setSelectedClass(classConfig);
    setGameState('playing');
    setScore(0);
    setStageIndex(0);
    setHp(classConfig.maxHp);
    setMaxHp(classConfig.maxHp);
    setSurvivalSeconds(0);
    setGrazeCount(0);
    setSkillCooldownRemaining(0);
    setIsSkillActive(false);
    setSubmitSuccess(false);
    setPlayerName('');

    playerRef.current = {
      x: PAN_CENTER_X,
      y: PAN_CENTER_Y + 100,
      radius: 20,
      vx: 0,
      vy: 0,
      invincibleTimer: 60, // 1 second initial spawn invincibility
      skillActiveTimer: 0,
      lastSkillUsed: -999999
    };

    bulletsRef.current = [];
    itemsRef.current = [];
    particlesRef.current = [];
    stageTimerRef.current = 0;
    lastItemSpawnRef.current = Date.now();
    freezeTimerRef.current = 0;
    spiralAngleRef.current = 0;

    initStage(0);
  };

  // Initialize Stage
  const initStage = (idx) => {
    const stageCfg = STAGE_CONFIGS[idx];
    stageTimerRef.current = 0;
    bulletsRef.current = [];

    if (stageCfg.targetBoss) {
      const bName =
        stageCfg.targetBoss === 'butter'
          ? '🧈 버터 킹 (Butter King)'
          : stageCfg.targetBoss === 'flame'
          ? '🔥 화염 정령 (Flame Spirit)'
          : '⚡ 인페르노 듀얼 (Inferno Duo)';

      bossRef.current = {
        active: true,
        type: stageCfg.targetBoss,
        name: bName,
        x: PAN_CENTER_X,
        y: PAN_CENTER_Y - 90,
        radius: 40,
        hp: stageCfg.bossHp,
        maxHp: stageCfg.bossHp,
        angle: 0,
        moveTimer: 0,
        shootTimer: 0
      };
      setBossInfo({ active: true, name: bName, hp: stageCfg.bossHp, maxHp: stageCfg.bossHp });
      soundManager.playBossRoar();
    } else {
      bossRef.current.active = false;
      setBossInfo({ active: false, name: '', hp: 0, maxHp: 0 });
    }
  };

  // Direct Touch / Drag Movement on Canvas
  const handleTouchMove = (e) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    if (!touch) return;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const targetX = (touch.clientX - rect.left) * scaleX;
    const targetY = (touch.clientY - rect.top) * scaleY;

    const clamped = clampToPanArena(targetX, targetY, playerRef.current.radius);
    playerRef.current.x = clamped.x;
    playerRef.current.y = clamped.y;
  };

  // Skill Trigger
  const activateSkill = () => {
    const now = Date.now();
    const cooldown = selectedClass.skillCooldown;
    if (now - playerRef.current.lastSkillUsed < cooldown) return;

    playerRef.current.lastSkillUsed = now;
    playerRef.current.skillActiveTimer = selectedClass.skillDuration / 16.6;

    if (selectedClass.id === 'knight') {
      soundManager.playShield();
      for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 * i) / 24;
        particlesRef.current.push(
          new Particle(
            playerRef.current.x + Math.cos(angle) * 30,
            playerRef.current.y + Math.sin(angle) * 30,
            Math.cos(angle) * 2,
            Math.sin(angle) * 2,
            '#38BDF8',
            4,
            30,
            30
          )
        );
      }
    } else if (selectedClass.id === 'wizard') {
      soundManager.playHeal();
      setHp(prev => Math.min(maxHp, prev + 1));
      const clearRadius = 220;
      bulletsRef.current = bulletsRef.current.filter(b => {
        const dist = Math.hypot(b.x - playerRef.current.x, b.y - playerRef.current.y);
        return dist > clearRadius;
      });
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        particlesRef.current.push(
          new Particle(
            playerRef.current.x,
            playerRef.current.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#F472B6',
            6,
            40,
            40,
            'heart'
          )
        );
      }
    } else if (selectedClass.id === 'runner') {
      soundManager.playDash();
      playerRef.current.invincibleTimer = selectedClass.skillDuration / 16.6;
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();
    let secondAcc = 0;

    const loop = (currentTime) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Update seconds & Survival Score
      secondAcc += dt;
      if (secondAcc >= 1.0) {
        secondAcc -= 1.0;
        setSurvivalSeconds(s => s + 1);
        setScore(sc => sc + 25);
        stageTimerRef.current += 1;
      }

      // Update Skill Cooldown HUD
      const now = Date.now();
      const timeSinceSkill = now - playerRef.current.lastSkillUsed;
      const cdRemaining = Math.max(0, selectedClass.skillCooldown - timeSinceSkill);
      setSkillCooldownRemaining(cdRemaining);
      setIsSkillActive(playerRef.current.skillActiveTimer > 0);

      // 1. Process Freeze / Speed Multiplier
      let bulletSpeedMult = 1.0;
      if (freezeTimerRef.current > 0) {
        freezeTimerRef.current -= dt * 1000;
        bulletSpeedMult = 0.5;
      }

      // 2. Update Player Keyboard Movement (if not touch dragging)
      if (!isTouchDragging.current) {
        const player = playerRef.current;
        let moveSpeed = selectedClass.speed;
        if (selectedClass.id === 'runner' && player.skillActiveTimer > 0) {
          moveSpeed *= 1.7;
        }

        let dx = 0;
        let dy = 0;
        if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) dy -= 1;
        if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) dy += 1;
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) dx -= 1;
        if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        player.x += dx * moveSpeed;
        player.y += dy * moveSpeed;

        const clamped = clampToPanArena(player.x, player.y, player.radius);
        player.x = clamped.x;
        player.y = clamped.y;
      }

      const player = playerRef.current;
      if (player.invincibleTimer > 0) player.invincibleTimer--;
      if (player.skillActiveTimer > 0) player.skillActiveTimer--;

      // 3. Stage & Boss Logic
      const currentStageCfg = STAGE_CONFIGS[stageIndex];
      const stageDuration = currentStageCfg.duration;

      // Check Stage Progression
      if (stageTimerRef.current >= stageDuration) {
        if (stageIndex + 1 < STAGE_CONFIGS.length) {
          const nextIdx = stageIndex + 1;
          setStageIndex(nextIdx);
          initStage(nextIdx);
          soundManager.playVictory();
          setScore(sc => sc + 1000);
        } else {
          soundManager.playVictory();
          setGameState('victory');
          return;
        }
      }

      // Boss Patterns & Spawning
      const boss = bossRef.current;
      if (boss.active) {
        boss.angle += 0.025;
        boss.x = PAN_CENTER_X + Math.sin(boss.angle) * 85;
        boss.y = PAN_CENTER_Y - 90 + Math.cos(boss.angle * 1.4) * 25;

        boss.shootTimer += dt * 1000;
        if (boss.shootTimer >= currentStageCfg.spawnInterval) {
          boss.shootTimer = 0;
          soundManager.playPop();

          if (boss.type === 'butter') {
            const spread = createAimedSpread(boss.x, boss.y, player.x, player.y, 5, Math.PI / 3, currentStageCfg.bulletSpeed, 'butter');
            bulletsRef.current.push(...spread);
          } else if (boss.type === 'flame') {
            spiralAngleRef.current += 0.38;
            const spiral = createSpiralPattern(boss.x, boss.y, spiralAngleRef.current, 6, currentStageCfg.bulletSpeed, 'flame');
            bulletsRef.current.push(...spiral);
          } else if (boss.type === 'dual') {
            const rings = createRingPattern(boss.x, boss.y, 10, currentStageCfg.bulletSpeed * 0.9, 'butter');
            const flameSpread = createAimedSpread(boss.x, boss.y, player.x, player.y, 4, Math.PI / 4, currentStageCfg.bulletSpeed * 1.1, 'flame');
            bulletsRef.current.push(...rings, ...flameSpread);
          }
        }
      } else {
        // Stage 1 Perimeter Ring Waves
        spiralAngleRef.current += 0.03;
        if (Math.random() < 0.05) {
          const ring = createRingPattern(PAN_CENTER_X, PAN_CENTER_Y - 40, 8, currentStageCfg.bulletSpeed, 'butter');
          bulletsRef.current.push(...ring);
        }
      }

      // 4. Random Item Spawning
      if (Date.now() - lastItemSpawnRef.current > 7000) {
        lastItemSpawnRef.current = Date.now();
        itemsRef.current.push(generateRandomItem());
      }

      // 5. Update Items
      itemsRef.current = itemsRef.current.filter(item => {
        if (item.isExpired()) return false;
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < player.radius + item.radius) {
          soundManager.playItem();
          setScore(sc => sc + item.type.score);
          if (item.type.id === 'heart') {
            setHp(h => Math.min(maxHp, h + 1));
          } else if (item.type.id === 'ice') {
            freezeTimerRef.current = item.type.freezeTime;
          }
          return false;
        }
        return true;
      });

      // 6. Update Bullets & Collisions
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.update(bulletSpeedMult);
        if (b.isOutOfBounds()) return false;

        const dist = Math.hypot(b.x - player.x, b.y - player.y);

        // Check Shield Reflection
        if (selectedClass.id === 'knight' && player.skillActiveTimer > 0) {
          if (dist < player.radius + b.radius + 18) {
            soundManager.playShield();
            setScore(sc => sc + 50);
            b.vx = -b.vx * 1.2;
            b.vy = -b.vy * 1.2;
            b.color = '#38BDF8';
            return true;
          }
        }

        // Check Graze (Near Miss)
        if (!b.grazed && dist < player.radius + b.radius + GRAZE_DISTANCE && dist >= player.radius + b.radius) {
          b.grazed = true;
          setGrazeCount(g => g + 1);
          setScore(sc => sc + GRAZE_SCORE);
          soundManager.playGraze();
          particlesRef.current.push(
            new Particle(player.x, player.y, 0, -1, '#FBBF24', 3, 20, 20, 'circle')
          );
        }

        // Check Hit with Player
        if (dist < player.radius + b.radius) {
          if (player.invincibleTimer <= 0) {
            soundManager.playHit();
            setHp(currHp => {
              const newHp = currHp - b.damage;
              if (newHp <= 0) {
                soundManager.playGameOver();
                setGameState('gameover');
              }
              return Math.max(0, newHp);
            });
            player.invincibleTimer = 45;

            for (let i = 0; i < 15; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 3;
              particlesRef.current.push(
                new Particle(player.x, player.y, Math.cos(angle) * spd, Math.sin(angle) * spd, '#EF4444', 4, 25, 25)
              );
            }
            return false;
          }
        }

        return true;
      });

      // 7. Update Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.update();
        return p.life > 0;
      });

      // 8. RENDER CANVAS SCENE
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render Pan Background
      if (imagesRef.current.bgPan && imagesRef.current.bgPan.complete) {
        ctx.drawImage(imagesRef.current.bgPan, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        ctx.fillStyle = '#1E1B4B';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.beginPath();
        ctx.arc(PAN_CENTER_X, PAN_CENTER_Y, PAN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#F59E0B';
        ctx.stroke();
      }

      // Draw Pan Arena Boundary Glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(PAN_CENTER_X, PAN_CENTER_Y, PAN_RADIUS, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = freezeTimerRef.current > 0 ? '#38BDF8' : '#F97316';
      ctx.shadowColor = freezeTimerRef.current > 0 ? '#0284C7' : '#EA580C';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();

      // Render Items
      itemsRef.current.forEach(item => item.draw(ctx));

      // Render Boss
      if (boss.active) {
        ctx.save();
        let bossImg = boss.type === 'butter' ? imagesRef.current.bossButter : imagesRef.current.bossFlame;
        if (bossImg && bossImg.complete) {
          ctx.beginPath();
          ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(bossImg, boss.x - boss.radius, boss.y - boss.radius, boss.radius * 2, boss.radius * 2);
        } else {
          ctx.beginPath();
          ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
          ctx.fillStyle = boss.type === 'butter' ? '#F59E0B' : '#EF4444';
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Bullets
      bulletsRef.current.forEach(b => b.draw(ctx));

      // Render Particles
      particlesRef.current.forEach(p => p.draw(ctx));

      // Render Player Kernel
      ctx.save();
      if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 4) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Shield Aura
      if (selectedClass.id === 'knight' && player.skillActiveTimer > 0) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#38BDF8';
        ctx.shadowColor = '#0284C7';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      // Player Sprite
      let pImg = imagesRef.current.cornIdle;
      if (selectedClass.id === 'knight') pImg = imagesRef.current.cornShield;
      if (selectedClass.id === 'wizard') pImg = imagesRef.current.cornHeal;

      if (pImg && pImg.complete) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pImg, player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FBBF24';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#D97706';
        ctx.stroke();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, selectedClass, stageIndex, maxHp]);

  // Handle Score Submission for Hall of Fame
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || score <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('popcorn', playerName.trim(), score);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit popcorn score:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="popcorn-container">
      {/* Top Toolbar & Header */}
      <div className="popcorn-header">
        <div className="popcorn-title-badge">
          <span>🍿 도촌 팝콘 서바이벌</span>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            STAGE {stageIndex + 1}
          </span>
        </div>

        <div className="popcorn-stats-row">
          <div className="popcorn-stat-box text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>{score.toLocaleString()}점</span>
          </div>

          <div className="popcorn-stat-box text-sky-300">
            <Sparkles className="w-4 h-4" />
            <span>스침 {grazeCount}회</span>
          </div>
        </div>

        <div className="popcorn-btn-group">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="popcorn-tool-btn popcorn-btn-help"
            title="게임 방법 설명"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">도움말</span>
          </button>

          <button
            onClick={toggleMute}
            className="popcorn-tool-btn popcorn-btn-sound"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Playing Field */}
      <div className="popcorn-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="popcorn-canvas"
          onTouchStart={(e) => {
            isTouchDragging.current = true;
            handleTouchMove(e);
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { isTouchDragging.current = false; }}
        />

        {/* In-Game HUD: Hearts & Skill Gauge */}
        {gameState === 'playing' && (
          <>
            <div className="popcorn-hud-overlay">
              <div className="popcorn-hud-left">
                <div className="popcorn-hearts-container">
                  {Array.from({ length: maxHp }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 transition-all ${
                        i < hp ? 'text-red-500 fill-red-500 scale-110' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="popcorn-skill-hud">
              <div className="popcorn-skill-pill">
                <span>{selectedClass.skillName} (Space)</span>
                <span className="text-xs text-amber-300">
                  {skillCooldownRemaining === 0 ? 'READY!' : `${(skillCooldownRemaining / 1000).toFixed(1)}s`}
                </span>
              </div>
              <div className="popcorn-skill-gauge-bg">
                <div
                  className="popcorn-skill-gauge-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      ((selectedClass.skillCooldown - skillCooldownRemaining) / selectedClass.skillCooldown) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Character Selection Screen */}
        {gameState === 'select' && (
          <div className="popcorn-char-select-screen">
            <h2 className="text-2xl font-black text-amber-400 mb-1">
              🌽 옥수수 알갱이 캐릭터 선택
            </h2>
            <p className="text-xs text-slate-300 mb-2">
              달궈진 프라이팬에서 생존할 당신의 영웅 알갱이를 골라주세요!
            </p>

            <div className="popcorn-char-grid">
              {Object.values(PLAYER_CLASSES).map(cls => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`popcorn-char-card ${selectedClass.id === cls.id ? 'selected' : ''}`}
                >
                  <img src={cls.avatar} alt={cls.name} className="popcorn-char-img" />
                  <div className="font-extrabold text-slate-100 text-sm">{cls.name}</div>
                  <div className="text-[11px] font-bold text-amber-400 mt-0.5">{cls.title}</div>
                  <div className="text-[10px] text-slate-300 mt-2">{cls.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => startGame(selectedClass)}
              className="popcorn-start-btn flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{selectedClass.name}로 서바이벌 시작!</span>
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="popcorn-gameover-overlay">
            <div className="popcorn-result-card">
              <h3 className="text-xl font-black text-amber-400 mb-2">⏸️ 일시 정지</h3>
              <p className="text-xs text-slate-300 mb-4">잠시 숨을 고르고 있습니다.</p>
              <button
                onClick={() => setGameState('playing')}
                className="popcorn-start-btn w-full"
              >
                계속 플레이
              </button>
            </div>
          </div>
        )}

        {/* Game Over / Victory Overlay */}
        {(gameState === 'gameover' || gameState === 'victory') && (
          <div className="popcorn-gameover-overlay">
            <div className="popcorn-result-card">
              {gameState === 'gameover' ? (
                <img
                  src="/assets/popcorn/corn_popped.jpg"
                  alt="Popped Popcorn"
                  className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-amber-400/50 mb-2 shadow-lg animate-bounce"
                />
              ) : (
                <img
                  src={selectedClass.avatar}
                  alt={selectedClass.name}
                  className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-amber-400/50 mb-2 shadow-lg"
                />
              )}
              <h2 className="text-2xl font-black text-amber-400 mb-1">
                {gameState === 'victory' ? '🎉 전 스테이지 생존 성공!' : '앗! 팝콘으로 튀겨졌습니다!'}
              </h2>
              <p className="text-xs text-slate-300 mb-3">
                {gameState === 'victory'
                  ? '달궈진 프라이팬의 모든 시련을 이겨냈습니다!'
                  : '뜨거운 열기를 견디지 못하고 바삭하게 팝콘이 되었습니다.'}
              </p>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 my-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">최종 점수:</span>
                  <strong className="text-amber-400 text-base">{score.toLocaleString()}점</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">생존 시간:</span>
                  <span className="text-slate-200">{survivalSeconds}초</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">스침(Graze) 횟수:</span>
                  <span className="text-sky-300">{grazeCount}회</span>
                </div>
              </div>

              {/* Hall of Fame Score Submission Form (Only if score > 100 as per rule!) */}
              {score > 100 && (
                <div className="popcorn-rank-form">
                  {submitSuccess ? (
                    <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                      ✅ 명예의 전당 랭킹 등록 완료!
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="space-y-2">
                      <div className="text-xs text-amber-300 font-bold text-left">
                        🏆 명예의 전당 점수 등록 (100점 초과 달성!)
                      </div>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={12}
                        required
                        className="popcorn-input"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl transition disabled:opacity-50"
                      >
                        {isSubmitting ? '등록 중...' : '명예의 전당 등록하기'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setGameState('select')}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  캐릭터 변경
                </button>
                <button
                  onClick={() => startGame(selectedClass)}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
                >
                  다시 도전
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Virtual Controls */}
      <div className="popcorn-mobile-controls">
        <div className="popcorn-dpad">
          <div />
          <button
            onPointerDown={() => { keysPressed.current['ArrowUp'] = true; }}
            onPointerUp={() => { keysPressed.current['ArrowUp'] = false; }}
            onPointerLeave={() => { keysPressed.current['ArrowUp'] = false; }}
            className="popcorn-dpad-btn"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => { keysPressed.current['ArrowLeft'] = true; }}
            onPointerUp={() => { keysPressed.current['ArrowLeft'] = false; }}
            onPointerLeave={() => { keysPressed.current['ArrowLeft'] = false; }}
            className="popcorn-dpad-btn"
          >
            ◀
          </button>
          <div />
          <button
            onPointerDown={() => { keysPressed.current['ArrowRight'] = true; }}
            onPointerUp={() => { keysPressed.current['ArrowRight'] = false; }}
            onPointerLeave={() => { keysPressed.current['ArrowRight'] = false; }}
            className="popcorn-dpad-btn"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => { keysPressed.current['ArrowDown'] = true; }}
            onPointerUp={() => { keysPressed.current['ArrowDown'] = false; }}
            onPointerLeave={() => { keysPressed.current['ArrowDown'] = false; }}
            className="popcorn-dpad-btn"
          >
            ▼
          </button>
          <div />
        </div>

        <button
          onClick={activateSkill}
          className="popcorn-mobile-skill-btn"
        >
          <Zap className="w-5 h-5" />
          <span>스킬</span>
        </button>
      </div>

      {/* How to Play Modal */}
      <PopcornHowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
