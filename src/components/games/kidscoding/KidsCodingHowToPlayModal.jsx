import React from 'react';
import { BLOCK_INFO, BLOCK_TYPE } from './kidsCodingConstants';
import { X, Trophy, Sparkles, HelpCircle, Compass, Zap, Repeat, ArrowRight, Star } from 'lucide-react';

export default function KidsCodingHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="kc-modal-overlay" onClick={onClose}>
      <div className="kc-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="kc-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🐰</span>
            <div>
              <h2 className="kc-modal-title">도촌 코딩 토끼 게임 방법</h2>
              <p className="kc-modal-subtitle">블록 코딩으로 당근을 수확하는 컴퓨팅 사고력 가이드</p>
            </div>
          </div>
          <button onClick={onClose} className="kc-modal-close" title="닫기">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body Content */}
        <div className="kc-modal-body">
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
            <span><strong>모바일/태블릿 팁:</strong> 블록을 탭하여 작업 영역에 추가하고, 루프 블록 안에 쏙 넣거나 숫자를 조절해보세요!</span>
          </div>

          {/* Section 1: Core Goal */}
          <div className="kc-guide-section">
            <h3 className="kc-section-title">
              <Compass style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
              게임 목표 및 진행 방식
            </h3>
            <div className="kc-guide-box">
              <p>
                귀여운 토끼가 밭에 놓인 <strong>모든 당근(🥕)을 남김없이 수확</strong>할 수 있도록 명령어 블록을 조립하세요!
                조립을 마친 후 <strong>실행(▶️)</strong> 버튼을 누르면 토끼가 조립한 순서대로 움직이며 당근을 쏙쏙 뽑아 먹습니다.
              </p>
            </div>
          </div>

          {/* Section 2: Coding Blocks Encyclopedia */}
          <div className="kc-guide-section">
            <h3 className="kc-section-title">
              <Zap style={{ width: '16px', height: '16px', color: '#FBBF24' }} />
              코딩 명령어 블록 종류
            </h3>
            <div className="kc-blocks-grid">
              {Object.values(BLOCK_INFO).map((block) => (
                <div
                  key={block.id}
                  className="kc-block-card"
                  style={{ borderLeft: `4px solid ${block.color}` }}
                >
                  <div className="kc-block-card-header">
                    <span className="kc-block-badge" style={{ backgroundColor: block.color }}>
                      {block.symbol} {block.name}
                    </span>
                  </div>
                  <p className="kc-block-desc">{block.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Loop Mastery & 3-Star Rating */}
          <div className="kc-guide-section">
            <h3 className="kc-section-title">
              <Star style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              최적화(Shortest Code)와 별 3개(⭐️⭐️⭐️) 획득 팁
            </h3>
            <div className="kc-guide-box">
              <ul className="kc-tips-list">
                <li>
                  <strong>반복 패턴 분석:</strong> 똑같은 동작이 여러 번 반복될 때는 <code>반복하기(🔁)</code> 블록을 적극 활용하세요.
                </li>
                <li>
                  <strong>최소 블록 메달 획득:</strong> 스테이지별 목표 최적 블록 수(Target Blocks) 이하로 해결하면 <strong>대량의 최적화 보너스 점수</strong>를 획득합니다.
                </li>
                <li>
                  <strong>단계별 디버깅:</strong> 어디서 잘못되었는지 헷갈릴 때는 <strong>한 단계씩 실행(⏭️)</strong> 버튼을 눌러 토끼의 움직임을 천천히 확인하세요!
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Hall of Fame */}
          <div className="kc-guide-section">
            <h3 className="kc-section-title">
              <Trophy style={{ width: '16px', height: '16px', color: '#34D399' }} />
              도촌초등학교 명예의 전당 점수 등록
            </h3>
            <div className="kc-guide-box">
              <p>
                모든 스테이지를 통과하거나 게임 종료 시 획득 점수가 <strong>100점을 초과</strong>하면,
                이름을 입력하여 실시간 도촌초등학교 랭킹에 자랑스럽게 이름을 올릴 수 있습니다!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="kc-modal-footer">
          <button onClick={onClose} className="kc-btn-primary">
            이해했어요, 코딩 시작하기! 🥕
          </button>
        </div>
      </div>
    </div>
  );
}
