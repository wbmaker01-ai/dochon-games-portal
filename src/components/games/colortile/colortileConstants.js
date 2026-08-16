// Dochon Color Tile Game Constants & Configuration

export const GRID_SIZE = 14; // 14 x 14 grid (196 cells total)
export const DEFAULT_SPAWN_RATE = 0.42; // ~82 tiles spawned initially

export const TILE_COLORS = [
  {
    id: 1,
    name: '루비 레드',
    shortName: '레드',
    symbol: '♥',
    emoji: '🍓',
    mainColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
    borderColor: '#FCA5A5'
  },
  {
    id: 2,
    name: '사파이어 블루',
    shortName: '블루',
    symbol: '◆',
    emoji: '🫐',
    mainColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
    borderColor: '#93C5FD'
  },
  {
    id: 3,
    name: '에메랄드 그린',
    shortName: '그린',
    symbol: '♣',
    emoji: '🥝',
    mainColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
    borderColor: '#6EE7B7'
  },
  {
    id: 4,
    name: '골드 앰버',
    shortName: '옐로우',
    symbol: '★',
    emoji: '🍋',
    mainColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    bgGradient: 'linear-gradient(135deg, #FCD34D 0%, #D97706 100%)',
    borderColor: '#FDE68A'
  },
  {
    id: 5,
    name: '아메시스트 퍼플',
    shortName: '퍼플',
    symbol: '🌙',
    emoji: '🍇',
    mainColor: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
    borderColor: '#C4B5FD'
  },
  {
    id: 6,
    name: '코랄 핑크',
    shortName: '핑크',
    symbol: '●',
    emoji: '🍑',
    mainColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    bgGradient: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
    borderColor: '#FBCFE8'
  }
];

export const GAME_SETTINGS = {
  INITIAL_TIME: 60, // 60 seconds
  TIME_BONUS_2_TILES: 1.5, // +1.5s for 2-tile match
  TIME_BONUS_3_TILES: 2.5, // +2.5s for 3-tile match
  TIME_BONUS_4_TILES: 4.0, // +4.0s for 4-tile super match
  MISS_PENALTY_TIME: 1.0, // -1.0s penalty on miss click
  COMBO_TIMEOUT_MS: 3000, // 3 seconds window to maintain combo
  BASE_SCORE_2_TILES: 200,
  BASE_SCORE_3_TILES: 600,
  BASE_SCORE_4_TILES: 1500,
  CLEARED_ALL_BONUS: 5000,
  INITIAL_HINTS: 3,
  INITIAL_SHUFFLES: 2
};
