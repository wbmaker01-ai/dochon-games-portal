// Game Constants & Configuration for Dochon Roswell UFO Escape Adventure
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

// Scenes in the adventure
export const SCENES = {
  CRASH_SITE: 'CRASH_SITE',
  FARMLAND: 'FARMLAND',
  BARN: 'BARN',
  FARMHOUSE: 'FARMHOUSE'
};

// Required UFO Parts for Escape
export const REQUIRED_PARTS = [
  { id: 'part_core', name: '에너지 코어', icon: '💎', desc: 'UFO의 핵심 동력원' },
  { id: 'part_dome', name: '조종석 유리 돔', icon: '🔮', desc: '외계인을 보호하는 투명 덮개' },
  { id: 'part_engine', name: '초공간 추진 안테나', icon: '📡', desc: '우주 비행을 위한 추진기' }
];

// Interactive Items
export const ITEMS = {
  CARROT: { id: 'carrot', name: '유기농 당근', icon: '🥕', desc: '도촌 들판에서 갓 뽑은 당근' },
  ROPE: { id: 'rope', name: '튼튼한 밧줄', icon: '🪢', desc: '도르래나 높은 곳을 연결할 수 있는 밧줄' },
  KEY: { id: 'key', name: '헛간 열쇠', icon: '🗝️', desc: '녹슨 헛간 보관함을 열 수 있는 열쇠' },
  BONE: { id: 'bone', name: '맛있는 뼈다귀', icon: '🦴', desc: '강아지의 주의를 끌 수 있는 간식' },
  PART_CORE: { id: 'part_core', name: '에너지 코어', icon: '💎', desc: '빛을 내뿜는 강력한 에너지원' },
  PART_DOME: { id: 'part_dome', name: '조종석 유리 돔', icon: '🔮', desc: '투명하고 단단한 조종석 덮개' },
  PART_ENGINE: { id: 'part_engine', name: '초공간 추진 안테나', icon: '📡', desc: '우주 신호를 포착하는 안테나' }
};

// Score Configuration
export const SCORE_CONFIG = {
  BASE_CLEAR_SCORE: 1200,
  TIME_LIMIT_SECONDS: 300, // 5분
  TIME_BONUS_MULTIPLIER: 5,
  INTERACTION_BONUS: 50,
  PERFECT_DISCOVERY_BONUS: 300
};

// Retro Aesthetic Palette
export const RETRO_COLORS = {
  FILM_BG: '#1a1d1a',
  FILM_TINT: 'rgba(230, 245, 230, 0.04)',
  GRAIN: 'rgba(255, 255, 255, 0.06)',
  VINTAGE_SEPIA_DARK: '#181f18',
  VINTAGE_SEPIA_MID: '#4a5948',
  VINTAGE_SEPIA_LIGHT: '#8da688',
  VINTAGE_CREAM: '#d5e3cf',
  ALIEN_GLOW: '#4ade80',
  UFO_LIGHT: '#22d3ee',
  TEXT_HIGHLIGHT: '#fef08a'
};
