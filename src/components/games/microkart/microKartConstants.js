// Dochon Games Portal - Micro Kart Racing Constants & Configurations
// School Desk & Stationary Top-Down Circuit Theme

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 650;

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;

export const TOTAL_LAPS = 3;
export const TOTAL_STAGES = 3;

// 3 Unique School Circuit Tracks
export const TRACK_LIST = [
  {
    id: 1,
    level: 1,
    name: '교실 책상 서킷',
    englishName: 'Classroom Wood Speedway',
    theme: 'wood',
    difficulty: '초급 (★☆☆)',
    icon: '🏫',
    description: '긴 직선 코스와 완만한 와이드 코너로 구성된 기본 책상 트랙!'
  },
  {
    id: 2,
    level: 2,
    name: '과학실 실험대 서킷',
    englishName: 'Science Lab Circuit',
    theme: 'lab',
    difficulty: '중급 (★★☆)',
    icon: '🧪',
    description: '연속 S자 시케인과 플라스크, 화학 액체 슬로우존이 배치된 테크니컬 트랙!'
  },
  {
    id: 3,
    level: 3,
    name: '미술실 스케치북 서킷',
    englishName: 'Art Room Neon Circuit',
    theme: 'art',
    difficulty: '마스터 (★★★)',
    icon: '🎨',
    description: '현란한 컬러 물감 웅덩이와 급격한 지그재그 헤어핀이 도사리는 최고난도 트랙!'
  }
];

// 4 Cute Desk Stationary Themed Kart Skins
export const KART_SKINS = [
  {
    id: 'eraser',
    name: '도촌 지우개 레이서',
    type: '균형형',
    avatarEmoji: '🧼',
    color: '#0284C7',
    bodyColor: '#38BDF8',
    subColor: '#FFFFFF',
    accentColor: '#0369A1',
    description: '안정적인 밸런스와 단단한 차체로 초보자에게 최적화된 지우개 카트!'
  },
  {
    id: 'pencil',
    name: '번개 연필 로켓',
    type: '스피드형',
    avatarEmoji: '✏️',
    color: '#F59E0B',
    bodyColor: '#FCD34D',
    subColor: '#D97706',
    accentColor: '#78350F',
    description: '샤프한 바디와 강력한 최고 속도를 자랑하는 고속 연필 머신!'
  },
  {
    id: 'magnet',
    name: '말굽 자석 버기',
    type: '드리프트형',
    avatarEmoji: '🧲',
    color: '#EF4444',
    bodyColor: '#F87171',
    subColor: '#E2E8F0',
    accentColor: '#991B1B',
    description: '강력한 자력으로 코너를 칼처럼 베고 미니 터보를 빠르게 충전!'
  },
  {
    id: 'highlighter',
    name: '네온 형광 스피더',
    type: '핸들링형',
    avatarEmoji: '🖍️',
    color: '#10B981',
    bodyColor: '#34D399',
    subColor: '#A7F3D0',
    accentColor: '#065F46',
    description: '날렵한 코너 선회력과 빠른 가속 응답성을 지닌 네온 머신!'
  }
];

// Physical Car Dynamics (Calibrated for crisp top-down arcade feel)
export const KART_PHYSICS = {
  ACCELERATION: 0.32,
  TOP_SPEED: 9.8,
  REVERSE_ACCELERATION: 0.18,
  TOP_REVERSE_SPEED: 3.6,
  BRAKE_FORCE: 0.42,
  NATURAL_FRICTION: 0.984,
  OFFROAD_FRICTION: 0.925,
  TURN_RATE: 0.054,
  DRIFT_TURN_RATE: 0.072,
  DRIFT_LATERAL_SLIP: 0.948,
  MINI_TURBO_STAGE1_TIME: 1.1, // seconds in drift
  MINI_TURBO_STAGE2_TIME: 2.2,
  BOOST_DURATION: 1.8,
  BOOST_TOP_SPEED_MULT: 1.45,
  BOOST_ACCEL_MULT: 2.2,
  KART_RADIUS: 22,
  SPIN_DURATION: 1.4 // seconds when hit by banana
};

// 5 Battle Items
export const ITEM_TYPES = {
  BANANA: 'BANANA',
  WATER_BALLOON: 'WATER_BALLOON',
  ROCKET: 'ROCKET',
  BOOSTER: 'BOOSTER',
  SHIELD: 'SHIELD'
};

export const ITEM_CONFIGS = {
  BANANA: {
    id: 'BANANA',
    name: '바나나 껍질',
    emoji: '🍌',
    color: '#FBBF24',
    description: '뒤에 떨어뜨립니다. 밟으면 360도 스핀하며 속도가 크게 떨어집니다!'
  },
  WATER_BALLOON: {
    id: 'WATER_BALLOON',
    name: '조준 물풍선',
    emoji: '💧',
    color: '#38BDF8',
    description: '앞선 경쟁자를 향해 날아갑니다. 맞으면 물방울에 갇혀 공중에 뜹니다!'
  },
  ROCKET: {
    id: 'ROCKET',
    name: '로켓 연필',
    emoji: '🚀',
    color: '#EF4444',
    description: '직선으로 초고속 발사됩니다. 적중 시 폭발하며 상대를 튕겨냅니다!'
  },
  BOOSTER: {
    id: 'BOOSTER',
    name: '도촌 슈퍼 부스터',
    emoji: '💨',
    color: '#F97316',
    description: '순간적으로 초강력 불꽃을 뿜으며 최고 속도로 급가속합니다!'
  },
  SHIELD: {
    id: 'SHIELD',
    name: '자석 쉴드',
    emoji: '🛡️',
    color: '#8B5CF6',
    description: '5초간 지속되며 적의 아이템 공격을 1회 완벽하게 방어합니다!'
  }
};

// AI Difficulty Presets
export const DIFFICULTY_PRESETS = {
  easy: {
    id: 'easy',
    name: '초급 레이서 (1~2학년)',
    speedScale: 0.84,
    driftSkill: 0.3,
    reactionDelay: 0.45,
    mistakeChance: 0.18
  },
  normal: {
    id: 'normal',
    name: '중급 레이서 (3~4학년)',
    speedScale: 0.93,
    driftSkill: 0.7,
    reactionDelay: 0.25,
    mistakeChance: 0.08
  },
  hard: {
    id: 'hard',
    name: '도촌 마스터 (5~6학년)',
    speedScale: 1.01,
    driftSkill: 0.95,
    reactionDelay: 0.12,
    mistakeChance: 0.02
  }
};

// Rank Finish Points
export const RANK_POINTS = [
  3000, // 1st
  2200, // 2nd
  1600, // 3rd
  1100, // 4th
  700   // 5th
];
