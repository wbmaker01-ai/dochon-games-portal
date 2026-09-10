// Dochon Games Portal - Dochon Pirate Coin Heist Constants
// World dimensions, ship stats, items, physics constants and scoring rules

export const WORLD_WIDTH = 2200;
export const WORLD_HEIGHT = 2200;

export const ISLAND_CENTER = { x: 1100, y: 1100 };
export const ISLAND_RADIUS = 300;

// 4 Team Base Docks (Corners)
export const TEAM_BASES = [
  {
    teamId: 0,
    name: '붉은 해골단',
    color: '#EF4444',
    secondaryColor: '#B91C1C',
    x: 220,
    y: 220,
    radius: 170,
    dockAngle: Math.PI / 4,
    icon: '🚩'
  },
  {
    teamId: 1,
    name: '푸른 크라켄단',
    color: '#3B82F6',
    secondaryColor: '#1D4ED8',
    x: 1980,
    y: 220,
    radius: 170,
    dockAngle: (3 * Math.PI) / 4,
    icon: '🌊'
  },
  {
    teamId: 2,
    name: '에메랄드 세이렌단',
    color: '#10B981',
    secondaryColor: '#047857',
    x: 220,
    y: 1980,
    radius: 170,
    dockAngle: -Math.PI / 4,
    icon: '🐍'
  },
  {
    teamId: 3,
    name: '황금 닻 해적단',
    color: '#F59E0B',
    secondaryColor: '#B45309',
    x: 1980,
    y: 1980,
    radius: 170,
    dockAngle: -(3 * Math.PI) / 4,
    icon: '⚓'
  }
];

// Ship Types & Stats
export const SHIP_CLASSES = {
  cutter: {
    id: 'cutter',
    name: '쾌속 커터선',
    tagline: '압도적인 스피드와 기동 탈출',
    icon: '⛵',
    maxSpeed: 6.2,
    accel: 0.18,
    turnSpeed: 0.056,
    ramPower: 1.0,
    defense: 0.8,
    hullWidth: 26,
    hullLength: 52
  },
  caravel: {
    id: 'caravel',
    name: '밸런스 캐러벨',
    tagline: '안정적인 조향과 준수한 돌진력',
    icon: '🚢',
    maxSpeed: 5.5,
    accel: 0.15,
    turnSpeed: 0.048,
    ramPower: 1.3,
    defense: 1.0,
    hullWidth: 28,
    hullLength: 54
  },
  galleon: {
    id: 'galleon',
    name: '장갑 갈레온',
    tagline: '육중한 들이받기로 코인 대량 강탈',
    icon: '⚓',
    maxSpeed: 4.8,
    accel: 0.12,
    turnSpeed: 0.040,
    ramPower: 2.1,
    defense: 1.5,
    hullWidth: 32,
    hullLength: 58
  },
  sloop: {
    id: 'sloop',
    name: '기동형 슬루프',
    tagline: '날렵한 회전으로 상대 뒤를 공략',
    icon: '🏴‍☠️',
    maxSpeed: 5.8,
    accel: 0.20,
    turnSpeed: 0.064,
    ramPower: 0.9,
    defense: 0.7,
    hullWidth: 24,
    hullLength: 48
  }
};

// Coin Types
export const COIN_TYPES = {
  GOLD: {
    id: 'gold',
    value: 10,
    radius: 13,
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    label: '금화'
  },
  CHEST: {
    id: 'chest',
    value: 50,
    radius: 20,
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    label: '보물상자'
  },
  SKULL: {
    id: 'skull',
    value: -20,
    radius: 15,
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    label: '저주받은 해골'
  }
};

// Item Types
export const ITEM_TYPES = {
  CANNON: {
    id: 'cannon',
    name: '해적 대포알',
    icon: '💣',
    color: '#EF4444',
    durationMs: 0,
    desc: '전방 발사 직격 시 상대 배를 1.5초간 스턴시키고 코인을 털어냅니다.'
  },
  BOOST: {
    id: 'boost',
    name: '순풍 돛대 부스터',
    icon: '💨',
    color: '#06B6D4',
    durationMs: 2500,
    desc: '2.5초간 1.7배 가속하여 신속하게 도주하거나 강력하게 들이받습니다.'
  },
  MAGNET: {
    id: 'magnet',
    name: '황금 자석',
    icon: '🧲',
    color: '#F59E0B',
    durationMs: 3500,
    desc: '3.5초간 주변 350px 반경의 모든 금화를 강력하게 끌어당깁니다.'
  },
  SHIELD: {
    id: 'shield',
    name: '크라켄 방패',
    icon: '🛡️',
    color: '#8B5CF6',
    durationMs: 5000,
    desc: '5초간 1회의 대포알 또는 적 충돌 공격을 완전 방어합니다.'
  }
};

// Reef Obstacles in Water
export const REEFS = [
  { x: 650, y: 550, radius: 42 },
  { x: 1550, y: 550, radius: 42 },
  { x: 650, y: 1650, radius: 42 },
  { x: 1550, y: 1650, radius: 42 },
  { x: 1100, y: 400, radius: 36 },
  { x: 1100, y: 1800, radius: 36 },
  { x: 400, y: 1100, radius: 36 },
  { x: 1800, y: 1100, radius: 36 }
];

// Whirlpools (Pushes and slows)
export const WHIRLPOOLS = [
  { x: 750, y: 1100, radius: 75, pullForce: 0.4 },
  { x: 1450, y: 1100, radius: 75, pullForce: 0.4 }
];

// Game Configuration
export const MATCH_DURATION_SEC = 90;
export const MAX_HELD_COINS = 30;
export const DEPOSIT_RATE_MS = 300; // Deposit 1 coin every 300ms while inside base
export const RAM_MIN_REL_SPEED = 2.5; // Minimum relative speed difference to register ram
export const RAM_COIN_DROP_RATIO = 0.45; // Drops 45% of victim's held coins

// AI Difficulty Profiles
export const AI_DIFFICULTIES = {
  easy: {
    name: '초급 해적',
    reactionTime: 600,
    bankCoinThreshold: 8,
    ramAggressiveness: 0.25,
    speedFactor: 0.78
  },
  normal: {
    name: '베테랑 해적',
    reactionTime: 350,
    bankCoinThreshold: 12,
    ramAggressiveness: 0.55,
    speedFactor: 0.90
  },
  master: {
    name: '전설의 해적왕',
    reactionTime: 150,
    bankCoinThreshold: 15,
    ramAggressiveness: 0.85,
    speedFactor: 1.0
  }
};
