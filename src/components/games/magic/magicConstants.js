// Dochon Magic Cat Academy Game Constants & Configuration

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// 6 Core Magic Symbols
export const SYMBOLS = {
  HORIZONTAL: {
    id: 'HORIZONTAL',
    name: '가로선',
    char: '—',
    color: '#EF4444', // Red / Crimson
    glowColor: 'rgba(239, 68, 68, 0.8)',
    desc: '왼쪽에서 오른쪽 또는 오른쪽에서 왼쪽으로 긋기'
  },
  VERTICAL: {
    id: 'VERTICAL',
    name: '세로선',
    char: '│',
    color: '#38BDF8', // Cyan / Light Blue
    glowColor: 'rgba(56, 189, 248, 0.8)',
    desc: '위에서 아래로 또는 아래에서 위로 긋기'
  },
  UP_V: {
    id: 'UP_V',
    name: '산 모양',
    char: '∧',
    color: '#10B981', // Emerald / Green
    glowColor: 'rgba(16, 185, 129, 0.8)',
    desc: '아래에서 위로 올라갔다가 아래로 꺾기'
  },
  DOWN_V: {
    id: 'DOWN_V',
    name: '골 모양',
    char: '∨',
    color: '#F59E0B', // Amber / Gold
    glowColor: 'rgba(245, 158, 11, 0.8)',
    desc: '위에서 아래로 내려갔다가 위로 꺾기'
  },
  LIGHTNING: {
    id: 'LIGHTNING',
    name: '번개 (광역 마법)',
    char: '⚡',
    color: '#A855F7', // Violet / Purple
    glowColor: 'rgba(168, 85, 247, 0.9)',
    desc: '지그재그로 번개를 그려 화면 전체의 번개 유령 동시 타격'
  },
  HEART: {
    id: 'HEART',
    name: '하트 (생명력 회복)',
    char: '❤️',
    color: '#F43F5E', // Rose / Pink
    glowColor: 'rgba(244, 63, 94, 0.9)',
    desc: '하트 곡선을 그려 잃어버린 생명력(+1 HP) 즉시 회복'
  }
};

export const SYMBOL_KEYS = Object.keys(SYMBOLS);

// Helper for Base URL Asset Loading
const getAsset = (file) => `${import.meta.env.BASE_URL}assets/magic/${file}`;

// 5 Magic School Stages
export const STAGES = [
  {
    stage: 1,
    title: '1단계: 고요한 도서관 (Library)',
    subtitle: '악령들이 마법학교에 침입했습니다! 기초 선 마법으로 도서관을 지켜내세요.',
    bgImage: getAsset('bg_library.jpg'),
    targetKills: 12,
    symbolsPool: ['HORIZONTAL', 'VERTICAL'],
    maxSymbolsPerGhost: 1,
    ghostSpeed: 0.9,
    spawnInterval: 110,
    allowHeart: true,
    allowLightning: false,
    themeColor: '#818CF8'
  },
  {
    stage: 2,
    title: '2단계: 어수선한 식당 (Cafeteria)',
    subtitle: '식당 테이블 사이로 빠른 유령들이 몰려옵니다! ∧, ∨ 모양 마법을 시전하세요.',
    bgImage: getAsset('bg_cafeteria.jpg'),
    targetKills: 16,
    symbolsPool: ['HORIZONTAL', 'VERTICAL', 'UP_V', 'DOWN_V'],
    maxSymbolsPerGhost: 2,
    ghostSpeed: 1.15,
    spawnInterval: 95,
    allowHeart: true,
    allowLightning: true,
    themeColor: '#F59E0B'
  },
  {
    stage: 3,
    title: '3단계: 신비한 마법 교실 (Classroom)',
    subtitle: '교실 칠판과 책상 위를 떠도는 쉴드 유령들을 번개(⚡) 광역 마법으로 정화하세요!',
    bgImage: getAsset('bg_classroom.jpg'),
    targetKills: 20,
    symbolsPool: ['HORIZONTAL', 'VERTICAL', 'UP_V', 'DOWN_V', 'LIGHTNING', 'HEART'],
    maxSymbolsPerGhost: 3,
    ghostSpeed: 1.35,
    spawnInterval: 85,
    allowHeart: true,
    allowLightning: true,
    themeColor: '#A855F7'
  },
  {
    stage: 4,
    title: '4단계: 밤의 체육관 (Gym)',
    subtitle: '사방에서 대규모 유령 군단이 쏟아집니다! 빠른 손놀림으로 콤보를 이어가세요.',
    bgImage: getAsset('bg_gym.jpg'),
    targetKills: 25,
    symbolsPool: ['HORIZONTAL', 'VERTICAL', 'UP_V', 'DOWN_V', 'LIGHTNING', 'HEART'],
    maxSymbolsPerGhost: 4,
    ghostSpeed: 1.55,
    spawnInterval: 72,
    allowHeart: true,
    allowLightning: true,
    themeColor: '#EC4899'
  },
  {
    stage: 5,
    title: '5단계: 폭풍우 치는 옥상 (Rooftop Boss)',
    subtitle: '대마법서를 훔쳐간 거대 보스 악령과의 최종 결전! 5단 콤보 패턴을 완벽히 격파하세요!',
    bgImage: getAsset('bg_rooftop.jpg'),
    isBossStage: true,
    targetKills: 30,
    bossMaxHp: 8,
    symbolsPool: ['HORIZONTAL', 'VERTICAL', 'UP_V', 'DOWN_V', 'LIGHTNING', 'HEART'],
    ghostSpeed: 1.6,
    spawnInterval: 80,
    themeColor: '#F43F5E'
  }
];

export const PLAYER_MAX_HP = 5;
export const COMBO_TIMEOUT_MS = 2500;
