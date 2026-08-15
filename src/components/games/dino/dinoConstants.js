// Dino Runner Constants & Configurations
export const CANVAS_WIDTH = 760;
export const CANVAS_HEIGHT = 290;
export const GROUND_Y = 224;

export const INITIAL_PLAYER_STATE = {
  x: 70,
  y: GROUND_Y - 56,
  width: 52,
  height: 56,
  vy: 0,
  gravity: 0.76,
  jumpForce: -13.6,
  isGrounded: true,
  isDucking: false,
  rotation: 0,
  animTimer: 0,
};

export const INITIAL_GAME_CONFIG = {
  speed: 6.5,
  score: 0,
  nextObstacleTimer: 30,
  bgScroll: 0,
  bgPhase: 'DAY',
};
