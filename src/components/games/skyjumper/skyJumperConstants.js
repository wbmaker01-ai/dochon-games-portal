/**
 * Dochon Sky Jumper - Constants & Configurations
 */

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

// Player Physics Constants
export const PLAYER_CONFIG = {
  WIDTH: 44,
  HEIGHT: 44,
  GRAVITY: 0.42,
  NORMAL_JUMP_VY: -11.6,
  SPRING_JUMP_VY: -16.8,
  TRAMPOLINE_JUMP_VY: -21.5,
  PROPELLER_VY: -14.0,
  PROPELLER_DURATION: 3200, // ms
  ROCKET_VY: -22.5,
  ROCKET_DURATION: 3600,    // ms
  MAX_FALL_SPEED: 14.5,
  MOVE_SPEED: 7.2,
  ACCELERATION: 1.2,
  FRICTION: 0.86,
  BULLET_SPEED: -16.0,
  SHOOT_COOLDOWN: 200 // ms
};

// Platform Dimensions & Types
export const PLATFORM_CONFIG = {
  WIDTH: 76,
  HEIGHT: 16,
  MIN_Y_GAP: 65,
  MAX_Y_GAP: 110,
  INITIAL_PLATFORM_COUNT: 9
};

export const PLATFORM_TYPES = {
  REGULAR: {
    id: 'regular',
    name: '기본 발판',
    color: '#22C55E',
    borderColor: '#15803D',
    description: '가장 안정적인 일반 초록색 발판입니다.'
  },
  MOVING: {
    id: 'moving',
    name: '좌우 이동 발판',
    color: '#0EA5E9',
    borderColor: '#0284C7',
    speed: 2.2,
    description: '좌우로 왕복 이동하며 움직이는 파란색 발판입니다.'
  },
  BROKEN: {
    id: 'broken',
    name: '부서지는 발판',
    color: '#B45309',
    borderColor: '#78350F',
    description: '밟는 순간 쪼개져 아래로 추락하는 함정 발판입니다.'
  },
  DISAPPEARING: {
    id: 'disappearing',
    name: '유령 발판',
    color: '#A855F7',
    borderColor: '#7E22CE',
    cycleMs: 2400,
    description: '일정 주기로 깜빡이며 나타났다 사라지는 발판입니다.'
  },
  CLOUD: {
    id: 'cloud',
    name: '1회용 구름 발판',
    color: '#E2E8F0',
    borderColor: '#94A3B8',
    description: '한 번 밟고 점프하면 뿅 하고 사라지는 발판입니다.'
  },
  VERTICAL: {
    id: 'vertical',
    name: '상하 이동 발판',
    color: '#F97316',
    borderColor: '#C2410C',
    speed: 1.5,
    range: 50,
    description: '위아래로 오르내리는 주황색 발판입니다.'
  }
};

// Powerup Items
export const ITEM_TYPES = {
  SPRING: {
    id: 'spring',
    name: '스프링',
    icon: '🌀',
    description: '통통 튀어올라 일반 점프보다 1.5배 높은 고도로 슈퍼 점프합니다.'
  },
  TRAMPOLINE: {
    id: 'trampoline',
    name: '트램펄린',
    icon: '🎪',
    description: '강력한 탄성으로 일반 점프보다 2배 높은 고도로 메가 점프합니다.'
  },
  PROPELLER: {
    id: 'propeller',
    name: '프로펠러 모자',
    icon: '🧢',
    duration: 3200,
    description: '3초간 머리 위의 프로펠러를 회전시키며 안정적으로 고속 상승합니다.'
  },
  ROCKET: {
    id: 'rocket',
    name: '로켓 제트팩',
    icon: '🚀',
    duration: 3600,
    description: '3.5초간 화염 부스터를 뿜으며 무적 상태로 초고속 질주합니다.'
  },
  SHIELD: {
    id: 'shield',
    name: '스타 보호막',
    icon: '🛡️',
    description: '몬스터나 위험 요소와의 1회 충돌을 방어해줍니다.'
  },
  STAR: {
    id: 'star',
    name: '보너스 별 코인',
    icon: '⭐',
    points: 200,
    description: '획득 시 보너스 고도 점수(+200점)를 즉시 획득합니다.'
  }
};

// Obstacles & Monsters
export const MONSTER_TYPES = {
  FLYING: {
    id: 'flying',
    name: '공중 몬스터',
    icon: '👾',
    width: 42,
    height: 38,
    points: 300,
    description: '공중에 떠서 좌우로 배회합니다. 위에서 밟거나 슈팅으로 격파할 수 있습니다.'
  },
  BLACK_HOLE: {
    id: 'black_hole',
    name: '시공간 블랙홀',
    icon: '🕳️',
    radius: 26,
    pullRadius: 90,
    pullForce: 0.28,
    description: '플레이어를 빨아들이는 위험 지대입니다. 반드시 멀리 피해가야 합니다.'
  }
};

// Altitude Milestones & Themes
export const ALTITUDE_THEMES = [
  {
    minAlt: 0,
    maxAlt: 2000,
    name: '푸른 하늘 (Sky)',
    topColor: '#38BDF8',
    bottomColor: '#BAE6FD',
    accentColor: '#0284C7',
    cloudCount: 6,
    starCount: 0
  },
  {
    minAlt: 2000,
    maxAlt: 5000,
    name: '황혼 노을 (Sunset)',
    topColor: '#6366F1',
    bottomColor: '#F43F5E',
    accentColor: '#FB7185',
    cloudCount: 4,
    starCount: 15
  },
  {
    minAlt: 5000,
    maxAlt: 10000,
    name: '신비의 밤하늘 (Night Aurora)',
    topColor: '#090D24',
    bottomColor: '#1E1B4B',
    accentColor: '#818CF8',
    cloudCount: 2,
    starCount: 40
  },
  {
    minAlt: 10000,
    maxAlt: Infinity,
    name: '심우주 은하수 (Deep Space)',
    topColor: '#030712',
    bottomColor: '#0F172A',
    accentColor: '#38BDF8',
    cloudCount: 0,
    starCount: 70
  }
];
