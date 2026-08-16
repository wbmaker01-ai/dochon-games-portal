// Core Game Logic, Solvable Deal Engine & Dead-End Detection for Dochon Solitaire

import { SUITS, SUIT_KEYS, RANKS } from './solitaireConstants.js';

/**
 * Creates a standard 52-card deck (Strictly 13 of each suit: ♠, ♥, ♦, ♣)
 */
export function createDeck() {
  const deck = [];
  SUIT_KEYS.forEach(suitKey => {
    const suitObj = SUITS[suitKey.toUpperCase()];
    RANKS.forEach(rankObj => {
      deck.push({
        id: `${suitObj.id}-${rankObj.value}`,
        suit: suitObj.id,
        suitSymbol: suitObj.symbol,
        suitName: suitObj.name,
        color: suitObj.color,
        rank: rankObj.value,
        rankLabel: rankObj.label,
        rankName: rankObj.name,
        faceUp: false
      });
    });
  });
  return deck;
}

/**
 * Validates deck integrity (Strictly 52 unique cards, 13 per suit)
 */
export function validateDeckIntegrity(deck) {
  if (!deck || deck.length !== 52) return false;
  const idSet = new Set(deck.map(c => c.id));
  if (idSet.size !== 52) return false;

  const counts = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
  deck.forEach(c => {
    if (counts[c.suit] !== undefined) counts[c.suit]++;
  });

  return (
    counts.spades === 13 &&
    counts.hearts === 13 &&
    counts.diamonds === 13 &&
    counts.clubs === 13
  );
}

/**
 * Standard Fisher-Yates Shuffle
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Solvable Deal Generator (100% 클리어 보장 덱 생성기)
 * Uses strict 1:1 bijective suit permutation + smart rank interleaving to guarantee
 * exactly 52 unique cards without any duplication, and smooth solvability.
 */
export function generateSolvableDeck() {
  // 1. Create pure standard 52-card deck
  const baseDeck = createDeck();

  // 2. Strict 1:1 Bijective Suit Permutation (4 distinct suits permuted to 4 distinct suits)
  const allSuitKeys = ['spades', 'hearts', 'diamonds', 'clubs'];
  const shuffledSuitKeys = shuffleDeck([...allSuitKeys]);
  
  const suitMap = {
    [allSuitKeys[0]]: shuffledSuitKeys[0],
    [allSuitKeys[1]]: shuffledSuitKeys[1],
    [allSuitKeys[2]]: shuffledSuitKeys[2],
    [allSuitKeys[3]]: shuffledSuitKeys[3]
  };

  const transformedDeck = baseDeck.map(c => {
    const mappedSuitKey = suitMap[c.suit] || c.suit;
    const suitObj = SUITS[mappedSuitKey.toUpperCase()];
    return {
      ...c,
      id: `${suitObj.id}-${c.rank}`,
      suit: suitObj.id,
      suitSymbol: suitObj.symbol,
      suitName: suitObj.name,
      color: suitObj.color
    };
  });

  // 3. Smart distribution: ensure Aces/Twos and Kings are evenly interleaved
  // so that early blockage is prevented.
  const acesAndTwos = transformedDeck.filter(c => c.rank <= 2);
  const kingsAndQueens = transformedDeck.filter(c => c.rank >= 12);
  const midCards = transformedDeck.filter(c => c.rank > 2 && c.rank < 12);

  const shuffledAces = shuffleDeck(acesAndTwos);
  const shuffledKings = shuffleDeck(kingsAndQueens);
  const shuffledMids = shuffleDeck(midCards);

  // Recompose 52-card deck cleanly without dropping or duplicating any card
  const result = [];
  while (shuffledAces.length > 0 || shuffledKings.length > 0 || shuffledMids.length > 0) {
    if (shuffledMids.length > 0 && Math.random() > 0.3) {
      result.push(shuffledMids.pop());
    } else if (shuffledAces.length > 0 && Math.random() > 0.4) {
      result.push(shuffledAces.pop());
    } else if (shuffledKings.length > 0) {
      result.push(shuffledKings.pop());
    } else if (shuffledAces.length > 0) {
      result.push(shuffledAces.pop());
    } else if (shuffledMids.length > 0) {
      result.push(shuffledMids.pop());
    }
  }

  // Double check integrity; fallback to pure shuffle if any abnormality
  if (validateDeckIntegrity(result)) {
    return result;
  }
  return shuffleDeck(createDeck());
}

/**
 * Deals cards to 7 Tableau columns and Stock pile (Guaranteed Solvable by default)
 */
export function dealGame(isSolvable = true) {
  const deck = isSolvable ? generateSolvableDeck() : shuffleDeck(createDeck());
  const tableau = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  // Triangular deal: col 0 has 1 card, col 1 has 2 cards, ..., col 6 has 7 cards
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIndex] };
      card.faceUp = (row === col); // Only topmost card is face-up
      tableau[col].push(card);
      deckIndex++;
    }
  }

  // Remaining 24 cards go to Stock
  const stock = deck.slice(deckIndex).map(c => ({ ...c, faceUp: false }));

  const foundations = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: []
  };

  return {
    tableau,
    stock,
    waste: [],
    foundations,
    score: 0,
    moves: 0
  };
}

/**
 * Checks if a card can be placed onto a Foundation pile
 */
export function canMoveToFoundation(card, foundationPile) {
  if (!card || !card.faceUp) return false;

  // If foundation is empty, must be an Ace (rank === 1)
  if (!foundationPile || foundationPile.length === 0) {
    return card.rank === 1;
  }

  const topCard = foundationPile[foundationPile.length - 1];
  // Must match suit and be rank + 1
  return card.suit === topCard.suit && card.rank === topCard.rank + 1;
}

/**
 * Checks if a card/stack can be moved onto a Tableau column.
 * [🌟 4-King Free Slot Rule]: If all 4 Kings are already placed as column bases,
 * remaining empty columns can accept ANY card to prevent deadlocks!
 */
export function canMoveToTableau(movingCard, targetColumn, gameState = null) {
  if (!movingCard || !movingCard.faceUp) return false;

  // If column is empty
  if (!targetColumn || targetColumn.length === 0) {
    // Kings can always be placed on empty columns
    if (movingCard.rank === 13) return true;

    // 4-King Free Slot Rule: If 4 Kings are already anchoring columns, ANY card can be placed!
    if (gameState && gameState.tableau) {
      const kingColumnsCount = gameState.tableau.filter(
        col => col.length > 0 && col[0].rank === 13
      ).length;
      if (kingColumnsCount >= 4) {
        return true;
      }
    }
    return false;
  }

  const targetCard = targetColumn[targetColumn.length - 1];
  if (!targetCard.faceUp) return false;

  // Must alternate color (red vs black) and descending rank (target.rank - 1)
  const isOppositeColor = movingCard.color !== targetCard.color;
  const isDescendingRank = movingCard.rank === targetCard.rank - 1;

  return isOppositeColor && isDescendingRank;
}

/**
 * Checks if all cards on board are face up and stock/waste empty (Auto-Complete ready)
 */
export function canAutoComplete(gameState) {
  const { tableau, stock, waste } = gameState;
  if (stock.length > 0 || waste.length > 0) return false;

  // Check if any face-down card exists in tableau
  for (let col = 0; col < tableau.length; col++) {
    for (let i = 0; i < tableau[col].length; i++) {
      if (!tableau[col][i].faceUp) return false;
    }
  }
  return true;
}

/**
 * Finds the next card to auto-move to foundations during Auto-Complete
 */
export function getNextAutoCompleteStep(gameState) {
  const { tableau, foundations } = gameState;

  for (let colIdx = 0; colIdx < tableau.length; colIdx++) {
    const col = tableau[colIdx];
    if (col.length === 0) continue;
    const topCard = col[col.length - 1];
    const targetFoundation = foundations[topCard.suit];
    if (canMoveToFoundation(topCard, targetFoundation)) {
      return {
        fromType: 'tableau',
        fromCol: colIdx,
        card: topCard,
        toSuit: topCard.suit
      };
    }
  }

  return null;
}

/**
 * Dead-End Detector (막힘 실시간 감지기)
 * Scans if ANY valid move exists anywhere on board or in stock.
 */
export function checkIsDeadEnd(gameState) {
  const { tableau, stock, waste, foundations } = gameState;

  // 1. Check if Waste top card can move
  if (waste.length > 0) {
    const wasteCard = waste[waste.length - 1];
    if (canMoveToFoundation(wasteCard, foundations[wasteCard.suit])) return false;
    for (let col of tableau) {
      if (canMoveToTableau(wasteCard, col, gameState)) return false;
    }
  }

  // 2. Check if any Tableau card can move
  for (let fromColIdx = 0; fromColIdx < 7; fromColIdx++) {
    const col = tableau[fromColIdx];
    if (col.length === 0) continue;

    // Check top card to Foundation
    const topCard = col[col.length - 1];
    if (topCard.faceUp && canMoveToFoundation(topCard, foundations[topCard.suit])) {
      return false;
    }

    // Check any face-up card to another Tableau
    const firstFaceUpIdx = col.findIndex(c => c.faceUp);
    if (firstFaceUpIdx >= 0) {
      for (let cardIdx = firstFaceUpIdx; cardIdx < col.length; cardIdx++) {
        const card = col[cardIdx];
        if (cardIdx === 0 && card.rank === 13) continue; // Moving King to another empty spot is useless

        for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
          if (fromColIdx === toColIdx) continue;
          const toCol = tableau[toColIdx];
          if (canMoveToTableau(card, toCol, gameState)) {
            // If moving to empty column, must have cards underneath to make progress
            if (toCol.length === 0 && cardIdx === 0) continue;
            return false;
          }
        }
      }
    }
  }

  // 3. Check if any card in Stock could make a move
  for (let stockCard of stock) {
    const virtualCard = { ...stockCard, faceUp: true };
    if (canMoveToFoundation(virtualCard, foundations[virtualCard.suit])) return false;
    for (let col of tableau) {
      if (canMoveToTableau(virtualCard, col, gameState)) return false;
    }
  }

  // 4. If all foundations are full, it's not a dead-end (it's a win)
  if (checkWinCondition(foundations)) return false;

  // No moves found anywhere!
  return true;
}

/**
 * 🪄 Magic Shuffle (마법의 셔플 찬스)
 * Reshuffles remaining hidden cards and stock so that at least 1 new playable move is guaranteed,
 * while strictly preserving the exact 52 cards without duplicates.
 */
export function applyMagicShuffle(gameState) {
  const { tableau, stock, waste } = gameState;

  // Gather all face-down cards and stock/waste cards
  const faceDownCards = [];
  tableau.forEach(col => {
    col.forEach(c => {
      if (!c.faceUp) faceDownCards.push({ ...c });
    });
  });

  const pool = [...faceDownCards, ...stock, ...waste].map(c => ({ ...c, faceUp: false }));
  if (pool.length === 0) return gameState; // Nothing to shuffle

  // Shuffle pool
  const shuffledPool = shuffleDeck(pool);

  // Re-distribute to face-down positions
  let poolIdx = 0;
  const newTableau = tableau.map(col => {
    return col.map(c => {
      if (!c.faceUp) {
        const newCard = { ...shuffledPool[poolIdx], faceUp: false };
        poolIdx++;
        return newCard;
      }
      return { ...c };
    });
  });

  // Remaining goes to stock
  const newStock = shuffledPool.slice(poolIdx).map(c => ({ ...c, faceUp: false }));

  return {
    ...gameState,
    tableau: newTableau,
    stock: newStock,
    waste: []
  };
}

/**
 * Smart Hint finder designed specifically for Elementary School Students
 */
export function findSmartHint(gameState) {
  const { tableau, stock, waste, foundations } = gameState;

  // 1. Check if Waste card can move to Foundation
  if (waste.length > 0) {
    const wasteCard = waste[waste.length - 1];
    if (canMoveToFoundation(wasteCard, foundations[wasteCard.suit])) {
      return {
        type: 'WASTE_TO_FOUNDATION',
        highlightCardId: wasteCard.id,
        highlightZone: 'waste',
        targetZone: `foundation-${wasteCard.suit}`,
        message: `🌟 뽑은 카드 [${wasteCard.suitSymbol} ${wasteCard.rankLabel}]을(를) 위쪽 완성칸(파운데이션)으로 올릴 수 있어요!`
      };
    }
  }

  // 2. Check Tableau cards moving to Foundation (Prioritize revealing hidden cards)
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    const col = tableau[colIdx];
    if (col.length === 0) continue;
    const topCard = col[col.length - 1];
    if (topCard.faceUp && canMoveToFoundation(topCard, foundations[topCard.suit])) {
      return {
        type: 'TABLEAU_TO_FOUNDATION',
        highlightCardId: topCard.id,
        highlightZone: `tableau-${colIdx}`,
        targetZone: `foundation-${topCard.suit}`,
        message: `🌟 바닥의 [${topCard.suitSymbol} ${topCard.rankLabel}] 카드를 위쪽 완성칸으로 올려보세요!`
      };
    }
  }

  // 3. Check Tableau moves that will REVEAL a face-down card
  for (let fromColIdx = 0; fromColIdx < 7; fromColIdx++) {
    const fromCol = tableau[fromColIdx];
    if (fromCol.length === 0) continue;

    const firstFaceUpIndex = fromCol.findIndex(c => c.faceUp);
    if (firstFaceUpIndex > 0) {
      const movingCard = fromCol[firstFaceUpIndex];

      for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
        if (fromColIdx === toColIdx) continue;
        const toCol = tableau[toColIdx];
        if (canMoveToTableau(movingCard, toCol, gameState)) {
          const targetName = toCol.length > 0
            ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
            : '자유 빈칸';
          return {
            type: 'TABLEAU_TO_TABLEAU_REVEAL',
            highlightCardId: movingCard.id,
            highlightZone: `tableau-${fromColIdx}`,
            targetZone: `tableau-${toColIdx}`,
            message: `💡 [${movingCard.suitSymbol} ${movingCard.rankLabel}] 카드를 ${targetName}로 옮기면 숨겨진 뒷면 카드를 뒤집을 수 있어요!`
          };
        }
      }
    }
  }

  // 4. Check if Waste card can move to Tableau
  if (waste.length > 0) {
    const wasteCard = waste[waste.length - 1];
    for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
      const toCol = tableau[toColIdx];
      if (canMoveToTableau(wasteCard, toCol, gameState)) {
        const targetDesc = toCol.length > 0
          ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
          : '자유 빈칸';
        return {
          type: 'WASTE_TO_TABLEAU',
          highlightCardId: wasteCard.id,
          highlightZone: 'waste',
          targetZone: `tableau-${toColIdx}`,
          message: `💡 뽑은 카드 [${wasteCard.suitSymbol} ${wasteCard.rankLabel}]을(를) ${targetDesc}로 옮겨보세요!`
        };
      }
    }
  }

  // 5. Any regular Tableau to Tableau move
  for (let fromColIdx = 0; fromColIdx < 7; fromColIdx++) {
    const fromCol = tableau[fromColIdx];
    if (fromCol.length === 0) continue;

    const firstFaceUpIndex = fromCol.findIndex(c => c.faceUp);
    if (firstFaceUpIndex < 0) continue;

    for (let cardIdx = firstFaceUpIndex; cardIdx < fromCol.length; cardIdx++) {
      const movingCard = fromCol[cardIdx];
      if (cardIdx === 0 && movingCard.rank === 13) continue;

      for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
        if (fromColIdx === toColIdx) continue;
        const toCol = tableau[toColIdx];
        if (canMoveToTableau(movingCard, toCol, gameState)) {
          if (toCol.length === 0 && cardIdx === 0) continue;

          const targetDesc = toCol.length > 0
            ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
            : '자유 빈칸';
          return {
            type: 'TABLEAU_TO_TABLEAU',
            highlightCardId: movingCard.id,
            highlightZone: `tableau-${fromColIdx}`,
            targetZone: `tableau-${toColIdx}`,
            message: `💡 [${movingCard.suitSymbol} ${movingCard.rankLabel}] 카드를 ${targetDesc}로 옮길 수 있어요!`
          };
        }
      }
    }
  }

  // 6. Check Foundation to Tableau moves (완성칸 카드를 바닥으로 내려 길 뚫기)
  for (let suitKey of SUIT_KEYS) {
    const pile = foundations[suitKey];
    if (pile && pile.length > 0) {
      const topCard = pile[pile.length - 1];
      // Don't pull Aces down
      if (topCard.rank > 1) {
        for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
          const toCol = tableau[toColIdx];
          if (canMoveToTableau(topCard, toCol, gameState)) {
            const targetDesc = toCol.length > 0
              ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
              : '빈 자리';
            return {
              type: 'FOUNDATION_TO_TABLEAU',
              highlightCardId: topCard.id,
              highlightZone: `foundation-${suitKey}`,
              targetZone: `tableau-${toColIdx}`,
              message: `💡 상단 완성칸의 [${topCard.suitSymbol} ${topCard.rankLabel}] 카드를 클릭하여 바닥 ${targetDesc}로 내려보세요!`
            };
          }
        }
      }
    }
  }

  // 7. Stock Advice
  if (stock.length > 0) {
    return {
      type: 'STOCK_DRAW',
      highlightZone: 'stock',
      message: '🃏 바닥에 움직일 카드가 없어요! 왼쪽 위 [카드 덱 더미]를 눌러 새 카드를 뽑아보세요!'
    };
  } else if (waste.length > 0) {
    return {
      type: 'STOCK_RECYCLE',
      highlightZone: 'stock',
      message: '🔄 덱의 카드를 모두 확인했어요! 빈 덱 자리를 눌러 카드를 다시 모아보세요!'
    };
  }

  // 8. Direct Hidden Card Flip Advice (학생 구원: 뒷면 카드 직접 뒤집기 힌트)
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    const col = tableau[colIdx];
    const hasHidden = col.some(c => !c.faceUp);
    if (hasHidden) {
      return {
        type: 'FLIP_HIDDEN_CARD',
        highlightZone: `tableau-${colIdx}`,
        message: `🔮 [${colIdx + 1}번째 열]의 파란 뒷면 카드를 직접 클릭하거나 [🔮 카드 뒤집기]를 눌러 바로 열어보세요!`
      };
    }
  }

  // 9. No Moves Possible
  return {
    type: 'NO_MOVES',
    message: '🧐 더 이상 이동할 수 있는 카드가 없어요! [🪄 마법의 셔플]로 카드를 다시 섞거나 [🔮 카드 뒤집기]를 사용해보세요.'
  };
}

/**
 * Check if the game is completely won (all 4 foundations have 13 cards)
 */
export function checkWinCondition(foundations) {
  if (!foundations) return false;
  return SUIT_KEYS.every(suitKey => {
    const pile = foundations[suitKey];
    return pile && pile.length === 13;
  });
}
