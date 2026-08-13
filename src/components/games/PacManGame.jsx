import React, { useEffect, useRef, useState } from 'react';
import { soundFx } from '../../utils/audio';
import { saveScore, getHighScore } from '../../utils/leaderboard';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const MAZE_GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,3,1],
  [1,2,1,1,2,1,2,1,2,1,2,1,2,1,1,1,2,1,2,1,2,1,2,1,1,2,1,2,1],
  [1,2,1,2,2,1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1,2,2,1,2,1],
  [1,2,1,1,2,1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1,1,2,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,1,1,0,0,0,1,1,1,2,1,1,1,2,1,1,1,2,1],
  [1,2,1,2,2,2,1,2,1,2,1,9,9,9,9,9,9,9,1,2,1,2,1,2,1,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,9,9,9,9,9,9,9,1,2,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1,1,2,1,2,1],
  [1,2,1,2,2,1,2,1,2,1,2,1,2,2,1,2,2,1,2,1,2,1,2,1,2,2,1,2,1],
  [1,2,1,1,2,1,2,1,2,1,2,1,2,1,1,1,2,1,2,1,2,1,2,1,1,2,1,2,1],
  [1,3,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,1,2,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const TILE_SIZE = 26;
const COLS = MAZE_GRID[0].length;
const ROWS = MAZE_GRID.length;

export default function PacManGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('pacman'));
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [comboText, setComboText] = useState('');

  const gameStateRef = useRef({
    grid: JSON.parse(JSON.stringify(MAZE_GRID)),
    pacman: { x: 14, y: 9, dx: 0, dy: 0, nextDx: 0, nextDy: 0 },
    ghosts: [
      { id: 'blinky', name: '시험지', color: '#FF0055', x: 13, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'pinky', name: '시간', color: '#FF77BC', x: 14, y: 7, dx: -1, dy: 0, frightened: false },
      { id: 'inky', name: '숙제', color: '#00F5D4', x: 15, y: 7, dx: 0, dy: -1, frightened: false },
      { id: 'clyde', name: '게으름', color: '#FFB703', x: 14, y: 8, dx: 0, dy: 1, frightened: false }
    ],
    frightenedTimer: null,
    frightenedTimeLeft: 0,
    dotsRemaining: 0,
    score: 0,
    lives: 3
  });

  useEffect(() => {
    let count = 0;
    MAZE_GRID.forEach(row => {
      row.forEach(cell => {
        if (cell === 2 || cell === 3) count++;
      });
    });
    gameStateRef.current.dotsRemaining = count;
  }, []);

  const setDirection = (dx, dy) => {
    soundFx.init();
    const g = gameStateRef.current;
    g.pacman.nextDx = dx;
    g.pacman.nextDy = dy;
    if (gameState === 'IDLE') {
      setGameState('PLAYING');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault(); setDirection(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault(); setDirection(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault(); setDirection(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault(); setDirection(1, 0);
      } else if (e.code === 'Space') {
        e.preventDefault(); togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const togglePause = () => {
    soundFx.init();
    if (gameState === 'PLAYING') setGameState('PAUSED');
    else if (gameState === 'PAUSED') setGameState('PLAYING');
  };

  const restartGame = () => {
    soundFx.init();
    const g = gameStateRef.current;
    g.grid = JSON.parse(JSON.stringify(MAZE_GRID));
    g.pacman = { x: 14, y: 9, dx: 0, dy: 0, nextDx: 0, nextDy: 0 };
    g.ghosts = [
      { id: 'blinky', name: '시험지', color: '#FF0055', x: 13, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'pinky', name: '시간', color: '#FF77BC', x: 14, y: 7, dx: -1, dy: 0, frightened: false },
      { id: 'inky', name: '숙제', color: '#00F5D4', x: 15, y: 7, dx: 0, dy: -1, frightened: false },
      { id: 'clyde', name: '게으름', color: '#FFB703', x: 14, y: 8, dx: 0, dy: 1, frightened: false }
    ];
    g.score = 0;
    g.lives = 3;
    g.frightenedTimeLeft = 0;
    setScore(0);
    setLives(3);
    setSubmitted(false);
    setGameState('PLAYING');

    let count = 0;
    MAZE_GRID.forEach(row => {
      row.forEach(cell => {
        if (cell === 2 || cell === 3) count++;
      });
    });
    g.dotsRemaining = count;
  };

  const triggerComboMsg = (msg) => {
    setComboText(msg);
    setTimeout(() => setComboText(''), 1200);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = performance.now();

    const isWall = (x, y) => {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
      return gameStateRef.current.grid[y][x] === 1;
    };

    const updateGame = () => {
      const g = gameStateRef.current;
      if (gameState !== 'PLAYING') return;

      const p = g.pacman;
      if (p.nextDx !== 0 || p.nextDy !== 0) {
        if (!isWall(p.x + p.nextDx, p.y + p.nextDy)) {
          p.dx = p.nextDx;
          p.dy = p.nextDy;
        }
      }

      if (p.dx !== 0 || p.dy !== 0) {
        const nextX = p.x + p.dx;
        const nextY = p.y + p.dy;
        if (!isWall(nextX, nextY)) {
          p.x = nextX;
          p.y = nextY;

          const currentCell = g.grid[p.y][p.x];
          if (currentCell === 2) {
            g.grid[p.y][p.x] = 0;
            g.score += 10;
            g.dotsRemaining--;
            setScore(g.score);
            soundFx.playPacmanWaka();
          } else if (currentCell === 3) {
            g.grid[p.y][p.x] = 0;
            g.score += 50;
            g.dotsRemaining--;
            setScore(g.score);
            soundFx.playPowerup();
            triggerComboMsg('🍔 도촌 햄버거 파워업!');

            g.frightenedTimeLeft = 8;
            g.ghosts.forEach(gh => (gh.frightened = true));
            if (g.frightenedTimer) clearInterval(g.frightenedTimer);
            g.frightenedTimer = setInterval(() => {
              g.frightenedTimeLeft--;
              if (g.frightenedTimeLeft <= 0) {
                clearInterval(g.frightenedTimer);
                g.ghosts.forEach(gh => (gh.frightened = false));
              }
            }, 1000);
          }

          if (g.dotsRemaining <= 0) {
            setGameState('VICTORY');
            soundFx.playMilestone();
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            return;
          }
        }
      }

      g.ghosts.forEach(ghost => {
        const possibleMoves = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ].filter(m => !isWall(ghost.x + m.dx, ghost.y + m.dy) && (m.dx !== -ghost.dx || m.dy !== -ghost.dy));

        if (possibleMoves.length > 0) {
          const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          ghost.dx = move.dx; ghost.dy = move.dy;
          ghost.x += ghost.dx; ghost.y += ghost.dy;
        }

        if (ghost.x === p.x && ghost.y === p.y) {
          if (ghost.frightened) {
            soundFx.playPacmanEatGhost();
            triggerComboMsg(`💥 ${ghost.name} 유령 퇴치! (+200점)`);
            ghost.x = 14; ghost.y = 7;
            ghost.frightened = false;
            g.score += 200;
            setScore(g.score);
          } else {
            soundFx.playGameOver();
            g.lives--;
            setLives(g.lives);
            if (g.lives <= 0) {
              setGameState('GAMEOVER');
              if (g.score > highScore) setHighScore(g.score);
            } else {
              p.x = 14; p.y = 9; p.dx = 0; p.dy = 0; p.nextDx = 0; p.nextDy = 0;
            }
          }
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = gameStateRef.current;

      // 1. Draw Maze Walls & Dots
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = g.grid[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (cell === 1) {
            // Neon Glow Wall
            ctx.fillStyle = '#0B1E36';
            ctx.strokeStyle = '#00F5D4';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(x + 1.5, y + 1.5, TILE_SIZE - 3, TILE_SIZE - 3, 5);
            ctx.fill();
            ctx.stroke();
          } else if (cell === 2) {
            // Gold Star Dot
            ctx.fillStyle = '#FFD166';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 3) {
            // Dochon School Lunch Burger / Strawberry Milk
            ctx.fillStyle = '#FF007F';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Draw Pacman Mascot
      const px = g.pacman.x * TILE_SIZE + TILE_SIZE / 2;
      const py = g.pacman.y * TILE_SIZE + TILE_SIZE / 2;
      const radius = TILE_SIZE / 2 - 1;

      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.lineTo(px, py);
      ctx.fill();

      ctx.fillStyle = '#0B0F19';
      ctx.beginPath();
      ctx.arc(px, py - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Ghosts with Cute Name Tags
      g.ghosts.forEach(ghost => {
        const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
        const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillStyle = ghost.frightened ? '#0077B6' : ghost.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, radius, Math.PI, 0, false);
        ctx.lineTo(gx + radius, gy + radius - 2);
        ctx.lineTo(gx - radius, gy + radius - 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 4, 3, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ghost.frightened ? '#FFD166' : '#0D1B2A';
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 4, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Monster Name Tag for Kids
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(gx - 14, gy - radius - 12, 28, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Pretendard';
        ctx.textAlign = 'center';
        ctx.fillText(ghost.name, gx, gy - radius - 4);
      });
    };

    const gameLoop = (time) => {
      if (time - lastTime > 150) {
        updateGame();
        lastTime = time;
      }
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleScoreSubmit = (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    saveScore('pacman', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 md:p-6 glass-panel glass-panel-gold">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between w-full mb-4 px-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gradient-gold">🕹️ Dochon Pac-Man</span>
          <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/50 px-3 py-1 rounded-full font-black">
            D-O-C-H-O-N 미로 맵
          </span>
        </div>
        <div className="flex items-center gap-6 font-black text-base md:text-lg">
          <div>점수: <span className="text-amber-400 font-mono text-2xl">{score}</span></div>
          <div>최고: <span className="text-teal-400 font-mono text-xl">{highScore}</span></div>
          <div className="flex items-center gap-1">
            목숨: {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xl ${i < lives ? 'opacity-100 scale-110' : 'opacity-25'}`}>❤️</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="relative border-4 border-amber-400/60 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
          className="block mx-auto"
        />

        {/* Combo Popup Text */}
        {comboText && (
          <div className="absolute top-6 left-1/2 -translate-x-12 z-30 bg-amber-400 text-slate-950 px-4 py-1.5 rounded-full font-black text-sm shadow-xl animate-bounce">
            {comboText}
          </div>
        )}

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6">
            <h3 className="text-3xl md:text-4xl font-black text-gradient-gold">도촌 팩맨 게임 시작!</h3>
            <p className="text-slate-200 text-sm max-w-md leading-relaxed">
              키보드 방향키(또는 W/A/S/D)로 팩맨을 조작하세요!<br />
              <span className="text-pink-400 font-extrabold">도촌 급식 햄버거(핑크 구슬)</span>를 먹고 시험지/숙제 유령을 물리치세요!
            </p>
            <button onClick={restartGame} className="btn-gold text-lg px-9 py-3.5 animate-pulse-scale">
              <Play className="w-6 h-6 fill-current" /> 게임 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <h3 className="text-3xl font-black text-amber-400">일시 정지</h3>
            <button onClick={togglePause} className="btn-primary">
              <Play className="w-5 h-5 fill-current" /> 계속하기
            </button>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4">
            <h3 className={`text-4xl md:text-5xl font-black ${gameState === 'VICTORY' ? 'text-teal-400' : 'text-red-400'}`}>
              {gameState === 'VICTORY' ? '🎉 전교 1위 등극! 축하합니다!' : '💀 유령에게 잡혔습니다!'}
            </h3>
            <p className="text-xl font-bold text-slate-200">
              최종 획득 점수: <span className="text-amber-400 text-3xl font-mono">{score}점</span>
            </p>

            {!submitted ? (
              <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 w-full max-w-xs bg-slate-900 p-5 rounded-2xl border-2 border-amber-500/50 shadow-2xl">
                <label className="text-xs text-amber-300 font-black flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> 도촌 명예의 전당 점수 등록
                </label>
                <input
                  type="text"
                  placeholder="예: 김도촌 (6학년 1반)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-4 py-2.5 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                  maxLength={16}
                  required
                />
                <button type="submit" className="btn-gold text-sm font-black justify-center py-2.5">
                  <Trophy className="w-4 h-4 text-slate-950" /> 랭킹 등록하기
                </button>
              </form>
            ) : (
              <p className="text-teal-300 font-black bg-teal-950/80 border-2 border-teal-500/50 px-5 py-2.5 rounded-xl shadow-lg">
                ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
              </p>
            )}

            <button onClick={restartGame} className="btn-primary mt-2">
              <RotateCcw className="w-5 h-5" /> 다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions & Mobile D-Pad */}
      <div className="flex flex-wrap items-center justify-between w-full mt-4 px-2 gap-3">
        <div className="flex items-center gap-2">
          <button onClick={togglePause} className="btn-outline text-xs px-3.5 py-2">
            {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {gameState === 'PAUSED' ? '재개' : '일시정지'}
          </button>
          <button onClick={restartGame} className="btn-outline text-xs px-3.5 py-2">
            <RotateCcw className="w-4 h-4" /> 다시 시작
          </button>
          <button onClick={() => setIsMuted(soundFx.toggleMute())} className="btn-outline text-xs px-3.5 py-2">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            {isMuted ? '음소거' : '소리 ON'}
          </button>
        </div>

        {/* Touch D-Pad for Mobile */}
        <div className="flex items-center gap-1 md:hidden bg-slate-900/80 p-2 rounded-2xl border border-slate-700">
          <button onClick={() => setDirection(-1, 0)} className="btn-outline p-2.5"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex flex-col gap-1">
            <button onClick={() => setDirection(0, -1)} className="btn-outline p-2.5"><ArrowUp className="w-5 h-5" /></button>
            <button onClick={() => setDirection(0, 1)} className="btn-outline p-2.5"><ArrowDown className="w-5 h-5" /></button>
          </div>
          <button onClick={() => setDirection(1, 0)} className="btn-outline p-2.5"><ArrowRight className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
}
