// Constants and definitions for Dochon Solitaire (도촌 솔리테어)

export const SUITS = {
  SPADES: { id: 'spades', symbol: '♠', name: '스페이드', color: 'black' },
  HEARTS: { id: 'hearts', symbol: '♥', name: '하트', color: 'red' },
  DIAMONDS: { id: 'diamonds', symbol: '♦', name: '다이아몬드', color: 'red' },
  CLUBS: { id: 'clubs', symbol: '♣', name: '클로버', color: 'black' }
};

export const SUIT_KEYS = ['spades', 'hearts', 'diamonds', 'clubs'];

export const RANKS = [
  { value: 1, label: 'A', name: '에이스' },
  { value: 2, label: '2', name: '2' },
  { value: 3, label: '3', name: '3' },
  { value: 4, label: '4', name: '4' },
  { value: 5, label: '5', name: '5' },
  { value: 6, label: '6', name: '6' },
  { value: 7, label: '7', name: '7' },
  { value: 8, label: '8', name: '8' },
  { value: 9, label: '9', name: '9' },
  { value: 10, label: '10', name: '10' },
  { value: 11, label: 'J', name: '잭' },
  { value: 12, label: 'Q', name: '퀸' },
  { value: 13, label: 'K', name: '킹' }
];

export const DRAW_MODES = {
  DRAW_ONE: { id: 'one', name: '쉬움 (1장 뽑기)', drawCount: 1, desc: '초보자와 초등학생에게 추천!' },
  DRAW_THREE: { id: 'three', name: '도전 (3장 뽑기)', drawCount: 3, desc: '표준 솔리테어 룰' }
};

// Standard Solitaire Scoring Rules
export const SCORING = {
  WASTE_TO_TABLEAU: 5,      // 덱에서 바닥으로: +5점
  WASTE_TO_FOUNDATION: 10,  // 덱에서 완성칸으로: +10점
  TABLEAU_TO_FOUNDATION: 10,// 바닥에서 완성칸으로: +10점
  FLIP_TABLEAU_CARD: 5,     // 뒷면 카드 뒤집기 성공: +5점
  FOUNDATION_TO_TABLEAU: -15, // 완성칸에서 다시 바닥으로: -15점
  RECYCLE_WASTE_PENALTY: -20, // 1장 뽑기에서 덱 다시 뒤집을 때 감점 (최저 0점 유지)
  VICTORY_BASE_BONUS: 200    // 승리 기본 보너스
};
