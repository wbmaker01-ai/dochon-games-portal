import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundFx } from '../../../utils/audio';
import { saveScore, getHighScore } from '../../../utils/leaderboard';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  GRID_COLS,
  GRID_ROWS,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DIRECTIONS,
  INITIAL_SNAKE,
  INITIAL_DIRECTION,
  GAME_SPEEDS,
  ITEM_TYPES,
  SNAKE_THEMES
} from './snakeConstants';

export default function SnakeGame({ onScoreSubmitted }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('snake'));
  const [gameState, setGameState] = useState('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [comboBadge, setComboBadge] = useState('');
  const [gameOverReason, setGameOverReason] = useState('장애물에 충돌했습니다!');
  const [snakeLength, setSnakeLength] = useState(INITIAL_SNAKE.length);

  // Mutable Game State Ref for High-Precision 60fps Loop
  const stateRef = useRef({
    snake: [...INITIAL_SNAKE],
    dir: INITIAL_DIRECTION,
    nextDir: INITIAL_DIRECTION,
    food: { x: 15, y: 8, type: ITEM_TYPES.APPLE },
    specialItem: null, // { x, y, type: 'acorn' | 'grape', timer: 120, maxTimer: 120 }
    obstacles: [], // Danger stone blocks: [{ x, y }]
    particles: [],
    speed: GAME_SPEEDS.INITIAL,
    lastTick: 0,
    animFrame: 0,
    tongueOut: false,
    scoreVal: 0,
    applesCount: 0,
  });

  const triggerBadge = useCallback((text) => {
    setComboBadge(text);
    setTimeout(() => setComboBadge(''), 1400);
  }, []);

  // Spawn random regular food or special bonus
  const spawnFood = useCallback((snakeBody, obstacles = []) => {
    const occupied = new Set(snakeBody.map(s => `${s.x},${s.y}`));
    obstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));
    const emptyCells = [];

    for (let x = 0; x < GRID_COLS; x++) {
      for (let y = 0; y < GRID_ROWS; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return { x: 0, y: 0, type: ITEM_TYPES.APPLE };
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return { ...randCell, type: ITEM_TYPES.APPLE };
  }, []);

  const spawnObstacle = useCallback((snakeBody, currentFood, obstacles = []) => {
    const occupied = new Set(snakeBody.map(s => `${s.x},${s.y}`));
    if (currentFood) occupied.add(`${currentFood.x},${currentFood.y}`);
    obstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

    // Don't spawn adjacent to snake head
    const head = snakeBody[0];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        occupied.add(`${head.x + dx},${head.y + dy}`);
      }
    }

    const emptyCells = [];
    for (let x = 1; x < GRID_COLS - 1; x++) {
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }, []);

  const spawnSpecialItem = useCallback((snakeBody, currentFood, obstacles = []) => {
    const occupied = new Set(snakeBody.map(s => `${s.x},${s.y}`));
    if (currentFood) occupied.add(`${currentFood.x},${currentFood.y}`);
    obstacles.forEach(ob => occupied.add(`${ob.x},${ob.y}`));

    const emptyCells = [];
    for (let x = 1; x < GRID_COLS - 1; x++) {
      for (let y = 1; y < GRID_ROWS - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length === 0) return null;
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const type = Math.random() < 0.6 ? ITEM_TYPES.ACORN : ITEM_TYPES.GRAPE;
    return { ...randCell, type, timer: 140, maxTimer: 140 };
  }, []);

  // Direction Change Handler (Prevents Instant 180 Reverse Suicide)
  const changeDirection = useCallback((newDir) => {
    soundFx.init();
    const currentDir = stateRef.current.dir;
    // Disallow exact reverse direction
    if (currentDir.x + newDir.x === 0 && currentDir.y + newDir.y === 0) {
      return;
    }
    haptics.light();
    stateRef.current.nextDir = newDir;
    soundFx.playSnakeTurn();
  }, []);

  // Restart / Start Game
  const restartGame = useCallback(() => {
    soundFx.init();
    const s = stateRef.current;
    s.snake = [
      { x: 7, y: 8 },
      { x: 6, y: 8 },
      { x: 5, y: 8 },
    ];
    s.dir = DIRECTIONS.RIGHT;
    s.nextDir = DIRECTIONS.RIGHT;
    s.obstacles = [];
    s.food = spawnFood(s.snake, s.obstacles);
    s.specialItem = null;
    s.particles = [];
    s.speed = GAME_SPEEDS.INITIAL;
    s.lastTick = performance.now();
    s.scoreVal = 0;
    s.applesCount = 0;

    setScore(0);
    setApplesEaten(0);
    setSnakeLength(3);
    setSubmitted(false);
    setGameState('PLAYING');
  }, [spawnFood]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
          restartGame();
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
        return;
      }

      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'IDLE') restartGame();
        else changeDirection(DIRECTIONS.UP);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'IDLE') restartGame();
        else changeDirection(DIRECTIONS.DOWN);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'IDLE') restartGame();
        else changeDirection(DIRECTIONS.LEFT);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        if (gameState === 'IDLE') restartGame();
        else changeDirection(DIRECTIONS.RIGHT);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, restartGame, changeDirection]);

  // Score Submit Handler
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || score <= 100) return;
    await submitScoreToDB('snake', studentName, score);
    setSubmitted(true);
    if (onScoreSubmitted) onScoreSubmitted();
  };

  // Main 60fps Animation and Fixed-Interval Tick Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const spawnJuiceParticles = (cx, cy, color, count = 10) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
        const spd = Math.random() * 3 + 1.5;
        stateRef.current.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          radius: Math.random() * 3.5 + 2,
          color,
          alpha: 1,
          life: 20 + Math.random() * 10,
        });
      }
    };

    const updateGame = () => {
      const s = stateRef.current;
      s.dir = s.nextDir;
      const head = s.snake[0];
      const newHead = {
        x: head.x + s.dir.x,
        y: head.y + s.dir.y,
      };

      // 1. Check Wall Collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_COLS ||
        newHead.y < 0 ||
        newHead.y >= GRID_ROWS
      ) {
        soundFx.playGameOver();
        setGameOverReason('벽에 부딪혔습니다!');
        setGameState('GAMEOVER');
        if (s.scoreVal > highScore) {
          setHighScore(s.scoreVal);
          saveScore('snake', s.scoreVal);
        }
        return;
      }

      // 2. Check Obstacle (Rock Block) Collision
      for (let ob of s.obstacles) {
        if (ob.x === newHead.x && ob.y === newHead.y) {
          soundFx.playGameOver();
          setGameOverReason('단단한 암석 장애물에 충돌했습니다!');
          setGameState('GAMEOVER');
          if (s.scoreVal > highScore) {
            setHighScore(s.scoreVal);
            saveScore('snake', s.scoreVal);
          }
          return;
        }
      }

      // 3. Check Self Collision (Snake Body)
      for (let i = 0; i < s.snake.length - 1; i++) {
        if (s.snake[i].x === newHead.x && s.snake[i].y === newHead.y) {
          soundFx.playGameOver();
          setGameOverReason('자신의 몸에 부딪혔습니다!');
          setGameState('GAMEOVER');
          if (s.scoreVal > highScore) {
            setHighScore(s.scoreVal);
            saveScore('snake', s.scoreVal);
          }
          return;
        }
      }

      // Move Snake forward
      s.snake.unshift(newHead);

      let grew = false;

      // 4. Check Food Collision (Regular Apple)
      if (newHead.x === s.food.x && newHead.y === s.food.y) {
        grew = true;
        s.applesCount += 1;
        s.scoreVal += 10;
        setScore(s.scoreVal);
        setApplesEaten(s.applesCount);
        setSnakeLength(s.snake.length);

        soundFx.playSnakeEat();
        haptics.medium();
        spawnJuiceParticles(
          s.food.x * CELL_SIZE + CELL_SIZE / 2,
          s.food.y * CELL_SIZE + CELL_SIZE / 2,
          '#EF4444',
          14
        );

        // Gradually speed up (No hard ceiling down to 28ms)
        s.speed = Math.max(GAME_SPEEDS.MIN, GAME_SPEEDS.INITIAL - s.applesCount * GAME_SPEEDS.ACCEL_STEP);

        // Spawn Danger Obstacle every 7 apples (up to 12 obstacles)
        if (s.applesCount % 7 === 0 && s.obstacles.length < 12) {
          const newOb = spawnObstacle(s.snake, s.food, s.obstacles);
          if (newOb) {
            s.obstacles.push(newOb);
            triggerBadge('⚠️ 새로운 암석 장애물 출현!');
            haptics.warning();
          }
        }

        // Milestone Alerts
        if (s.applesCount % 5 === 0) {
          haptics.heavy();
          soundFx.playMilestone();
          triggerBadge(`🍎 ${s.applesCount}개 사과 달성! (+${s.scoreVal}점)`);
          confetti({
            particleCount: 28,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#22C55E', '#EF4444', '#FBBF24'],
          });
        }

        // Spawn new Food
        s.food = spawnFood(s.snake, s.obstacles);

        // Random chance or count threshold to spawn special bonus
        if (!s.specialItem && Math.random() < 0.45) {
          s.specialItem = spawnSpecialItem(s.snake, s.food, s.obstacles);
        }
      }

      // 4. Check Special Bonus Item Collision
      if (s.specialItem && newHead.x === s.specialItem.x && newHead.y === s.specialItem.y) {
        const item = s.specialItem;
        const pts = item.type === ITEM_TYPES.ACORN ? 50 : 30;
        s.scoreVal += pts;
        setScore(s.scoreVal);
        soundFx.playSnakeBonus();

        const pColor = item.type === ITEM_TYPES.ACORN ? '#F59E0B' : '#A855F7';
        spawnJuiceParticles(
          item.x * CELL_SIZE + CELL_SIZE / 2,
          item.y * CELL_SIZE + CELL_SIZE / 2,
          pColor,
          20
        );

        triggerBadge(
          item.type === ITEM_TYPES.ACORN
            ? `🌰 도촌 황금 도토리 획득! (+${pts}점)`
            : `🍇 비타민 포도 획득! (+${pts}점)`
        );

        confetti({
          particleCount: 35,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#FBBF24', '#A855F7'],
        });

        s.specialItem = null;
      }

      // If no food was eaten, trim the tail
      if (!grew) {
        s.snake.pop();
      }

      // Tick special item countdown timer
      if (s.specialItem) {
        s.specialItem.timer -= 1;
        if (s.specialItem.timer <= 0) {
          s.specialItem = null;
        }
      }
    };

    const getCurrentTheme = (applesCount) => {
      for (let i = SNAKE_THEMES.length - 1; i >= 0; i--) {
        if (applesCount >= SNAKE_THEMES[i].minApples) {
          return SNAKE_THEMES[i];
        }
      }
      return SNAKE_THEMES[0];
    };

    const drawGrid = (curTheme) => {
      // Dynamic Theme Checkered Board
      for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS; r++) {
          const isEven = (c + r) % 2 === 0;
          ctx.fillStyle = isEven ? curTheme.boardBg : '#0B1120';
          ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }

      // Soft grid line accents
      ctx.strokeStyle = curTheme.gridColor;
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * CELL_SIZE);
        ctx.stroke();
      }
    };

    const drawObstacles = (obstacles) => {
      for (let ob of obstacles) {
        const ox = ob.x * CELL_SIZE + CELL_SIZE / 2;
        const oy = ob.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(ox, oy);

        // Stone Block Base
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-CELL_SIZE * 0.42, -CELL_SIZE * 0.42, CELL_SIZE * 0.84, CELL_SIZE * 0.84, 4);
        ctx.fill();
        ctx.stroke();

        // 3D Bevel Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-CELL_SIZE * 0.38, -CELL_SIZE * 0.38, CELL_SIZE * 0.76, 3);

        // Danger Warning Sign
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪨', 0, 1);

        ctx.restore();
      }
    };

    const drawFood = (food, frameCount) => {
      const cx = food.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = food.y * CELL_SIZE + CELL_SIZE / 2;
      const bounce = Math.sin(frameCount * 0.12) * 2;

      ctx.save();
      ctx.translate(cx, cy + bounce);

      // Apple Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 10 - bounce, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Apple Body
      const radGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 11);
      radGrad.addColorStop(0, '#FF6B6B');
      radGrad.addColorStop(0.7, '#EF4444');
      radGrad.addColorStop(1, '#B91C1C');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(-4, 0, 8, 0, Math.PI * 2);
      ctx.arc(4, 0, 8, 0, Math.PI * 2);
      ctx.arc(0, 3, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Apple Stem & Leaf
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(2, -11, 4, -12);
      ctx.stroke();

      // Green Leaf
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.ellipse(4, -10, 4, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Glossy specular highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-4, -4, 3, 1.5, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSpecialItem = (item, frameCount) => {
      const cx = item.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = item.y * CELL_SIZE + CELL_SIZE / 2;
      const pulse = Math.sin(frameCount * 0.15) * 1.5;

      ctx.save();
      ctx.translate(cx, cy);

      // Countdown Ring Gauge
      const pct = item.timer / item.maxTimer;
      ctx.strokeStyle = item.type === ITEM_TYPES.ACORN ? '#F59E0B' : '#C084FC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE / 2 - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = item.type === ITEM_TYPES.ACORN ? '#FBBF24' : '#A855F7';
      ctx.shadowBlur = 10;

      if (item.type === ITEM_TYPES.ACORN) {
        // Golden Acorn
        ctx.fillStyle = '#D97706';
        ctx.beginPath();
        ctx.arc(0, 2 + pulse, 7.5, 0, Math.PI);
        ctx.lineTo(0, 10 + pulse);
        ctx.closePath();
        ctx.fill();

        // Cap
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.arc(0, 0 + pulse, 8.5, Math.PI, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8 + pulse);
        ctx.lineTo(0, -3 + pulse);
        ctx.stroke();
      } else {
        // Vitamin Grapes
        ctx.fillStyle = '#9333EA';
        const grapeOffsets = [
          { x: -4, y: -4 },
          { x: 4, y: -4 },
          { x: 0, y: 0 },
          { x: -3, y: 5 },
          { x: 3, y: 5 },
          { x: 0, y: 9 },
        ];
        grapeOffsets.forEach((pos) => {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y + pulse, 3.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();
    };

    const drawSnake = (snake, dir, frameCount, curTheme) => {
      if (snake.length === 0) return;

      const head = snake[0];

      // Draw Body Segments (from tail to head for proper layer ordering)
      for (let i = snake.length - 1; i >= 1; i--) {
        const seg = snake[i];
        const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;

        const isTail = i === snake.length - 1;
        const progress = 1 - i / snake.length; // 1 at neck, 0 at tail
        const segRadius = isTail ? CELL_SIZE * 0.32 : CELL_SIZE * (0.38 + progress * 0.08);

        // Body Gradient with Theme Colors
        const grad = ctx.createRadialGradient(
          segX - 2,
          segY - 2,
          1,
          segX,
          segY,
          segRadius
        );
        grad.addColorStop(0, curTheme.snakeHead);
        grad.addColorStop(0.7, curTheme.snakeBody);
        grad.addColorStop(1, curTheme.borderColor);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(segX, segY, segRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Head
      const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const hy = head.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.save();
      ctx.translate(hx, hy);

      let angle = 0;
      if (dir === DIRECTIONS.RIGHT) angle = 0;
      else if (dir === DIRECTIONS.DOWN) angle = Math.PI / 2;
      else if (dir === DIRECTIONS.LEFT) angle = Math.PI;
      else if (dir === DIRECTIONS.UP) angle = -Math.PI / 2;

      ctx.rotate(angle);

      // Head Base Shape with Glowing Aura
      ctx.shadowColor = curTheme.accent;
      ctx.shadowBlur = 10;
      const headGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, CELL_SIZE * 0.48);
      headGrad.addColorStop(0, curTheme.snakeHead);
      headGrad.addColorStop(0.7, curTheme.snakeBody);
      headGrad.addColorStop(1, curTheme.borderColor);

      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(0, 0, CELL_SIZE * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cute Snout Nose
      ctx.fillStyle = curTheme.snakeHead;
      ctx.beginPath();
      ctx.ellipse(CELL_SIZE * 0.35, 0, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute Animated Flicking Tongue
      const isTongueFlicking = (frameCount % 30) < 14;
      if (isTongueFlicking) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE * 0.44, 0);
        ctx.lineTo(CELL_SIZE * 0.44 + 9, 0);
        // Forked Tip
        ctx.lineTo(CELL_SIZE * 0.44 + 13, -3);
        ctx.moveTo(CELL_SIZE * 0.44 + 9, 0);
        ctx.lineTo(CELL_SIZE * 0.44 + 13, 3);
        ctx.stroke();
      }

      // Eyes (White base + Dilated cute pupils looking towards direction)
      const eyeOffsets = [
        { x: 3, y: -6 },
        { x: 3, y: 6 },
      ];

      eyeOffsets.forEach((pos) => {
        // Eye White
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye Pupil
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(pos.x + 1.2, pos.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye Specular Highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x + 1.8, pos.y - 1, 1, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    const drawParticles = () => {
      const s = stateRef.current;
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 1 / p.life;

        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    let frameCount = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS; // 33.33ms
    let lastRenderTime = performance.now();

    const gameLoop = (timestamp) => {
      try {
        const s = stateRef.current;

        // Fixed tick step for accurate grid movements
        if (gameState === 'PLAYING') {
          if (!s.lastTick) s.lastTick = timestamp;
          const elapsed = timestamp - s.lastTick;

          if (elapsed >= s.speed) {
            updateGame();
            s.lastTick = timestamp;
          }
        }

        const renderElapsed = timestamp - lastRenderTime;
        if (renderElapsed >= FRAME_INTERVAL) {
          lastRenderTime = timestamp - (renderElapsed % FRAME_INTERVAL);
          frameCount++;

          const curTheme = getCurrentTheme(s.applesCount);

          // Draw Everything (Capped at 30FPS for 50% GPU Reduction)
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          drawGrid(curTheme);
          drawObstacles(s.obstacles);
          drawParticles();

          if (s.food) {
            drawFood(s.food, frameCount);
          }

          if (s.specialItem) {
            drawSpecialItem(s.specialItem, frameCount);
          }

          drawSnake(s.snake, s.dir, frameCount, curTheme);
        }
      } catch (err) {
        console.error('[Snake Loop Error]', err);
      } finally {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    lastRenderTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, highScore, spawnFood, spawnSpecialItem, spawnObstacle, triggerBadge]);

  return (
    <div className="snake-container">
      {/* Header Bar */}
      <div className="snake-header">
        <div className="snake-title-wrap">
          <span className="snake-title">🐍 Dochon Snake Master</span>
          <span className="snake-badge">도촌초 꿈나무 스네이크</span>
        </div>
        <div className="snake-score-wrap">
          {(() => {
            let curTheme = SNAKE_THEMES[0];
            for (let i = SNAKE_THEMES.length - 1; i >= 0; i--) {
              if (applesEaten >= SNAKE_THEMES[i].minApples) {
                curTheme = SNAKE_THEMES[i];
                break;
              }
            }
            return (
              <div style={{ color: curTheme.accent, fontWeight: 800 }}>
                테마: <span>{curTheme.name.split(' ')[0]}</span>
              </div>
            );
          })()}
          <div>
            현재 점수: <span className="snake-score-val">{score}점</span>
          </div>
          <div>
            먹은 사과: <span className="snake-apple-val">🍎 {applesEaten}개</span>
          </div>
          <div>
            최고 기록: <span className="snake-high-val">{highScore}점</span>
          </div>
        </div>
      </div>

      {/* Main Canvas & Overlays */}
      <div className="snake-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {comboBadge && (
          <div className="snake-combo-badge">
            {comboBadge}
          </div>
        )}

        {/* Overlay States */}
        {gameState === 'IDLE' && (
          <div className="snake-overlay">
            <h3 className="snake-overlay-title">도촌 스네이크 시작!</h3>
            <p className="snake-overlay-desc">
              <span style={{ color: '#34D399', fontWeight: 900 }}>방향키(↑↓←→) / WASD</span> 키 또는 <span style={{ color: '#FBBF24', fontWeight: 900 }}>아래 십자키</span>로 뱀을 조종하여<br />
              맛있는 <span style={{ color: '#EF4444', fontWeight: 900 }}>도촌 사과 🍎</span>와 <span style={{ color: '#FBBF24', fontWeight: 900 }}>황금 도토리 🌰</span>를 먹어보세요!<br />
              <span style={{ color: '#F87171', fontWeight: 800 }}>벽이나 자신의 몸통에 부딪히면 게임이 종료됩니다.</span>
            </p>
            <button onClick={restartGame} className="btn-gold text-base md:text-lg px-8 py-3 animate-pulse shadow-2xl">
              <Play className="w-5 h-5 fill-current" /> 게임 시작하기
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="snake-overlay">
            <h3 className="snake-overlay-title" style={{ color: '#34D399' }}>일시 정지</h3>
            <button onClick={() => setGameState('PLAYING')} className="btn-gold text-sm md:text-base px-6 py-2.5 shadow-xl">
              <Play className="w-4 h-4 fill-current" /> 계속하기
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="snake-overlay">
            <h3 className="snake-overlay-title" style={{ color: '#F87171' }}>
              💥 {gameOverReason}
            </h3>
            <p style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', margin: '4px 0' }}>
              최종 점수: <span className="snake-score-val" style={{ fontSize: '26px' }}>{score}점</span>
              <span style={{ fontSize: '13px', color: '#94A3B8', marginLeft: '8px' }}>
                (사과 {applesEaten}개 / 길이 {snakeLength})
              </span>
            </p>

            {score > 100 ? (
              !submitted ? (
                <form onSubmit={handleScoreSubmit} className="snake-score-form">
                  <label style={{ fontSize: '12px', color: '#34D399', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Sparkles style={{ width: '14px', height: '14px' }} /> 도촌 명예의 전당 점수 등록
                  </label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="snake-score-input"
                    maxLength={16}
                    required
                  />
                  <button type="submit" className="btn-gold text-xs font-black justify-center py-2.5 shadow-lg">
                    <Trophy className="w-4 h-4 text-slate-950" /> 랭킹 등록하기
                  </button>
                </form>
              ) : (
                <p style={{ color: '#34D399', fontWeight: 900, background: 'rgba(6, 78, 59, 0.8)', border: '1.5px solid #10B981', padding: '8px 18px', borderRadius: '12px' }}>
                  ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
                </p>
              )
            ) : (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '10px 16px', borderRadius: '14px', maxWidth: '300px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#34D399', fontWeight: 800, marginBottom: '2px' }}>
                  💡 100점 초과 달성 시 랭킹에 등록할 수 있어요!
                </p>
                <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                  사과를 더 많이 먹고 100점을 돌파해보세요 🐍
                </p>
              </div>
            )}

            <button onClick={restartGame} className="btn-gold" style={{ marginTop: '6px' }}>
              <RotateCcw style={{ width: '18px', height: '18px' }} /> 다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* Cute Arcade Action Bar & Large 3-Row Touch D-Pad (Dochon Pac-Man Style) */}
      <div className="flex flex-col items-center justify-center w-full mt-3 px-2">

        {/* 1. Cute Action Pill Buttons Row */}
        <div className="arcade-action-bar">
          <button
            onClick={() => {
              if (gameState === 'PLAYING') setGameState('PAUSED');
              else if (gameState === 'PAUSED') setGameState('PLAYING');
            }}
            className="btn-arcade-purple"
          >
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
              onClick={() => changeDirection(DIRECTIONS.UP)}
              className="dpad-btn dpad-btn-up"
              title="위쪽 이동 (Up)"
            >
              <ArrowUp className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>

            {/* Row 2: Left = LEFT (◀) */}
            <button
              type="button"
              onClick={() => changeDirection(DIRECTIONS.LEFT)}
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
              onClick={() => changeDirection(DIRECTIONS.RIGHT)}
              className="dpad-btn dpad-btn-right"
              title="오른쪽 이동 (Right)"
            >
              <ArrowRight className="w-9 h-9 stroke-[3.5] drop-shadow-sm" />
            </button>

            {/* Row 3: Bottom Center = DOWN (▼) */}
            <button
              type="button"
              onClick={() => changeDirection(DIRECTIONS.DOWN)}
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
