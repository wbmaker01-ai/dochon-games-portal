// ==========================================
// 🍩 도넛 틱택토 (Donut Tic-Tac-Toe) 핵심 로직
// ==========================================

import {
  PLAYERS,
  GAME_MODES,
  CLASSIC_WINNING_LINES,
  TORUS_WINNING_LINES,
  AI_DIFFICULTIES
} from './donutTicTacToeConstants';

/**
 * 주어진 모드에 따라 승리 라인 목록을 반환합니다.
 */
export function getWinningLines(mode) {
  return mode === GAME_MODES.DONUT_TORUS ? TORUS_WINNING_LINES : CLASSIC_WINNING_LINES;
}

/**
 * 보드 상태에서 승리 여부 및 승리 라인을 검사합니다.
 * @param {Array<string|null>} board - 길이 9의 배열
 * @param {string} mode - 'CLASSIC' | 'DONUT_TORUS'
 * @returns {{ winner: string|null, winningLine: Array<number>|null, isDraw: boolean }}
 */
export function checkGameStatus(board, mode) {
  const lines = getWinningLines(mode);

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningLine: line,
        isDraw: false,
      };
    }
  }

  // 빈 칸이 없으면 무승부
  const isBoardFull = board.every(cell => cell !== null);
  return {
    winner: null,
    winningLine: null,
    isDraw: isBoardFull,
  };
}

/**
 * 빈 칸들의 인덱스 목록을 반환합니다.
 */
export function getAvailableMoves(board) {
  const moves = [];
  board.forEach((cell, idx) => {
    if (cell === null) moves.push(idx);
  });
  return moves;
}

/**
 * AI의 다음 착수 위치를 계산합니다.
 * @param {Array<string|null>} board
 * @param {string} mode
 * @param {string} difficulty - 'EASY' | 'NORMAL' | 'MASTER'
 * @param {string} aiPlayer - PLAYERS.P2 ('CHOCO')
 * @param {string} humanPlayer - PLAYERS.P1 ('PINK')
 * @returns {number} 착수할 셀 인덱스 (0~8)
 */
export function calculateAIMove(board, mode, difficulty, aiPlayer = PLAYERS.P2, humanPlayer = PLAYERS.P1) {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return -1;

  // 1. 쉬움 모드: 75% 확률로 무작위, 25% 확률로 즉시 승리/방어
  if (difficulty === 'EASY') {
    if (Math.random() > 0.35) {
      // 무작위 선택
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // 2. 보통 및 마스터 모드 공통: 1순위 - 내가 이길 수 있는 수가 있으면 즉시 둔다.
  for (const move of availableMoves) {
    const testBoard = [...board];
    testBoard[move] = aiPlayer;
    const result = checkGameStatus(testBoard, mode);
    if (result.winner === aiPlayer) {
      return move;
    }
  }

  // 3. 보통 및 마스터 모드 공통: 2순위 - 상대가 이길 수 있는 수가 있으면 막는다.
  for (const move of availableMoves) {
    const testBoard = [...board];
    testBoard[move] = humanPlayer;
    const result = checkGameStatus(testBoard, mode);
    if (result.winner === humanPlayer) {
      return move;
    }
  }

  // 4. 보통 모드: 50% 확률로 중앙/코너 선호, 50% 랜덤
  if (difficulty === 'NORMAL') {
    if (Math.random() < 0.6) {
      // 중앙(4) 우선, 그 다음 모서리(0,2,6,8)
      if (availableMoves.includes(4)) return 4;
      const corners = [0, 2, 6, 8].filter(c => availableMoves.includes(c));
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
      }
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 5. 마스터 모드: Minimax 알고리즘으로 최적의 수 탐색
  const bestMove = runMinimax(board, mode, aiPlayer, humanPlayer, aiPlayer, 0, -Infinity, Infinity);
  return bestMove.index !== undefined ? bestMove.index : availableMoves[0];
}

/**
 * Minimax 탐색 (알파베타 가지치기 포함)
 */
function runMinimax(board, mode, aiPlayer, humanPlayer, currentTurn, depth, alpha, beta) {
  const status = checkGameStatus(board, mode);
  
  if (status.winner === aiPlayer) {
    return { score: 10 - depth };
  }
  if (status.winner === humanPlayer) {
    return { score: depth - 10 };
  }
  if (status.isDraw || depth >= 6) { // 탐색 깊이 제한으로 빠른 반응 보장
    return { score: 0 };
  }

  const availableMoves = getAvailableMoves(board);

  if (currentTurn === aiPlayer) {
    let maxEval = -Infinity;
    let bestIndex = availableMoves[0];

    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const evaluation = runMinimax(board, mode, aiPlayer, humanPlayer, humanPlayer, depth + 1, alpha, beta);
      board[move] = null;

      if (evaluation.score > maxEval) {
        maxEval = evaluation.score;
        bestIndex = move;
      }
      alpha = Math.max(alpha, evaluation.score);
      if (beta <= alpha) break;
    }
    return { score: maxEval, index: bestIndex };
  } else {
    let minEval = Infinity;
    let bestIndex = availableMoves[0];

    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const evaluation = runMinimax(board, mode, aiPlayer, humanPlayer, aiPlayer, depth + 1, alpha, beta);
      board[move] = null;

      if (evaluation.score < minEval) {
        minEval = evaluation.score;
        bestIndex = move;
      }
      beta = Math.min(beta, evaluation.score);
      if (beta <= alpha) break;
    }
    return { score: minEval, index: bestIndex };
  }
}

/**
 * 라운드 결과에 따른 획득 점수 계산
 */
export function calculateRoundScore({
  isWin,
  isDraw,
  difficultyKey,
  mode,
  winStreak,
  remainingEmptyCells
}) {
  if (isDraw) {
    return 30; // 무승부 격려 점수
  }
  if (!isWin) {
    return 0; // 패배
  }

  const diffConfig = AI_DIFFICULTIES[difficultyKey] || AI_DIFFICULTIES.NORMAL;
  const baseScore = 150; // 기본 승리 점수
  const difficultyBonus = diffConfig.bonus;
  const modeBonus = mode === GAME_MODES.DONUT_TORUS ? 80 : 0; // 토러스 모드 추가 보너스
  const speedBonus = remainingEmptyCells * 20; // 빠르게 끝낼수록 높은 보너스
  const streakBonus = Math.min(winStreak, 5) * 50; // 연승 보너스 (최대 5연승)

  const total = Math.round((baseScore + difficultyBonus + modeBonus + speedBonus + streakBonus) * diffConfig.scoreMultiplier);
  return total;
}
