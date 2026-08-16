// Core Game Logic & Rules Engine for Dochon Solitaire

import { SUITS, SUIT_KEYS, RANKS } from './solitaireConstants';

/**
 * Creates a standard 52-card deck
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
 * Fisher-Yates Shuffle Algorithm
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
 * Deals cards to 7 Tableau columns and Stock pile
 */
export function dealGame(shuffledDeck = null) {
  const deck = shuffledDeck || shuffleDeck(createDeck());
  const tableau = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  // Deal 1 to 7 cards into tableau columns (triangular deal)
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIndex] };
      // Topmost card of each column is face-up
      if (row === col) {
        card.faceUp = true;
      } else {
        card.faceUp = false;
      }
      tableau[col].push(card);
      deckIndex++;
    }
  }

  // Remaining cards go to Stock pile (all face-down)
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
 * Checks if a card/stack can be moved onto a Tableau column
 */
export function canMoveToTableau(movingCard, targetColumn) {
  if (!movingCard || !movingCard.faceUp) return false;

  // If column is empty, only a King (rank === 13) can be placed
  if (!targetColumn || targetColumn.length === 0) {
    return movingCard.rank === 13;
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
 * Smart Hint finder designed specifically for Elementary School Students
 * Scans all possible moves and returns the most helpful actionable advice.
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

    // Find the highest faceUp card in this column
    const firstFaceUpIndex = fromCol.findIndex(c => c.faceUp);
    if (firstFaceUpIndex > 0) {
      // There is a hidden card underneath!
      const movingCard = fromCol[firstFaceUpIndex];

      for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
        if (fromColIdx === toColIdx) continue;
        const toCol = tableau[toColIdx];
        if (canMoveToTableau(movingCard, toCol)) {
          const targetName = toCol.length > 0
            ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
            : '빈 열';
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
      if (canMoveToTableau(wasteCard, toCol)) {
        const targetDesc = toCol.length > 0
          ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
          : '빈 자리';
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

    // Try each face-up sub-stack
    for (let cardIdx = firstFaceUpIndex; cardIdx < fromCol.length; cardIdx++) {
      const movingCard = fromCol[cardIdx];
      // Avoid moving a King from an already empty-revealed spot to another empty spot pointlessly
      if (cardIdx === 0 && movingCard.rank === 13) continue;

      for (let toColIdx = 0; toColIdx < 7; toColIdx++) {
        if (fromColIdx === toColIdx) continue;
        const toCol = tableau[toColIdx];
        if (canMoveToTableau(movingCard, toCol)) {
          // If toCol is empty, only move if this column has other cards underneath
          if (toCol.length === 0 && cardIdx === 0) continue;

          const targetDesc = toCol.length > 0
            ? `[${toCol[toCol.length - 1].suitSymbol} ${toCol[toCol.length - 1].rankLabel}] 아래`
            : '빈 자리';
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

  // 6. Stock Advice
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

  // 7. No Moves Possible
  return {
    type: 'NO_MOVES',
    message: '🧐 더 이상 이동할 수 있는 카드가 없어요! [실행 취소(Undo)]로 되돌리거나 새 게임을 시작해보세요.'
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
