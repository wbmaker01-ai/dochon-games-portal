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
  MIN: 65,     // max speed cap
  ACCEL_STEP: 2.5, // speed increase per apple
};

export const ITEM_TYPES = {
  APPLE: 'apple',         // +10 pts, +1 length
  ACORN: 'acorn',         // +50 pts (Golden acorn - temporary bonus)
  GRAPE: 'grape',         // +30 pts (Speed smooth buffer)
};
