// Dochon Games Portal - Snowball Survival Constants & Configurations

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 700;

// Arena Ice Ring Stages (Shrinking Arena)
export const ARENA_CONFIG = {
  INITIAL_RADIUS: 460,
  SHRINK_STAGES: [
    { targetRadius: 360, shrinkStartTime: 30, duration: 9, warningTime: 6 },
    { targetRadius: 260, shrinkStartTime: 65, duration: 9, warningTime: 6 },
    { targetRadius: 160, shrinkStartTime: 100, duration: 9, warningTime: 6 },
    { targetRadius: 100, shrinkStartTime: 135, duration: 9, warningTime: 6 }
  ],
  FRICTION: 0.925, // Optimized ice friction for controllable steering & braking
  KNOCKBACK_FRICTION: 0.915
};

// Player Movement & Snowball Physics (Calm, stable & responsive handling)
export const PLAYER_CONFIG = {
  BASE_SPEED: 2.4, // Reduced from 4.2 to 2.4 for comfortable pacing
  RADIUS: 22,
  TURN_SPEED: 0.09, // Smoother rotation curve, eliminates twitchy behavior
  SNOWBALL_GROWTH_RATE: 13, // Balanced growth rate
  SNOWBALL_MIN_RADIUS: 10,
  SNOWBALL_MAX_RADIUS: 62,
  SNOWBALL_MIN_SPEED: 7.5,
  SNOWBALL_MAX_SPEED: 11.0,
  SNOWBALL_LIFETIME: 3.8, // seconds before melting
  COLLISION_BOUNCE: 0.6
};

// 4 Cute Procedural Characters
export const CHARACTER_SKINS = [
  {
    id: 'penguin',
    name: '도촌 꼬마 펭귄',
    role: '균형형',
    color: '#0284C7',
    bodyColor: '#1E293B',
    bellyColor: '#F8FAFC',
    accentColor: '#F59E0B',
    avatarEmoji: '🐧',
    description: '민첩한 발걸음과 귀여운 뒤뚱거림으로 얼음판을 누빕니다!'
  },
  {
    id: 'snowman',
    name: '얼음마을 눈사람',
    role: '파워형',
    color: '#EF4444',
    bodyColor: '#FFFFFF',
    bellyColor: '#F1F5F9',
    accentColor: '#DC2626',
    avatarEmoji: '⛄',
    description: '눈덩이를 누구보다 단단하고 거대하게 굴릴 수 있습니다!'
  },
  {
    id: 'polarbear',
    name: '포근한 북극곰',
    role: '탱커형',
    color: '#10B981',
    bodyColor: '#F8FAFC',
    bellyColor: '#E2E8F0',
    accentColor: '#059669',
    avatarEmoji: '🐻‍❄️',
    description: '묵직한 무게감으로 상대의 넉백 충격을 든든하게 버팁니다!'
  },
  {
    id: 'student',
    name: '도촌초 패딩 대장',
    role: '스피드형',
    color: '#8B5CF6',
    bodyColor: '#3B82F6',
    bellyColor: '#60A5FA',
    accentColor: '#FBBF24',
    avatarEmoji: '🧣',
    description: '따뜻한 롱패딩과 귀마개를 장착하고 재빠르게 회피합니다!'
  }
];

// Difficulty Presets for Solo Mode AI Bots
export const DIFFICULTY_PRESETS = {
  easy: {
    name: '초급 (쉬움)',
    aiCount: 5,
    botAimAccuracy: 0.65,
    botReactionDelay: 0.5,
    botMaxChargeRatio: 0.65,
    speedMultiplier: 0.85
  },
  normal: {
    name: '중급 (보통)',
    aiCount: 7,
    botAimAccuracy: 0.85,
    botReactionDelay: 0.25,
    botMaxChargeRatio: 0.85,
    speedMultiplier: 0.95
  },
  hard: {
    name: '상급 (익스트림)',
    aiCount: 7,
    botAimAccuracy: 0.95,
    botReactionDelay: 0.12,
    botMaxChargeRatio: 0.98,
    speedMultiplier: 1.05
  }
};

// PeerJS Networking Constants
export const SNOWBALL_PEER_PREFIX = 'dochon-snow-';
export const NETWORK_TICK_RATE = 20; // 20 updates per second
export const NETWORK_TICK_INTERVAL = 1000 / NETWORK_TICK_RATE;

// Scoring Constants (Strict Dochon Rule: Score > 100 for Hall of Fame)
export const SCORING = {
  RANK_BONUS: [600, 350, 200, 120, 80, 50, 30, 10], // 1st to 8th rank
  KILL_BONUS: 150, // Per ring-out knockback elimination
  SURVIVAL_PER_SEC: 8
};
