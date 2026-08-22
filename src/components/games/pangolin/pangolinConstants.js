// Constants and Stage Definitions for Dochon Pangolin Adventure

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// Physics Parameters
export const PHYSICS = {
  GRAVITY: 0.52,
  WALK_SPEED: 4.5,
  ROLL_ACCEL: 0.25,
  MAX_ROLL_SPEED: 10.0,
  JUMP_FORCE: -11.8,
  DOUBLE_JUMP_FORCE: -10.2,
  SPRING_FORCE: -16.5,
  FRICTION: 0.985,
  SLOPE_BOOST: 0.38,
  GROUND_Y_BASE: 420
};

// 4 Global Adventure Stages (Google Pangolin Love Motif)
export const STAGES = [
  {
    id: 1,
    name: '가나 카카오 숲',
    subName: 'Ghana Cocoa Forest',
    country: '가나 (Ghana)',
    targetDistance: 2000,
    timeLimit: 75,
    skyGradient: ['#1e1b4b', '#3b0764', '#9333ea', '#f59e0b'],
    hillColors: ['#14532d', '#166534', '#15803d'],
    groundColor: '#451a03',
    itemType: 'cocoa',
    itemName: '카카오 열매',
    itemEmoji: '🍫',
    itemScore: 100,
    storyText: '사랑하는 친구에게 선물할 달콤한 초콜릿을 만들기 위해 싱싱한 카카오 열매를 모아보세요!'
  },
  {
    id: 2,
    name: '인도 향신료 언덕',
    subName: 'India Spice Hills',
    country: '인도 (India)',
    targetDistance: 2400,
    timeLimit: 70,
    skyGradient: ['#311042', '#701a75', '#c026d3', '#fb923c'],
    hillColors: ['#7c2d12', '#9a3412', '#c2410c'],
    groundColor: '#78350f',
    itemType: 'flower',
    itemName: '향기로운 꽃잎',
    itemEmoji: '🌺',
    itemScore: 120,
    storyText: '향긋한 꽃향기를 전하기 위해 화려한 꽃잎과 장식용 리본을 모으며 언덕을 질주하세요!'
  },
  {
    id: 3,
    name: '중국 대나무 계곡',
    subName: 'China Bamboo Valley',
    country: '중국 (China)',
    targetDistance: 2800,
    timeLimit: 65,
    skyGradient: ['#0f172a', '#064e3b', '#047857', '#34d399'],
    hillColors: ['#065f46', '#047857', '#059669'],
    groundColor: '#064e3b',
    itemType: 'note',
    itemName: '사랑의 멜로디 악보',
    itemEmoji: '🎵',
    itemScore: 150,
    storyText: '마음을 전할 로맨틱한 사랑의 세레나데 악보를 모으며 험난한 계곡을 뛰어넘으세요!'
  },
  {
    id: 4,
    name: '필리핀 별빛 해변',
    subName: 'Philippines Starlight Beach',
    country: '필리핀 (Philippines)',
    targetDistance: 3200,
    timeLimit: 60,
    skyGradient: ['#020617', '#0f172a', '#1e1b4b', '#6366f1'],
    hillColors: ['#1e1b4b', '#312e81', '#3730a3'],
    groundColor: '#1e293b',
    itemType: 'star',
    itemName: '반짝이는 별빛 보석',
    itemEmoji: '✨',
    itemScore: 200,
    storyText: '마지막 목적지! 반짝이는 별빛을 모아 사랑의 완주선에 골인하세요!'
  }
];

export const ITEM_DEFS = {
  cocoa: { name: '카카오 열매', baseScore: 100, color: '#d97706', size: 14 },
  flower: { name: '향기로운 꽃잎', baseScore: 120, color: '#ec4899', size: 14 },
  note: { name: '사랑의 멜로디', baseScore: 150, color: '#38bdf8', size: 14 },
  star: { name: '별빛 보석', baseScore: 200, color: '#fbbf24', size: 15 },
  heart: { name: '황금 하트', baseScore: 500, color: '#ef4444', size: 18 },
  booster: { name: '슈퍼 롤링 젬', baseScore: 300, color: '#a855f7', size: 16 }
};

export const OBSTACLE_DEFS = {
  thorn: { name: '가시덤불', penalty: 50, stunDuration: 30, color: '#dc2626', width: 36, height: 28 },
  rock: { name: '돌부리', penalty: 30, stunDuration: 20, color: '#64748b', width: 40, height: 32 },
  mud: { name: '진흙탕', penalty: 20, slowDuration: 45, color: '#78350f', width: 55, height: 18 }
};
