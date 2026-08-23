// Dochon Pani Puri Master - Constants & Configuration

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 520;

// 4 Signature Flavors + 1 Fever Special
export const PANI_FLAVORS = {
  MINT: {
    id: 'mint',
    name: '민트·고수 파니',
    shortName: '민트',
    icon: '🌿',
    tag: 'Teekha',
    color: '#10B981',
    bgColor: '#ECFDF5',
    liquidColor: '#059669',
    deepColor: '#047857',
    surfaceColor: '#34D399',
    splashParticleColor: '#6EE7B7',
    description: '상쾌하고 알싸한 초록빛 시그니처 소스'
  },
  TAMARIND: {
    id: 'tamarind',
    name: '스위트 타마린드',
    shortName: '타마린드',
    icon: '🍯',
    tag: 'Meetha',
    color: '#B45309',
    bgColor: '#FFFBEB',
    liquidColor: '#92400E',
    deepColor: '#78350F',
    surfaceColor: '#D97706',
    splashParticleColor: '#FDE68A',
    description: '달콤새콤하고 깊은 맛의 갈색 과일 소스'
  },
  CHILI: {
    id: 'chili',
    name: '스파이시 칠리',
    shortName: '칠리',
    icon: '🌶️',
    tag: 'Chatpata',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    liquidColor: '#DC2626',
    deepColor: '#B91C1C',
    surfaceColor: '#F87171',
    splashParticleColor: '#FECACA',
    description: '화끈하고 중독성 넘치는 매콤한 레드 소스'
  },
  MANGO: {
    id: 'mango',
    name: '망고 요거트',
    shortName: '망고',
    icon: '🥭',
    tag: 'Dahi Mango',
    color: '#F59E0B',
    bgColor: '#FFFDF0',
    liquidColor: '#D97706',
    deepColor: '#B45309',
    surfaceColor: '#FBBF24',
    splashParticleColor: '#FEF08A',
    description: '달콤하고 부드러운 황금빛 요거트 소스'
  },
  GOLDEN: {
    id: 'golden',
    name: '황금 레인보우',
    shortName: '황금',
    icon: '✨',
    tag: 'Fever Rainbow',
    color: '#FACC15',
    bgColor: '#FEFCE8',
    liquidColor: '#EAB308',
    deepColor: '#CA8A04',
    surfaceColor: '#FEF08A',
    splashParticleColor: '#FEF9C3',
    description: '피버 타임 발동 시 모든 손님을 만족시키는 보너스'
  }
};

export const FLAVOR_LIST = [
  PANI_FLAVORS.MINT,
  PANI_FLAVORS.TAMARIND,
  PANI_FLAVORS.CHILI,
  PANI_FLAVORS.MANGO
];

// Diverse Customer Characters with lively expressions
export const CUSTOMER_PROFILES = [
  {
    id: 'aarav',
    name: '아라브',
    role: '미식가 소년',
    skinColor: '#F5D0A9',
    hairColor: '#1E293B',
    hairStyle: 'short',
    shirtColor: '#3B82F6',
    glasses: false,
    turban: false,
    patienceTime: 26,
    catchphrase: '바삭하고 시원한 걸로 부탁해요!'
  },
  {
    id: 'diya',
    name: '디야',
    role: '매운맛 챌린저',
    skinColor: '#E8B88A',
    hairColor: '#0F172A',
    hairStyle: 'pigtails',
    shirtColor: '#EC4899',
    glasses: false,
    turban: false,
    patienceTime: 24,
    catchphrase: '아주 화끈하게 맵게 해주세요!'
  },
  {
    id: 'rohan',
    name: '로한',
    role: '단골 신사',
    skinColor: '#D4A373',
    hairColor: '#334155',
    hairStyle: 'slick',
    shirtColor: '#10B981',
    glasses: true,
    turban: false,
    patienceTime: 28,
    catchphrase: '오늘도 달콤새콤한 타마린드로~'
  },
  {
    id: 'ananya',
    name: '아난야',
    role: '호기심 소녀',
    skinColor: '#FAD9C1',
    hairColor: '#475569',
    hairStyle: 'bun',
    shirtColor: '#8B5CF6',
    glasses: false,
    turban: false,
    patienceTime: 25,
    catchphrase: '망고 요거트 맛이 정말 최고예요!'
  },
  {
    id: 'vikram',
    name: '비크람',
    role: '파니 푸리 장인',
    skinColor: '#C68B59',
    hairColor: '#1E293B',
    hairStyle: 'turban',
    shirtColor: '#F59E0B',
    glasses: false,
    turban: true,
    turbanColor: '#EF4444',
    patienceTime: 27,
    catchphrase: '골고루 듬뿍 담아줘 보시게!'
  },
  {
    id: 'priya',
    name: '프리야',
    role: '댄서 지망생',
    skinColor: '#E0AC75',
    hairColor: '#0F172A',
    hairStyle: 'wavy',
    shirtColor: '#06B6D4',
    glasses: false,
    turban: false,
    patienceTime: 22,
    catchphrase: '서둘러 주세요, 연습 가야 해요!'
  }
];

// Game Balance & Scoring Constants
export const INITIAL_TIME_LIMIT = 60; // 60 seconds for Time Attack
export const MAX_TIME_LIMIT = 90;
export const TIME_BONUS_ON_SUCCESS = 3.5; // +3.5s per success
export const TIME_PENALTY_ON_WRONG = 2.5; // -2.5s on wrong serve

export const BASE_SCORE_PER_PURI = 100;
export const PERFECT_ORDER_BONUS = 150;
export const SPEED_BONUS_MAX = 100;
export const COMBO_MULTIPLIER_STEP = 0.15; // +15% per combo level
export const FEVER_DURATION = 8.0; // 8 seconds of Golden Fever
export const FEVER_SCORE_MULTIPLIER = 2.0;
export const FEVER_REQ_POINTS = 100; // Fever gauge threshold

// Dish capacity on the chef's prep table
export const PREP_TRAY_MAX_PURIS = 6;
