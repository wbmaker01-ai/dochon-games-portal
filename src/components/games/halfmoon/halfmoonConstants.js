// Half Moon (Rise of the Half Moon) Game Constants

export const LUNAR_PHASES = {
  NEW_MOON: {
    id: 'NEW_MOON',
    step: 0,
    name: '삭 (New Moon)',
    shortName: '삭',
    koreanDesc: '달이 보이지 않는 시작 단계',
    color: '#3A405A',
    glowColor: '#6B728E',
    icon: '🌑'
  },
  WAXING_CRESCENT: {
    id: 'WAXING_CRESCENT',
    step: 1,
    name: '초승달 (Waxing Crescent)',
    shortName: '초승달',
    koreanDesc: '오른쪽이 가늘게 차오르는 달',
    color: '#F4D06F',
    glowColor: '#FFE494',
    icon: '🌒'
  },
  FIRST_QUARTER: {
    id: 'FIRST_QUARTER',
    step: 2,
    name: '상현달 (First Quarter)',
    shortName: '상현달',
    koreanDesc: '오른쪽 반쪽이 찬 반달',
    color: '#FFB703',
    glowColor: '#FFD166',
    icon: '🌓'
  },
  WAXING_GIBBOUS: {
    id: 'WAXING_GIBBOUS',
    step: 3,
    name: '차오르는 달 (Waxing Gibbous)',
    shortName: '상현망',
    koreanDesc: '보름달을 향해 둥글어지는 달',
    color: '#FB8500',
    glowColor: '#FFAA4C',
    icon: '🌔'
  },
  FULL_MOON: {
    id: 'FULL_MOON',
    step: 4,
    name: '보름달 (Full Moon)',
    shortName: '보름달',
    koreanDesc: '온 세상을 밝히는 둥근 보름달',
    color: '#FFF275',
    glowColor: '#FFFFFF',
    icon: '🌕'
  },
  WANING_GIBBOUS: {
    id: 'WANING_GIBBOUS',
    step: 5,
    name: '기우는 달 (Waning Gibbous)',
    shortName: '하현망',
    koreanDesc: '왼쪽으로 조금씩 기우는 달',
    color: '#E0AAFF',
    glowColor: '#C77DFF',
    icon: '🌖'
  },
  THIRD_QUARTER: {
    id: 'THIRD_QUARTER',
    step: 6,
    name: '하현달 (Third Quarter)',
    shortName: '하현달',
    koreanDesc: '왼쪽 반쪽만 남은 반달',
    color: '#7209B7',
    glowColor: '#B5179E',
    icon: '🌗'
  },
  WANING_CRESCENT: {
    id: 'WANING_CRESCENT',
    step: 7,
    name: '그믐달 (Waning Crescent)',
    shortName: '그믐달',
    koreanDesc: '왼쪽 눈썹 모양으로 저무는 달',
    color: '#4361EE',
    glowColor: '#4CC9F0',
    icon: '🌘'
  }
};

export const SPECIAL_CARDS = {
  SUPER_MOON: {
    id: 'SUPER_MOON',
    name: '슈퍼문 (Super Moon)',
    shortName: '슈퍼문',
    koreanDesc: '인접한 아군 카드의 점수를 2배로 증폭!',
    icon: '✨',
    color: '#FF007F',
    glowColor: '#FF70A6'
  },
  LUNAR_ECLIPSE: {
    id: 'LUNAR_ECLIPSE',
    name: '개기월식 (Lunar Eclipse)',
    shortName: '월식',
    koreanDesc: '인접한 상대 카드를 뒤집어 내 점수로 흡수!',
    icon: '🩸',
    color: '#D90429',
    glowColor: '#EF233C'
  },
  SHOOTING_STAR: {
    id: 'SHOOTING_STAR',
    name: '별똥별 (Shooting Star)',
    shortName: '유성우',
    koreanDesc: '상하좌우에 빛나는 보너스 별빛 파편 생성!',
    icon: '🌠',
    color: '#06D6A0',
    glowColor: '#70E000'
  }
};

export const GAME_STATES = {
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  ROUND_RESULT: 'ROUND_RESULT',
  GAME_OVER: 'GAME_OVER',
  GAME_CLEAR: 'GAME_CLEAR'
};

export const STAGES = [
  {
    stage: 1,
    name: '스테이지 1: 초승달의 인도',
    subtitle: '달의 8가지 위상 기본 매칭 배우기',
    gridSize: { rows: 3, cols: 3 },
    targetScore: 400,
    roundsToWin: 1,
    aiLevel: 'EASY',
    allowSpecials: false,
    handSize: 3
  },
  {
    stage: 2,
    name: '스테이지 2: 반달의 시험',
    subtitle: '달의 정령 Luna와의 전략적 위상 연계 대결',
    gridSize: { rows: 3, cols: 3 },
    targetScore: 900,
    roundsToWin: 1,
    aiLevel: 'NORMAL',
    allowSpecials: true,
    handSize: 3
  },
  {
    stage: 3,
    name: '스테이지 3: 보름달의 결전',
    subtitle: '4x4 확장 전장에서 펼쳐지는 궁극의 천문 카드 배틀',
    gridSize: { rows: 4, cols: 4 },
    targetScore: 1600,
    roundsToWin: 1,
    aiLevel: 'HARD',
    allowSpecials: true,
    handSize: 4
  }
];

export const SCORING_RULES = {
  BASE_CARD_PLAY: 20,
  SAME_PHASE_PAIR: 60, // 동일 위상 인접
  CONSECUTIVE_CYCLE_STEP: 100, // 연속 위상 (예: 초승달 ➔ 상현달)
  OPPOSITE_PHASE_BALANCE: 80, // 상반된 위상 (예: 삭 vs 보름달)
  FULL_CYCLE_LINE: 300, // 3연속 완벽 주기 라인
  BOARD_CONTROL_WIN: 200, // 보드 영역 우세 승리 보너스
  STAGE_CLEAR_BONUS: 350 // 스테이지 클리어 보너스
};
