// Dochon Games Portal - School Tag (도촌 야간 학교 숨바꼭질) Constants
// 2D Fog of War Raycasting Lighting, Physics, Scoring & Network Constants

export const SCHOOL_TAG_CONSTANTS = {
  // Tile & World Grid Setup
  TILE_SIZE: 48,
  MAP_COLS: 26,
  MAP_ROWS: 18,
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 600,

  // Time & Match Settings
  MATCH_DURATION_SEC: 180, // 3 Minutes
  COUNTDOWN_SEC: 7,        // Hiding grace period for runners before tagger wakes up
  REQUIRED_KEYS: 3,        // Total keys needed to unlock the escape gate
  GATE_UNLOCK_TIME_SEC: 3, // Seconds needed in escape zone to escape

  // Player Attributes (Runners / Students)
  RUNNER_RADIUS: 14,
  RUNNER_WALK_SPEED: 135,
  RUNNER_RUN_SPEED: 220,
  RUNNER_STAMINA_MAX: 100,
  RUNNER_STAMINA_DRAIN_RATE: 30, // Per second while sprinting
  RUNNER_STAMINA_RECOVERY_RATE: 22, // Per second while walking or idle
  RUNNER_FOV_ANGLE: 75 * (Math.PI / 180), // 75-degree flashlight cone
  RUNNER_LIGHT_DISTANCE: 320,
  RUNNER_AMBIENT_LIGHT_RADIUS: 45, // Tiny self-ambient glow

  // Tagger Attributes (Night Patrol Teacher / School Ghost)
  TAGGER_RADIUS: 16,
  TAGGER_SPEED: 165, // Faster than runner walk, slower than runner sprint
  TAGGER_FOV_ANGLE: 110 * (Math.PI / 180),
  TAGGER_LIGHT_DISTANCE: 260,
  TAGGER_RED_AURA_RADIUS: 85, // Sinister red ambient glow
  HEARTBEAT_TRIGGER_DISTANCE: 320, // Distance to hear frantic heartbeat

  // Stealth & Noise System
  RUN_NOISE_WAVE_INTERVAL: 0.22, // Spawn footstep soundwave every 0.22s while running
  WALK_NOISE_WAVE_INTERVAL: 0.7,
  NOISE_WAVE_LIFETIME: 1.2,

  // Locker / Hiding Places
  HIDING_DISTANCE: 42,
  UNHIDE_COOLDOWN: 1.0,

  // Scoring Rule Constants
  SCORE_ESCAPE_SUCCESS: 1200,
  SCORE_TIME_BONUS_PER_SEC: 10,
  SCORE_KEY_COLLECTED: 300,
  SCORE_TEAMMATE_RESCUE: 500,
  SCORE_SURVIVAL_TIME_PER_SEC: 3,

  // P2P WebRTC Network Settings
  PEER_PREFIX: 'dochon-schooltag-',
  SYNC_RATE_HZ: 20, // 20 updates per second
};

export const ROLE_TYPES = {
  RUNNER: 'RUNNER',
  TAGGER: 'TAGGER',
};

export const GAME_STATES = {
  MENU: 'MENU',
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
};

export const CHARACTER_SKINS = [
  { id: 'boy', name: '도촌 남학생', role: '도망자', color: '#38bdf8', icon: '👦' },
  { id: 'girl', name: '도촌 여학생', role: '도망자', color: '#f472b6', icon: '👧' },
  { id: 'detective', name: '추리 탐정', role: '도망자', color: '#fbbf24', icon: '🕵️' },
  { id: 'ghost', name: '당직 도깨비', role: '술래', color: '#ef4444', icon: '👹' },
];
