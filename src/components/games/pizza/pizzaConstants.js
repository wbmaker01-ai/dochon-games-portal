// Dochon Pizza Master - Game Constants & Stage Configurations

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 560;

export const PIZZA_CENTER = { x: 320, y: 275 };
export const PIZZA_RADIUS = 185;
export const CRUST_WIDTH = 22;

export const TOPPING_TYPES = {
  PEPPERONI: 'pepperoni',
  OLIVE: 'olive',
  MUSHROOM: 'mushroom',
  PAPRIKA: 'paprika',
  BASIL: 'basil',
  TOMATO: 'tomato'
};

export const TOPPING_INFO = {
  [TOPPING_TYPES.PEPPERONI]: {
    name: '페퍼로니',
    emoji: '🍕',
    color: '#D32F2F',
    borderColor: '#9A0007',
    radius: 20
  },
  [TOPPING_TYPES.OLIVE]: {
    name: '블랙 올리브',
    emoji: '🫒',
    color: '#212121',
    borderColor: '#424242',
    radius: 13
  },
  [TOPPING_TYPES.MUSHROOM]: {
    name: '양송이 버섯',
    emoji: '🍄',
    color: '#E8D8C8',
    borderColor: '#BCAAA4',
    radius: 17
  },
  [TOPPING_TYPES.PAPRIKA]: {
    name: '파프리카',
    emoji: '🫑',
    color: '#2E7D32',
    borderColor: '#1B5E20',
    radius: 16
  },
  [TOPPING_TYPES.BASIL]: {
    name: '생 바질',
    emoji: '🌿',
    color: '#43A047',
    borderColor: '#2E7D32',
    radius: 15
  },
  [TOPPING_TYPES.TOMATO]: {
    name: '방울 토마토',
    emoji: '🍅',
    color: '#E53935',
    borderColor: '#B71C1C',
    radius: 16
  }
};

// Stage Configurations with Fraction & Geometry math learning goals
export const STAGES = [
  {
    level: 1,
    title: '입문: 1/2로 반 나누기',
    customerName: '도촌 토끼',
    customerAvatar: '🐰',
    customerSpeech: '친구랑 둘이서 먹으려고 해요! 피자를 똑같이 2조각(1/2)으로 나누고, 페퍼로니를 2개씩 나눠주세요!',
    fractionText: '1/2 (2등분)',
    targetSlices: 2,
    maxCuts: 1,
    timeLimit: 45,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PEPPERONI, x: 250, y: 220 },
      { id: 2, type: TOPPING_TYPES.PEPPERONI, x: 240, y: 320 },
      { id: 3, type: TOPPING_TYPES.PEPPERONI, x: 390, y: 220 },
      { id: 4, type: TOPPING_TYPES.PEPPERONI, x: 400, y: 320 }
    ],
    // Validation requirement: Each slice needs exactly 2 pepperonis
    requirements: [
      { type: TOPPING_TYPES.PEPPERONI, countPerSlice: 2, description: '각 조각마다 페퍼로니 2개' }
    ]
  },
  {
    level: 2,
    title: '기초: 1/4로 4등분하기',
    customerName: '도촌 곰돌이',
    customerAvatar: '🐻',
    customerSpeech: '우리 가족 4명이 사이좋게 1조각씩! 피자를 똑같이 4조각(1/4)으로 나누고, 각 조각에 올리브 1개씩 넣어주세요!',
    fractionText: '1/4 (4등분)',
    targetSlices: 4,
    maxCuts: 2,
    timeLimit: 45,
    toppings: [
      { id: 1, type: TOPPING_TYPES.OLIVE, x: 250, y: 205 },
      { id: 2, type: TOPPING_TYPES.OLIVE, x: 390, y: 205 },
      { id: 3, type: TOPPING_TYPES.OLIVE, x: 250, y: 345 },
      { id: 4, type: TOPPING_TYPES.OLIVE, x: 390, y: 345 }
    ],
    requirements: [
      { type: TOPPING_TYPES.OLIVE, countPerSlice: 1, description: '각 조각마다 올리브 1개' }
    ]
  },
  {
    level: 3,
    title: '응용: 반반 피자 4등분',
    customerName: '도촌 냥이',
    customerAvatar: '🐱',
    customerSpeech: '저는 페퍼로니파, 동생은 버섯파예요! 왼쪽은 페퍼로니 2조각, 오른쪽은 버섯 2조각으로 4등분(1/4)해주세요!',
    fractionText: '1/4 (4등분)',
    targetSlices: 4,
    maxCuts: 2,
    timeLimit: 50,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PEPPERONI, x: 240, y: 210 },
      { id: 2, type: TOPPING_TYPES.PEPPERONI, x: 240, y: 340 },
      { id: 3, type: TOPPING_TYPES.MUSHROOM, x: 400, y: 210 },
      { id: 4, type: TOPPING_TYPES.MUSHROOM, x: 400, y: 340 }
    ],
    requirements: [
      { type: TOPPING_TYPES.PEPPERONI, requiredTotalSlices: 2, countPerSlice: 1, description: '페퍼로니 조각 2개' },
      { type: TOPPING_TYPES.MUSHROOM, requiredTotalSlices: 2, countPerSlice: 1, description: '버섯 조각 2개' }
    ]
  },
  {
    level: 4,
    title: '심화: 1/3 균등 3등분',
    customerName: '도촌 다람쥐',
    customerAvatar: '🐿️',
    customerSpeech: '도토리 삼총사가 모였어요! 피자를 정확하게 3조각(1/3)으로 나누고 방울토마토를 2개씩 공평하게 나눠줘요!',
    fractionText: '1/3 (3등분)',
    targetSlices: 3,
    maxCuts: 3,
    timeLimit: 55,
    toppings: [
      { id: 1, type: TOPPING_TYPES.TOMATO, x: 300, y: 170 },
      { id: 2, type: TOPPING_TYPES.TOMATO, x: 340, y: 170 },
      { id: 3, type: TOPPING_TYPES.TOMATO, x: 210, y: 320 },
      { id: 4, type: TOPPING_TYPES.TOMATO, x: 245, y: 350 },
      { id: 5, type: TOPPING_TYPES.TOMATO, x: 430, y: 320 },
      { id: 6, type: TOPPING_TYPES.TOMATO, x: 395, y: 350 }
    ],
    requirements: [
      { type: TOPPING_TYPES.TOMATO, countPerSlice: 2, description: '각 조각마다 방울토마토 2개' }
    ]
  },
  {
    level: 5,
    title: '숙련: 1/6 정밀 6등분',
    customerName: '도촌 펭귄',
    customerAvatar: '🐧',
    customerSpeech: '피자 파티 시작! 3번의 멋진 칼질로 피자를 똑같이 6조각(1/6)으로 나누고, 각 조각에 파프리카 1개씩 넣어주세요!',
    fractionText: '1/6 (6등분)',
    targetSlices: 6,
    maxCuts: 3,
    timeLimit: 60,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PAPRIKA, x: 320, y: 160 },
      { id: 2, type: TOPPING_TYPES.PAPRIKA, x: 415, y: 220 },
      { id: 3, type: TOPPING_TYPES.PAPRIKA, x: 415, y: 330 },
      { id: 4, type: TOPPING_TYPES.PAPRIKA, x: 320, y: 390 },
      { id: 5, type: TOPPING_TYPES.PAPRIKA, x: 225, y: 330 },
      { id: 6, type: TOPPING_TYPES.PAPRIKA, x: 225, y: 220 }
    ],
    requirements: [
      { type: TOPPING_TYPES.PAPRIKA, countPerSlice: 1, description: '각 조각마다 파프리카 1개' }
    ]
  },
  {
    level: 6,
    title: '스페셜: 콤비네이션 4등분',
    customerName: '도촌 여우',
    customerAvatar: '🦊',
    customerSpeech: '페퍼로니 1개와 버섯 1개가 모든 조각에 동시에 들어가도록 4조각(1/4)으로 깔끔하게 등분해주세요!',
    fractionText: '1/4 (4등분)',
    targetSlices: 4,
    maxCuts: 2,
    timeLimit: 50,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PEPPERONI, x: 240, y: 200 },
      { id: 2, type: TOPPING_TYPES.MUSHROOM, x: 275, y: 235 },
      { id: 3, type: TOPPING_TYPES.PEPPERONI, x: 400, y: 200 },
      { id: 4, type: TOPPING_TYPES.MUSHROOM, x: 365, y: 235 },
      { id: 5, type: TOPPING_TYPES.PEPPERONI, x: 240, y: 350 },
      { id: 6, type: TOPPING_TYPES.MUSHROOM, x: 275, y: 315 },
      { id: 7, type: TOPPING_TYPES.PEPPERONI, x: 400, y: 350 },
      { id: 8, type: TOPPING_TYPES.MUSHROOM, x: 365, y: 315 }
    ],
    requirements: [
      { type: TOPPING_TYPES.PEPPERONI, countPerSlice: 1, description: '각 조각마다 페퍼로니 1개' },
      { type: TOPPING_TYPES.MUSHROOM, countPerSlice: 1, description: '각 조각마다 버섯 1개' }
    ]
  },
  {
    level: 7,
    title: '마스터: 1/8 대형 8등분',
    customerName: '도촌 사자',
    customerAvatar: '🦁',
    customerSpeech: '우와! 8명의 친구들이 기다려요! 4번의 직선 컷팅으로 완벽한 8등분(1/8)을 만들고 올리브를 1개씩 채워주세요!',
    fractionText: '1/8 (8등분)',
    targetSlices: 8,
    maxCuts: 4,
    timeLimit: 65,
    toppings: [
      { id: 1, type: TOPPING_TYPES.OLIVE, x: 320, y: 150 },
      { id: 2, type: TOPPING_TYPES.OLIVE, x: 400, y: 190 },
      { id: 3, type: TOPPING_TYPES.OLIVE, x: 440, y: 275 },
      { id: 4, type: TOPPING_TYPES.OLIVE, x: 400, y: 360 },
      { id: 5, type: TOPPING_TYPES.OLIVE, x: 320, y: 400 },
      { id: 6, type: TOPPING_TYPES.OLIVE, x: 240, y: 360 },
      { id: 7, type: TOPPING_TYPES.OLIVE, x: 200, y: 275 },
      { id: 8, type: TOPPING_TYPES.OLIVE, x: 240, y: 190 }
    ],
    requirements: [
      { type: TOPPING_TYPES.OLIVE, countPerSlice: 1, description: '각 조각마다 올리브 1개' }
    ]
  },
  {
    level: 8,
    title: '이탈리안: 마르게리타 6등분',
    customerName: '도촌 부엉이',
    customerAvatar: '🦉',
    customerSpeech: '신선한 생바질과 방울토마토가 조화로운 6조각(1/6) 피자를 주문합니다! 각 조각에 바질과 토마토가 1개씩 쏙!',
    fractionText: '1/6 (6등분)',
    targetSlices: 6,
    maxCuts: 3,
    timeLimit: 60,
    toppings: [
      { id: 1, type: TOPPING_TYPES.BASIL, x: 305, y: 165 },
      { id: 2, type: TOPPING_TYPES.TOMATO, x: 335, y: 165 },
      { id: 3, type: TOPPING_TYPES.BASIL, x: 405, y: 215 },
      { id: 4, type: TOPPING_TYPES.TOMATO, x: 425, y: 240 },
      { id: 5, type: TOPPING_TYPES.BASIL, x: 405, y: 335 },
      { id: 6, type: TOPPING_TYPES.TOMATO, x: 425, y: 310 },
      { id: 7, type: TOPPING_TYPES.BASIL, x: 305, y: 385 },
      { id: 8, type: TOPPING_TYPES.TOMATO, x: 335, y: 385 },
      { id: 9, type: TOPPING_TYPES.BASIL, x: 235, y: 335 },
      { id: 10, type: TOPPING_TYPES.TOMATO, x: 215, y: 310 },
      { id: 11, type: TOPPING_TYPES.BASIL, x: 235, y: 215 },
      { id: 12, type: TOPPING_TYPES.TOMATO, x: 215, y: 240 }
    ],
    requirements: [
      { type: TOPPING_TYPES.BASIL, countPerSlice: 1, description: '각 조각마다 바질 1개' },
      { type: TOPPING_TYPES.TOMATO, countPerSlice: 1, description: '각 조각마다 방울토마토 1개' }
    ]
  },
  {
    level: 9,
    title: '올스타: 3색 토핑 8등분',
    customerName: '도촌 판다',
    customerAvatar: '🐼',
    customerSpeech: '페퍼로니, 올리브, 파프리카가 골고루 어우러진 8등분(1/8) 최고급 피자를 부탁해요! 칼질 4번으로 성공해보세요!',
    fractionText: '1/8 (8등분)',
    targetSlices: 8,
    maxCuts: 4,
    timeLimit: 70,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PEPPERONI, x: 320, y: 155 },
      { id: 2, type: TOPPING_TYPES.OLIVE, x: 395, y: 195 },
      { id: 3, type: TOPPING_TYPES.PAPRIKA, x: 435, y: 275 },
      { id: 4, type: TOPPING_TYPES.PEPPERONI, x: 395, y: 355 },
      { id: 5, type: TOPPING_TYPES.OLIVE, x: 320, y: 395 },
      { id: 6, type: TOPPING_TYPES.PAPRIKA, x: 245, y: 355 },
      { id: 7, type: TOPPING_TYPES.PEPPERONI, x: 205, y: 275 },
      { id: 8, type: TOPPING_TYPES.OLIVE, x: 245, y: 195 },
      { id: 9, type: TOPPING_TYPES.PAPRIKA, x: 320, y: 210 },
      { id: 10, type: TOPPING_TYPES.PEPPERONI, x: 365, y: 275 },
      { id: 11, type: TOPPING_TYPES.OLIVE, x: 320, y: 340 },
      { id: 12, type: TOPPING_TYPES.PAPRIKA, x: 275, y: 275 }
    ],
    requirements: [
      { type: TOPPING_TYPES.PEPPERONI, minTotalSlices: 4, description: '페퍼로니 조각 4개 이상' },
      { type: TOPPING_TYPES.OLIVE, minTotalSlices: 4, description: '올리브 조각 4개 이상' }
    ]
  },
  {
    level: 10,
    title: '그랜드 마스터: 셰프 승급전',
    customerName: '도촌 마스터 셰프',
    customerAvatar: '👨‍🍳',
    customerSpeech: '마지막 관문일세! 8조각(1/8)으로 오차 없이 완벽하게 분할하고 전설의 도촌 피자 마스터 칭호를 획득하게!',
    fractionText: '1/8 (8등분)',
    targetSlices: 8,
    maxCuts: 4,
    timeLimit: 65,
    toppings: [
      { id: 1, type: TOPPING_TYPES.PEPPERONI, x: 320, y: 150 },
      { id: 2, type: TOPPING_TYPES.MUSHROOM, x: 400, y: 190 },
      { id: 3, type: TOPPING_TYPES.PAPRIKA, x: 440, y: 275 },
      { id: 4, type: TOPPING_TYPES.TOMATO, x: 400, y: 360 },
      { id: 5, type: TOPPING_TYPES.PEPPERONI, x: 320, y: 400 },
      { id: 6, type: TOPPING_TYPES.MUSHROOM, x: 240, y: 360 },
      { id: 7, type: TOPPING_TYPES.PAPRIKA, x: 200, y: 275 },
      { id: 8, type: TOPPING_TYPES.TOMATO, x: 240, y: 190 }
    ],
    requirements: [
      { type: TOPPING_TYPES.PEPPERONI, countPerSlice: 1, requiredTotalSlices: 2, description: '페퍼로니 조각 2개' },
      { type: TOPPING_TYPES.MUSHROOM, countPerSlice: 1, requiredTotalSlices: 2, description: '버섯 조각 2개' },
      { type: TOPPING_TYPES.PAPRIKA, countPerSlice: 1, requiredTotalSlices: 2, description: '파프리카 조각 2개' },
      { type: TOPPING_TYPES.TOMATO, countPerSlice: 1, requiredTotalSlices: 2, description: '토마토 조각 2개' }
    ]
  }
];

// Helper to generate procedural stages for endless mode after Level 10
export function generateEndlessStage(levelNumber) {
  const sliceOptions = [4, 6, 8];
  const targetSlices = sliceOptions[Math.floor(Math.random() * sliceOptions.length)];
  const maxCuts = targetSlices / 2;
  const availableToppings = [TOPPING_TYPES.PEPPERONI, TOPPING_TYPES.OLIVE, TOPPING_TYPES.MUSHROOM, TOPPING_TYPES.PAPRIKA, TOPPING_TYPES.TOMATO];
  const chosenTopping = availableToppings[Math.floor(Math.random() * availableToppings.length)];

  const toppings = [];
  const angleStep = (Math.PI * 2) / targetSlices;
  const dist = PIZZA_RADIUS * 0.6;

  for (let i = 0; i < targetSlices; i++) {
    const angle = angleStep * i + (angleStep / 2) + (Math.random() - 0.5) * 0.2;
    toppings.push({
      id: i + 1,
      type: chosenTopping,
      x: PIZZA_CENTER.x + Math.cos(angle) * dist,
      y: PIZZA_CENTER.y + Math.sin(angle) * dist
    });
  }

  const avatars = ['🦊', '🐰', '🐻', '🐼', '🦁', '🦉', '🐱', '🐶', '🦄'];
  const avatar = avatars[Math.floor(Math.random() * avatars.length)];

  return {
    level: levelNumber,
    title: `무한 챌린지: Level ${levelNumber}`,
    customerName: `도촌 VIP 손님`,
    customerAvatar: avatar,
    customerSpeech: `피자를 똑같이 ${targetSlices}조각(1/${targetSlices})으로 나누고, ${TOPPING_INFO[chosenTopping].name}을 1개씩 넣어주세요!`,
    fractionText: `1/${targetSlices} (${targetSlices}등분)`,
    targetSlices,
    maxCuts,
    timeLimit: Math.max(35, 60 - (levelNumber - 10) * 2),
    toppings,
    requirements: [
      { type: chosenTopping, countPerSlice: 1, description: `각 조각마다 ${TOPPING_INFO[chosenTopping].name} 1개` }
    ]
  };
}

// Scoring & Star thresholds
export const SCORE_BASE_SUCCESS = 500;
export const SCORE_PER_PERFECT_STAR = 200;
export const SCORE_COMBO_MULTIPLIER = 100;
export const SCORE_TIME_BONUS_PER_SEC = 10;
