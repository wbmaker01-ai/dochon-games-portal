// Dochon Games Portal - The Great Ghoul Duel (도촌 영혼 대결) Constants & Config

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 600;

// Mansion Map Dimensions (Spacious Arena)
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1200;
export const TILE_SIZE = 60;

// Match Duration
export const MATCH_DURATION_SEC = 90; // 1 min 30 sec

// Team Definitions
export const TEAMS = {
  GREEN: {
    id: 'green',
    name: '초록 영혼팀',
    nameEn: 'Team Green',
    primaryColor: '#10b981',
    glowColor: '#34d399',
    trailColor: '#6ee7b7',
    tailColor: 'rgba(52, 211, 153, 0.9)',
    baseColor: 'rgba(16, 185, 129, 0.25)',
    baseBorder: '#10b981',
    baseX: 180,
    baseY: 200,
    baseWidth: 220,
    baseHeight: 220
  },
  PURPLE: {
    id: 'purple',
    name: '보라 유령팀',
    nameEn: 'Team Purple',
    primaryColor: '#a855f7',
    glowColor: '#c084fc',
    trailColor: '#e9d5ff',
    tailColor: 'rgba(192, 132, 252, 0.9)',
    baseColor: 'rgba(168, 85, 247, 0.25)',
    baseBorder: '#a855f7',
    baseX: WORLD_WIDTH - 400,
    baseY: WORLD_HEIGHT - 420,
    baseWidth: 220,
    baseHeight: 220
  }
};

// Ghost Character Definitions (4 for each team)
export const GHOST_ROSTER = [
  // Green Team
  {
    id: 'player_green',
    name: '초록대장 (나)',
    team: 'green',
    isPlayer: true,
    hat: 'crown',
    eyeColor: '#ecfdf5',
    color: '#10b981',
    glow: '#34d399'
  },
  {
    id: 'bot_green_1',
    name: '올리브',
    team: 'green',
    isPlayer: false,
    hat: 'witch',
    eyeColor: '#ecfdf5',
    color: '#059669',
    glow: '#10b981'
  },
  {
    id: 'bot_green_2',
    name: '제이드',
    team: 'green',
    isPlayer: false,
    hat: 'cat_ears',
    eyeColor: '#ecfdf5',
    color: '#14b8a6',
    glow: '#2dd4bf'
  },
  {
    id: 'bot_green_3',
    name: '민트',
    team: 'green',
    isPlayer: false,
    hat: 'ribbon',
    eyeColor: '#ecfdf5',
    color: '#34d399',
    glow: '#6ee7b7'
  },

  // Purple Team
  {
    id: 'bot_purple_1',
    name: '바이올렛',
    team: 'purple',
    isPlayer: false,
    hat: 'witch',
    eyeColor: '#faf5ff',
    color: '#9333ea',
    glow: '#a855f7'
  },
  {
    id: 'bot_purple_2',
    name: '플럼',
    team: 'purple',
    isPlayer: false,
    hat: 'horns',
    eyeColor: '#faf5ff',
    color: '#a855f7',
    glow: '#c084fc'
  },
  {
    id: 'bot_purple_3',
    name: '섀도우',
    team: 'purple',
    isPlayer: false,
    hat: 'bat_wings',
    eyeColor: '#faf5ff',
    color: '#7e22ce',
    glow: '#9333ea'
  },
  {
    id: 'bot_purple_4',
    name: '애메시스트',
    team: 'purple',
    isPlayer: false,
    hat: 'pumpkin',
    eyeColor: '#faf5ff',
    color: '#c084fc',
    glow: '#e9d5ff'
  }
];

// Powerup Definitions
export const POWERUP_TYPES = {
  SPEED: {
    id: 'speed',
    name: '질주 부스트',
    icon: '⚡',
    duration: 6000,
    color: '#fbbf24',
    speedMultiplier: 1.45,
    desc: '이동 속도가 대폭 증가합니다!'
  },
  GHOST_WALK: {
    id: 'ghost_walk',
    name: '벽 통과 (유령화)',
    icon: '👻',
    duration: 7000,
    color: '#38bdf8',
    speedMultiplier: 1.15,
    desc: '저택의 모든 벽을 통과해 날아다닙니다!'
  },
  MAGNET: {
    id: 'magnet',
    name: '영혼 자석',
    icon: '🧲',
    duration: 8000,
    color: '#f43f5e',
    magnetRadius: 180,
    desc: '주변의 영혼 불꽃을 강력하게 끌어당깁니다!'
  }
};

// Mansion Wall Obstacle Layout (Grid-based bounding boxes for collision)
export const MANSION_WALLS = [
  // Outer Boundaries
  { x: 0, y: 0, w: WORLD_WIDTH, h: 40 },
  { x: 0, y: WORLD_HEIGHT - 40, w: WORLD_WIDTH, h: 40 },
  { x: 0, y: 0, w: 40, h: WORLD_HEIGHT },
  { x: WORLD_WIDTH - 40, y: 0, w: 40, h: WORLD_HEIGHT },

  // Center Grand Hall Partition Columns
  { x: WORLD_WIDTH / 2 - 20, y: 160, w: 40, h: 220 },
  { x: WORLD_WIDTH / 2 - 20, y: WORLD_HEIGHT - 380, w: 40, h: 220 },

  // Top Left Library Wings
  { x: 440, y: 120, w: 40, h: 280 },
  { x: 200, y: 440, w: 320, h: 40 },

  // Bottom Left Dungeon Cells
  { x: 180, y: 720, w: 280, h: 40 },
  { x: 420, y: 760, w: 40, h: 260 },

  // Center Maze Pillars
  { x: 680, y: 320, w: 140, h: 140 },
  { x: 980, y: 320, w: 140, h: 140 },
  { x: 680, y: 740, w: 140, h: 140 },
  { x: 980, y: 740, w: 140, h: 140 },

  // Top Right Attic Rooms
  { x: WORLD_WIDTH - 460, y: 180, w: 40, h: 260 },
  { x: WORLD_WIDTH - 460, y: 440, w: 280, h: 40 },

  // Bottom Right Crypt Corridors
  { x: WORLD_WIDTH - 480, y: 720, w: 300, h: 40 },
  { x: WORLD_WIDTH - 480, y: 760, w: 40, h: 260 }
];

// Difficulty Presets
export const DIFFICULTY_PRESETS = {
  easy: {
    name: '초급 (쉬움)',
    aiSpeed: 2.7,
    playerSpeed: 3.8,
    aiStealAggressiveness: 0.35,
    spiritSpawnRate: 1.2
  },
  normal: {
    name: '중급 (보통)',
    aiSpeed: 3.2,
    playerSpeed: 3.6,
    aiStealAggressiveness: 0.65,
    spiritSpawnRate: 1.0
  },
  hard: {
    name: '고급 (스릴 만점)',
    aiSpeed: 3.7,
    playerSpeed: 3.7,
    aiStealAggressiveness: 0.9,
    spiritSpawnRate: 0.9
  }
};
