// Player and AI Hand Component

import React from 'react';
import HalfMoonCard from './HalfMoonCard';
import { Sparkles, Moon, Bot } from 'lucide-react';

export default function HalfMoonHand({
  cards,
  selectedCard,
  onSelectCard,
  isPlayer = true,
  isTurn = false,
  deckRemaining = 0
}) {
  return (
    <div className={`halfmoon-hand-panel ${isPlayer ? 'hand-player' : 'hand-ai'}`}>
      <div className="hand-header-bar">
        <div className="hand-owner-title">
          {isPlayer ? (
            <>
              <Moon className="w-4 h-4 text-cyan-300" />
              <span>플레이어 덱 (남은 카드 {cards.length}장)</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 text-purple-300" />
              <span>달의 정령 Luna (손패 {cards.length}장)</span>
            </>
          )}
        </div>

        {isTurn && (
          <div className="hand-turn-badge animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isPlayer ? '내 턴! 카드를 골라 보드에 놓으세요' : 'Luna 생각 중...'}</span>
          </div>
        )}
      </div>

      <div className="hand-cards-rack">
        {cards.map((card, idx) => {
          if (!isPlayer) {
            // AI Hand - Show Card Back
            return (
              <div key={`ai-hand-${idx}`} className="halfmoon-card-back animate-fade-in">
                <div className="card-back-pattern">
                  <div className="card-back-center-moon">🌙</div>
                </div>
              </div>
            );
          }

          const isCardSelected = selectedCard && selectedCard.uid === card.uid;

          return (
            <div key={card.uid} className="hand-card-slot">
              <HalfMoonCard
                card={card}
                isSelected={isCardSelected}
                isPlayable={isTurn}
                size="normal"
                onClick={() => onSelectCard(card)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
