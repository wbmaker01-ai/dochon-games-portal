// Constants and Configuration for Dochon Popcorn Survival Game

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PAN_CENTER_X = CANVAS_WIDTH / 2;
export const PAN_CENTER_Y = CANVAS_HEIGHT / 2;
export const PAN_RADIUS = 230; // Circular arena boundary

export const PLAYER_CLASSES = {
  KNIGHT: {
    id: 'knight',
    name: '기사 알갱이',
    title: '🛡️ 실드 나이트',
    desc: '투사체를 튕겨내고 막아내는 단단한 수호 방패',
    badge: '방어 특화',
    badgeColor: '#3B82F6',
    maxHp: 4,
    speed: 4.0,
    skillName: '에너지 방패',
    skillCooldown: 10000, // 10s
    skillDuration: 3500,  // 3.5s
    skillDesc: '3.5초간 모든 공격을 무효화하고 탄막을 튕겨냅니다.',
    avatar: '/assets/popcorn/corn_shield.jpg'
  },
  WIZARD: {
    id: 'wizard',
    name: '마법사 알갱이',
    title: '💖 힐링 위저드',
    desc: '체력을 회복하고 주변 탄막을 정화하는 마법',
    badge: '치유 & 정화',
    badgeColor: '#EC4899',
    maxHp: 3,
    speed: 4.2,
    skillName: '하트 펄스 정화',
    skillCooldown: 12000, // 12s
    skillDuration: 800,   // Instant pulse
    skillDesc: '체력을 1 회복하고 주변 넓은 범위의 탄막을 모두 지웁니다.',
    avatar: '/assets/popcorn/corn_heal.jpg'
  },
  RUNNER: {
    id: 'runner',
    name: '질주 알갱이',
    title: '⚡ 스피드 러너',
    desc: '빠른 기동성과 초고속 무적 대시로 위기 탈출',
    badge: '스피드 & 회피',
    badgeColor: '#EAB308',
    maxHp: 3,
    speed: 5.6,
    skillName: '스파크 대시',
    skillCooldown: 7000, // 7s
    skillDuration: 1800,  // 1.8s
    skillDesc: '1.8초간 이동속도가 폭발적으로 증가하며 완전 무적 상태가 됩니다.',
    avatar: '/assets/popcorn/corn_idle.jpg'
  }
};

export const STAGE_CONFIGS = [
  {
    stage: 1,
    name: 'STAGE 1: 예열 단계 (Preheating)',
    duration: 25, // 25 seconds
    targetBoss: null,
    heatIntensity: 1.0,
    spawnInterval: 850,
    bulletSpeed: 2.6,
    desc: '프라이팬이 서서히 달아오릅니다. 튀는 기름과 버터 방울을 피하세요!'
  },
  {
    stage: 2,
    name: 'STAGE 2: 버터 킹의 습격 (Butter King)',
    duration: 35,
    targetBoss: 'butter',
    bossHp: 100,
    heatIntensity: 1.4,
    spawnInterval: 600,
    bulletSpeed: 3.2,
    desc: '녹아내리는 거대 버터 킹이 끈적한 버터 폭탄을 쏟아붓습니다!'
  },
  {
    stage: 3,
    name: 'STAGE 3: 화염 정령의 분노 (Flame Spirit)',
    duration: 40,
    targetBoss: 'flame',
    bossHp: 150,
    heatIntensity: 1.8,
    spawnInterval: 420,
    bulletSpeed: 3.8,
    desc: '이글거리는 불꽃 정령이 나선형 화염 탄막과 불기둥을 뿜어냅니다!'
  },
  {
    stage: 4,
    name: 'STAGE 4: 인페르노 피에스타 (Inferno Fiesta)',
    duration: 50,
    targetBoss: 'dual',
    bossHp: 220,
    heatIntensity: 2.2,
    spawnInterval: 300,
    bulletSpeed: 4.4,
    desc: '버터 킹과 불꽃 정령의 합동 공격! 끝까지 튀겨지지 말고 살아남으세요!'
  }
];

export const ITEM_TYPES = {
  HEART: {
    id: 'heart',
    name: '회복 하트',
    score: 150,
    duration: 7000,
    color: '#EF4444'
  },
  SALT: {
    id: 'salt',
    name: '소금 크리스털',
    score: 300,
    duration: 8000,
    color: '#38BDF8'
  },
  ICE: {
    id: 'ice',
    name: '쿨링 아이스',
    score: 200,
    duration: 6000,
    freezeTime: 4000,
    color: '#67E8F9'
  }
};

export const GRAZE_DISTANCE = 32; // Distance for near-miss "Graze" score
export const GRAZE_SCORE = 30;
