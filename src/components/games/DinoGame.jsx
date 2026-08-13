import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../../utils/audio';
import { saveScore, getHighScore } from '../../utils/leaderboard';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 290;
const GROUND_Y = 230;

export default function DinoGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('dino'));
  const [gameState, setGameState] = useState('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [comboBadge, setComboBadge] = useState('');

  const gameStateRef = useRef({
    player: {
      x: 70,
      y: GROUND_Y - 48,
      width: 42,
      height: 48,
      vy: 0,
      gravity: 0.75,
      jumpForce: -13.5,
      isGrounded: true,
      isDucking: false,
      legStep: 0
    },
    obstacles: [],
    speed: 6.5,
    score: 0,
    nextObstacleTimer: 0,
    bgPhase: 'DAY'
  });

  const triggerBadge = (text) => {
    setComboBadge(text);
    setTimeout(() => setComboBadge(''), 1000);
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
    }
  };

  const setDuck = (ducking) => {
    if (gameState === 'PLAYING') {
      const p = gameStateRef.current.player;
      p.isDucking = ducking;
      p.height = ducking ? 26 : 48;
      if (ducking && !p.isGrounded) {
        p.vy += 4.5;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault(); jump();
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault(); setDuck(true);
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
    g.player = {
      x: 70,
      y: GROUND_Y - 48,
      width: 42,
      height: 48,
      vy: 0,
      gravity: 0.75,
      jumpForce: -13.5,
      isGrounded: true,
      isDucking: false,
      legStep: 0
    };
    g.obstacles = [];
    g.speed = 6.5;
    g.score = 0;
    g.nextObstacleTimer = 0;
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
      if (r < 0.45) {
        g.obstacles.push({ type: 'backpack', label: '책가방', x: CANVAS_WIDTH + 20, y: GROUND_Y - 36, width: 32, height: 36 });
      } else if (r < 0.75) {
        g.obstacles.push({ type: 'cone', label: '체육 꼬깔', x: CANVAS_WIDTH + 20, y: GROUND_Y - 48, width: 28, height: 48 });
      } else {
        g.obstacles.push({ type: 'drone', label: '숙제 유령', x: CANVAS_WIDTH + 20, y: GROUND_Y - 76, width: 36, height: 26 });
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
      if (frameCount % 6 === 0) p.legStep = (p.legStep + 1) % 2;

      g.score += 1;
      const currentPts = Math.floor(g.score / 5);
      setScore(currentPts);

      if (g.score % 500 === 0) {
        g.speed += 0.5;
        soundFx.playMilestone();
        triggerComboMsg(`⚡ 가속 스퍼트! (${currentPts}점 달성)`);
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

        const pad = 4;
        if (
          p.x + pad < obs.x + obs.width - pad &&
          p.x + p.width - pad > obs.x + pad &&
          p.y + pad < obs.y + obs.height - pad &&
          p.y + p.height - pad > obs.y + pad
        ) {
          soundFx.playGameOver();
          setGameState('GAMEOVER');
          if (currentPts > highScore) setHighScore(currentPts);
          return;
        }

        if (obs.x + obs.width < -10) {
          g.obstacles.splice(i, 1);
        }
      }
    };

    const draw = () => {
      const g = gameStateRef.current;
      const p = g.player;

      // Sky Background
      let bgGrad;
      if (g.bgPhase === 'NIGHT') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#0B0F19'); bgGrad.addColorStop(1, '#1E293B');
      } else if (g.bgPhase === 'SUNSET') {
        bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#FF77BC'); bgGrad.addColorStop(1, '#7209B7');
      } else {
        bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#00F5D4'); bgGrad.addColorStop(1, '#0F172A');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Fluffy Clouds in Sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(150, 50, 18, 0, Math.PI * 2);
      ctx.arc(175, 45, 24, 0, Math.PI * 2);
      ctx.arc(200, 50, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(520, 60, 15, 0, Math.PI * 2);
      ctx.arc(542, 55, 20, 0, Math.PI * 2);
      ctx.arc(565, 60, 15, 0, Math.PI * 2);
      ctx.fill();

      // Ground Track
      ctx.fillStyle = '#00F5D4';
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 5);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      const dashOffset = (frameCount * g.speed) % 40;
      for (let x = -dashOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.fillRect(x, GROUND_Y + 14, 22, 4);
      }

      // Player Mascot
      ctx.fillStyle = '#FFD166';
      if (p.isDucking) {
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width + 12, p.height, 8);
        ctx.fill();
        ctx.fillStyle = '#0B0F19';
        ctx.beginPath();
        ctx.arc(p.x + p.width + 4, p.y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 10);
        ctx.fill();

        ctx.fillStyle = '#00F5D4';
        ctx.fillRect(p.x + 2, p.y, p.width - 4, 10);

        ctx.fillStyle = '#0B0F19';
        ctx.beginPath();
        ctx.arc(p.x + p.width - 10, p.y + 16, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFD166';
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (p.isGrounded) {
          if (p.legStep === 0) {
            ctx.moveTo(p.x + 12, p.y + p.height); ctx.lineTo(p.x + 4, p.y + p.height + 12);
            ctx.moveTo(p.x + 30, p.y + p.height); ctx.lineTo(p.x + 38, p.y + p.height + 12);
          } else {
            ctx.moveTo(p.x + 12, p.y + p.height); ctx.lineTo(p.x + 20, p.y + p.height + 12);
            ctx.moveTo(p.x + 30, p.y + p.height); ctx.lineTo(p.x + 22, p.y + p.height + 12);
          }
        } else {
          ctx.moveTo(p.x + 12, p.y + p.height); ctx.lineTo(p.x + 4, p.y + p.height + 8);
          ctx.moveTo(p.x + 30, p.y + p.height); ctx.lineTo(p.x + 36, p.y + p.height + 8);
        }
        ctx.stroke();
      }

      // Draw Obstacles with Tags
      g.obstacles.forEach(obs => {
        if (obs.type === 'backpack') {
          ctx.fillStyle = '#FF0055';
          ctx.beginPath(); ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 7); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(obs.x + 6, obs.y + 9, obs.width - 12, 4);
        } else if (obs.type === 'cone') {
          ctx.fillStyle = '#FFB703';
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.lineTo(obs.x, obs.y + obs.height);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(obs.x + 5, obs.y + 18, obs.width - 10, 5);
        } else if (obs.type === 'drone') {
          ctx.fillStyle = '#00F5D4';
          ctx.beginPath(); ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0B0F19'; ctx.fillRect(obs.x + 4, obs.y + obs.height / 2 - 2, obs.width - 8, 4);
        }

        // Tag label
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(obs.x - 4, obs.y - 14, obs.width + 8, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Pretendard';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y - 6);
      });
    };

    const gameLoop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleScoreSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    saveScore('dino', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 md:p-6 glass-panel glass-panel-teal">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between w-full mb-4 px-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gradient-teal">🦖 Dochon Dino Runner</span>
          <span className="text-xs bg-teal-400/20 text-teal-300 border border-teal-400/50 px-3 py-1 rounded-full font-black">
            학교 장애물 달리기
          </span>
        </div>
        <div className="flex items-center gap-6 font-black text-base md:text-lg">
          <div>점수: <span className="text-teal-400 font-mono text-2xl">{score}</span></div>
          <div>최고: <span className="text-amber-400 font-mono text-xl">{highScore}</span></div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative border-4 border-teal-400/60 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block mx-auto"
        />

        {comboBadge && (
          <div className="absolute top-6 left-1/2 -translate-x-12 z-30 bg-teal-400 text-slate-950 px-4 py-1.5 rounded-full font-black text-sm shadow-xl animate-bounce">
            {comboBadge}
          </div>
        )}

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6">
            <h3 className="text-3xl md:text-4xl font-black text-gradient-teal">도촌 공룡 달리기 시작!</h3>
            <p className="text-slate-200 text-sm max-w-md leading-relaxed">
              <span className="text-teal-300 font-black">스페이스바 / 방향키 위 ↑</span> 키로 점프하고,<br />
              <span className="text-amber-300 font-black">방향키 아래 ↓</span> 키로 숙제 드론 유령을 피하세요!
            </p>
            <button onClick={restartGame} className="btn-primary text-lg px-9 py-3.5 animate-pulse-scale">
              <Play className="w-6 h-6 fill-current" /> 달리기 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <h3 className="text-3xl font-black text-teal-400">일시 정지</h3>
            <button onClick={() => setGameState('PLAYING')} className="btn-primary">
              <Play className="w-5 h-5 fill-current" /> 계속하기
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4">
            <h3 className="text-4xl md:text-5xl font-black text-red-400">💥 장애물에 부딪혔습니다!</h3>
            <p className="text-xl font-bold text-slate-200">
              최종 달린 거리 점수: <span className="text-teal-300 text-3xl font-mono">{score}점</span>
            </p>

            {!submitted ? (
              <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 w-full max-w-xs bg-slate-900 p-5 rounded-2xl border-2 border-teal-500/50 shadow-2xl">
                <label className="text-xs text-teal-300 font-black flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> 도촌 명예의 전당 점수 등록
                </label>
                <input
                  type="text"
                  placeholder="예: 박달리기 (5학년 2반)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-4 py-2.5 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-teal-400"
                  maxLength={16}
                  required
                />
                <button type="submit" className="btn-primary text-sm font-black justify-center py-2.5">
                  <Trophy className="w-4 h-4 text-slate-950" /> 랭킹 등록하기
                </button>
              </form>
            ) : (
              <p className="text-teal-300 font-black bg-teal-950/80 border-2 border-teal-500/50 px-5 py-2.5 rounded-xl shadow-lg">
                ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
              </p>
            )}

            <button onClick={restartGame} className="btn-gold mt-2">
              <RotateCcw className="w-5 h-5" /> 다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between w-full mt-4 px-2 gap-3">
        <div className="flex items-center gap-2">
          <button onClick={restartGame} className="btn-outline text-xs px-3.5 py-2">
            <RotateCcw className="w-4 h-4" /> 다시 시작
          </button>
          <button onClick={() => setIsMuted(soundFx.toggleMute())} className="btn-outline text-xs px-3.5 py-2">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            {isMuted ? '음소거' : '소리 ON'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={jump} className="btn-primary text-sm font-black px-7 py-3">
            <ArrowUp className="w-5 h-5" /> 점프 (Jump)
          </button>
          <button
            onMouseDown={() => setDuck(true)}
            onMouseUp={() => setDuck(false)}
            onTouchStart={() => setDuck(true)}
            onTouchEnd={() => setDuck(false)}
            className="btn-gold text-sm font-black px-7 py-3"
          >
            <ArrowDown className="w-5 h-5" /> 숙이기 (Duck)
          </button>
        </div>
      </div>
    </div>
  );
}
