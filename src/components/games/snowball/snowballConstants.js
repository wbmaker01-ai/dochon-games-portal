// Dochon Games Portal - Snowball Survival Constants & Configurations

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 700;

// Arena Ice Ring Stages (Shrinking Arena)
export const ARENA_CONFIG = {
  INITIAL_RADIUS: 460,
  SHRINK_STAGES: [
    { targetRadius: 360, shrinkStartTime: 25, duration: 8, warningTime: 5 },
    { targetRadius: 260, shrinkStartTime: 55, duration: 8, warningTime: 5 },
    { targetRadius: 160, shrinkStartTime: 85, duration: 8, warningTime: 5 },
    { targetRadius: 100, shrinkStartTime: 115, duration: 8, warningTime: 5 }
  ],
  FRICTION: 0.965, // Ice surface low-friction slide
  KNOCKBACK_FRICTION: 0.93
};

// Player Movement & Snowball Physics
export const PLAYER_CONFIG = {
  BASE_SPEED: 4.2,
  RADIUS: 22,
  TURN_SPEED: 0.15,
  SNOWBALL_GROWTH_RATE: 16, // px radius per second
  SNOWBALL_MIN_RADIUS: 10,
  SNOWBALL_MAX_RADIUS: 62,
  SNOWBALL_MIN_SPEED: 9.0,
  SNOWBALL_MAX_SPEED: 13.5,
  SNOWBALL_LIFETIME: 3.5, // seconds before melting
  COLLISION_BOUNCE: 0.7
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
    botAimAccuracy: 0.55,
    botReactionDelay: 0.45,
    botMaxChargeRatio: 0.65,
    speedMultiplier: 0.85
  },
  normal: {
    name: '중급 (보통)',
    aiCount: 7,
    botAimAccuracy: 0.78,
    botReactionDelay: 0.25,
    botMaxChargeRatio: 0.85,
    speedMultiplier: 1.0
  },
  hard: {
    name: '상급 (익스트림)',
    aiCount: 7,
    botAimAccuracy: 0.92,
    botReactionDelay: 0.12,
    botMaxChargeRatio: 1.0,
    speedMultiplier: 1.15
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
