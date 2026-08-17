// Jerry Lawson 8-Bit Cartridge Adventure & Level Editor Constants

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;

export const TILE_SIZE = 32;
export const COLS = 25; // 25 * 32 = 800
export const ROWS = 15; // 15 * 32 = 480

// Tile & Entity IDs
export const TILES = {
  EMPTY: 0,
  SOLID: 1,         // 🧱 기본 픽셀 블록 (Solid Block)
  PLATFORM: 2,      // 💻 얇은 회로 발판 (Jump-through Platform)
  SPIKE: 3,         // ⚡ 고전압 스파크 트랩 (Danger Spike)
  COIN: 4,          // 🪙 롬 칩 / 골드 코인 (Collectible Coin)
  SPRING: 5,        // 🦘 슈퍼 점프 스프링 콘덴서 (Bounce Pad)
  ENEMY_BUG: 6,     // 👾 글리치 버그 (Patrolling Monster)
  GOAL_CARTRIDGE: 7 // 🏆 황금 롬 카트리지 (Stage Clear Goal)
};

export const TILE_COLORS = {
  [TILES.SOLID]: '#8B5A2B',
  [TILES.PLATFORM]: '#00ADB5',
  [TILES.SPIKE]: '#FF2E63',
  [TILES.COIN]: '#FFD700',
  [TILES.SPRING]: '#00FF66',
  [TILES.ENEMY_BUG]: '#E84545',
  [TILES.GOAL_CARTRIDGE]: '#FFB800'
};

// Physics Constants
export const PHYSICS = {
  GRAVITY: 0.52,
  WALK_SPEED: 3.8,
  JUMP_FORCE: -10.8,
  SPRING_FORCE: -15.8,
  FRICTION: 0.85,
  MAX_FALL_SPEED: 12
};

// Score Values
export const SCORE_VALUES = {
  COIN: 50,
  BUG_STOMP: 100,
  STAGE_CLEAR: 500,
  CUSTOM_LEVEL_CLEAR: 300,
  COMBO_MULTIPLIER: 25
};

// 3 Story Adventure Preset Stages (25x15 Tile Grid)
export const STAGE_PRESETS = [
  {
    id: 1,
    name: '1976 연구소 (Lab Workshop)',
    subtitle: '제리 로슨의 실험실에서 롬 칩을 모으고 첫 카트리지를 완성하세요!',
    bgImage: '/assets/jerrylawson/lab_background.jpg',
    themeColor: '#FFB800',
    timeLimit: 90,
    // S: Solid, P: Platform, ^: Spike, C: Coin, J: Spring, E: Enemy, G: Goal, .: Empty
    map: [
      '.........................',
      '.........................',
      '..C...C...C..............',
      '.SSSSSSSSSS.......C.C.C..',
      '................SSSSSSSS.',
      '.....C.C.................',
      '....PPPPP......P...C..G..',
      '..............PP..SSSSSS.',
      '...C...C...C.PPP.........',
      '.SSSSSSSSSSSSSSS.........',
      '..................C......',
      '.....E..........PPPPP....',
      '.SSSSSSSS................',
      '......................^..',
      'SSSSSSSSSSSSSSSSSSSSSSSSS'
    ]
  },
  {
    id: 2,
    name: '카트리지 시스템 (Fairchild F)',
    subtitle: '시스템 내부의 글리치 버그를 밟아 처치하고 슈퍼 스프링을 활용하세요!',
    bgImage: '/assets/jerrylawson/lab_background.jpg',
    themeColor: '#00ADB5',
    timeLimit: 100,
    map: [
      '.........................',
      '......................G..',
      '....C..C..C........SSSSSS',
      '..SSSSSSSSSS..^..........',
      '.............SSSS........',
      '......C.............C.C..',
      '....PPPPP.........PPPPPP.',
      '...........C.............',
      '..J.......SSSS...........',
      'SSSS..E..........E.......',
      '....SSSSSS......SSSSSS...',
      '.........................',
      '..C.....C....J.....C.....',
      '.SSSS..SSSS..S..SSSSSS.^.',
      'SSSSSSSSSSSSSSSSSSSSSSSSS'
    ]
  },
  {
    id: 3,
    name: '사이버 아케이드 (Cyber Matrix)',
    subtitle: '네온 매트릭스 속 최고난도 퍼즐을 돌파하고 마스터 카트리지를 획득하세요!',
    bgImage: '/assets/jerrylawson/arcade_background.jpg',
    themeColor: '#FF2E63',
    timeLimit: 120,
    map: [
      '......................G..',
      '....C.C.C.C........SSSSSS',
      '..SSSSSSSSSS.............',
      '.............C..C........',
      '......E....PPPPPPP.......',
      '....SSSSS................',
      '...............E....C.C..',
      '..C.........SSSS..PPPPPP.',
      '.PPP..J..................',
      '.....SSSS..^....^........',
      '..........SSSSSSSS.......',
      '....C.C..............C...',
      '..SSSSSS....J...E...PPP..',
      '...........SSSSSSSS...^..',
      'SSSSSSSSSSSSSSSSSSSSSSSSS'
    ]
  }
];
