// Dochon Bubble Tea Cafe - Game Constants & Recipe Definitions

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Cup Geometry on Canvas
export const CUP_CONFIG = {
  x: 400, // Center X
  y: 450, // Bottom Y
  topWidth: 170,
  bottomWidth: 125,
  height: 230,
  wallThickness: 6,
  strawWidth: 20,
  strawHeight: 300,
  strawAngle: -0.12 // slightly tilted
};

// Customer definitions (Cute animals inspired by Google Doodle)
export const CUSTOMERS = [
  {
    id: 'bear',
    name: '포모사 흑곰',
    tag: '대만 흑곰',
    color: '#262626',
    bellyColor: '#FFFFFF',
    innerEarColor: '#FFAAA6',
    favorite: '오리지널 흑당 버블티',
    message: '시원하고 달콤한 흑당 버블티 한 잔 부탁해요! 🐻'
  },
  {
    id: 'shiba',
    name: '시바견 뭉치',
    tag: '발랄한 시바',
    color: '#D97706',
    bellyColor: '#FEF3C7',
    innerEarColor: '#F43F5E',
    favorite: '달콤 망고 버블티',
    message: '오늘 산책하고 와서 시원한 망고 버블티가 땡겨요! 🐶'
  },
  {
    id: 'cat',
    name: '삼색 고양이 나비',
    tag: '새침한 냥이',
    color: '#F97316',
    bellyColor: '#FFFFFF',
    innerEarColor: '#FDA4AF',
    favorite: '부드러운 타로 버블티',
    message: '보라빛 달콤한 타로 밀크티에 펄 많이 넣어주세요, 냥~ 🐱'
  },
  {
    id: 'rabbit',
    name: '토끼 달콩이',
    tag: '달콤 토끼',
    color: '#FBCFE8',
    bellyColor: '#FFFFFF',
    innerEarColor: '#FB7185',
    favorite: '상큼 딸기 버블티',
    message: '딸기 펄이 듬뿍 들어간 상큼한 딸기 라떼 주세요! 🐰'
  },
  {
    id: 'fox',
    name: '여우 루루',
    tag: '영리한 여우',
    color: '#EA580C',
    bellyColor: '#FFFBEB',
    innerEarColor: '#FCA5A5',
    favorite: '쌉싸름 말차 버블티',
    message: '초록빛 깊은 맛의 말차 버블티를 정성껏 만들어주세요! 🦊'
  },
  {
    id: 'penguin',
    name: '아기 펭귄 핑구',
    tag: '시원한 펭귄',
    color: '#1E293B',
    bellyColor: '#F8FAFC',
    innerEarColor: '#38BDF8',
    favorite: '블루 스카이 버블티',
    message: '남극처럼 시원하고 달달한 소다 버블티 부탁해요! 🐧'
  }
];

// Drink Recipes with 3 distinct target levels (Pearl, Tea, Syrup)
export const RECIPES = [
  {
    id: 'black_sugar',
    name: '오리지널 흑당 버블티',
    pearlType: 'tapioca',
    pearlName: '쫀득 타피오카 펄',
    pearlColor: '#1E1B18',
    pearlCount: 22,
    teaType: 'milk_tea',
    teaName: '클래식 홍차 밀크티',
    teaColor: '#C49774',
    teaGradient: ['#E2BCA4', '#B47B56'],
    syrupType: 'black_sugar_syrup',
    syrupName: '진한 흑당 시럽',
    syrupColor: '#3B1E08',
    strawColor: '#F59E0B',
    line1Pct: 0.28, // 28% height from bottom
    line2Pct: 0.72, // 72% height from bottom
    line3Pct: 0.90  // 90% height from bottom
  },
  {
    id: 'taro_milk',
    name: '달콤 보라 타로 밀크티',
    pearlType: 'tapioca',
    pearlName: '쫀득 타피오카 펄',
    pearlColor: '#1E1B18',
    pearlCount: 20,
    teaType: 'taro_tea',
    teaName: '부드러운 타로 밀크티',
    teaColor: '#B088F9',
    teaGradient: ['#D6BBFC', '#9055EB'],
    syrupType: 'vanilla_cream',
    syrupName: '달콤 바닐라 크림',
    syrupColor: '#FFF8E7',
    strawColor: '#A855F7',
    line1Pct: 0.25,
    line2Pct: 0.70,
    line3Pct: 0.88
  },
  {
    id: 'matcha_latte',
    name: '쌉싸름 녹차 말차 라떼',
    pearlType: 'tapioca',
    pearlName: '쫀득 타피오카 펄',
    pearlColor: '#1E1B18',
    pearlCount: 24,
    teaType: 'matcha_tea',
    teaName: '진한 유기농 말차 라떼',
    teaColor: '#4E9F3D',
    teaGradient: ['#7ED957', '#347424'],
    syrupType: 'sweet_condensed_milk',
    syrupName: '달콤 연유 폼',
    syrupColor: '#FFFFF0',
    strawColor: '#22C55E',
    line1Pct: 0.30,
    line2Pct: 0.75,
    line3Pct: 0.92
  },
  {
    id: 'strawberry_boba',
    name: '상큼 핑크 딸기 버블티',
    pearlType: 'strawberry_pearl',
    pearlName: '루비 딸기 팝핑펄',
    pearlColor: '#E11D48',
    pearlCount: 26,
    teaType: 'strawberry_milk',
    teaName: '리얼 딸기 우유',
    teaColor: '#FB7185',
    teaGradient: ['#FDA4AF', '#F43F5E'],
    syrupType: 'strawberry_jam',
    syrupName: '달콤 딸기 과육 시럽',
    syrupColor: '#9F1239',
    strawColor: '#FB7185',
    line1Pct: 0.32,
    line2Pct: 0.76,
    line3Pct: 0.92
  },
  {
    id: 'mango_boba',
    name: '골든 망고 버블티',
    pearlType: 'mango_pearl',
    pearlName: '골든 망고 팝핑펄',
    pearlColor: '#F59E0B',
    pearlCount: 24,
    teaType: 'mango_juice',
    teaName: '시원한 리얼 망고티',
    teaColor: '#FBBF24',
    teaGradient: ['#FDE68A', '#F59E0B'],
    syrupType: 'mango_puree',
    syrupName: '달콤 망고 퓨레',
    syrupColor: '#D97706',
    strawColor: '#EAB308',
    line1Pct: 0.28,
    line2Pct: 0.74,
    line3Pct: 0.90
  },
  {
    id: 'blue_soda',
    name: '청량 블루 스카이 버블티',
    pearlType: 'tapioca',
    pearlName: '쫀득 타피오카 펄',
    pearlColor: '#1E1B18',
    pearlCount: 20,
    teaType: 'blue_soda',
    teaName: '에메랄드 블루 소다',
    teaColor: '#0EA5E9',
    teaGradient: ['#7DD3FC', '#0284C7'],
    syrupType: 'icecream_topping',
    syrupName: '밀키 바닐라 아이스크림',
    syrupColor: '#FFFFFF',
    strawColor: '#38BDF8',
    line1Pct: 0.26,
    line2Pct: 0.70,
    line3Pct: 0.88
  }
];

// Pouring Steps
export const STEP_PEARLS = 1;
export const STEP_TEA = 2;
export const STEP_SYRUP = 3;
export const STEP_SERVE = 4;

// Accuracy Ratings & Tolerances (in pixels from target line)
export const RATING_CONFIG = {
  PERFECT: {
    maxDiff: 5, // within 5px
    stars: 3,
    score: 150,
    label: 'PERFECT! ⭐️⭐️⭐️',
    color: '#FBBF24',
    bonusMultiplier: 1.5
  },
  GREAT: {
    maxDiff: 14, // within 14px
    stars: 2,
    score: 100,
    label: 'GREAT! ⭐️⭐️',
    color: '#38BDF8',
    bonusMultiplier: 1.2
  },
  GOOD: {
    maxDiff: 28, // within 28px
    stars: 1,
    score: 50,
    label: 'GOOD! ⭐️',
    color: '#4ADE80',
    bonusMultiplier: 1.0
  },
  MISS: {
    maxDiff: Infinity,
    stars: 0,
    score: 10,
    label: 'OOPS! 💧',
    color: '#F87171',
    bonusMultiplier: 0.5
  }
};

export const TOTAL_CUSTOMERS_PER_DAY = 6;
