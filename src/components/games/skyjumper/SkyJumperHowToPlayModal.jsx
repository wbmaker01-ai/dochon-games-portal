import React from 'react';
import { PLATFORM_TYPES, ITEM_TYPES, MONSTER_TYPES } from './skyJumperConstants';
import { X, HelpCircle, ArrowLeftRight, Crosshair, Zap, Shield, Sparkles, Orbit } from 'lucide-react';

export default function SkyJumperHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="sj-modal-backdrop" onClick={onClose}>
      <div className="sj-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sj-modal-header">
          <div className="sj-modal-title-group">
            <HelpCircle className="sj-modal-icon" />
            <h2 className="sj-modal-title">도촌 스카이 점퍼 게임 가이드</h2>
          </div>
          <button onClick={onClose} className="sj-modal-close-btn" title="닫기">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sj-modal-body">
          {/* 1. Basic Controls & Goal */}
          <div className="sj-guide-section">
            <h3 className="sj-guide-heading">🕹️ 게임 목표 및 기본 조작</h3>
            <p className="sj-guide-desc">
              하늘 위로 끝없이 솟아있는 발판을 밟고 우주 끝까지 최고 고도에 도전하세요!
              화면 왼쪽/오른쪽 끝으로 이동하면 반대편으로 통과하는 <strong>화면 랩어라운드(순간이동)</strong>가 가능합니다.
            </p>
            <div className="sj-controls-grid">
              <div className="sj-ctrl-item">
                <span className="sj-ctrl-key">⬅️ / ➡️ 또는 A / D</span>
                <span className="sj-ctrl-desc">좌 / 우 이동 (마우스/터치 드래그 지원)</span>
              </div>
              <div className="sj-ctrl-item">
                <span className="sj-ctrl-key">Space / 터치 슈팅 버튼</span>
                <span className="sj-ctrl-desc">공중을 향해 콩알탄 발사 (몬스터 격파)</span>
              </div>
            </div>
          </div>

          {/* 2. Platform Types */}
          <div className="sj-guide-section">
            <h3 className="sj-guide-heading">🪜 6종 발판 기믹 도감</h3>
            <div className="sj-items-grid">
              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#22C55E' }}>초록</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.REGULAR.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.REGULAR.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#0EA5E9' }}>파랑</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.MOVING.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.MOVING.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#B45309' }}>갈색</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.BROKEN.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.BROKEN.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#A855F7' }}>보라</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.DISAPPEARING.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.DISAPPEARING.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#64748B' }}>구름</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.CLOUD.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.CLOUD.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-badge" style={{ backgroundColor: '#F97316' }}>주황</div>
                <div>
                  <div className="sj-item-name">{PLATFORM_TYPES.VERTICAL.name}</div>
                  <div className="sj-item-desc">{PLATFORM_TYPES.VERTICAL.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Items & Powerups */}
          <div className="sj-guide-section">
            <h3 className="sj-guide-heading">✨ 파워업 & 특수 아이템</h3>
            <div className="sj-items-grid">
              {Object.values(ITEM_TYPES).map(item => (
                <div key={item.id} className="sj-item-card">
                  <div className="sj-item-icon">{item.icon}</div>
                  <div>
                    <div className="sj-item-name">{item.name}</div>
                    <div className="sj-item-desc">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Monsters & Obstacles */}
          <div className="sj-guide-section">
            <h3 className="sj-guide-heading">👾 몬스터 & 위험 요소</h3>
            <div className="sj-items-grid">
              <div className="sj-item-card">
                <div className="sj-item-icon">{MONSTER_TYPES.FLYING.icon}</div>
                <div>
                  <div className="sj-item-name">{MONSTER_TYPES.FLYING.name} (+300점)</div>
                  <div className="sj-item-desc">{MONSTER_TYPES.FLYING.description}</div>
                </div>
              </div>

              <div className="sj-item-card">
                <div className="sj-item-icon">{MONSTER_TYPES.BLACK_HOLE.icon}</div>
                <div>
                  <div className="sj-item-name">{MONSTER_TYPES.BLACK_HOLE.name} (위험!)</div>
                  <div className="sj-item-desc">{MONSTER_TYPES.BLACK_HOLE.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Altitudes */}
          <div className="sj-guide-section">
            <h3 className="sj-guide-heading">🌌 고도별 4단계 배경 테마</h3>
            <ul className="sj-altitude-list">
              <li><strong>0 ~ 2,000m:</strong> 🌤️ 맑고 푸른 도촌의 하늘과 뭉게구름</li>
              <li><strong>2,000 ~ 5,000m:</strong> 🌇 환상적인 핑크빛 석양 노을</li>
              <li><strong>5,000 ~ 10,000m:</strong> 🌌 신비로운 밤하늘과 오로라</li>
              <li><strong>10,000m 이상:</strong> 🚀 광활한 우주 은하수와 별무리 & 별똥별</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sj-modal-footer">
          <button onClick={onClose} className="sj-btn-primary" style={{ width: '100%' }}>
            확인 및 게임 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
