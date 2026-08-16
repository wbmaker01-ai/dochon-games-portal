// Dochon Minesweeper Constants & Presets
// Scalable for Dochon Elementary School Students

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: '🌱 초급',
    label: '초급 (9x9)',
    rows: 9,
    cols: 9,
    mines: 10,
    baseClearBonus: 500,
    targetTime: 60, // seconds for max time bonus
    recommendedFor: '1~3학년 추천'
  },
  medium: {
    id: 'medium',
    name: '🌿 중급',
    label: '중급 (16x16)',
    rows: 16,
    cols: 16,
    mines: 40,
    baseClearBonus: 1500,
    targetTime: 180,
    recommendedFor: '4~6학년 추천'
  },
  hard: {
    id: 'hard',
    name: '🔥 고급',
    label: '고급 (22x12)',
    rows: 12,
    cols: 22,
    mines: 50,
    baseClearBonus: 3500,
    targetTime: 300,
    recommendedFor: '지뢰찾기 마스터'
  },
  custom: {
    id: 'custom',
    name: '🎨 맞춤 설정',
    label: '사용자 지정',
    rows: 10,
    cols: 10,
    mines: 15,
    baseClearBonus: 800,
    targetTime: 120,
    recommendedFor: '내 맘대로 크기 조절'
  }
};

export const TILE_STATUS = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  FLAGGED: 'flagged',
  EXPLODED: 'exploded',
  SAVED_BY_SHIELD: 'shield_saved'
};

export const NUMBER_COLORS = {
  1: '#1976D2', // Blue
  2: '#388E3C', // Green
  3: '#D32F2F', // Red
  4: '#7B1FA2', // Purple
  5: '#FF8F00', // Amber/Orange
  6: '#0097A7', // Teal
  7: '#424242', // Dark Grey
  8: '#616161'  // Grey
};

export const SCORING = {
  TILE_REVEAL: 15,          // 점수 per safe tile
  CHORD_BONUS: 25,          // 점수 per chord multi-open
  FLAG_CORRECT_BONUS: 50,   // 점수 per accurate flag upon win
  SHIELD_UNUSED_BONUS: 300  // 보호막을 한 번도 안 썼을 때 보너스
};
