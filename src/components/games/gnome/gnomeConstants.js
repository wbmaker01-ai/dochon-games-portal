// =========================================================================
// Constants & Configuration for Dochon Garden Gnomes (도촌 정원 요정)
// =========================================================================

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;
export const GROUND_Y = 460; // Base ground baseline in world coords

// World & Physics simulation parameters (Soaring floaty flight)
export const PHYSICS_CONFIG = {
  GRAVITY: 0.18,
  AIR_DRAG: 0.9982,
  GROUND_FRICTION: 0.92,
  BOUNCE_MIN_VELOCITY: 1.2,
  STOP_VELOCITY_THRESHOLD: 0.35,
  MIN_LAUNCH_ANGLE: 25, // degrees
  MAX_LAUNCH_ANGLE: 65, // degrees
  LAUNCH_POWER_MIN: 18,
  LAUNCH_POWER_MAX: 40,
  PERFECT_POWER_THRESHOLD: 0.92, // 92%~100% is PERFECT
};

// 3 Gnome Characters with distinct stats and flight mechanics
export const GNOME_CHARACTERS = [
  {
    id: 'classic',
    name: '클래식 요정',
    subtitle: '표준 밸런스형',
    hatColor: '#e53e3e',
    hatName: '빨간 모자',
    mass: 1.0,
    bounceCoeff: 0.70,
    drag: 0.9975,
    dropSpeed: 12.0,
    avatarBadge: '🧙‍♂️',
    spriteFile: 'gnome_classic.jpg',
    stats: {
      power: 80,
      bounce: 75,
      glide: 80,
    },
    description: '안정적인 비행 궤적과 탄성을 지닌 표준 정원 요정입니다. 초보자에게 추천합니다.'
  },
  {
    id: 'heavy',
    name: '통통이 요정',
    subtitle: '슈퍼 바운스형',
    hatColor: '#ecc94b',
    hatName: '노란 모자',
    mass: 1.25,
    bounceCoeff: 0.82,
    drag: 0.996,
    dropSpeed: 16.0,
    avatarBadge: '🧝',
    spriteFile: 'gnome_heavy.jpg',
    stats: {
      power: 95,
      bounce: 95,
      glide: 60,
    },
    description: '무겁지만 지형이나 버섯을 밟았을 때 엄청난 반발력으로 하늘 높이 튕겨 오릅니다.'
  },
  {
    id: 'butterfly',
    name: '나비 요정',
    subtitle: '공중 활공형',
    hatColor: '#ed64a6',
    hatName: '분홍 꽃 모자',
    mass: 0.75,
    bounceCoeff: 0.64,
    drag: 0.9988,
    dropSpeed: 9.0,
    avatarBadge: '🧚',
    spriteFile: 'gnome_butterfly.jpg',
    stats: {
      power: 70,
      bounce: 65,
      glide: 98,
    },
    description: '가벼운 요정 날개로 공기 저항이 적어 공중에서 오랫동안 부드럽게 활공합니다.'
  }
];

// Interactive Terrain Objects along the Garden Path
export const TERRAIN_ITEM_TYPES = {
  MUSHROOM: {
    id: 'MUSHROOM',
    name: '점핑 버섯',
    icon: '🍄',
    color: '#e53e3e',
    width: 48,
    height: 42,
    bounceBoostY: -21.0,
    bounceBoostX: 1.15,
    points: 100,
    message: '🍄 버섯 슈퍼 점프!'
  },
  LOG: {
    id: 'LOG',
    name: '가속 통나무',
    icon: '🪵',
    color: '#8b5a2b',
    width: 60,
    height: 32,
    bounceBoostY: -9.0,
    bounceBoostX: 1.35,
    minSpeedX: 20.0,
    points: 120,
    message: '🪵 통나무 부스트 가속!'
  },
  SUNFLOWER: {
    id: 'SUNFLOWER',
    name: '황금 해바라기밭',
    icon: '🌻',
    color: '#ecc94b',
    width: 80,
    height: 48,
    friction: 0.985, // Very slippery glide
    points: 150,
    message: '🌻 해바라기 꽃길 글라이딩!'
  },
  CLOUD: {
    id: 'CLOUD',
    name: '스카이 구름',
    icon: '☁️',
    color: '#63b3ed',
    width: 70,
    height: 38,
    bounceBoostY: -19.0,
    bounceBoostX: 1.25,
    points: 200,
    message: '☁️ 구름 퐁퐁 도약!'
  },
  RAINBOW: {
    id: 'RAINBOW',
    name: '무지개 링',
    icon: '🌈',
    color: '#9f7aea',
    width: 60,
    height: 60,
    bounceBoostY: -12.0,
    boostSpeedX: 11.0,
    points: 300,
    message: '🌈 무지개 초음속 돌파!'
  },
  SEED: {
    id: 'SEED',
    name: '황금 씨앗',
    icon: '✨',
    color: '#f6e05e',
    width: 24,
    height: 24,
    points: 50,
    message: '✨ 꽃씨 수집 +50점'
  },
  TRAMPOLINE: {
    id: 'TRAMPOLINE',
    name: '스프링 트램펄린',
    icon: '🎪',
    color: '#48bb78',
    width: 56,
    height: 28,
    bounceBoostY: -25.0,
    bounceBoostX: 1.22,
    points: 180,
    message: '🎪 슈퍼 스프링 로켓 도약!'
  },
  BUTTERFLY_SWARM: {
    id: 'BUTTERFLY_SWARM',
    name: '요정 나비 떼',
    icon: '🦋',
    color: '#ed64a6',
    width: 64,
    height: 52,
    bounceBoostY: -15.0,
    boostSpeedX: 9.0,
    points: 250,
    message: '🦋 요정 나비단 날개짓 부스트!'
  }
};
