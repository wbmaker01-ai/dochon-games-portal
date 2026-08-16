import React from 'react';
import { X, Target, Sparkles, Zap, Award, CheckCircle2 } from 'lucide-react';
import { GNOME_CHARACTERS, TERRAIN_ITEM_TYPES } from './gnomeConstants';

export default function GnomeHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="gnome-modal-overlay" onClick={onClose}>
      <div className="gnome-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gnome-modal-header">
          <div className="gnome-modal-title-box">
            <div className="gnome-modal-icon-wrap">
              <span style={{ fontSize: '24px' }}>🌿</span>
            </div>
            <div>
              <h2 className="gnome-modal-title">도촌 정원 요정 플레이 가이드</h2>
              <p className="gnome-modal-subtitle">투석기로 요정을 날려 가장 멀리 비행하고 정원에 꽃을 심어보세요!</p>
            </div>
          </div>
          <button className="gnome-modal-close-btn" onClick={onClose} title="가이드 닫기">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="gnome-modal-body">
          {/* Section 1: Launch & Flight Controls */}
          <div className="gnome-guide-section">
            <h3 className="gnome-guide-heading">
              <Target style={{ width: '18px', height: '18px', color: '#ecc94b' }} />
              <span>1. 원버튼 조작 및 2단계 발사법</span>
            </h3>
            <div className="gnome-guide-grid">
              <div className="gnome-guide-card">
                <div className="gnome-guide-card-icon">📐</div>
                <div className="gnome-guide-card-text">
                  <strong>1단계: 발사 각도 결정</strong>
                  <p>위아래로 오르내리는 화살표 게이지가 약 <strong>45°~55° 황금 각도</strong>일 때 클릭(스페이스바)하세요!</p>
                </div>
              </div>
              <div className="gnome-guide-card">
                <div className="gnome-guide-card-icon">⚡</div>
                <div className="gnome-guide-card-text">
                  <strong>2단계: 파워 미터 결정</strong>
                  <p>파워 게이지가 오른쪽 끝 <strong>PERFECT 구간(95% 이상)</strong>에 도달했을 때 누르면 무지개 부스트 발사!</p>
                </div>
              </div>
              <div className="gnome-guide-card" style={{ gridColumn: '1 / -1' }}>
                <div className="gnome-guide-card-icon">⬇️</div>
                <div className="gnome-guide-card-text">
                  <strong>3단계: 공중 급강하 & 바운스 (Air Drop)</strong>
                  <p>비행 중 화면을 클릭하거나 <kbd>Spacebar</kbd>를 누르면 요정이 <strong>급강하</strong>합니다. 버섯이나 통나무 바로 위에서 내리찍으면 폭발적으로 튕겨 오릅니다!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 3 Gnome Characters */}
          <div className="gnome-guide-section">
            <h3 className="gnome-guide-heading">
              <Sparkles style={{ width: '18px', height: '18px', color: '#48bb78' }} />
              <span>2. 3종 요정 캐릭터 특성</span>
            </h3>
            <div className="gnome-characters-guide-grid">
              {GNOME_CHARACTERS.map((char) => (
                <div key={char.id} className="gnome-char-guide-card">
                  <div className="gnome-char-guide-head">
                    <span className="gnome-char-guide-avatar">{char.avatarBadge}</span>
                    <div>
                      <h4 className="gnome-char-guide-name">{char.name}</h4>
                      <span className="gnome-char-guide-sub" style={{ color: char.hatColor }}>{char.subtitle}</span>
                    </div>
                  </div>
                  <p className="gnome-char-guide-desc">{char.description}</p>
                  <div className="gnome-char-guide-stats">
                    <div className="stat-bar-row">
                      <span>파워</span>
                      <div className="stat-track"><div className="stat-fill" style={{ width: `${char.stats.power}%`, background: '#f56565' }}></div></div>
                    </div>
                    <div className="stat-bar-row">
                      <span>탄성</span>
                      <div className="stat-track"><div className="stat-fill" style={{ width: `${char.stats.bounce}%`, background: '#ecc94b' }}></div></div>
                    </div>
                    <div className="stat-bar-row">
                      <span>활공</span>
                      <div className="stat-track"><div className="stat-fill" style={{ width: `${char.stats.glide}%`, background: '#48bb78' }}></div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Interactive Terrain Items */}
          <div className="gnome-guide-section">
            <h3 className="gnome-guide-heading">
              <Zap style={{ width: '18px', height: '18px', color: '#9f7aea' }} />
              <span>3. 정원 지형지물 & 부스터 아이템</span>
            </h3>
            <div className="gnome-items-guide-table">
              {Object.values(TERRAIN_ITEM_TYPES).map((item) => (
                <div key={item.id} className="gnome-item-row">
                  <div className="gnome-item-badge">
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <strong style={{ color: item.color }}>{item.name}</strong>
                  </div>
                  <span className="gnome-item-effect">{item.message} (+{item.points}점)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Pro Tips */}
          <div className="gnome-guide-section">
            <h3 className="gnome-guide-heading">
              <Award style={{ width: '18px', height: '18px', color: '#ed8936' }} />
              <span>4. 고득점 달성 꿀팁</span>
            </h3>
            <ul className="gnome-tips-list">
              <li>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#48bb78', flexShrink: 0 }} />
                <span><strong>버섯 타이밍 맞추기</strong>: 요정이 버섯 바로 위(1~2m)에 도달했을 때 급강하를 누르면 최대 탄성 보너스를 받습니다.</span>
              </li>
              <li>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#48bb78', flexShrink: 0 }} />
                <span><strong>통나무 연속 가속</strong>: 가속 통나무를 연속으로 밟으면 시속 100km가 넘는 초고속 비행이 가능합니다.</span>
              </li>
              <li>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#48bb78', flexShrink: 0 }} />
                <span><strong>꽃 심기 보너스</strong>: 요정이 잔디에 닿을 때마다 자동으로 꽃이 심어지며, 총 비행 거리와 함께 최종 점수에 반영됩니다!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="gnome-modal-footer">
          <button className="gnome-confirm-btn" onClick={onClose}>
            준비 완료! 정원으로 출발 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
