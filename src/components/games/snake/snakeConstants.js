// Snake Game Constants & Configurations for Dochon Games Portal

export const GRID_COLS = 22;
export const GRID_ROWS = 16;
export const CELL_SIZE = 28;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE; // 616px
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE; // 448px

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const INITIAL_SNAKE = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
];

export const INITIAL_DIRECTION = DIRECTIONS.RIGHT;

export const GAME_SPEEDS = {
  INITIAL: 130, // ms per tick
  MIN: 28,     // Unlimited Hyper Drive speed floor (35+ tiles/sec)
  ACCEL_STEP: 3.2, // speed increase per apple
};

export const ITEM_TYPES = {
  APPLE: 'apple',         // +10 pts, +1 length
  ACORN: 'acorn',         // +50 pts (Golden acorn - temporary bonus)
  GRAPE: 'grape',         // +30 pts (Speed smooth buffer)
  OBSTACLE: 'obstacle'    // Danger rock block (Game Over on hit)
};

// 5-Stage Dynamic Neon Themes (Apples eaten based)
export const SNAKE_THEMES = [
  {
    id: 'CLASSIC',
    minApples: 0,
    name: '도촌 클래식 그린 ☀️',
    boardBg: '#0F172A',
    gridColor: 'rgba(30, 41, 59, 0.6)',
    snakeHead: '#22C55E',
    snakeBody: '#16A34A',
    borderColor: '#15803D',
    accent: '#22C55E'
  },
  {
    id: 'SUNSET',
    minApples: 10,
    name: '선셋 사이버 🌅',
    boardBg: '#180C06',
    gridColor: 'rgba(67, 20, 7, 0.6)',
    snakeHead: '#FB923C',
    snakeBody: '#EA580C',
    borderColor: '#C2410C',
    accent: '#F97316'
  },
  {
    id: 'CYBER_NEON',
    minApples: 22,
    name: '네온 사이버 스페이스 🌌',
    boardBg: '#050B14',
    gridColor: 'rgba(14, 116, 144, 0.5)',
    snakeHead: '#38BDF8',
    snakeBody: '#0284C7',
    borderColor: '#0369A1',
    accent: '#00F5D4'
  },
  {
    id: 'VIOLET_STORM',
    minApples: 36,
    name: '바이올렛 플라즈마 ⚡',
    boardBg: '#130826',
    gridColor: 'rgba(126, 34, 206, 0.5)',
    snakeHead: '#C084FC',
    snakeBody: '#9333EA',
    borderColor: '#7E22CE',
    accent: '#E879F9'
  },
  {
    id: 'HYPER_GOLD',
    minApples: 52,
    name: '골든 하이퍼 블리츠 👑',
    boardBg: '#1A1305',
    gridColor: 'rgba(202, 138, 4, 0.5)',
    snakeHead: '#FDE047',
    snakeBody: '#EAB308',
    borderColor: '#CA8A04',
    accent: '#FBBF24'
  }
];
