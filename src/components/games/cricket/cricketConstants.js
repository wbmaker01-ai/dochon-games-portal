// Dochon Cricket Game Constants & Configurations

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// Coordinate Reference Points on the Cricket Field Canvas
export const BOWLER_POS = { x: 480, y: 150 };
export const BATTER_POS = { x: 480, y: 405 };
export const WICKET_POS = { x: 480, y: 452 };
export const BOWLER_WICKET_POS = { x: 480, y: 135 };
export const PITCH_BOUNCE_Y = 310;

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

// Bat Swing Timing Thresholds (Milliseconds from ideal contact point)
export const TIMING_THRESHOLDS = {
  PERFECT: 50, // |diff| <= 50ms -> 6 Runs (Home Run)
  GREAT: 110,   // |diff| <= 110ms -> 4 Runs (Boundary)
  GOOD: 170,    // |diff| <= 170ms -> 2 Runs
  OK: 240       // |diff| <= 240ms -> 1 Run
};

// Speed & Difficulty Scaling Tiers
export const SPEED_LEVELS = [
  { minScore: 0, name: '초심자 타자', level: 1, color: '#10B981', badge: 'LV.1 초급' },
  { minScore: 30, name: '유망주 타자', level: 2, color: '#3B82F6', badge: 'LV.2 중급' },
  { minScore: 80, name: '에이스 타자', level: 3, color: '#8B5CF6', badge: 'LV.3 상급' },
  { minScore: 150, name: '크리켓 마스터', level: 4, color: '#F59E0B', badge: 'LV.4 달인' },
  { minScore: 250, name: '전설의 타자', level: 5, color: '#EF4444', badge: 'LV.5 전설' },
  { minScore: 400, name: '도촌 신화', level: 6, color: '#EC4899', badge: 'LV.MAX 신화' }
];
