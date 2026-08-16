// Dochon Baseball Game Constants & Configurations

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// 3D Perspective Coordinate Reference Points (Matching New 3D Stadium Field)
export const PITCHER_POS = {
  x: 480,
  y: 350,
  scale: 0.28
};

// Batter in Left Batter's Box (Naturally standing just left of home plate)
export const BATTER_POS = {
  x: 400,
  y: 445,
  scale: 0.58
};

// 3D Home Plate at bottom center
export const HOME_PLATE_POS = {
  x: 480,
  y: 460
};

// Progressive Speed Level Tiers & Dynamic Timing Scales
export const SPEED_LEVELS = [
  { level: 1, name: '루키 (Rookie)', minScore: 0, speedMultiplier: 1.0, color: '#10B981', bgBadge: '#064E3B', timingScale: 1.0 },
  { level: 2, name: '주니어 (Junior)', minScore: 400, speedMultiplier: 1.15, color: '#38BDF8', bgBadge: '#0C4A6E', timingScale: 0.88 },
  { level: 3, name: '에이스 (Ace)', minScore: 1000, speedMultiplier: 1.30, color: '#FBBF24', bgBadge: '#78350F', timingScale: 0.75 },
  { level: 4, name: '마스터 (Master)', minScore: 2000, speedMultiplier: 1.48, color: '#FB923C', bgBadge: '#7C2D12', timingScale: 0.62 },
  { level: 5, name: '올스타 (All-Star)', minScore: 3500, speedMultiplier: 1.65, color: '#F43F5E', bgBadge: '#881337', timingScale: 0.52 },
  { level: 6, name: '레전드 (Legend)', minScore: 5000, speedMultiplier: 1.85, color: '#C084FC', bgBadge: '#581C87', timingScale: 0.42 }
];

// Pitch Types Definitions
export const PITCH_TYPES = {
  FASTBALL: {
    id: 'FASTBALL',
    name: '정직한 직구',
    color: '#FFFFFF',
    trailColor: 'rgba(255, 255, 255, 0.6)',
    baseSpeed: 2100, // ms duration from pitcher to plate
    difficulty: 1,
    description: '일정한 속도로 똑바로 날아오는 직구'
  },
  SLOWBALL: {
    id: 'SLOWBALL',
    name: '느린 아리랑볼',
    color: '#6EE7B7',
    trailColor: 'rgba(110, 231, 183, 0.6)',
    baseSpeed: 2900,
    difficulty: 1,
    description: '포물선을 그리며 천천히 날아오는 느린 공'
  },
  CHANGEUP: {
    id: 'CHANGEUP',
    name: '마법 체인지업',
    color: '#60A5FA',
    trailColor: 'rgba(96, 165, 250, 0.6)',
    baseSpeed: 2400,
    difficulty: 2,
    deceleratePoint: 0.5,
    decelerateFactor: 1.9,
    description: '타석 앞에서 갑자기 속도가 뚝 떨어지는 변화구'
  },
  CURVE: {
    id: 'CURVE',
    name: '휘어지는 커브',
    color: '#F59E0B',
    trailColor: 'rgba(245, 158, 11, 0.6)',
    baseSpeed: 2150,
    difficulty: 2,
    curveAmplitude: 135,
    description: '옆으로 크게 휘어지는 궤적의 커브볼'
  },
  SINKER: {
    id: 'SINKER',
    name: '낙차 큰 싱커',
    color: '#A855F7',
    trailColor: 'rgba(168, 85, 247, 0.6)',
    baseSpeed: 1900,
    difficulty: 3,
    verticalDrop: 75,
    description: '타석 앞에서 아래로 급격히 가라앉는 싱커'
  },
  ZIGZAG: {
    id: 'ZIGZAG',
    name: '도촌 마구 (지그재그)',
    color: '#EC4899',
    trailColor: 'rgba(236, 72, 153, 0.7)',
    baseSpeed: 2000,
    difficulty: 4,
    zigzagFreq: 4.5,
    zigzagAmp: 85,
    description: '좌우로 번갈아 꺾이며 날아오는 마구'
  },
  GHOST: {
    id: 'GHOST',
    name: '도촌 유령 마구',
    color: '#94A3B8',
    trailColor: 'rgba(148, 163, 184, 0.5)',
    baseSpeed: 2100,
    difficulty: 4,
    disappearRange: [0.35, 0.75],
    description: '중간 구간에서 시야에서 사라졌다가 나타나는 유령구'
  },
  FIREBALL: {
    id: 'FIREBALL',
    name: '초고속 불꽃 광속구',
    color: '#EF4444',
    trailColor: 'rgba(239, 68, 68, 0.8)',
    baseSpeed: 1350,
    difficulty: 5,
    hasFlameEffect: true,
    description: '엄청난 속도와 불꽃을 뿜으며 꽂히는 광속구'
  },
  BAD_BALL_HIGH: {
    id: 'BAD_BALL_HIGH',
    name: '높은 유인구 (BALL)',
    color: '#84CC16',
    trailColor: 'rgba(132, 204, 22, 0.6)',
    baseSpeed: 1950,
    difficulty: 2,
    isBadBall: true,
    verticalOffset: -65,
    description: '스트라이크 존 위로 크게 벗어나는 유인구'
  },
  BAD_BALL_LOW: {
    id: 'BAD_BALL_LOW',
    name: '원바운드 유인구 (BALL)',
    color: '#84CC16',
    trailColor: 'rgba(132, 204, 22, 0.6)',
    baseSpeed: 2000,
    difficulty: 2,
    isBadBall: true,
    verticalOffset: 75,
    description: '홈플레이트 앞 바닥으로 떨어지는 원바운드 유인구'
  },
  BAD_BALL_WIDE: {
    id: 'BAD_BALL_WIDE',
    name: '바깥쪽 빠지는 유인구 (BALL)',
    color: '#84CC16',
    trailColor: 'rgba(132, 204, 22, 0.6)',
    baseSpeed: 1900,
    difficulty: 3,
    isBadBall: true,
    lateralOffset: 120,
    description: '타자 바깥쪽으로 멀리 빠져나가는 슬라이더 유인구'
  }
};

// Batting Timing Judgments (Base ms thresholds)
export const TIMING_THRESHOLDS = {
  PERFECT: 50,
  GREAT: 110,
  GOOD: 180,
  OUT: 270,
  FOUL: 340
};

// Hit Type Definitions & Scoring
export const HIT_RESULTS = {
  HOMERUN: {
    label: 'HOMERUN! 💥',
    subLabel: '장쾌한 장외 홈런!',
    color: '#FBBF24',
    bases: 4,
    baseScore: 150,
    audio: 'playBaseballHomerun'
  },
  GRAND_SLAM: {
    label: 'GRAND SLAM! 🏆',
    subLabel: '짜릿한 만루 홈런!!',
    color: '#F43F5E',
    bases: 4,
    baseScore: 350,
    audio: 'playBaseballHomerun'
  },
  TRIPLE: {
    label: 'TRIPLE! ⚡',
    subLabel: '우중간을 가르는 3루타!',
    color: '#38BDF8',
    bases: 3,
    baseScore: 90,
    audio: 'playBaseballHit'
  },
  DOUBLE: {
    label: 'DOUBLE! ✨',
    subLabel: '좌익수 키를 넘기는 2루타!',
    color: '#34D399',
    bases: 2,
    baseScore: 60,
    audio: 'playBaseballHit'
  },
  SINGLE: {
    label: 'HIT! ⚾',
    subLabel: '깔끔한 1루타 안타!',
    color: '#60A5FA',
    bases: 1,
    baseScore: 35,
    audio: 'playBaseballHit'
  },
  FLY_OUT: {
    label: 'FLY OUT! 🧤',
    subLabel: '외야수 정면 뜬공 아웃!',
    color: '#E11D48',
    bases: 0,
    isOut: true,
    baseScore: 0,
    audio: 'playBaseballSwingMiss'
  },
  GROUND_OUT: {
    label: 'GROUND OUT! 🧤',
    subLabel: '빗맞아 내야 땅볼 아웃!',
    color: '#E11D48',
    bases: 0,
    isOut: true,
    baseScore: 0,
    audio: 'playBaseballSwingMiss'
  },
  FOUL: {
    label: 'FOUL ⚠️',
    subLabel: '파울 라인 밖으로 벗어남',
    color: '#F97316',
    bases: 0,
    baseScore: 10,
    audio: 'playBaseballHit'
  },
  STRIKE: {
    label: 'STRIKE! ❌',
    subLabel: '헛스윙 또는 스트라이크!',
    color: '#EF4444',
    bases: 0,
    baseScore: 0,
    audio: 'playBaseballSwingMiss'
  },
  OUT: {
    label: 'OUT! 🚫',
    subLabel: '아웃 카운트 추가!',
    color: '#DC2626',
    bases: 0,
    isOut: true,
    baseScore: 0,
    audio: 'playBaseballSwingMiss'
  },
  BALL: {
    label: 'BALL! 👁️',
    subLabel: '날카로운 선구안! 볼 판정',
    color: '#10B981',
    bases: 0,
    baseScore: 20
  }
};

// Runner Colors on Diamond HUD
export const RUNNER_COLORS = {
  EMPTY: 'rgba(255, 255, 255, 0.25)',
  OCCUPIED: '#FBBF24',
  HOME_RUNNER: '#10B981'
};
