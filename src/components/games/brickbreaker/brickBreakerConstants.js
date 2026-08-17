// Dochon Brick Breaker (도촌 벽돌 격파왕) Constants & Level Map Configurations

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

// Paddle Default Specs
export const PADDLE_DEFAULT = {
  WIDTH: 90,
  HEIGHT: 14,
  SPEED: 8,
  Y_OFFSET: 35, // Distance from canvas bottom
  COLOR: '#38BDF8',
  GLOW: '#0284C7'
};

// Ball Default Specs
export const BALL_DEFAULT = {
  RADIUS: 6.5,
  BASE_SPEED: 5.5,
  MAX_SPEED: 11,
  COLOR: '#F8FAFC',
  FIRE_COLOR: '#EF4444'
};

// Brick Types & Configurations
export const BRICK_TYPES = {
  NORMAL_1: { id: 'N1', hp: 1, color: '#38BDF8', borderColor: '#0284C7', score: 10, label: '일반 블록' },
  NORMAL_2: { id: 'N2', hp: 1, color: '#34D399', borderColor: '#059669', score: 15, label: '에메랄드 블록' },
  NORMAL_3: { id: 'N3', hp: 1, color: '#FBBF24', borderColor: '#D97706', score: 20, label: '골드 블록' },
  NORMAL_4: { id: 'N4', hp: 1, color: '#F472B6', borderColor: '#DB2777', score: 25, label: '루비 블록' },
  HARD_2: { id: 'H2', hp: 2, color: '#A855F7', borderColor: '#7E22CE', score: 40, label: '강화 블록 (2HP)' },
  HARD_3: { id: 'H3', hp: 3, color: '#64748B', borderColor: '#334155', score: 70, label: '철갑 블록 (3HP)' },
  BOMB: { id: 'BOMB', hp: 1, color: '#EF4444', borderColor: '#B91C1C', score: 50, label: '폭탄 블록 💣' },
  STAR: { id: 'STAR', hp: 1, color: '#FDE047', borderColor: '#CA8A04', score: 100, label: '스타 보너스 ⭐' },
  UNBREAKABLE: { id: 'UNB', hp: 999, color: '#475569', borderColor: '#1E293B', score: 0, label: '무적 강철 블록' }
};

// Power-Up Item Definitions
export const POWERUP_TYPES = {
  MULTIBALL: {
    id: 'MULTIBALL',
    name: '멀티볼 3구',
    icon: '🔴',
    color: '#EF4444',
    duration: 0, // Instant
    desc: '현재 공이 3개로 분신하여 동시에 블록을 타격합니다.'
  },
  WIDE_PADDLE: {
    id: 'WIDE_PADDLE',
    name: '패들 확장',
    icon: '📏',
    color: '#38BDF8',
    duration: 12000, // 12 seconds
    desc: '패들의 길이가 1.5배로 넓어져 안정적인 수비가 가능합니다.'
  },
  LASER: {
    id: 'LASER',
    name: '레이저 캐논',
    icon: '⚡',
    color: '#FBBF24',
    duration: 10000, // 10 seconds
    desc: '패들 양쪽에서 레이저 빔을 연속 발사하여 블록을 직접 저격합니다.'
  },
  FIREBALL: {
    id: 'FIREBALL',
    name: '관통 파이어볼',
    icon: '🔥',
    color: '#F97316',
    duration: 8000, // 8 seconds
    desc: '공이 튕기지 않고 모든 블록을 관통하며 초토화합니다.'
  },
  SAFETY_BARRIER: {
    id: 'SAFETY_BARRIER',
    name: '바닥 방어막',
    icon: '🛡️',
    color: '#10B981',
    duration: 15000, // 15 seconds or 1 hit
    desc: '캔버스 하단에 레이저 안전망이 펼쳐져 공의 추락을 1회 방어합니다.'
  },
  SLOW: {
    id: 'SLOW',
    name: '슬로우 모션',
    icon: '⏳',
    color: '#A855F7',
    duration: 9000,
    desc: '공의 이동 속도가 완만해져 정밀한 컨트롤이 가능해집니다.'
  },
  EXTRA_LIFE: {
    id: 'EXTRA_LIFE',
    name: '생명 보너스 +1',
    icon: '💖',
    color: '#EC4899',
    duration: 0,
    desc: '패들의 잔여 목숨(라이프)이 1개 추가됩니다.'
  }
};

export const POWERUP_DROP_CHANCE = 0.28; // 28% drop rate on breaking bricks

// Level Map Blueprints (Grid: 10 cols x Variable rows)
// 0: Empty, 1: N1, 2: N2, 3: N3, 4: N4, 5: H2, 6: H3, 7: BOMB, 8: STAR, 9: UNBREAKABLE
export const STAGE_MAPS = [
  // Stage 1: Welcome Dochon (클래식 도촌 무지개)
  {
    stage: 1,
    name: '스테이지 1: 도촌 클래식 무지개',
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [0, 1, 2, 7, 0, 0, 7, 2, 1, 0]
    ]
  },
  // Stage 2: Heart Castle (도촌초 사랑의 하트)
  {
    stage: 2,
    name: '스테이지 2: 도촌 사랑의 하트',
    grid: [
      [0, 4, 4, 0, 0, 0, 0, 4, 4, 0],
      [4, 4, 4, 4, 0, 0, 4, 4, 4, 4],
      [4, 8, 4, 4, 4, 4, 4, 4, 8, 4],
      [0, 4, 4, 7, 4, 4, 7, 4, 4, 0],
      [0, 0, 4, 4, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 5, 5, 5, 5, 0, 0, 0],
      [0, 0, 0, 0, 5, 5, 0, 0, 0, 0]
    ]
  },
  // Stage 3: Diamond Fortress (다이아몬드 철갑 요새)
  {
    stage: 3,
    name: '스테이지 3: 다이아몬드 철갑 요새',
    grid: [
      [0, 0, 0, 0, 6, 6, 0, 0, 0, 0],
      [0, 0, 0, 5, 8, 8, 5, 0, 0, 0],
      [0, 0, 5, 3, 3, 3, 3, 5, 0, 0],
      [0, 6, 2, 7, 1, 1, 7, 2, 6, 0],
      [0, 0, 5, 3, 3, 3, 3, 5, 0, 0],
      [0, 0, 0, 5, 8, 8, 5, 0, 0, 0],
      [0, 0, 0, 0, 6, 6, 0, 0, 0, 0]
    ]
  },
  // Stage 4: Space Invader (우주 침공 인베이더)
  {
    stage: 4,
    name: '스테이지 4: 우주 침공 인베이더',
    grid: [
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 5, 5, 5, 5, 5, 5, 0, 0],
      [0, 5, 5, 7, 5, 5, 7, 5, 5, 0],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [5, 0, 5, 5, 5, 5, 5, 5, 0, 5],
      [5, 0, 5, 0, 0, 0, 0, 5, 0, 5],
      [0, 0, 0, 6, 8, 8, 6, 0, 0, 0]
    ]
  },
  // Stage 5: Dochon Master Boss Gate (도촌초 대마왕 관문)
  {
    stage: 5,
    name: '스테이지 5: 도촌 대마왕 최종 관문',
    grid: [
      [6, 6, 6, 6, 8, 8, 6, 6, 6, 6],
      [5, 7, 5, 5, 7, 7, 5, 5, 7, 5],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 9, 2, 2, 2, 2, 9, 2, 2],
      [1, 7, 1, 1, 7, 7, 1, 1, 7, 1],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [0, 5, 0, 5, 8, 8, 5, 0, 5, 0]
    ]
  }
];
