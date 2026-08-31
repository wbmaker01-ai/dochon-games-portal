// Dochon Cricket Game Constants & Configurations

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// Coordinate Reference Points on the Cricket Field Canvas
export const BOWLER_POS = { x: 480, y: 150 };
export const BATTER_POS = { x: 425, y: 405 }; // Batsman stands to the left (leg/off side) of the wicket
export const WICKET_POS = { x: 480, y: 445 }; // Wickets stand at center target
export const HIT_ZONE_POS = { x: 475, y: 420 }; // Contact point between bat & ball
export const BOWLER_WICKET_POS = { x: 480, y: 135 };
export const PITCH_BOUNCE_Y = 310;

// 5-Stage Dynamic Cricket Stadium Themes
export const CRICKET_THEMES = [
  {
    id: 'DAY',
    name: '도촌 그린 파크 ☀️',
    minScore: 0,
    skyTop: '#38BDF8',
    skyBottom: '#BAE6FD',
    pitchGrass: '#15803D',
    pitchStrip: '#D97706',
    accent: '#10B981'
  },
  {
    id: 'SUNSET',
    name: '선셋 오벌 🌅',
    minScore: 50,
    skyTop: '#7C2D12',
    skyBottom: '#FB923C',
    pitchGrass: '#14532D',
    pitchStrip: '#B45309',
    accent: '#F97316'
  },
  {
    id: 'NIGHT',
    name: '나이트 아레나 🌌',
    minScore: 120,
    skyTop: '#090D16',
    skyBottom: '#1E1B4B',
    pitchGrass: '#064E3B',
    pitchStrip: '#92400E',
    accent: '#38BDF8'
  },
  {
    id: 'STORM',
    name: '스톰 챔피언십 ⚡',
    minScore: 220,
    skyTop: '#18181B',
    skyBottom: '#3F3F46',
    pitchGrass: '#0F766E',
    pitchStrip: '#78350F',
    accent: '#EAB308'
  },
  {
    id: 'CHAMPION',
    name: '월드 블리츠 돔 👑',
    minScore: 350,
    skyTop: '#4C1D95',
    skyBottom: '#831843',
    pitchGrass: '#312E81',
    pitchStrip: '#A16207',
    accent: '#FDE047'
  }
];

// Pitch Types & Characteristics
export const PITCH_TYPES = {
  FASTBALL: {
    id: 'fastball',
    name: '정통 직구',
    nameEn: 'FASTBALL',
    color: '#3B82F6',
    baseSpeed: 1700, // ms from release to batter
    bounceHeight: 38,
    curveAmount: 0,
    trailColor: 'rgba(59, 130, 246, 0.6)',
    desc: '정직하고 시원하게 바운드되어 들어오는 기본 직구'
  },
  SLOW_BOUNCER: {
    id: 'slow_bouncer',
    name: '바운드 아리랑볼',
    nameEn: 'BOUNCER',
    color: '#10B981',
    baseSpeed: 2300,
    bounceHeight: 65,
    curveAmount: 0,
    trailColor: 'rgba(16, 185, 129, 0.6)',
    desc: '지면에 닿고 높게 통통 튀어 올라 타이밍을 뺏는 느린 공'
  },
  CHANGEUP: {
    id: 'changeup',
    name: '감속 체인지업',
    nameEn: 'CHANGEUP',
    color: '#8B5CF6',
    baseSpeed: 2000,
    bounceHeight: 30,
    curveAmount: 0,
    trailColor: 'rgba(139, 92, 246, 0.6)',
    decelerateOnBounce: true,
    desc: '빠르게 날아오다 바운드 순간 급격히 속도가 줄어드는 마구'
  },
  SLIDER: {
    id: 'slider',
    name: '스네이크 슬라이더',
    nameEn: 'SLIDER',
    color: '#F59E0B',
    baseSpeed: 1600,
    bounceHeight: 32,
    curveAmount: 50,
    trailColor: 'rgba(245, 158, 11, 0.6)',
    desc: '바운드 후 날카롭게 바깥쪽으로 휘어지는 변화구'
  },
  GOOGLY: {
    id: 'googly',
    name: '구글리 스핀',
    nameEn: 'GOOGLY SPIN',
    color: '#EC4899',
    baseSpeed: 1850,
    bounceHeight: 45,
    curveAmount: -60,
    trailColor: 'rgba(236, 72, 153, 0.6)',
    desc: '역방향으로 예리하게 회전하며 꺾여 들어오는 스핀 마구'
  },
  FIRE_YORKER: {
    id: 'fire_yorker',
    name: '불꽃 요커',
    nameEn: 'FIRE YORKER',
    color: '#EF4444',
    baseSpeed: 1350,
    bounceHeight: 18,
    curveAmount: 0,
    trailColor: 'rgba(239, 68, 68, 0.9)',
    isFire: true,
    desc: '위켓 바닥을 노리고 불꽃을 뿜으며 꽂히는 최고속 요커!'
  },
  SUPER_BOUNCER: {
    id: 'super_bouncer',
    name: '급상승 슈퍼바운서 💥',
    nameEn: 'SUPER BOUNCER',
    color: '#06B6D4',
    baseSpeed: 1200,
    bounceHeight: 88,
    curveAmount: 25,
    trailColor: 'rgba(6, 182, 212, 0.8)',
    desc: '바닥 충돌 후 머리 위까지 치솟아 오르는 초고난도 바운서'
  },
  KNUCKLE_SPIN: {
    id: 'knuckle_spin',
    name: '너클 지그재그 🌀',
    nameEn: 'KNUCKLE SPIN',
    color: '#C084FC',
    baseSpeed: 1100,
    bounceHeight: 28,
    curveAmount: -80,
    trailColor: 'rgba(192, 132, 252, 0.85)',
    desc: '기류를 타고 좌우로 심하게 요동치는 너클 스핀볼'
  },
  HYPER_YORKER: {
    id: 'hyper_yorker',
    name: '하이퍼 썬더 요커 ⚡',
    nameEn: 'HYPER YORKER',
    color: '#FDE047',
    baseSpeed: 850,
    bounceHeight: 14,
    curveAmount: 0,
    trailColor: 'rgba(253, 224, 71, 0.95)',
    isFire: true,
    desc: '눈으로 보고 반응하기 불가능한 익스트림 광속 요커'
  }
};

// Hit Judgment Definitions & Scores
export const HIT_RESULTS = {
  SIX: {
    id: 'SIX',
    label: 'SIX! 6점 홈런',
    subLabel: 'PERFECT TIMING!',
    points: 6,
    color: '#F59E0B',
    bgGradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    badgeText: '6 RUNS',
    animationDuration: 2200
  },
  FOUR: {
    id: 'FOUR',
    label: 'FOUR! 4점 바운더리',
    subLabel: 'GREAT HIT!',
    points: 4,
    color: '#10B981',
    bgGradient: 'linear-gradient(135deg, #10B981, #059669)',
    badgeText: '4 RUNS',
    animationDuration: 1800
  },
  TWO_RUNS: {
    id: 'TWO_RUNS',
    label: '2점 안타 주루',
    subLabel: 'GOOD SHOT!',
    points: 2,
    color: '#3B82F6',
    bgGradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    badgeText: '2 RUNS',
    animationDuration: 1600
  },
  ONE_RUN: {
    id: 'ONE_RUN',
    label: '1점 단타 주루',
    subLabel: 'NICE CONTACT',
    points: 1,
    color: '#6366F1',
    bgGradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    badgeText: '1 RUN',
    animationDuration: 1400
  },
  WICKET_OUT: {
    id: 'WICKET_OUT',
    label: 'WICKET! 아웃',
    subLabel: 'BOWLED OUT!',
    points: 0,
    color: '#EF4444',
    bgGradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
    badgeText: 'OUT',
    animationDuration: 2500
  }
};

// Bat Swing Timing Thresholds (Base ms)
export const TIMING_THRESHOLDS = {
  PERFECT: 45, // |diff| <= 45ms -> 6 Runs (Home Run)
  GREAT: 100,   // |diff| <= 100ms -> 4 Runs (Boundary)
  GOOD: 160,    // |diff| <= 160ms -> 2 Runs
  OK: 220       // |diff| <= 220ms -> 1 Run
};

// Speed & Difficulty Scaling Tiers (No Speed Limit)
export const SPEED_LEVELS = [
  { minScore: 0, name: '초심자 (Lv.1)', level: 1, color: '#10B981', badge: 'Lv.1 루키', speedMultiplier: 1.0, timingScale: 1.0 },
  { minScore: 25, name: '유망주 (Lv.2)', level: 2, color: '#38BDF8', badge: 'Lv.2 주니어', speedMultiplier: 1.2, timingScale: 0.90 },
  { minScore: 60, name: '에이스 (Lv.3)', level: 3, color: '#60A5FA', badge: 'Lv.3 에이스', speedMultiplier: 1.45, timingScale: 0.80 },
  { minScore: 110, name: '마스터 (Lv.4)', level: 4, color: '#FBBF24', badge: 'Lv.4 마스터', speedMultiplier: 1.75, timingScale: 0.70 },
  { minScore: 170, name: '챔피언 (Lv.5)', level: 5, color: '#FB923C', badge: 'Lv.5 챔피언', speedMultiplier: 2.10, timingScale: 0.60 },
  { minScore: 240, name: '레전드 (Lv.6)', level: 6, color: '#F43F5E', badge: 'Lv.6 레전드', speedMultiplier: 2.50, timingScale: 0.50 },
  { minScore: 320, name: '도촌 신화 (Lv.7)', level: 7, color: '#C084FC', badge: 'Lv.7 신화', speedMultiplier: 2.95, timingScale: 0.42 },
  { minScore: 420, name: '익스트림 (Lv.8)', level: 8, color: '#E879F9', badge: 'Lv.8 익스트림', speedMultiplier: 3.45, timingScale: 0.35 },
  { minScore: 540, name: '초신성 블리츠 (Lv.9+)', level: 9, color: '#FDE047', badge: 'Lv.9+ 블리츠', speedMultiplier: 4.00, timingScale: 0.28 }
];
