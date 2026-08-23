// Half Moon Grid Board Component

import React from 'react';
import HalfMoonCard from './HalfMoonCard';
import { evaluateMoveScore } from './halfmoonLogic';
import { Sparkles, Zap } from 'lucide-react';

export default function HalfMoonBoard({
  board,
  selectedCard,
  onSlotClick,
  currentTurn,
  lastMoveSlot,
  winningSlots = []
}) {
  const rows = board.length;
  const cols = board[0].length;

  return (
    <div className="halfmoon-board-container">
      <div
        className={`halfmoon-grid-board rows-${rows} cols-${cols}`}
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
        }}
      >
        {board.map((rowArr, rIdx) =>
          rowArr.map((card, cIdx) => {
            const isSlotEmpty = card === null;
            const isLastMove =
              lastMoveSlot && lastMoveSlot.row === rIdx && lastMoveSlot.col === cIdx;
            const isWinning = winningSlots.some(s => s.row === rIdx && s.col === cIdx);

            // Calculate preview score if player has a card selected and it's player's turn
            let previewScore = null;
            if (isSlotEmpty && selectedCard && currentTurn === 'PLAYER') {
              const evalResult = evaluateMoveScore(board, rIdx, cIdx, selectedCard, 'PLAYER');
              previewScore = evalResult.score;
            }

            return (
              <div
                key={`slot-${rIdx}-${cIdx}`}
                onClick={() => isSlotEmpty && onSlotClick(rIdx, cIdx)}
                className={`halfmoon-board-slot ${isSlotEmpty ? 'slot-empty' : 'slot-occupied'} ${
                  selectedCard && isSlotEmpty && currentTurn === 'PLAYER' ? 'slot-valid-target' : ''
                } ${isLastMove ? 'slot-last-move' : ''} ${isWinning ? 'slot-winning' : ''}`}
              >
                {/* Background Constellation Pattern */}
                <div className="slot-celestial-bg" />

                {/* Empty Slot Highlight & Projected Score Tag */}
                {isSlotEmpty && selectedCard && currentTurn === 'PLAYER' && (
                  <div className="slot-preview-overlay">
                    <span className="slot-place-prompt">착수</span>
                    {previewScore !== null && previewScore > 20 && (
                      <span className="slot-preview-points">
                        +{previewScore}점
                      </span>
                    )}
                  </div>
                )}

                {/* Placed Card */}
                {card && (
                  <div className="slot-card-wrapper animate-card-drop">
                    <HalfMoonCard
                      card={card}
                      size="board"
                      showOwner={true}
                      isWinningLine={isWinning}
                      isPlayable={false}
                    />
                  </div>
                )}

                {/* Last Move Glowing Border Indicator */}
                {isLastMove && (
                  <div className="slot-last-move-ping" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
