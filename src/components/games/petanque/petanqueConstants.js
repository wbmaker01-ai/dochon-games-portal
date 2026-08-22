// Dochon Pétanque Master Constants & Game Configuration

export const GAME_STATES = {
  INTRO: 'INTRO',
  READY_THROW: 'READY_THROW',
  THROWING: 'THROWING',
  BALLS_MOVING: 'BALLS_MOVING',
  MEASURING: 'MEASURING',
  END_ROUND: 'END_ROUND',
  GAME_OVER: 'GAME_OVER'
};

export const SHOT_TYPES = {
  POINTER: 'POINTER', // 포앵테: 낮은 탄도, 부드러운 롤링, 목표 공 가까이 붙이기
  TIRER: 'TIRER'     // 티레: 높은 포물선 로브, 상대 공 직접 타격
};

export const TEAMS = {
  PLAYER: {
    id: 'PLAYER',
    name: '도촌 청팀 (나)',
    ballColor: '#2563eb', // Blue
    ballGlow: '#60a5fa',
    ballAccent: '#93c5fd',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-600',
    icon: '🔵'
  },
  AI: {
    id: 'AI',
    name: '도촌 백팀 (AI)',
    ballColor: '#dc2626', // Red
    ballGlow: '#f87171',
    ballAccent: '#fca5a5',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-600',
    icon: '🔴'
  }
};

export const FIELD_CONFIG = {
  WIDTH: 800,
  HEIGHT: 560,
  // Perspective parameters for 2.5D rendering
  HORIZON_Y: 100,
  FIELD_TOP_Y: 120,
  FIELD_BOTTOM_Y: 530,
  LAUNCH_Y: 510,
  LAUNCH_X: 400,
  MIN_SCALE: 0.45, // Scale at the far back
  MAX_SCALE: 1.05, // Scale at the throw line
  
  // Real-world representation bounds (in virtual meters)
  VIRTUAL_LENGTH_M: 10.0,
  VIRTUAL_WIDTH_M: 4.0
};

export const PHYSICS_CONFIG = {
  GRAVITY: 9.8,
  GROUND_FRICTION: 0.984, // Sand & gravel ground friction per frame
  RESTITUTION: 0.65,      // Metal boule elasticity (bounce)
  COCHONNET_RESTITUTION: 0.72,
  MIN_VELOCITY_STOP: 0.05,
  
  // Boule Specs
  BOULE_RADIUS_REAL: 20,  // Base visual radius in px at MAX_SCALE
  BOULE_MASS: 0.7,        // 700g
  
  // Cochonnet (Target Ball) Specs
  COCHONNET_RADIUS_REAL: 10,
  COCHONNET_MASS: 0.15,   // 150g
  COCHONNET_COLOR: '#f59e0b', // Amber/Yellow
  COCHONNET_GLOW: '#fef08a'
};

export const MATCH_CONFIG = {
  TOTAL_ROUNDS: 3,         // 3엔드 매치
  BALLS_PER_PLAYER: 3,     // 1엔드당 3구씩 (총 6구 투구)
  TARGET_WIN_SCORE: 13,
  
  // Scoring points for leaderboard calculation
  WIN_BONUS: 400,
  ROUND_POINT_SCORE: 150,  // 엔드 득점당 150점
  BULLSEYE_BONUS: 200,     // 뷔슈 20cm 이내 안착 보너스
  TIRER_HIT_BONUS: 180,    // 상대 공 명중 타격 보너스
  SWEEP_BONUS: 300,        // 3구 모두 상대보다 가까울 때
  BASE_SCORE: 100
};

export const AI_DIFFICULTY = {
  EASY: { name: '초급', errorVariance: 0.28, tirerChance: 0.15 },
  NORMAL: { name: '중급', errorVariance: 0.16, tirerChance: 0.35 },
  HARD: { name: '고급', errorVariance: 0.08, tirerChance: 0.60 }
};
