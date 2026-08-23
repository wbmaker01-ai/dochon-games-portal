// Memory Master Game Constants & Configurations

export const GAME_MODES = {
  CARD_MATCH: 'card_match',
  SIMON_RHYTHM: 'simon_rhythm'
};

export const CARD_THEMES = {
  ANIMALS: {
    id: 'animals',
    name: '동물 친구들',
    icon: '🐶',
    cards: [
      { id: 'dog', emoji: '🐶', label: '강아지', color: '#f59e0b' },
      { id: 'cat', emoji: '🐱', label: '고양이', color: '#ec4899' },
      { id: 'rabbit', emoji: '🐰', label: '토끼', color: '#10b981' },
      { id: 'fox', emoji: '🦊', label: '여우', color: '#f97316' },
      { id: 'bear', emoji: '🐻', label: '곰', color: '#8b5cf6' },
      { id: 'panda', emoji: '🐼', label: '판다', color: '#06b6d4' },
      { id: 'koala', emoji: '🐨', label: '코알라', color: '#64748b' },
      { id: 'lion', emoji: '🦁', label: '사자', color: '#eab308' },
      { id: 'tiger', emoji: '🐯', label: '호랑이', color: '#f43f5e' },
      { id: 'penguin', emoji: '🐧', label: '펭귄', color: '#3b82f6' }
    ]
  },
  SNACKS: {
    id: 'snacks',
    name: '달콤한 디저트',
    icon: '🍰',
    cards: [
      { id: 'cake', emoji: '🍰', label: '케이크', color: '#ec4899' },
      { id: 'donut', emoji: '🍩', label: '도넛', color: '#8b5cf6' },
      { id: 'icecream', emoji: '🍦', label: '아이스크림', color: '#06b6d4' },
      { id: 'cookie', emoji: '🍪', label: '쿠키', color: '#d97706' },
      { id: 'candy', emoji: '🍬', label: '사탕', color: '#f43f5e' },
      { id: 'cupcake', emoji: '🧁', label: '컵케이크', color: '#10b981' },
      { id: 'pudding', emoji: '🍮', label: '푸딩', color: '#f59e0b' },
      { id: 'chocolate', emoji: '🍫', label: '초콜릿', color: '#78350f' },
      { id: 'lollipop', emoji: '🍭', label: '막대사탕', color: '#a855f7' },
      { id: 'waffle', emoji: '🧇', label: '와플', color: '#eab308' }
    ]
  },
  SPACE: {
    id: 'space',
    name: '신나는 우주 탐험',
    icon: '🚀',
    cards: [
      { id: 'rocket', emoji: '🚀', label: '로켓', color: '#ef4444' },
      { id: 'alien', emoji: '👽', label: '외계인', color: '#10b981' },
      { id: 'planet', emoji: '🪐', label: '토성', color: '#f59e0b' },
      { id: 'star', emoji: '⭐', label: '별', color: '#eab308' },
      { id: 'earth', emoji: '🌍', label: '지구', color: '#3b82f6' },
      { id: 'moon', emoji: '🌙', label: '달', color: '#8b5cf6' },
      { id: 'comet', emoji: '☄️', label: '혜성', color: '#f97316' },
      { id: 'telescope', emoji: '🔭', label: '망원경', color: '#06b6d4' },
      { id: 'ufo', emoji: '🛸', label: 'UFO', color: '#ec4899' },
      { id: 'astronaut', emoji: '🧑‍🚀', label: '우주비행사', color: '#6366f1' }
    ]
  },
  SCHOOL: {
    id: 'school',
    name: '도촌 학교생활',
    icon: '🏫',
    cards: [
      { id: 'book', emoji: '📚', label: '책', color: '#3b82f6' },
      { id: 'pencil', emoji: '✏️', label: '연필', color: '#f59e0b' },
      { id: 'backpack', emoji: '🎒', label: '책가방', color: '#ef4444' },
      { id: 'palette', emoji: '🎨', label: '미술 팔레트', color: '#ec4899' },
      { id: 'soccer', emoji: '⚽', label: '축구공', color: '#10b981' },
      { id: 'music', emoji: '🎵', label: '음악 노트', color: '#8b5cf6' },
      { id: 'microscope', emoji: '🔬', label: '현미경', color: '#06b6d4' },
      { id: 'trophy', emoji: '🏆', label: '트로피', color: '#eab308' },
      { id: 'scissors', emoji: '✂️', label: '가위', color: '#f43f5e' },
      { id: 'computer', emoji: '💻', label: '노트북', color: '#64748b' }
    ]
  }
};

export const CARD_DIFFICULTIES = {
  EASY: {
    id: 'easy',
    name: '초급 (3x4)',
    pairs: 6,
    cols: 4,
    rows: 3,
    timeLimit: 60,
    baseScore: 1000,
    timeBonusMultiplier: 10,
    minScore: 300
  },
  MEDIUM: {
    id: 'medium',
    name: '중급 (4x4)',
    pairs: 8,
    cols: 4,
    rows: 4,
    timeLimit: 90,
    baseScore: 1800,
    timeBonusMultiplier: 15,
    minScore: 500
  },
  HARD: {
    id: 'hard',
    name: '고급 (4x5)',
    pairs: 10,
    cols: 5,
    rows: 4,
    timeLimit: 120,
    baseScore: 2800,
    timeBonusMultiplier: 20,
    minScore: 800
  }
};

export const SIMON_BUTTONS = [
  {
    id: 0,
    name: '도 (C4)',
    note: 'C4',
    freq: 261.63,
    color: 'emerald',
    bgClass: 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-300 text-emerald-950',
    glowClass: 'shadow-[0_0_40px_rgba(16,185,129,1)] ring-4 ring-white scale-105',
    icon: '🐢',
    label: '에메랄드 터틀'
  },
  {
    id: 1,
    name: '레 (D4)',
    note: 'D4',
    freq: 293.66,
    color: 'amber',
    bgClass: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-amber-950',
    glowClass: 'shadow-[0_0_40px_rgba(245,158,11,1)] ring-4 ring-white scale-105',
    icon: '🦁',
    label: '골든 라이언'
  },
  {
    id: 2,
    name: '미 (E4)',
    note: 'E4',
    freq: 329.63,
    color: 'cyan',
    bgClass: 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-300 text-cyan-950',
    glowClass: 'shadow-[0_0_40px_rgba(6,182,212,1)] ring-4 ring-white scale-105',
    icon: '🐬',
    label: '오션 돌고래'
  },
  {
    id: 3,
    name: '솔 (G4)',
    note: 'G4',
    freq: 392.00,
    color: 'rose',
    bgClass: 'bg-rose-500 hover:bg-rose-400 active:bg-rose-300 text-rose-950',
    glowClass: 'shadow-[0_0_40px_rgba(244,63,94,1)] ring-4 ring-white scale-105',
    icon: '🐙',
    label: '루비 옥토퍼스'
  }
];
