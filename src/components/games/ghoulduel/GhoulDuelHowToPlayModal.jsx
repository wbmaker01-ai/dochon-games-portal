import React from 'react';
import { X, Sparkles, Zap, Shield, Flame, Trophy, Play } from 'lucide-react';

export default function GhoulDuelHowToPlayModal({ isOpen, onClose, onStartGame }) {
  if (!isOpen) return null;

  return (
    <div className="ghoulduel-modal-overlay" onClick={onClose}>
      <div className="ghoulduel-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ghoulduel-modal-header">
          <div className="header-title-box">
            <span className="title-emoji">👻</span>
            <div>
              <h3 className="modal-title">도촌 영혼 대결 완벽 가이드</h3>
              <p className="modal-subtitle">초록팀 vs 보라팀 4:4 실시간 꼬리 뺏기 대전!</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ghoulduel-modal-body">
          {/* Section 1: Core Rules */}
          <div className="guide-card hero-guide">
            <div className="guide-icon-badge green-glow">
              <Flame size={24} className="text-emerald-400" />
            </div>
            <div className="guide-content">
              <h4>1. 영혼 불꽃 모으기 & 기지 반납</h4>
              <p>
                대저택 곳곳에 떠다니는 <strong>영혼 불꽃</strong>을 모으면 유령 뒤에 긴 꼬리로 이어집니다.
                꼬리에 달린 영혼을 <strong>자신의 팀 기지(좌측 상단 초록 / 우측 하단 보라)</strong>로 안전하게 가져와야 우리 팀 점수가 됩니다!
              </p>
            </div>
          </div>

          {/* Section 2: Tail Steal */}
          <div className="guide-card hero-guide">
            <div className="guide-icon-badge purple-glow">
              <Zap size={24} className="text-purple-400" />
            </div>
            <div className="guide-content">
              <h4>2. 짜릿한 꼬리 가로채기 (Steal!)</h4>
              <p>
                상대 팀 유령의 <strong>긴 꼬리 부분을 내 몸으로 들이받아 가로채면</strong>, 상대가 모아둔 영혼 꼬리를 싹둑 끊어 내 것으로 빼앗을 수 있습니다!
              </p>
            </div>
          </div>

          {/* Section 3: Powerups */}
          <div className="guide-card">
            <div className="guide-icon-badge gold-glow">
              <Sparkles size={24} className="text-amber-400" />
            </div>
            <div className="guide-content">
              <h4>3. 맵에 나타나는 3대 마법 파워업</h4>
              <div className="powerup-grid">
                <div className="powerup-item">
                  <span className="powerup-icon">⚡</span>
                  <div>
                    <strong>질주 부스트</strong>
                    <span>이동 속도 45% 초고속 질주</span>
                  </div>
                </div>
                <div className="powerup-item">
                  <span className="powerup-icon">👻</span>
                  <div>
                    <strong>벽 통과 (유령화)</strong>
                    <span>모든 벽과 장애물을 뚫고 이동</span>
                  </div>
                </div>
                <div className="powerup-item">
                  <span className="powerup-icon">🧲</span>
                  <div>
                    <strong>영혼 자석</strong>
                    <span>주변 영혼 불꽃을 멀리서도 흡수</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Controls */}
          <div className="guide-card controls-guide">
            <div className="guide-icon-badge blue-glow">
              <Shield size={24} className="text-blue-400" />
            </div>
            <div className="guide-content">
              <h4>4. 조작 방법</h4>
              <p>
                • <strong>PC 키보드</strong>: 방향키 <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> 또는 <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd><br />
                • <strong>스마트폰 / 태블릿</strong>: 화면 하단 가상 조이스틱 터치 드래그
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ghoulduel-modal-footer">
          <button className="ghoulduel-start-btn" onClick={() => { onClose(); if (onStartGame) onStartGame(); }}>
            <Play size={18} fill="currentColor" />
            <span>지금 바로 대결 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
