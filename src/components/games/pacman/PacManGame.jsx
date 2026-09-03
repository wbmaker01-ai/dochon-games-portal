import React, { useEffect, useRef, useState } from 'react';
import { DOCHON_MAZE_GRID, TILE_SIZE, COLS, ROWS, LETTER_REGIONS } from './mazeData';
import { soundFx } from '../../../utils/audio';
import { saveScore, getHighScore } from '../../../utils/leaderboard';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import './pacman.css';

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
    invincibleUntil: 0,
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
    haptics.light();
    const g = gameStateRef.current;
    g.pacman.nextDx = dx;
    g.pacman.nextDy = dy;
    if (gameState === 'IDLE') {
      g.invincibleUntil = Date.now() + 3000;
      triggerComboMsg('🛡️ 3초 무적 보호막 발동!');
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
    g.invincibleUntil = Date.now() + 3000;
    setScore(0);
    setLives(3);
    setSubmitted(false);
    triggerComboMsg('🛡️ 3초 무적 보호막 발동!');
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
      if (y < 0 || y >= ROWS) return true;
      if (x < 0) return gameStateRef.current.grid[y][COLS - 1] === 1;
      if (x >= COLS) return gameStateRef.current.grid[y][0] === 1;
      return gameStateRef.current.grid[y][x] === 1;
    };

    const updateGame = () => {
      const g = gameStateRef.current;
      if (gameState !== 'PLAYING') return;

      const p = g.pacman;
      if (p.nextDx !== 0 || p.nextDy !== 0) {
        let testX = p.x + p.nextDx;
        let testY = p.y + p.nextDy;
        if (testX < 0) testX = COLS - 1;
        else if (testX >= COLS) testX = 0;

        if (!isWall(testX, testY)) {
          p.dx = p.nextDx;
          p.dy = p.nextDy;
        }
      }

      if (p.dx !== 0 || p.dy !== 0) {
        let nextX = p.x + p.dx;
        let nextY = p.y + p.dy;

        // Teleport wrap across left & right edges
        if (nextX < 0) nextX = COLS - 1;
        else if (nextX >= COLS) nextX = 0;

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
        // 1. Find all unblocked adjacent directions with teleport support
        const moves = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        const allMoves = moves.filter(m => {
          let tx = ghost.x + m.dx;
          let ty = ghost.y + m.dy;
          if (tx < 0) tx = COLS - 1;
          else if (tx >= COLS) tx = 0;
          return !isWall(tx, ty);
        });

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
              let tx = ghost.x + m.dx;
              if (tx < 0) tx = COLS - 1;
              else if (tx >= COLS) tx = 0;
              const distM = Math.abs(tx - p.x) + Math.abs((ghost.y + m.dy) - p.y);

              let bx = ghost.x + best.dx;
              if (bx < 0) bx = COLS - 1;
              else if (bx >= COLS) bx = 0;
              const distBest = Math.abs(bx - p.x) + Math.abs((ghost.y + best.dy) - p.y);

              return distM < distBest ? m : best;
            }, validMoves[0]);
          } else {
            chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          }

          ghost.dx = chosenMove.dx;
          ghost.dy = chosenMove.dy;
          ghost.x += ghost.dx;
          ghost.y += ghost.dy;

          // Wrap ghost across left & right teleport portals
          if (ghost.x < 0) ghost.x = COLS - 1;
          else if (ghost.x >= COLS) ghost.x = 0;
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
            const isInvincible = Date.now() < g.invincibleUntil;
            if (!isInvincible) {
              soundFx.playGameOver();
              g.lives--;
              setLives(g.lives);
              if (g.lives <= 0) {
                setGameState('GAMEOVER');
                if (g.score > highScore) setHighScore(g.score);
              } else {
                p.x = 16; p.y = 11; p.dx = 0; p.dy = 0; p.nextDx = 0; p.nextDy = 0;
                g.invincibleUntil = Date.now() + 3000;
                triggerComboMsg('🛡️ 3초 무적 보호막 발동!');
              }
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
      const isInvincible = Date.now() < g.invincibleUntil;

      // Draw Invincibility Forcefield Bubble
      if (isInvincible) {
        const shieldPulse = Math.sin(Date.now() / 70) * 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, radius + 5 + shieldPulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#00F5D4';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00F5D4';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(0, 245, 212, 0.22)';
        ctx.fill();
        ctx.stroke();

        // Orbiting golden spark
        const sparkAngle = (Date.now() / 160) % (Math.PI * 2);
        const sparkX = px + Math.cos(sparkAngle) * (radius + 5.5);
        const sparkY = py + Math.sin(sparkAngle) * (radius + 5.5);
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Shield status badge
        ctx.fillStyle = '#00F5D4';
        ctx.font = '900 8.5px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ 무적', px, py - radius - 7);
        ctx.restore();
      }

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

      // Blinking effect when invincible
      if (isInvincible) {
        ctx.globalAlpha = Math.floor(Date.now() / 120) % 2 === 0 ? 1 : 0.45;
      }

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

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const gameLoop = (time) => {
      try {
        if (time - lastTime > 140) {
          updateGame();
          lastTime = time;
        }

        const elapsed = time - lastRenderTime;
        if (elapsed >= FRAME_INTERVAL) {
          lastRenderTime = time - (elapsed % FRAME_INTERVAL);
          draw();
        }
      } catch (err) {
        console.error('[PacMan Loop Error]', err);
      } finally {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    lastRenderTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || score <= 100) return;
    saveScore('pacman', studentName, score);
    await submitScoreToDB('pacman', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  return (
    <div className="pacman-game-wrap">
      {/* 1. Header Bar with Dedicated CSS Styling */}
      <div className="pacman-header-hud">
        {/* Title */}
        <div className="pacman-title-group">
          <span className="pacman-title-text">🕹️ Dochon Pac-Man</span>
          <span className="pacman-map-badge">D-O-C-H-O-N 미로 맵</span>
        </div>

        {/* Row 1: 현재 점수 100점 / 최고 점수 3,250점 (한 줄에 나란히) */}
        <div className="pacman-score-row">
          <div className="pacman-score-pill">
            <span className="pacman-pill-label">현재 점수</span>
            <span className="pacman-pill-val-amber">{score.toLocaleString()}점</span>
          </div>
          <span className="pacman-score-divider">/</span>
          <div className="pacman-score-pill pill-teal">
            <span className="pacman-pill-label">최고 점수</span>
            <span className="pacman-pill-val-teal">{highScore.toLocaleString()}점</span>
          </div>
        </div>

        {/* Row 2: 목숨 💖 💖 💖 (한 줄에 나란히) */}
        <div className="pacman-lives-row">
          <div className="pacman-lives-pill">
            <span className="pacman-pill-label">목숨</span>
            <div className="pacman-hearts-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={i < lives ? 'pacman-heart-active' : 'pacman-heart-lost'}
                >
                  💖
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Reserved Fixed-Height Announcement Ribbon */}
      <div className="pacman-ribbon-container">
        {comboText ? (
          <div className="pacman-ribbon-badge">
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
            <span>{comboText}</span>
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
          </div>
        ) : null}
      </div>

      {/* 3. Main Canvas Container */}
      <div className="pacman-canvas-container">
        <canvas
          ref={canvasRef}
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
          className="pacman-canvas"
        />

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="pacman-overlay-screen">
            <h3 className="pacman-overlay-title">
              도촌 팩맨 (DOCHON PAC-MAN)
            </h3>
            <p className="pacman-overlay-desc">
              알파벳 <strong>D O C H O N</strong>으로 디자인된 도촌초등학교 팩맨 미로!<br />
              키보드 방향키(W/A/S/D) 또는 아래 십자키로 조작하며<br />
              <span className="highlight-pink">도촌 급식 햄버거(파워 구슬)</span>를 먹고 유령을 물리치세요!
            </p>
            <button onClick={restartGame} className="btn-gold text-base px-8 py-3 animate-pulse shadow-2xl">
              <Play className="w-5 h-5 fill-current" /> 게임 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="pacman-overlay-screen pointer-events-none">
            <h3 className="pacman-overlay-title">
              ⏸️ 일시 정지
            </h3>
            <p className="pacman-overlay-desc">
              하단의 [게임 재개] 버튼을 누르면 이어서 진행됩니다
            </p>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="pacman-overlay-screen">
            <h3 className={`pacman-overlay-title ${gameState === 'VICTORY' ? 'title-victory' : 'title-gameover'}`}>
              {gameState === 'VICTORY' ? '🎉 전교 1위 등극! 축하합니다!' : '💀 유령에게 잡혔습니다!'}
            </h3>
            <p className="pacman-final-score">
              최종 획득 점수: <span className="pacman-final-score-val">{score.toLocaleString()}점</span>
            </p>

            {score > 100 ? (
              !submitted ? (
                <form onSubmit={handleScoreSubmit} className="pacman-score-form">
                  <div className="pacman-score-form__header">
                    <Sparkles className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                    <span>도촌 명예의 전당 점수 등록</span>
                  </div>
                  <div className="pacman-score-form__input-wrap">
                    <span className="pacman-score-form__input-icon">✏️</span>
                    <input
                      type="text"
                      placeholder="예: 홍길동"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="pacman-score-form__input"
                      maxLength={16}
                      required
                    />
                  </div>
                  <button type="submit" className="pacman-score-form__submit">
                    <Trophy className="w-4 h-4" /> 랭킹 등록하기
                  </button>
                </form>
              ) : (
                <p className="pacman-success-badge">
                  ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
                </p>
              )
            ) : (
              <div className="pacman-low-score-notice">
                <p className="text-xs text-amber-300 font-bold mb-1">
                  💡 100점 초과 달성 시 랭킹에 등록할 수 있어요!
                </p>
                <p className="text-[11px] text-slate-400">
                  다시 도전해서 더 높은 점수를 노려보세요 🔥
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cute Arcade Action Bar & Large 3-Row Touch D-Pad */}
      <div className="pacman-bottom-controls">

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
              <ArrowUp className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>

            {/* Row 2: Left = LEFT (◀) */}
            <button
              type="button"
              onClick={() => setDirection(-1, 0)}
              className="dpad-btn dpad-btn-left"
              title="왼쪽 이동 (Left)"
            >
              <ArrowLeft className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>

            {/* Row 2: Center = Joystick Pivot Dot */}
            <div className="dpad-btn-center select-none" title="도촌 아케이드 조이스틱 코어">
              <div className="dpad-center-core" />
            </div>

            {/* Row 2: Right = RIGHT (▶) */}
            <button
              type="button"
              onClick={() => setDirection(1, 0)}
              className="dpad-btn dpad-btn-right"
              title="오른쪽 이동 (Right)"
            >
              <ArrowRight className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>

            {/* Row 3: Bottom Center = DOWN (▼) */}
            <button
              type="button"
              onClick={() => setDirection(0, 1)}
              className="dpad-btn dpad-btn-down"
              title="아래쪽 이동 (Down)"
            >
              <ArrowDown className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
