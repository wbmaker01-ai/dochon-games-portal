// Fruit Merge Constants - Dochon Elementary School Game Portal
// 11 Fruit Evolution Tiers & Physics World Dimensions

export const CANVAS_WIDTH = 460;
export const CANVAS_HEIGHT = 660;

// Container Box Dimensions
export const BOX_LEFT = 25;
export const BOX_RIGHT = 435;
export const BOX_WIDTH = BOX_RIGHT - BOX_LEFT; // 410px
export const BOX_TOP = 130; // Danger deadline line
export const BOX_BOTTOM = 635; // Bottom floor
export const BOX_HEIGHT = BOX_BOTTOM - BOX_TOP; // 505px

// Spawn Crane & Aim Line
export const SPAWN_Y = 65;
export const DROP_COOLDOWN_MS = 600;

// Physical Constants
export const GRAVITY = 0.38;
export const AIR_RESISTANCE = 0.998;
export const RESTITUTION_DEFAULT = 0.22; // Fruit bounce bounciness
export const WALL_RESTITUTION = 0.25;
export const FRICTION_GROUND = 0.88;
export const FRICTION_COLLISION = 0.92;
export const DEADLINE_GRACE_TIME_MS = 2500; // Time fruit can sit above deadline before Game Over

// 11 Fruit Evolution Levels
export const FRUITS = [
  {
    level: 0,
    name: '체리',
    emoji: '🍒',
    radius: 17,
    score: 2,
    mass: 1.0,
    restitution: 0.32,
    color: '#FF2442',
    accentColor: '#B8001F',
    highlightColor: '#FFA4B2',
    stemColor: '#78350F',
    description: '작고 귀여운 첫 번째 과일'
  },
  {
    level: 1,
    name: '딸기',
    emoji: '🍓',
    radius: 24,
    score: 4,
    mass: 1.5,
    restitution: 0.28,
    color: '#FF3366',
    accentColor: '#CC1444',
    highlightColor: '#FF99B3',
    leafColor: '#10B981',
    description: '새콤달콤한 딸기'
  },
  {
    level: 2,
    name: '포도',
    emoji: '🍇',
    radius: 32,
    score: 8,
    mass: 2.2,
    restitution: 0.25,
    color: '#8E44AD',
    accentColor: '#5B2C6F',
    highlightColor: '#BB8FCE',
    leafColor: '#229954',
    description: '탱글탱글한 보랏빛 포도'
  },
  {
    level: 3,
    name: '귤',
    emoji: '🍊',
    radius: 41,
    score: 16,
    mass: 3.0,
    restitution: 0.22,
    color: '#FF8C00',
    accentColor: '#D35400',
    highlightColor: '#FAD7A0',
    leafColor: '#27AE60',
    description: '상큼한 비타민 가득 귤'
  },
  {
    level: 4,
    name: '감',
    emoji: '🟠',
    radius: 51,
    score: 32,
    mass: 4.1,
    restitution: 0.20,
    color: '#FF5E13',
    accentColor: '#BA3E00',
    highlightColor: '#FFB28A',
    leafColor: '#2E7D32',
    description: '달콤하게 익은 주황빛 감'
  },
  {
    level: 5,
    name: '사과',
    emoji: '🍎',
    radius: 62,
    score: 64,
    mass: 5.5,
    restitution: 0.18,
    color: '#E74C3C',
    accentColor: '#922B21',
    highlightColor: '#F5B7B1',
    leafColor: '#2ECC71',
    description: '탐스럽고 아삭한 꿀사과'
  },
  {
    level: 6,
    name: '배',
    emoji: '🍐',
    radius: 74,
    score: 128,
    mass: 7.2,
    restitution: 0.16,
    color: '#BAC938',
    accentColor: '#808C17',
    highlightColor: '#E8EDA9',
    leafColor: '#588100',
    description: '시원하고 달콤한 청록빛 배'
  },
  {
    level: 7,
    name: '복숭아',
    emoji: '🍑',
    radius: 86,
    score: 256,
    mass: 9.3,
    restitution: 0.14,
    color: '#FF85A2',
    accentColor: '#DB3A65',
    highlightColor: '#FFD1DC',
    leafColor: '#2ECC71',
    description: '향긋하고 말랑한 분홍 복숭아'
  },
  {
    level: 8,
    name: '파인애플',
    emoji: '🍍',
    radius: 99,
    score: 512,
    mass: 12.0,
    restitution: 0.12,
    color: '#F4B41A',
    accentColor: '#B77900',
    highlightColor: '#FFE599',
    leafColor: '#1B813E',
    description: '황금빛 뾰족뾰족 파인애플'
  },
  {
    level: 9,
    name: '멜론',
    emoji: '🍈',
    radius: 114,
    score: 1024,
    mass: 15.2,
    restitution: 0.10,
    color: '#76D7C4',
    accentColor: '#16A085',
    highlightColor: '#D1F2EB',
    leafColor: '#117A65',
    description: '그물 무늬가 아름다운 달콤 멜론'
  },
  {
    level: 10,
    name: '수박',
    emoji: '🍉',
    radius: 132,
    score: 2048,
    mass: 20.0,
    restitution: 0.08,
    color: '#27AE60',
    accentColor: '#145A32',
    highlightColor: '#ABEBC6',
    stripeColor: '#0E3B20',
    description: '초대형 왕 수박! (최종 완성 과일)'
  }
];

// Spawning probability for random fruits (only 0 ~ 3 can drop from crane)
export const DROP_PROBABILITIES = [
  { level: 0, weight: 40 }, // 체리 (40%)
  { level: 1, weight: 30 }, // 딸기 (30%)
  { level: 2, weight: 20 }, // 포도 (20%)
  { level: 3, weight: 8 },  // 귤 (8%)
  { level: 4, weight: 2 }   // 감 (2% 희귀)
];

export function getRandomSpawnFruit() {
  const totalWeight = DROP_PROBABILITIES.reduce((acc, p) => acc + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const item of DROP_PROBABILITIES) {
    if (rand < item.weight) {
      return item.level;
    }
    rand -= item.weight;
  }
  return 0;
}
