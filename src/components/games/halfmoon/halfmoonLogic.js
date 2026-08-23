// Game Logic and AI Engine for Half Moon

import { LUNAR_PHASES, SPECIAL_CARDS, SCORING_RULES } from './halfmoonConstants';

// Helper to generate a fresh shuffled deck
export function createShuffledDeck(allowSpecials = false) {
  const deck = [];
  const phases = Object.values(LUNAR_PHASES);

  // Each phase gets 4 copies in the deck
  phases.forEach(phase => {
    for (let i = 0; i < 4; i++) {
      deck.push({
        uid: `card_${phase.id}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'PHASE',
        phase: phase.id,
        step: phase.step,
        name: phase.name,
        shortName: phase.shortName,
        icon: phase.icon,
        color: phase.color,
        glowColor: phase.glowColor
      });
    }
  });

  // If specials allowed, add special cards
  if (allowSpecials) {
    const specials = Object.values(SPECIAL_CARDS);
    specials.forEach(special => {
      for (let i = 0; i < 2; i++) {
        deck.push({
          uid: `special_${special.id}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'SPECIAL',
          specialId: special.id,
          name: special.name,
          shortName: special.shortName,
          koreanDesc: special.koreanDesc,
          icon: special.icon,
          color: special.color,
          glowColor: special.glowColor
        });
      }
    });
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Create empty board grid
export function createEmptyBoard(rows = 3, cols = 3) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}

// Get adjacent cells (Orthogonal + Diagonal)
export function getAdjacentCells(board, row, col) {
  const rows = board.length;
  const cols = board[0].length;
  const adjacent = [];

  const directions = [
    { dr: -1, dc: 0, dir: 'N' },
    { dr: 1, dc: 0, dir: 'S' },
    { dr: 0, dc: -1, dir: 'W' },
    { dr: 0, dc: 1, dir: 'E' },
    { dr: -1, dc: -1, dir: 'NW' },
    { dr: -1, dc: 1, dir: 'NE' },
    { dr: 1, dc: -1, dir: 'SW' },
    { dr: 1, dc: 1, dir: 'SE' }
  ];

  for (const { dr, dc, dir } of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      adjacent.push({
        row: nr,
        col: nc,
        card: board[nr][nc],
        isOrthogonal: Math.abs(dr) + Math.abs(dc) === 1,
        dir
      });
    }
  }

  return adjacent;
}

// Check score earned by playing a card at (row, col)
export function evaluateMoveScore(board, row, col, card, owner = 'PLAYER') {
  if (board[row][col] !== null) return { score: 0, details: [] };

  let totalScore = SCORING_RULES.BASE_CARD_PLAY;
  const details = [];
  const adjacent = getAdjacentCells(board, row, col);

  if (card.type === 'SPECIAL') {
    if (card.specialId === 'SUPER_MOON') {
      let boostCount = 0;
      adjacent.forEach(adj => {
        if (adj.card && adj.card.owner === owner) {
          boostCount++;
          totalScore += 120;
        }
      });
      if (boostCount > 0) {
        details.push({
          type: 'SUPER_MOON_BOOST',
          message: `✨ 슈퍼문 달빛 증폭! 아군 카드 ${boostCount}개 강화 (+${boostCount * 120}점)`,
          score: boostCount * 120
        });
      }
    } else if (card.specialId === 'LUNAR_ECLIPSE') {
      let convertedCount = 0;
      adjacent.forEach(adj => {
        if (adj.card && adj.card.owner !== owner && adj.card.type === 'PHASE') {
          convertedCount++;
          totalScore += 150;
        }
      });
      if (convertedCount > 0) {
        details.push({
          type: 'ECLIPSE_CONVERT',
          message: `🩸 개기월식 발동! 상대 카드 ${convertedCount}개 잠식 전환 (+${convertedCount * 150}점)`,
          score: convertedCount * 150
        });
      }
    } else if (card.specialId === 'SHOOTING_STAR') {
      totalScore += 180;
      details.push({
        type: 'STAR_BURST',
        message: '🌠 유성우 축복! 별빛 보너스 (+180점)',
        score: 180
      });
    }
    return { score: totalScore, details };
  }

  // Regular Phase Card Scoring
  const cardStep = card.step;

  adjacent.forEach(adj => {
    const adjCard = adj.card;
    if (!adjCard || adjCard.type !== 'PHASE') return;

    const adjStep = adjCard.step;

    // 1. Same Phase Pair (+60)
    if (cardStep === adjStep) {
      totalScore += SCORING_RULES.SAME_PHASE_PAIR;
      details.push({
        type: 'SAME_PHASE',
        message: `🌓 ${card.shortName} 위상 페어 일치! (+${SCORING_RULES.SAME_PHASE_PAIR}점)`,
        score: SCORING_RULES.SAME_PHASE_PAIR
      });
    }

    // 2. Consecutive Cycle Step (+100) (0->1, 1->2, ... 7->0 or vice versa)
    const diff = (cardStep - adjStep + 8) % 8;
    if (diff === 1 || diff === 7) {
      totalScore += SCORING_RULES.CONSECUTIVE_CYCLE_STEP;
      details.push({
        type: 'CYCLE_STEP',
        message: `🔄 삭망월 연속 주기 연계 (${adjCard.shortName} ➔ ${card.shortName}) (+${SCORING_RULES.CONSECUTIVE_CYCLE_STEP}점)`,
        score: SCORING_RULES.CONSECUTIVE_CYCLE_STEP
      });
    }

    // 3. Opposite Phase Balance (+80) (Difference of 4 steps, e.g., New Moon vs Full Moon)
    if (Math.abs(cardStep - adjStep) === 4) {
      totalScore += SCORING_RULES.OPPOSITE_PHASE_BALANCE;
      details.push({
        type: 'OPPOSITE_BALANCE',
        message: `⚖️ 대칭 위상의 조화 (${adjCard.shortName} ⚔️ ${card.shortName}) (+${SCORING_RULES.OPPOSITE_PHASE_BALANCE}점)`,
        score: SCORING_RULES.OPPOSITE_PHASE_BALANCE
      });
    }
  });

  // Check Full Cycle Line (3 in a row with consecutive sequence)
  const rows = board.length;
  const cols = board[0].length;

  // Temporarily simulate card placement
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = { ...card, owner };

  const lineScore = checkFullLineBonus(tempBoard, row, col);
  if (lineScore.bonus > 0) {
    totalScore += lineScore.bonus;
    details.push({
      type: 'FULL_LINE_CYCLE',
      message: `🌟 완벽한 달의 궤도 라인 완성! (+${lineScore.bonus}점)`,
      score: lineScore.bonus
    });
  }

  return { score: totalScore, details };
}

// Check for 3-in-a-row consecutive phase line
function checkFullLineBonus(board, r, c) {
  const rows = board.length;
  const cols = board[0].length;
  let totalBonus = 0;

  // Check Row
  if (cols >= 3) {
    for (let colStart = 0; colStart <= cols - 3; colStart++) {
      const c1 = board[r][colStart];
      const c2 = board[r][colStart + 1];
      const c3 = board[r][colStart + 2];
      if (c1 && c2 && c3 && c1.type === 'PHASE' && c2.type === 'PHASE' && c3.type === 'PHASE') {
        if (isConsecutiveTrio(c1.step, c2.step, c3.step)) {
          totalBonus += SCORING_RULES.FULL_CYCLE_LINE;
        }
      }
    }
  }

  // Check Col
  if (rows >= 3) {
    for (let rowStart = 0; rowStart <= rows - 3; rowStart++) {
      const c1 = board[rowStart][c];
      const c2 = board[rowStart + 1][c];
      const c3 = board[rowStart + 2][c];
      if (c1 && c2 && c3 && c1.type === 'PHASE' && c2.type === 'PHASE' && c3.type === 'PHASE') {
        if (isConsecutiveTrio(c1.step, c2.step, c3.step)) {
          totalBonus += SCORING_RULES.FULL_CYCLE_LINE;
        }
      }
    }
  }

  return { bonus: totalBonus };
}

function isConsecutiveTrio(s1, s2, s3) {
  // Ascending sequence
  const d1 = (s2 - s1 + 8) % 8;
  const d2 = (s3 - s2 + 8) % 8;
  if ((d1 === 1 && d2 === 1) || (d1 === 7 && d2 === 7)) {
    return true;
  }
  return false;
}

// Luna AI Decision Making Engine
export function getBestAIMove(board, aiHand, difficulty = 'NORMAL') {
  const rows = board.length;
  const cols = board[0].length;
  const possibleMoves = [];

  // Find all available empty slots
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === null) {
        aiHand.forEach((card, handIndex) => {
          const evalResult = evaluateMoveScore(board, r, c, card, 'AI');
          
          // Additional AI heuristics based on difficulty
          let heuristicScore = evalResult.score;

          // Prefer center slot
          if (r === Math.floor(rows / 2) && c === Math.floor(cols / 2)) {
            heuristicScore += 15;
          }

          if (difficulty === 'HARD') {
            // Check if placing here blocks a high-scoring player move
            const playerThreat = evaluateMoveScore(board, r, c, { type: 'PHASE', step: 4 }, 'PLAYER');
            if (playerThreat.score > 100) {
              heuristicScore += playerThreat.score * 0.4;
            }
          }

          possibleMoves.push({
            row: r,
            col: c,
            handIndex,
            card,
            score: evalResult.score,
            heuristicScore,
            details: evalResult.details
          });
        });
      }
    }
  }

  if (possibleMoves.length === 0) return null;

  // Sort by heuristic score descending
  possibleMoves.sort((a, b) => b.heuristicScore - a.heuristicScore);

  if (difficulty === 'EASY') {
    // Easy AI picks among top 4 randomly
    const topN = Math.min(possibleMoves.length, 4);
    const chosenIndex = Math.floor(Math.random() * topN);
    return possibleMoves[chosenIndex];
  } else if (difficulty === 'NORMAL') {
    // Normal AI picks top 1 or 2
    const topN = Math.min(possibleMoves.length, 2);
    const chosenIndex = Math.floor(Math.random() * topN);
    return possibleMoves[chosenIndex];
  } else {
    // Hard AI always picks the optimal move
    return possibleMoves[0];
  }
}

// Apply special effects on board after card placed
export function applyBoardSideEffects(board, row, col, card, owner) {
  const newBoard = board.map(r => [...r]);
  const adjacent = getAdjacentCells(newBoard, row, col);

  if (card.type === 'SPECIAL') {
    if (card.specialId === 'LUNAR_ECLIPSE') {
      // Flip adjacent opponent cards to current owner
      adjacent.forEach(adj => {
        if (adj.card && adj.card.owner !== owner && adj.card.type === 'PHASE') {
          newBoard[adj.row][adj.col] = {
            ...adj.card,
            owner: owner,
            wasConverted: true
          };
        }
      });
    }
  }

  return newBoard;
}
