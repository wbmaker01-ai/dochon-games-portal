// Dochon Pétanque Master How-to-Play Modal

import React from 'react';
import { X, Target, Crosshair, Sparkles } from 'lucide-react';
import './petanque.css';

export default function PetanqueHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="petanque-modal-backdrop" onClick={onClose}>
      <div
        className="petanque-modal-container animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="petanque-modal-header">
          <div className="petanque-modal-title">
            <span>🇫🇷 🎯</span>
            <span>도촌 페탕크 마스터 게임 방법</span>
          </div>
          <button
            onClick={onClose}
            className="petanque-btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="petanque-modal-body">
          
          {/* Section 1: Pétanque Core Rule */}
          <div className="petanque-info-card">
            <div className="petanque-info-title" style={{ color: '#fbbf24' }}>
              <Target className="w-4 h-4 text-amber-400" />
              <span>1. 페탕크 기본 룰</span>
            </div>
            <p className="petanque-info-desc">
              목표 공인 <strong style={{ color: '#fde047' }}>⭐ 뷔슈(Cochonnet)</strong>에 내 쇠구슬(도촌 청팀 🔵)을 상대(AI 백팀 🔴)보다 더 가깝게 붙여 점수를 획득하는 프랑스 전통 레저 스포츠입니다!
            </p>
          </div>

          {/* Section 2: 2 Tactical Shot Types */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="petanque-info-card" style={{ background: 'rgba(30, 58, 138, 0.35)', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
              <div className="petanque-info-title" style={{ color: '#93c5fd' }}>
                <span>🎯</span>
                <span>포앵테 (Point / 롤링)</span>
              </div>
              <p className="petanque-info-desc">
                낮은 탄도로 부드럽게 굴려 목표 공 바로 앞에 붙이는 정밀 투구 기술입니다. 수비에 유리합니다!
              </p>
            </div>

            <div className="petanque-info-card" style={{ background: 'rgba(136, 19, 55, 0.35)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <div className="petanque-info-title" style={{ color: '#fca5a5' }}>
                <span>💥</span>
                <span>티레 (Tirer / 타격)</span>
              </div>
              <p className="petanque-info-desc">
                높은 포물선으로 날아가 뷔슈에 가까운 상대 공을 직접 때려 튕겨내는 강력한 공격 기술입니다!
              </p>
            </div>
          </div>

          {/* Section 3: Match & Controls */}
          <div className="petanque-info-card">
            <div className="petanque-info-title" style={{ color: '#34d399' }}>
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span>3. 조작 방법 & 엔드 진행</span>
            </div>
            <ul className="petanque-info-desc" style={{ paddingLeft: '18px', listStyleType: 'disc' }}>
              <li>
                <strong style={{ color: '#ffffff' }}>각도 조절:</strong> 하단 ◀ / ▶ 버튼 또는 방향키(← / →) / <kbd style={{ padding: '1px 5px', background: '#334155', borderRadius: '4px', color: '#93c5fd', fontFamily: 'monospace' }}>A / D</kbd>
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>파워 조절:</strong> 하단 ➖ / ➕ 버튼 또는 방향키(↑ / ↓) / <kbd style={{ padding: '1px 5px', background: '#334155', borderRadius: '4px', color: '#93c5fd', fontFamily: 'monospace' }}>W / S</kbd>
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>투구 발사:</strong> <kbd style={{ padding: '2px 6px', background: '#334155', borderRadius: '4px', color: '#fbbf24', fontFamily: 'monospace' }}>Space / Enter / 터치</kbd> 홀드로 파워 충전 후 릴리즈
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>전술 샷 전환:</strong> <kbd style={{ padding: '1px 5px', background: '#334155', borderRadius: '4px', color: '#fde047', fontFamily: 'monospace' }}>1 (포앵테)</kbd> / <kbd style={{ padding: '1px 5px', background: '#334155', borderRadius: '4px', color: '#fca5a5', fontFamily: 'monospace' }}>2 (티레)</kbd>
              </li>
              <li>
                <strong style={{ color: '#ffffff' }}>경기 구성 & 득점:</strong> 총 3엔드 진행, 뷔슈에 더 가까운 승리팀 구슬 개수만큼 득점!
              </li>
            </ul>
          </div>

          {/* Section 4: Bonus Points */}
          <div className="petanque-info-card" style={{ background: 'rgba(120, 53, 15, 0.3)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles className="w-5 h-5 text-amber-400" style={{ flexShrink: 0 }} />
              <div className="petanque-info-desc">
                <strong style={{ color: '#fef08a' }}>고득점 비결:</strong> 뷔슈 20cm 이내 안착(불스아이 +200점), 티레 상대 공 직접 명중(+180점), 3구 전승 스윕(+300점) 보너스를 노려보세요!
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="petanque-modal-footer">
          <button
            onClick={onClose}
            className="petanque-btn-primary"
            style={{ marginBottom: 0 }}
          >
            이해했습니다! 경기 시작 🚀
          </button>
        </div>

      </div>
    </div>
  );
}
