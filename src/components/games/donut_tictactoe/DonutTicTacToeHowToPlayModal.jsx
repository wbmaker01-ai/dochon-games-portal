import React from 'react';
import { X, Trophy, Sparkles, HelpCircle, Flame, RefreshCw, Star, Heart } from 'lucide-react';
import { ASSETS } from './donutTicTacToeConstants';

export default function DonutTicTacToeHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="donut-howto-overlay" onClick={onClose}>
      <div className="donut-howto-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="donut-howto-header">
          <div className="donut-howto-title-box">
            <span className="text-2xl animate-bounce">🍩</span>
            <h2>도넛 틱택토 게임 방법</h2>
          </div>
          <button className="donut-howto-close-btn" onClick={onClose} aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="donut-howto-body">
          {/* Section 1: 게임 개요 */}
          <div className="donut-howto-section">
            <div className="donut-howto-sec-title">
              <span className="donut-badge pink">1</span>
              <h3>기본 규칙 & 조작법</h3>
            </div>
            <p>
              알록달록 맛있는 도넛 말을 번갈아 격자판에 놓아 <strong>가로, 세로, 대각선 3목</strong>을 먼저 완성하는 플레이어가 승리합니다!
            </p>
            <div className="donut-howto-pieces-preview">
              <div className="donut-piece-card">
                <img src={ASSETS.PINK_DONUT} alt="핑크 딸기 도넛" />
                <span>1P (선공) : 핑크 딸기</span>
              </div>
              <span className="text-pink-400 font-black text-xl">VS</span>
              <div className="donut-piece-card">
                <img src={ASSETS.CHOCO_DONUT} alt="초코 도넛" />
                <span>2P / AI (후공) : 초코 글레이즈</span>
              </div>
            </div>
          </div>

          {/* Section 2: 2가지 플레이 모드 */}
          <div className="donut-howto-section">
            <div className="donut-howto-sec-title">
              <span className="donut-badge gold">2</span>
              <h3>2가지 흥미진진한 게임 모드</h3>
            </div>
            <div className="donut-mode-cards">
              <div className="donut-mode-box">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <span>👾</span>
                  <span>클래식 모드</span>
                </div>
                <p className="text-xs text-slate-300">
                  전통적인 3×3 틱택토 규칙! 가로 3줄, 세로 3줄, 대각선 2줄 (총 8개 승리 라인)
                </p>
              </div>

              <div className="donut-mode-box torus">
                <div className="font-bold text-pink-300 flex items-center gap-1.5 mb-1">
                  <span>🍩</span>
                  <span>도넛 토러스 모드 (추천!)</span>
                </div>
                <p className="text-xs text-slate-300">
                  판의 상하좌우가 도넛 표면처럼 연결되어 <strong>벽을 뚫고 순환하는 대각선 4개 추가!</strong> (총 12개 승리 라인) 방심하면 반대편에서 승리 라인이 완성됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 명예의 전당 점수 시스템 */}
          <div className="donut-howto-section">
            <div className="donut-howto-sec-title">
              <span className="donut-badge green">3</span>
              <h3>점수 획득 & 랭킹 등록</h3>
            </div>
            <ul className="donut-score-rules-list">
              <li>
                <span className="rule-bullet">🏆</span>
                <span><strong>난이도 보너스:</strong> 마스터(도사) 모드 승리 시 <strong>2.5배 점수 증폭</strong>!</span>
              </li>
              <li>
                <span className="rule-bullet">🔥</span>
                <span><strong>연승 콤보(Streak):</strong> 연속으로 승리할수록 추가 콤보 점수 누적!</span>
              </li>
              <li>
                <span className="rule-bullet">⚡</span>
                <span><strong>속전속결 보너스:</strong> 남은 빈 칸이 많을 때 빠르게 이길수록 고득점!</span>
              </li>
              <li>
                <span className="rule-bullet">🎖️</span>
                <span><strong>100점 초과 시</strong> 도촌초 <strong>'명예의 전당'</strong>에 이름을 올릴 수 있습니다!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="donut-howto-footer">
          <button className="donut-howto-ok-btn" onClick={onClose}>
            <Sparkles className="w-4 h-4 mr-1.5 inline" />
            이해했어요! 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
