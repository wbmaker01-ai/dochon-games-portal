// ==========================================
// 🍩 도넛 틱택토 (Donut Tic-Tac-Toe) 상수 정의
// ==========================================

const getDonutAsset = (file) => `${import.meta.env.BASE_URL}assets/donut-tictactoe/${file}`;

export const ASSETS = {
  THUMB: getDonutAsset('thumb.jpg'),
  PINK_DONUT: getDonutAsset('pink_donut.jpg'),
  CHOCO_DONUT: getDonutAsset('choco_donut.jpg'),
  BAKERY_BG: getDonutAsset('bakery_bg.jpg'),
};

// 플레이어 정의
export const PLAYERS = {
  P1: 'PINK',   // 핑크 딸기 도넛 (선공 / 플레이어)
  P2: 'CHOCO',  // 초코 도넛 (후공 / AI 또는 2P)
};

// 게임 모드
export const GAME_MODES = {
  CLASSIC: 'CLASSIC',         // 전통 3x3 틱택토
  DONUT_TORUS: 'DONUT_TORUS', // 토러스(도넛) 순환 틱택토 (벽을 뚫고 이어짐)
};

// 대전 상대
export const OPPONENT_TYPES = {
  AI: 'AI',                   // 싱글플레이 (AI 대전)
  TWO_PLAYER: 'TWO_PLAYER',   // 2인 로컬 대전 (친구와 함께)
};

// AI 난이도
export const AI_DIFFICULTIES = {
  EASY: { id: 'EASY', label: '쉬움 (초보)', scoreMultiplier: 1.0, bonus: 50 },
  NORMAL: { id: 'NORMAL', label: '보통 (일반)', scoreMultiplier: 1.5, bonus: 120 },
  MASTER: { id: 'MASTER', label: '마스터 (도사)', scoreMultiplier: 2.5, bonus: 250 },
};

// 기본 승리 라인 정의 (3x3 인덱스: 0~8)
// 0 1 2
// 3 4 5
// 6 7 8

export const CLASSIC_WINNING_LINES = [
  // 가로 3개
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // 세로 3개
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // 대각선 2개
  [0, 4, 8],
  [2, 4, 6],
];

export const TORUS_WINNING_LINES = [
  // 가로 3개
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // 세로 3개
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // 주대각선 계열 (상하좌우 순환)
  [0, 4, 8], // 표준 주대각선
  [1, 5, 6], // 오른쪽으로 1칸 시프트 주대각
  [2, 3, 7], // 오른쪽으로 2칸 시프트 주대각
  // 역대각선 계열 (상하좌우 순환)
  [2, 4, 6], // 표준 역대각선
  [1, 3, 8], // 왼쪽으로 1칸 시프트 역대각
  [0, 5, 7], // 왼쪽으로 2칸 시프트 역대각
];
