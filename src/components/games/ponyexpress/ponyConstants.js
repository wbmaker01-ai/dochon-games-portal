// Pony Express Game Constants & Configuration

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

// 3 Lanes (Y coordinates for player and obstacle centers)
export const LANES = [
  { id: 0, y: 195, label: '상단 레인' },
  { id: 1, y: 280, label: '중단 레인' },
  { id: 2, y: 365, label: '하단 레인' }
];

export const TOTAL_LETTERS = 100;

export const STAGES = [
  {
    id: 1,
    name: '서부 황무지 사막',
    subName: 'Stage 1: Desert Plains',
    letterRange: [1, 30],
    bgColor: '#FDE68A',
    skyGradient: ['#F59E0B', '#FDE68A', '#FEF3C7'],
    groundColor: '#D97706',
    roadColor: '#B45309',
    roadLineColor: '#FBBF24',
    theme: 'desert',
    description: '선인장과 굴러다니는 바위를 피해 편지를 모으세요!'
  },
  {
    id: 2,
    name: '붉은 협곡 & 강',
    subName: 'Stage 2: Red Canyon & Rivers',
    letterRange: [31, 65],
    bgColor: '#F87171',
    skyGradient: ['#DC2626', '#F87171', '#FEE2E2'],
    groundColor: '#991B1B',
    roadColor: '#7F1D1D',
    roadLineColor: '#FCA5A5',
    theme: 'canyon',
    description: '물웅덩이와 울타리를 피해 강을 건너세요!'
  },
  {
    id: 3,
    name: '설원 산맥 & 웨스턴 타운',
    subName: 'Stage 3: Snowy Peaks & Western Town',
    letterRange: [66, 100],
    bgColor: '#93C5FD',
    skyGradient: ['#1E40AF', '#3B82F6', '#DBEAFE'],
    groundColor: '#1E3A8A',
    roadColor: '#1E293B',
    roadLineColor: '#93C5FD',
    theme: 'snow',
    description: '눈 뭉치와 무법자를 피해 최종 목적지 마을에 도착하세요!'
  }
];

export const OBSTACLE_TYPES = {
  CACTUS: {
    type: 'CACTUS',
    name: '선인장',
    width: 38,
    height: 48,
    penalty: 50,
    color: '#059669',
    canJumpOver: true
  },
  ROCK: {
    type: 'ROCK',
    name: '바위',
    width: 44,
    height: 36,
    penalty: 50,
    color: '#78716C',
    canJumpOver: true
  },
  PUDDLE: {
    type: 'PUDDLE',
    name: '진흙 웅덩이',
    width: 54,
    height: 28,
    penalty: 40,
    color: '#3B82F6',
    canJumpOver: true
  },
  FENCE: {
    type: 'FENCE',
    name: '목재 울타리',
    width: 48,
    height: 46,
    penalty: 60,
    color: '#854D0E',
    canJumpOver: true
  },
  SNOWDRIFT: {
    type: 'SNOWDRIFT',
    name: '눈 뭉치',
    width: 46,
    height: 38,
    penalty: 40,
    color: '#E0F2FE',
    canJumpOver: true
  },
  BANDIT: {
    type: 'BANDIT',
    name: '무법자 도둑',
    width: 44,
    height: 52,
    penalty: 80,
    color: '#475569',
    canJumpOver: false
  }
};

export const ITEM_TYPES = {
  LETTER: {
    type: 'LETTER',
    name: '우편 편지',
    width: 32,
    height: 24,
    score: 10,
    color: '#F8FAFC'
  },
  GOLD_LETTER: {
    type: 'GOLD_LETTER',
    name: '황금 특급 편지',
    width: 36,
    height: 28,
    score: 30,
    color: '#FBBF24'
  },
  CARROT: {
    type: 'CARROT',
    name: '말 당근 (스피드업)',
    width: 28,
    height: 28,
    score: 20,
    color: '#EA580C'
  }
};

export const GAME_SPEED_BASE = 5.2;
export const JUMP_DURATION_FRAMES = 32;
export const JUMP_HEIGHT_MAX = 55;
