// Olympics Constants and Configurations for Dochon Mini Olympics

export const GAME_EVENTS = {
  INTRO: 'INTRO',
  HURDLES: 'HURDLES',
  BASKETBALL: 'BASKETBALL',
  CANOE: 'CANOE',
  RESULTS: 'RESULTS'
};

export const EVENT_DETAILS = {
  [GAME_EVENTS.HURDLES]: {
    id: 'hurdles',
    name: '100m 허들 달리기',
    subtitle: '100m Hurdles Dash',
    icon: '🏃',
    bgColor: '#1E293B',
    accentColor: '#F59E0B',
    description: '좌우(← →) 키를 번갈아 연타하여 가속하고, 스페이스바로 허들을 완벽하게 점프하세요!'
  },
  [GAME_EVENTS.BASKETBALL]: {
    id: 'basketball',
    name: '3점 슛 챌린지',
    subtitle: '3-Point Shootout',
    icon: '🏀',
    bgColor: '#0F172A',
    accentColor: '#FB923C',
    description: '움직이는 타이밍 바가 초록색 PERFECT 존에 도달했을 때 슛을 던져 득점하세요!'
  },
  [GAME_EVENTS.CANOE]: {
    id: 'canoe',
    name: '급류 카누 슬라럼',
    subtitle: 'Whitewater Canoe Slalom',
    icon: '🛶',
    bgColor: '#082F49',
    accentColor: '#38BDF8',
    description: '좌우 방향키로 카누를 조종하여 장애물을 피하고 모든 게이트를 통과하세요!'
  }
};

// Hurdles Configuration (Balanced for 12~16s realistic sprint)
export const HURDLES_CONFIG = {
  TRACK_LENGTH_METERS: 100,
  HURDLE_POSITIONS: [18, 32, 46, 60, 74, 88], // 6 hurdles
  BASE_ACCEL: 0.16,
  MAX_SPEED: 5.6,
  FRICTION: 0.99,
  JUMP_POWER: 8.5,
  GRAVITY: 0.40,
  TIME_LIMIT_SECONDS: 30,
  BASE_SCORE: 600,
  PERFECT_JUMP_BONUS: 70,
  GOOD_JUMP_BONUS: 35,
  HIT_PENALTY_TIME: 1.0
};

// Basketball Configuration (10 shots shootout)
export const BASKETBALL_CONFIG = {
  TOTAL_BALLS: 10,
  TIME_LIMIT: 35,
  REGULAR_SHOT_SCORE: 100,
  MONEY_BALL_SCORE: 200,
  PERFECT_ZONE_WIDTH: 22, // in percent
  GOOD_ZONE_WIDTH: 44,
  GAUGE_SPEED: 2.0
};

// Canoe Slalom Configuration (2,400m Extended Course with Wide Gate Spacing)
export const CANOE_CONFIG = {
  COURSE_LENGTH: 2400,
  RIVER_SPEED: 2.4,
  BOOST_SPEED: 4.2,
  STEER_SPEED: 5.6,
  TOTAL_GATES: 10,
  GATE_PASS_SCORE: 100,
  PERFECT_LINE_BONUS: 50,
  ROCK_COLLISION_PENALTY: 40
};

// Medal cutoffs based on Total Combined Score
export const MEDAL_CUTOFFS = {
  GOLD: 1500,
  SILVER: 1000,
  BRONZE: 600
};

// Athlete Character Palette
export const ATHLETE_PALETTES = [
  { id: 'red', name: '도촌 불꽃팀', primary: '#EF4444', secondary: '#FCA5A5', skin: '#FCD34D' },
  { id: 'blue', name: '도촌 푸른팀', primary: '#3B82F6', secondary: '#93C5FD', skin: '#FDE68A' },
  { id: 'green', name: '도촌 에메랄드팀', primary: '#10B981', secondary: '#6EE7B7', skin: '#FCD34D' },
  { id: 'purple', name: '도촌 번개팀', primary: '#8B5CF6', secondary: '#C4B5FD', skin: '#FDE68A' }
];
