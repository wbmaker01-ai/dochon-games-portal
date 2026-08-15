import React, { useEffect, useRef, useState } from 'react';
import { DOCHON_MAZE_GRID, TILE_SIZE, COLS, ROWS, LETTER_REGIONS } from './mazeData';
import { soundFx } from '../../../utils/audio';
import { saveScore, getHighScore } from '../../../utils/leaderboard';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

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
    grid: JSON.parse(JSON.stringify(DOCHON_MAZE_GRID)),
    pacman: { x: 16, y: 11, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouthAngle: 0.2, mouthSpeed: 0.05 },
    ghosts: [
      { id: 'blinky', name: '시험지', color: '#FF0055', x: 14, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'pinky', name: '시간', color: '#FF77BC', x: 16, y: 7, dx: -1, dy: 0, frightened: false },
      { id: 'inky', name: '숙제', color: '#00F5D4', x: 18, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'clyde', name: '게으름', color: '#FFB703', x: 16, y: 11, dx: -1, dy: 0, frightened: false }
    ],
    frightenedTimer: null,
    frightenedTimeLeft: 0,
    dotsRemaining: 0,
    score: 0,
    lives: 3
  });

  useEffect(() => {
    let count = 0;
    DOCHON_MAZE_GRID.forEach(row => {
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
    g.grid = JSON.parse(JSON.stringify(DOCHON_MAZE_GRID));
    g.pacman = { x: 16, y: 11, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouthAngle: 0.2, mouthSpeed: 0.05 };
    g.ghosts = [
      { id: 'blinky', name: '시험지', color: '#FF0055', x: 14, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'pinky', name: '시간', color: '#FF77BC', x: 16, y: 7, dx: -1, dy: 0, frightened: false },
      { id: 'inky', name: '숙제', color: '#00F5D4', x: 18, y: 7, dx: 1, dy: 0, frightened: false },
      { id: 'clyde', name: '게으름', color: '#FFB703', x: 16, y: 11, dx: -1, dy: 0, frightened: false }
    ];
    g.score = 0;
    g.lives = 3;
    g.frightenedTimeLeft = 0;
    setScore(0);
    setLives(3);
    setSubmitted(false);
    setGameState('PLAYING');

    let count = 0;
    DOCHON_MAZE_GRID.forEach(row => {
      row.forEach(cell => {
        if (cell === 2 || cell === 3) count++;
      });
    });
    g.dotsRemaining = count;
  };

  const triggerComboMsg = (msg) => {
    setComboText(msg);
    setTimeout(() => setComboText(''), 1400);
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
            triggerComboMsg('🍔 DOCHON 햄버거 파워업!');

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
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            return;
          }
        }
      }

      g.ghosts.forEach(ghost => {
        // 1. Find all unblocked adjacent directions
        const allMoves = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ].filter(m => !isWall(ghost.x + m.dx, ghost.y + m.dy));

        if (allMoves.length > 0) {
          // 2. Filter out moves that reverse direction, unless at a dead-end
          let validMoves = allMoves.filter(m => !(m.dx === -ghost.dx && m.dy === -ghost.dy));
          if (validMoves.length === 0) {
            validMoves = allMoves; // Dead-end fallback: allow 180-degree turn!
          }

          let chosenMove;
          if (!ghost.frightened && Math.random() < 0.4) {
            // Chase Pac-Man: pick move minimizing Manhattan distance to Pac-Man
            chosenMove = validMoves.reduce((best, m) => {
              const distM = Math.abs((ghost.x + m.dx) - p.x) + Math.abs((ghost.y + m.dy) - p.y);
              const distBest = Math.abs((ghost.x + best.dx) - p.x) + Math.abs((ghost.y + best.dy) - p.y);
              return distM < distBest ? m : best;
            }, validMoves[0]);
          } else {
            chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          }

          ghost.dx = chosenMove.dx;
          ghost.dy = chosenMove.dy;
          ghost.x += ghost.dx;
          ghost.y += ghost.dy;
        }

        if (ghost.x === p.x && ghost.y === p.y) {
          if (ghost.frightened) {
            soundFx.playPacmanEatGhost();
            triggerComboMsg(`💥 DOCHON! ${ghost.name} 퇴치! (+200점)`);
            ghost.x = 16; ghost.y = 7;
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
              p.x = 16; p.y = 11; p.dx = 0; p.dy = 0; p.nextDx = 0; p.nextDy = 0;
            }
          }
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = gameStateRef.current;

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#030712');
      bgGradient.addColorStop(1, '#0B0F19');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Maze Walls & Dots
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = g.grid[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;

          if (cell === 1) {
            // Neon Glow Wall
            const isLetterRow = r >= 2 && r <= 6;
            ctx.fillStyle = isLetterRow ? '#0F2B48' : '#0B1E36';
            ctx.strokeStyle = isLetterRow ? '#FBBF24' : '#00F5D4';
            ctx.lineWidth = isLetterRow ? 2.5 : 2;
            ctx.beginPath();
            ctx.roundRect(x + 1.5, y + 1.5, TILE_SIZE - 3, TILE_SIZE - 3, 4);
            ctx.fill();
            ctx.stroke();
          } else if (cell === 2) {
            // Gold Star Dot
            ctx.fillStyle = '#FFD166';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 3) {
            // Dochon School Lunch Burger / Strawberry Milk
            ctx.fillStyle = '#FF007F';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 7.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Draw "D O C H O N" Highlight Badges above letter Columns
      LETTER_REGIONS.forEach(({ letter, startCol, endCol }) => {
        const lx = ((startCol + endCol) / 2 + 0.5) * TILE_SIZE;
        const ly = 1.6 * TILE_SIZE;

        ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
        ctx.font = '900 12px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(letter, lx, ly);
      });

      // 3. Draw Pacman Mascot
      const px = g.pacman.x * TILE_SIZE + TILE_SIZE / 2;
      const py = g.pacman.y * TILE_SIZE + TILE_SIZE / 2;
      const radius = TILE_SIZE / 2 - 1;

      // Animate mouth
      g.pacman.mouthAngle += g.pacman.mouthSpeed;
      if (g.pacman.mouthAngle > 0.35 || g.pacman.mouthAngle < 0.05) {
        g.pacman.mouthSpeed = -g.pacman.mouthSpeed;
      }

      let rotationAngle = 0;
      if (g.pacman.dx === 1) rotationAngle = 0;
      else if (g.pacman.dx === -1) rotationAngle = Math.PI;
      else if (g.pacman.dy === 1) rotationAngle = Math.PI / 2;
      else if (g.pacman.dy === -1) rotationAngle = -Math.PI / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotationAngle);

      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(0, 0, radius, g.pacman.mouthAngle * Math.PI, (2 - g.pacman.mouthAngle) * Math.PI);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#0B0F19';
      ctx.beginPath();
      ctx.arc(2, -radius / 2.2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 4. Draw Ghosts with Cute Name Tags
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
        ctx.arc(gx - 3.5, gy - 3.5, 2.5, 0, Math.PI * 2);
        ctx.arc(gx + 3.5, gy - 3.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = ghost.frightened ? '#FFD166' : '#0D1B2A';
        ctx.beginPath();
        ctx.arc(gx - 3.5, gy - 3.5, 1.2, 0, Math.PI * 2);
        ctx.arc(gx + 3.5, gy - 3.5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Monster Name Tag for Kids
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(gx - 14, gy - radius - 11, 28, 9);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ghost.name, gx, gy - radius - 3);
      });
    };

    const gameLoop = (time) => {
      if (time - lastTime > 140) {
        updateGame();
        lastTime = time;
      }
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    saveScore('pacman', studentName, score);
    await submitScoreToDB('pacman', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-3 md:p-5 glass-panel glass-panel-gold select-none">
      {/* 1. Header Bar with Cute Arcade Typography */}
      <div className="flex flex-wrap items-center justify-between w-full mb-2 px-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent flex items-center gap-1.5 drop-shadow">
            🕹️ Dochon Pac-Man
          </span>
          <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/50 px-2.5 py-0.5 rounded-full font-black tracking-wide shadow-sm">
            D-O-C-H-O-N 미로 맵
          </span>
        </div>

        {/* Scoreboard Pills */}
        <div className="flex items-center gap-3 md:gap-5 font-black text-xs md:text-sm">
          <div className="bg-slate-900/90 border border-amber-500/40 px-3 py-1 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">점수</span>
            <span className="text-amber-400 font-mono text-base md:text-lg">{score.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/90 border border-teal-500/40 px-3 py-1 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">최고</span>
            <span className="text-teal-300 font-mono text-base md:text-lg">{highScore.toLocaleString()}</span>
          </div>

          <div className="bg-slate-900/90 border border-pink-500/40 px-3 py-1 rounded-xl shadow-inner flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">목숨</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-base transition-all duration-300 ${i < lives ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'opacity-20 scale-90 grayscale'}`}>💖</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Reserved Fixed-Height Announcement Ribbon (100% Fixed Height, Zero Layout Shift) */}
      <div className="w-full h-10 sm:h-11 flex items-center justify-center mb-2 shrink-0">
        <div className={`transition-all duration-300 transform ${comboText ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 border-2 border-yellow-200 flex items-center gap-2 tracking-tight">
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
            <span>{comboText || '도촌 팩맨 파워업!'}</span>
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
          </div>
        </div>
      </div>

      {/* 3. Main Canvas Container */}
      <div className="relative border-4 border-amber-400/60 rounded-2xl overflow-hidden shadow-2xl bg-slate-950 max-w-full">
        <canvas
          ref={canvasRef}
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
          className="block mx-auto max-w-full h-auto"
        />

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center p-6">
            <h3 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-yellow-300 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow">
              도촌 팩맨 (DOCHON PAC-MAN)
            </h3>
            <p className="text-slate-200 text-xs md:text-sm max-w-md leading-relaxed">
              알파벳 <strong className="text-amber-400 font-black">D O C H O N</strong>으로 디자인된 도촌초등학교 팩맨 미로!<br />
              키보드 방향키(W/A/S/D) 또는 아래 십자키로 조작하며<br />
              <span className="text-pink-300 font-black underline decoration-pink-500">도촌 급식 햄버거(파워 구슬)</span>를 먹고 유령을 물리치세요!
            </p>
            <button onClick={restartGame} className="btn-gold text-base md:text-lg px-8 py-3 animate-pulse shadow-2xl">
              <Play className="w-5 h-5 fill-current" /> 게임 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none">
            <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
              ⏸️ 일시 정지
            </h3>
            <p className="text-slate-300 text-xs font-bold bg-slate-900/80 border border-slate-700 px-4 py-1.5 rounded-full shadow-lg">
              하단의 [게임 재개] 버튼을 누르면 이어서 진행됩니다
            </p>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-4">
            <h3 className={`text-3xl md:text-5xl font-black ${gameState === 'VICTORY' ? 'text-teal-400' : 'text-red-400'}`}>
              {gameState === 'VICTORY' ? '🎉 전교 1위 등극! 축하합니다!' : '💀 유령에게 잡혔습니다!'}
            </h3>
            <p className="text-lg md:text-xl font-bold text-slate-200">
              최종 획득 점수: <span className="text-amber-400 text-2xl md:text-3xl font-mono">{score}점</span>
            </p>

            {!submitted ? (
              <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 w-full max-w-xs bg-slate-900/95 p-4 rounded-2xl border-2 border-amber-500/50 shadow-2xl">
                <label className="text-xs text-amber-300 font-black flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> 도촌 명예의 전당 점수 등록
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border-2 border-slate-600 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-amber-400 text-center"
                  maxLength={16}
                  required
                />
                <button type="submit" className="btn-gold text-xs font-black justify-center py-2.5">
                  <Trophy className="w-4 h-4 text-slate-950" /> 랭킹 등록하기
                </button>
              </form>
            ) : (
              <p className="text-teal-300 font-black bg-teal-950/80 border-2 border-teal-500/50 px-5 py-2 rounded-xl text-xs shadow-lg">
                ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cute Arcade Action Bar & Large 3-Row Touch D-Pad */}
      <div className="flex flex-col items-center justify-center w-full mt-2 px-2">

        {/* 1. Cute Action Pill Buttons Row */}
        <div className="arcade-action-bar">
          <button onClick={togglePause} className="btn-arcade-purple">
            {gameState === 'PAUSED' ? <Play className="w-4 h-4 fill-current text-yellow-300" /> : <Pause className="w-4 h-4 fill-current text-purple-100" />}
            <span>{gameState === 'PAUSED' ? '게임 재개' : '일시 정지'}</span>
          </button>

          <button onClick={restartGame} className="btn-arcade-emerald">
            <RotateCcw className="w-4 h-4 text-emerald-100" />
            <span>다시 시작</span>
          </button>

          <button onClick={() => setIsMuted(soundFx.toggleMute())} className="btn-arcade-amber">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-950" /> : <Volume2 className="w-4 h-4 text-slate-950" />}
            <span>{isMuted ? '음소거' : '소리 ON'}</span>
          </button>
        </div>

        {/* 2. Large & Cute 3-Row D-Pad Controller for Mobile, Tablet & Desktop */}
        <div className="dpad-panel">
          <div className="dpad-title">
            <span>🕹️ DOCHON TOUCH CONTROLLER</span>
          </div>

          {/* 3x3 Grid Layout for D-Pad */}
          <div className="dpad-grid-3x3">
            {/* Row 1: Top Center = UP (▲) */}
            <button
              type="button"
              onClick={() => setDirection(0, -1)}
              className="dpad-btn dpad-btn-up"
              title="위쪽 이동 (Up)"
            >
              <ArrowUp className="w-8 h-8 stroke-[3.5]" />
            </button>

            {/* Row 2: Left = LEFT (◀) */}
            <button
              type="button"
              onClick={() => setDirection(-1, 0)}
              className="dpad-btn dpad-btn-left"
              title="왼쪽 이동 (Left)"
            >
              <ArrowLeft className="w-8 h-8 stroke-[3.5]" />
            </button>

            {/* Row 2: Center = Mascot */}
            <div className="dpad-btn-center select-none">
              🟡
            </div>

            {/* Row 2: Right = RIGHT (▶) */}
            <button
              type="button"
              onClick={() => setDirection(1, 0)}
              className="dpad-btn dpad-btn-right"
              title="오른쪽 이동 (Right)"
            >
              <ArrowRight className="w-8 h-8 stroke-[3.5]" />
            </button>

            {/* Row 3: Bottom Center = DOWN (▼) */}
            <button
              type="button"
              onClick={() => setDirection(0, 1)}
              className="dpad-btn dpad-btn-down"
              title="아래쪽 이동 (Down)"
            >
              <ArrowDown className="w-8 h-8 stroke-[3.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
