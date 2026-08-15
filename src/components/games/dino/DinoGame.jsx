import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { saveScore, getHighScore } from '../../../utils/leaderboard';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, INITIAL_PLAYER_STATE, INITIAL_GAME_CONFIG } from './dinoConstants';

const baseUrl = import.meta.env.BASE_URL;

export default function DinoGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('dino'));
  const [gameState, setGameState] = useState('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [comboBadge, setComboBadge] = useState('');

  // Asset references
  const assetsRef = useRef({
    loaded: false,
    dinoRun: null,
    dinoJump: null,
    dinoDuck: null,
    dinoHurt: null,
    obsBackpack: null,
    obsCone: null,
    obsGhost: null,
    bgSchool: null,
  });

  const gameStateRef = useRef({
    player: { ...INITIAL_PLAYER_STATE },
    obstacles: [],
    particles: [],
    ...INITIAL_GAME_CONFIG,
  });

  // Preload game sprite assets
  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    Promise.all([
      loadImage(`${baseUrl}assets/dino/dino_run.png`),
      loadImage(`${baseUrl}assets/dino/dino_jump.png`),
      loadImage(`${baseUrl}assets/dino/dino_duck.png`),
      loadImage(`${baseUrl}assets/dino/dino_hurt.png`),
      loadImage(`${baseUrl}assets/dino/obs_backpack.png`),
      loadImage(`${baseUrl}assets/dino/obs_cone.png`),
      loadImage(`${baseUrl}assets/dino/obs_ghost.png`),
      loadImage(`${baseUrl}assets/dino/bg_school.jpg`),
    ]).then(([dinoRun, dinoJump, dinoDuck, dinoHurt, obsBackpack, obsCone, obsGhost, bgSchool]) => {
      assetsRef.current = {
        loaded: true,
        dinoRun,
        dinoJump,
        dinoDuck,
        dinoHurt,
        obsBackpack,
        obsCone,
        obsGhost,
        bgSchool,
      };
    });
  }, []);

  const triggerBadge = (text) => {
    setComboBadge(text);
    setTimeout(() => setComboBadge(''), 1200);
  };

  const jump = () => {
    soundFx.init();
    const p = gameStateRef.current.player;
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
    } else if (gameState === 'PLAYING' && p.isGrounded) {
      p.vy = p.jumpForce;
      p.isGrounded = false;
      soundFx.playDinoJump();
      // Jump dust effect
      for (let i = 0; i < 6; i++) {
        gameStateRef.current.particles.push({
          x: p.x + 20 + (Math.random() - 0.5) * 15,
          y: GROUND_Y - 4,
          vx: (Math.random() - 0.8) * 3,
          vy: -Math.random() * 2.5,
          radius: Math.random() * 3 + 2,
          color: 'rgba(255, 255, 255, 0.7)',
          alpha: 1,
          life: 18,
        });
      }
    }
  };

  const setDuck = (ducking) => {
    if (gameState === 'PLAYING') {
      const p = gameStateRef.current.player;
      p.isDucking = ducking;
      p.width = ducking ? 70 : 52;
      p.height = ducking ? 32 : 56;
      if (ducking && !p.isGrounded) {
        p.vy += 5; // Fast dive
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        setDuck(true);
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        setDuck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const restartGame = () => {
    soundFx.init();
    const g = gameStateRef.current;
    g.player = { ...INITIAL_PLAYER_STATE };
    g.obstacles = [];
    g.particles = [];
    g.speed = 6.5;
    g.score = 0;
    g.nextObstacleTimer = 30;
    g.bgScroll = 0;
    g.bgPhase = 'DAY';
    setScore(0);
    setSubmitted(false);
    setGameState('PLAYING');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let frameCount = 0;

    const spawnObstacle = () => {
      const g = gameStateRef.current;
      const r = Math.random();
      if (r < 0.42) {
        // School Backpack
        g.obstacles.push({
          type: 'backpack',
          label: '도촌 책가방',
          x: CANVAS_WIDTH + 20,
          y: GROUND_Y - 48,
          width: 44,
          height: 48,
          hitboxPad: { top: 6, bottom: 2, left: 7, right: 7 },
        });
      } else if (r < 0.74) {
        // PE Sports Cone
        g.obstacles.push({
          type: 'cone',
          label: '체육 꼬깔',
          x: CANVAS_WIDTH + 20,
          y: GROUND_Y - 50,
          width: 38,
          height: 50,
          hitboxPad: { top: 7, bottom: 2, left: 6, right: 6 },
        });
      } else {
        // Flying Homework Ghost Drone (flying obstacle)
        g.obstacles.push({
          type: 'ghost',
          label: '시험지 유령 드론',
          x: CANVAS_WIDTH + 20,
          baseY: GROUND_Y - 88,
          y: GROUND_Y - 88,
          width: 46,
          height: 52,
          hitboxPad: { top: 6, bottom: 6, left: 7, right: 7 },
          bobOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const update = () => {
      if (gameState !== 'PLAYING') return;

      const g = gameStateRef.current;
      const p = g.player;

      p.vy += p.gravity;
      p.y += p.vy;

      if (p.y >= GROUND_Y - p.height) {
        p.y = GROUND_Y - p.height;
        p.vy = 0;
        p.isGrounded = true;
      }

      frameCount++;
      p.animTimer += 0.2;
      g.bgScroll += g.speed * 0.45;

      // Dust particles when running on ground
      if (p.isGrounded && frameCount % 6 === 0) {
        g.particles.push({
          x: p.x + 8,
          y: GROUND_Y - 3,
          vx: -(g.speed * 0.4) - Math.random() * 1.5,
          vy: -Math.random() * 1.2 - 0.2,
          radius: Math.random() * 2.8 + 1.5,
          color: 'rgba(240, 200, 150, 0.65)',
          alpha: 1,
          life: 14,
        });
      }

      // Update particle physics
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 1 / pt.life;
        if (pt.alpha <= 0) {
          g.particles.splice(i, 1);
        }
      }

      g.score += 1;
      const currentPts = Math.floor(g.score / 5);
      setScore(currentPts);

      // Speed milestones
      if (g.score % 500 === 0) {
        g.speed += 0.5;
        soundFx.playMilestone();
        triggerBadge(`⚡ 스퍼트 가속! (${currentPts}m 돌파)`);
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.65 },
          colors: ['#00F5D4', '#FFD166', '#FF0055']
        });
      }

      if (currentPts > 700) g.bgPhase = 'NIGHT';
      else if (currentPts > 300) g.bgPhase = 'SUNSET';
      else g.bgPhase = 'DAY';

      g.nextObstacleTimer--;
      if (g.nextObstacleTimer <= 0) {
        spawnObstacle();
        g.nextObstacleTimer = Math.floor(Math.random() * 45) + Math.max(38, 85 - Math.floor(g.speed * 3));
      }

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        obs.x -= g.speed;

        // Flying obstacle bobbing
        if (obs.type === 'ghost') {
          obs.y = obs.baseY + Math.sin(frameCount * 0.08 + obs.bobOffset) * 6;
        }

        // Precise Hitbox Collision
        const pad = obs.hitboxPad || { top: 4, bottom: 2, left: 5, right: 5 };
        const pPadX = p.isDucking ? 6 : 8;
        const pPadY = 6;

        const playerBox = {
          left: p.x + pPadX,
          right: p.x + p.width - pPadX,
          top: p.y + pPadY,
          bottom: p.y + p.height - 2,
        };

        const obsBox = {
          left: obs.x + pad.left,
          right: obs.x + obs.width - pad.right,
          top: obs.y + pad.top,
          bottom: obs.y + obs.height - pad.bottom,
        };

        if (
          playerBox.left < obsBox.right &&
          playerBox.right > obsBox.left &&
          playerBox.top < obsBox.bottom &&
          playerBox.bottom > obsBox.top
        ) {
          soundFx.playGameOver();
          setGameState('GAMEOVER');
          if (currentPts > highScore) {
            setHighScore(currentPts);
            saveScore('dino', currentPts);
          }
          return;
        }

        if (obs.x + obs.width < -30) {
          g.obstacles.splice(i, 1);
        }
      }
    };

    const draw = () => {
      const g = gameStateRef.current;
      const p = g.player;
      const assets = assetsRef.current;

      // 1. Draw Parallax School Campus Background
      if (assets.bgSchool && assets.bgSchool.complete) {
        const bgImg = assets.bgSchool;
        const bgWidth = (CANVAS_HEIGHT / bgImg.height) * bgImg.width;
        const offset = g.bgScroll % bgWidth;

        // Draw multiple copies for seamless scroll
        for (let x = -offset; x < CANVAS_WIDTH; x += bgWidth) {
          ctx.drawImage(bgImg, x, 0, bgWidth, CANVAS_HEIGHT);
        }

        // Atmosphere tint overlay for Sunset / Night
        if (g.bgPhase === 'SUNSET') {
          ctx.fillStyle = 'rgba(255, 100, 150, 0.28)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else if (g.bgPhase === 'NIGHT') {
          ctx.fillStyle = 'rgba(10, 15, 45, 0.65)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
      } else {
        // Fallback Sky gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#38BDF8');
        bgGrad.addColorStop(1, '#E0F2FE');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // 2. Draw Athletic Track & Ground
      // Track Bed (School red tartan running track)
      const trackGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
      trackGrad.addColorStop(0, '#D34528');
      trackGrad.addColorStop(0.5, '#BA361D');
      trackGrad.addColorStop(1, '#8C2410');
      ctx.fillStyle = trackGrad;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

      // Top green turf border
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, GROUND_Y - 4, CANVAS_WIDTH, 4);

      // White Track Lane Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 18);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 18);
      ctx.moveTo(0, GROUND_Y + 44);
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 44);
      ctx.stroke();

      // Moving Dash marks on Track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const laneOffset = (frameCount * g.speed) % 50;
      for (let x = -laneOffset; x < CANVAS_WIDTH; x += 50) {
        ctx.fillRect(x, GROUND_Y + 28, 24, 4);
      }

      // 3. Draw Running Dust Particles
      g.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. Draw Obstacles
      g.obstacles.forEach((obs) => {
        ctx.save();

        // Shadow below obstacle
        if (obs.type !== 'ghost') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(obs.x + obs.width / 2, GROUND_Y + 1, obs.width / 2 - 2, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        let spriteImg = null;
        if (obs.type === 'backpack') spriteImg = assets.obsBackpack;
        else if (obs.type === 'cone') spriteImg = assets.obsCone;
        else if (obs.type === 'ghost') spriteImg = assets.obsGhost;

        if (spriteImg && spriteImg.complete) {
          if (obs.type === 'ghost') {
            // Glow around flying ghost
            ctx.shadowColor = '#00F5D4';
            ctx.shadowBlur = 12;
          }
          ctx.drawImage(spriteImg, obs.x, obs.y, obs.width, obs.height);
          ctx.shadowBlur = 0;
        } else {
          // Fallback simple shapes
          if (obs.type === 'backpack') {
            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
            ctx.fill();
          } else if (obs.type === 'cone') {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.width / 2, obs.y);
            ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.lineTo(obs.x, obs.y + obs.height);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = '#38BDF8';
            ctx.beginPath();
            ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Tag label
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(obs.x - 6, obs.y - 15, obs.width + 12, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8.5px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y - 6);

        ctx.restore();
      });

      // 5. Draw Player Dino Mascot
      ctx.save();
      // Dino ground shadow
      if (p.isGrounded) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.width / 2, GROUND_Y + 1, p.width / 2 - 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      let playerSprite = assets.dinoRun;
      if (gameState === 'GAMEOVER') {
        playerSprite = assets.dinoHurt || assets.dinoRun;
      } else if (p.isDucking) {
        playerSprite = assets.dinoDuck || assets.dinoRun;
      } else if (!p.isGrounded) {
        playerSprite = assets.dinoJump || assets.dinoRun;
      }

      if (playerSprite && playerSprite.complete) {
        // Running slight energetic bounce
        const bounce = p.isGrounded && !p.isDucking ? Math.sin(p.animTimer * 2) * 2 : 0;
        ctx.drawImage(playerSprite, p.x, p.y + bounce, p.width, p.height);
      } else {
        // Fallback mascot
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 8);
        ctx.fill();
      }
      ctx.restore();
    };

    const gameLoop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, highScore]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    await submitScoreToDB('dino', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  return (
    <div className="dino-container">
      {/* Header Bar */}
      <div className="dino-header">
        <div className="dino-title-wrap">
          <span className="dino-title">🦖 Dochon Dino Runner</span>
          <span className="dino-badge">
            도촌초 장애물 달리기
          </span>
        </div>
        <div className="dino-score-wrap">
          <div>달린 거리: <span className="dino-score-val">{score}m</span></div>
          <div>최고 기록: <span className="dino-high-val">{highScore}m</span></div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="dino-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {comboBadge && (
          <div className="dino-combo-badge">
            {comboBadge}
          </div>
        )}

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="dino-overlay">
            <h3 className="dino-overlay-title dino-title">도촌 공룡 달리기 시작!</h3>
            <p className="dino-overlay-desc">
              <span style={{ color: '#2DD4BF', fontWeight: 900 }}>스페이스바 / 방향키 위 ↑</span> 키로 책가방과 꼬깔을 점프하고,<br />
              <span style={{ color: '#FBBF24', fontWeight: 900 }}>방향키 아래 ↓</span> 키로 날아다니는 숙제 유령을 피하세요!
            </p>
            <button onClick={restartGame} className="btn-dino-jump" style={{ fontSize: '16px', padding: '12px 32px' }}>
              <Play style={{ width: '20px', height: '20px', fill: 'currentColor' }} /> 달리기 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="dino-overlay">
            <h3 className="dino-overlay-title" style={{ color: '#2DD4BF' }}>일시 정지</h3>
            <button onClick={() => setGameState('PLAYING')} className="btn-dino-jump">
              <Play style={{ width: '18px', height: '18px', fill: 'currentColor' }} /> 계속하기
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="dino-overlay">
            <h3 className="dino-overlay-title" style={{ color: '#F87171' }}>💥 장애물에 부딪혔습니다!</h3>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', margin: '4px 0' }}>
              최종 달린 거리 기록: <span className="dino-score-val" style={{ fontSize: '26px' }}>{score}m</span>
            </p>

            {!submitted ? (
              <form onSubmit={handleScoreSubmit} className="dino-score-form">
                <label style={{ fontSize: '12px', color: '#2DD4BF', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Sparkles style={{ width: '14px', height: '14px' }} /> 도촌 명예의 전당 점수 등록
                </label>
                <input
                  type="text"
                  placeholder="예: 박달리기 (5학년 2반)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="dino-score-input"
                  maxLength={16}
                  required
                />
                <button type="submit" className="btn-dino-jump" style={{ justifyContent: 'center', padding: '8px 16px', fontSize: '13px' }}>
                  <Trophy style={{ width: '16px', height: '16px' }} /> 랭킹 등록하기
                </button>
              </form>
            ) : (
              <p style={{ color: '#34D399', fontWeight: 900, background: 'rgba(6, 78, 59, 0.8)', border: '1.5px solid #10B981', padding: '8px 18px', borderRadius: '12px' }}>
                ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
              </p>
            )}

            <button onClick={restartGame} className="btn-gold" style={{ marginTop: '6px' }}>
              <RotateCcw style={{ width: '18px', height: '18px' }} /> 다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="dino-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={restartGame} className="btn-arcade-purple" style={{ padding: '8px 14px', fontSize: '12px' }}>
            <RotateCcw style={{ width: '14px', height: '14px' }} /> 다시 시작
          </button>
          <button onClick={() => setIsMuted(soundFx.toggleMute())} className="btn-arcade-purple" style={{ padding: '8px 14px', fontSize: '12px' }}>
            {isMuted ? <VolumeX style={{ width: '14px', height: '14px', color: '#F87171' }} /> : <Volume2 style={{ width: '14px', height: '14px', color: '#34D399' }} />}
            {isMuted ? '음소거' : '소리 ON'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={jump} className="btn-dino-jump">
            <ArrowUp style={{ width: '18px', height: '18px' }} /> 점프 (Jump)
          </button>
          <button
            onMouseDown={() => setDuck(true)}
            onMouseUp={() => setDuck(false)}
            onTouchStart={() => setDuck(true)}
            onTouchEnd={() => setDuck(false)}
            className="btn-dino-duck"
          >
            <ArrowDown style={{ width: '18px', height: '18px' }} /> 숙이기 (Duck)
          </button>
        </div>
      </div>
    </div>
  );
}
