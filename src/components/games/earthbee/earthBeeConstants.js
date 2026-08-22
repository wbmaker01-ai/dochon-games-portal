// Earth Bee Game Constants & Configurations
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

// Bee Physics & Gameplay Settings
export const BEE_CONFIG = {
  SPEED: 260,
  ACCELERATION: 12,
  RADIUS: 16,
  POLLEN_COLLECT_RADIUS: 38,
  POLLEN_DELIVER_RADIUS: 42,
  MAX_POLLEN: 100,
  WING_FLAP_SPEED: 25
};

// Flower Definitions & Visual Attributes
export const FLOWER_TYPES = {
  DAISY: {
    id: 'daisy',
    name: '화사한 데이지',
    color: '#FFFFFF',
    petalColor: '#FFFFFF',
    centerColor: '#F59E0B',
    stemColor: '#22C55E',
    petals: 8,
    pollenReward: 25,
    score: 20,
    timeBonus: 2,
    rarity: 0.45
  },
  TULIP: {
    id: 'tulip',
    name: '향기로운 튤립',
    color: '#EC4899',
    petalColor: '#F43F5E',
    centerColor: '#FDE047',
    stemColor: '#16A34A',
    petals: 5,
    pollenReward: 35,
    score: 35,
    timeBonus: 2.5,
    rarity: 0.28
  },
  SUNFLOWER: {
    id: 'sunflower',
    name: '황금 해바라기',
    color: '#EAB308',
    petalColor: '#FBBF24',
    centerColor: '#78350F',
    stemColor: '#15803D',
    petals: 12,
    pollenReward: 50,
    score: 60,
    timeBonus: 3.5,
    rarity: 0.16
  },
  LAVENDER: {
    id: 'lavender',
    name: '보랏빛 라벤더',
    color: '#A855F7',
    petalColor: '#C084FC',
    centerColor: '#E9D5FF',
    stemColor: '#166534',
    petals: 6,
    pollenReward: 40,
    score: 45,
    timeBonus: 4,
    rarity: 0.08
  },
  RAINBOW: {
    id: 'rainbow',
    name: '무지개빛 신비꽃',
    color: '#06B6D4',
    petalColor: '#38BDF8',
    centerColor: '#F43F5E',
    stemColor: '#10B981',
    petals: 10,
    pollenReward: 100,
    score: 150,
    timeBonus: 6,
    rarity: 0.03
  }
};

// Garden Ecosystem Levels
export const ECO_LEVELS = [
  { level: 1, name: '아늑한 도촌 화단', requiredBlooms: 0, flowerTypes: ['DAISY', 'TULIP'] },
  { level: 2, name: '향기로운 들꽃 정원', requiredBlooms: 8, flowerTypes: ['DAISY', 'TULIP', 'SUNFLOWER'] },
  { level: 3, name: '활기찬 꿀벌 숲', requiredBlooms: 20, flowerTypes: ['DAISY', 'TULIP', 'SUNFLOWER', 'LAVENDER'] },
  { level: 4, name: '찬란한 무지개 꽃밭', requiredBlooms: 36, flowerTypes: ['DAISY', 'TULIP', 'SUNFLOWER', 'LAVENDER', 'RAINBOW'] },
  { level: 5, name: '환상의 도촌 생태 낙원', requiredBlooms: 55, flowerTypes: ['DAISY', 'TULIP', 'SUNFLOWER', 'LAVENDER', 'RAINBOW'] }
];

// Educational Environmental & Honeybee Facts
export const ECO_FACTS = [
  '꿀벌은 우리가 먹는 음식의 3분의 1을 수분시켜 주는 소중한 친구예요! 🍎',
  '꿀벌 한 마리는 평생 동안 약 1/12 티스푼의 꿀을 모아요! 🍯',
  '꿀벌의 비행 속도는 시속 약 24km에 달해요! 💨',
  '꿀벌은 춤을 춰서 다른 벌들에게 꽃의 위치와 거리를 알려줘요! 💃',
  '꽃가루받이를 통해 식물들이 열매를 맺고 지구가 푸르게 유지돼요! 🌻',
  '도촌초 정원에 꽃과 나무를 가꾸면 꿀벌과 나비들이 찾아와요! 🦋',
  '꿀벌의 날개는 1초에 200번 이상 빠르게 파닥거려요! 🐝',
  '꽃가루를 옮겨주는 꿀벌 덕분에 아름다운 숲과 생태계가 번성해요! 🌲'
];

export const INITIAL_GAME_TIME = 40; // seconds (Starts at 40s)
export const MAX_GAME_TIME = 45;     // seconds (Strict cap: cannot exceed 45s)
export const GOAL_BLOOMS = 60;       // blooms needed for Sunset Day Clear Ending
export const CLEAR_BONUS_SCORE = 1000;

// Dynamic Diminishing Time Bonus per Level
export const LEVEL_TIME_BONUS = {
  1: 1.0,  // Lv.1: +1.0s per bloom
  2: 1.0,  // Lv.2: +1.0s per bloom
  3: 0.5,  // Lv.3: +0.5s per bloom
  4: 0.5,  // Lv.4: +0.5s per bloom
  5: 0.2   // Lv.5: +0.2s per bloom
};
export const LEVELUP_TIME_BONUS = 5.0; // +5s on ecosystem level up
