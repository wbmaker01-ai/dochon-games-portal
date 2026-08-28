// Dochon Games Portal - Snowball Survival How To Play Modal Guide

import React from 'react';
import { X, Sparkles, Trophy, ShieldAlert, Zap, Compass } from 'lucide-react';

export default function SnowballHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="snowball-modal-overlay" onClick={onClose}>
      <div className="snowball-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="snowball-modal-header">
          <div className="snowball-modal-title">
            <span className="snowball-title-icon">☃️</span>
            <h2>도촌 눈싸움 서바이벌 게임 가이드</h2>
          </div>
          <button className="snowball-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="snowball-modal-body">
          {/* Mission Banner */}
          <div className="snowball-guide-banner">
            <Trophy className="guide-trophy-icon" size={24} />
            <div>
              <h3>게임 목표: 얼음섬 최후의 1인이 되어라!</h3>
              <p>눈덩이를 굴려 거대하게 키운 뒤 상대를 링 밖 바다로 날려버리세요!</p>
            </div>
          </div>

          {/* Section 1: Controls */}
          <div className="snowball-guide-section">
            <h4>🎮 조작 방법 (PC & 모바일)</h4>
            <div className="snowball-controls-grid">
              <div className="control-item">
                <span className="control-badge">PC 마우스</span>
                <p>마우스 드래그로 이동 & 조준, <strong>마우스 클릭을 떼면</strong> 거대 눈덩이 발사!</p>
              </div>
              <div className="control-item">
                <span className="control-badge">PC 키보드</span>
                <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 또는 방향키로 이동, <kbd>Space</kbd>로 눈덩이 발사!</p>
              </div>
              <div className="control-item">
                <span className="control-badge">모바일/태블릿</span>
                <p>화면 왼쪽 <strong>가상 조이스틱</strong>으로 이동, 오른쪽 <strong>눈덩이 발사</strong> 버튼 터치!</p>
              </div>
            </div>
          </div>

          {/* Section 2: Core Mechanics */}
          <div className="snowball-guide-section">
            <h4>❄️ 눈싸움 승리 전략 & 팁</h4>
            <div className="snowball-tips-list">
              <div className="tip-card">
                <div className="tip-icon">🌀</div>
                <div className="tip-content">
                  <strong>눈덩이 굴리기 & 성장</strong>
                  <p>눈밭을 달릴수록 전방에 눈덩이가 점점 거대해집니다. 눈덩이가 커질수록 무게 때문에 이동 속도는 살짝 느려지지만, 맞았을 때 상대방을 한 방에 날려버릴 수 있습니다!</p>
                </div>
              </div>

              <div className="tip-card">
                <div className="tip-icon">💥</div>
                <div className="tip-content">
                  <strong>눈덩이 정면충돌 (Clash)</strong>
                  <p>날아오는 상대 눈덩이에 내 눈덩이를 맞추면 서로 상쇄되어 부서집니다! 더 큰 눈덩이가 작은 눈덩이를 파괴하고 전진합니다.</p>
                </div>
              </div>

              <div className="tip-card">
                <div className="tip-icon">⚠️</div>
                <div className="tip-content">
                  <strong>빙판 붕괴 (Shrinking Arena)</strong>
                  <p>시간이 지나면 외곽 빙판에 금이 가고 바다 밑으로 무너집니다. 외곽에 너무 오래 머무르면 눈먼 눈덩이에 맞아 링아웃될 수 있으니 중앙을 사수하세요!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Hall of Fame Rule */}
          <div className="snowball-guide-rule">
            <ShieldAlert size={18} color="#F59E0B" />
            <span>도촌초 명예의 전당 점수 등록은 <strong>100점을 초과</strong>하여 달성했을 때 등록 창이 활성화됩니다!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="snowball-modal-footer">
          <button className="snowball-btn-primary" onClick={onClose}>
            <Sparkles size={18} /> 이해했습니다! 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
