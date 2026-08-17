import React from 'react';
import { BRICK_TYPES, POWERUP_TYPES } from './brickBreakerConstants';
import { X, Trophy, Sparkles, HelpCircle, Shield, Zap, Flame, Compass } from 'lucide-react';

export default function BrickBreakerHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="bb-modal-overlay" onClick={onClose}>
      <div className="bb-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🧱</span>
            <div>
              <h2 className="bb-modal-title">도촌 벽돌 격파왕 게임 방법</h2>
              <p className="bb-modal-subtitle">클래식 아케이드 블록 격파 가이드 & 아이템 도감</p>
            </div>
          </div>
          <button onClick={onClose} className="bb-modal-close" title="닫기">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body Content */}
        <div className="bb-modal-body">
          {/* 📱 Mobile Landscape Tip */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FEF3C7',
            fontSize: '0.78rem'
          }}>
            <span style={{ fontSize: '1.1rem' }}>📱</span>
            <span><strong>모바일 이용 팁:</strong> 핸드폰이나 태블릿으로 이용 시 화면을 가로(가로모드)로 돌려 이용해주세요!</span>
          </div>

          {/* Section 1: Core Goal */}
          <div className="bb-guide-section">
            <h3 className="bb-section-title">
              <Compass style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
              게임 목표 및 핵심 규칙
            </h3>
            <div className="bb-guide-box">
              <p>
                하단의 패들을 조작하여 공을 위로 튕겨 올려 상단의 모든 벽돌을 파괴하세요!
                모든 벽돌을 깨뜨리면 다음 스테이지로 진입하며, 공이 바닥으로 떨어지면 라이프(목숨)가 1개 차감됩니다.
              </p>
            </div>
          </div>

          {/* Section 2: Controls */}
          <div className="bb-guide-section">
            <h3 className="bb-section-title">
              <Zap style={{ width: '16px', height: '16px', color: '#FBBF24' }} />
              조작법 (PC & 모바일)
            </h3>
            <div className="bb-controls-grid">
              <div className="bb-control-card">
                <span className="bb-control-badge">PC 키보드 & 마우스</span>
                <ul>
                  <li><strong>마우스 이동</strong>: 패들을 마우스 커서 위치로 즉시 이동</li>
                  <li><strong>좌우 방향키(← / →)</strong> 또는 <strong>A / D</strong>: 패들 정밀 이동</li>
                  <li><strong>스페이스바(Space)</strong>: 공 발사 및 레이저 빔 연사</li>
                </ul>
              </div>
              <div className="bb-control-card">
                <span className="bb-control-badge">모바일 & 태블릿</span>
                <ul>
                  <li><strong>캔버스 터치 드래그</strong>: 손가락 위치로 패들 직관적 이동</li>
                  <li><strong>온스크린 방향키 버튼</strong>: 탭 및 꾹 누르기로 연속 이동</li>
                  <li><strong>[공 발사 / 레이저] 버튼</strong>: 시작 시 공 발사 및 레이저 사격</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Special Bricks Encyclopedia */}
          <div className="bb-guide-section">
            <h3 className="bb-section-title">
              <Sparkles style={{ width: '16px', height: '16px', color: '#A855F7' }} />
              특수 벽돌 도감
            </h3>
            <div className="bb-encyclopedia-grid">
              <div className="bb-enc-item">
                <div className="bb-brick-preview" style={{ background: '#38BDF8', borderColor: '#0284C7' }}>일반</div>
                <div className="bb-enc-info">
                  <strong>기본/컬러 벽돌</strong>
                  <span>공으로 1회 타격 시 부서지며 점수를 획득합니다.</span>
                </div>
              </div>
              <div className="bb-enc-item">
                <div className="bb-brick-preview" style={{ background: '#A855F7', borderColor: '#7E22CE' }}>2~3HP</div>
                <div className="bb-enc-info">
                  <strong>강화 & 철갑 벽돌</strong>
                  <span>여러 번 타격해야 부서지며 타격 시 금이 갑니다.</span>
                </div>
              </div>
              <div className="bb-enc-item">
                <div className="bb-brick-preview" style={{ background: '#EF4444', borderColor: '#B91C1C' }}>💣</div>
                <div className="bb-enc-info">
                  <strong>폭탄 벽돌</strong>
                  <span>타격 시 주변 3x3 범위의 모든 벽돌을 연쇄 폭파합니다.</span>
                </div>
              </div>
              <div className="bb-enc-item">
                <div className="bb-brick-preview" style={{ background: '#FDE047', borderColor: '#CA8A04', color: '#000' }}>⭐</div>
                <div className="bb-enc-info">
                  <strong>스타 보너스</strong>
                  <span>격파 시 100점의 대량 보너스 점수를 제공합니다.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Power-Up Items */}
          <div className="bb-guide-section">
            <h3 className="bb-section-title">
              <Flame style={{ width: '16px', height: '16px', color: '#EF4444' }} />
              파워업 캡슐 아이템 7종
            </h3>
            <div className="bb-items-list">
              {Object.values(POWERUP_TYPES).map(item => (
                <div key={item.id} className="bb-powerup-row">
                  <div className="bb-powerup-icon" style={{ borderColor: item.color, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="bb-powerup-text">
                    <strong>{item.name}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Honor of School Leaderboard */}
          <div className="bb-guide-section">
            <h3 className="bb-section-title">
              <Trophy style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              도촌초 명예의 전당 랭킹 등록
            </h3>
            <div className="bb-guide-box bb-highlight-box">
              <p>
                게임 종료 후 <strong>100점을 초과 달성</strong>하면 도촌초등학교 실시간 명예의 전당에 본인의 이름을 남길 수 있습니다.
                높은 콤보와 스테이지 클리어로 전교 1위에 도전해보세요!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="bb-modal-footer">
          <button onClick={onClose} className="bb-btn-confirm">
            확인 및 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
