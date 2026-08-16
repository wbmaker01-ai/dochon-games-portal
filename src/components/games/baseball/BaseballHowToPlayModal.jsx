import React from 'react';
import { X, Trophy, Sparkles, Flame, Target, Zap, Shield, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function BaseballHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="baseball-modal-overlay" onClick={onClose}>
      <div className="baseball-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="baseball-modal-header">
          <div className="baseball-modal-title-box">
            <div className="baseball-modal-icon-wrap">
              <span style={{ fontSize: '24px' }}>⚾</span>
            </div>
            <div>
              <h2 className="baseball-modal-title">도촌 야구왕 플레이 가이드</h2>
              <p className="baseball-modal-subtitle">홈런왕이 되어 도촌초 명예의 전당에 이름을 새겨보세요!</p>
            </div>
          </div>
          <button className="baseball-modal-close-btn" onClick={onClose} title="가이드 닫기">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="baseball-modal-body">
          {/* Section 1: Controls */}
          <div className="baseball-guide-section">
            <h3 className="baseball-guide-heading">
              <Target style={{ width: '18px', height: '18px', color: '#FBBF24' }} />
              <span>1. 초간단 원버튼 조작법</span>
            </h3>
            <div className="baseball-guide-grid">
              <div className="baseball-guide-card">
                <div className="baseball-guide-card-icon">⌨️</div>
                <div className="baseball-guide-card-text">
                  <strong>PC 키보드</strong>
                  <p><kbd>Spacebar</kbd> 또는 <kbd>Enter</kbd> 키를 눌러 스윙</p>
                </div>
              </div>
              <div className="baseball-guide-card">
                <div className="baseball-guide-card-icon">🖱️ / 📱</div>
                <div className="baseball-guide-card-text">
                  <strong>마우스 & 모바일 터치</strong>
                  <p>화면 아무 곳이나 <strong>클릭</strong> 또는 <strong>터치</strong>하면 배트 스윙!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Timing & Hits */}
          <div className="baseball-guide-section">
            <h3 className="baseball-guide-heading">
              <Sparkles style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
              <span>2. 타격 타이밍과 판정 등급</span>
            </h3>
            <div className="baseball-timing-table">
              <div className="timing-row homerun-row">
                <span className="timing-badge">PERFECT</span>
                <span className="timing-desc">정타 완벽 타이밍! 경기장 밖으로 날아가는 <strong>초대형 홈런</strong> (주자 모두 득점!)</span>
              </div>
              <div className="timing-row great-row">
                <span className="timing-badge">GREAT</span>
                <span className="timing-desc">펜스를 직격하는 시원한 <strong>2루타 & 3루타</strong> 장타!</span>
              </div>
              <div className="timing-row good-row">
                <span className="timing-badge">GOOD</span>
                <span className="timing-desc">내야를 가르는 깨끗한 <strong>1루타 안타</strong>로 주자 진루!</span>
              </div>
              <div className="timing-row foul-row">
                <span className="timing-badge">FOUL</span>
                <span className="timing-desc">살짝 빠르거나 늦으면 파울 라인 밖으로 벗어납니다.</span>
              </div>
              <div className="timing-row strike-row">
                <span className="timing-badge">STRIKE</span>
                <span className="timing-desc">타이밍을 크게 놓치거나 헛스윙 시 스트라이크! (3스트라이크 = 1아웃)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Pitch Types */}
          <div className="baseball-guide-section">
            <h3 className="baseball-guide-heading">
              <Zap style={{ width: '18px', height: '18px', color: '#A855F7' }} />
              <span>3. 투수의 다양한 마구와 변화구</span>
            </h3>
            <p className="baseball-guide-p">점수가 높아질수록 투수가 던지는 구종이 점점 다양해집니다!</p>
            <div className="pitch-types-grid">
              <div className="pitch-card">
                <span className="pitch-badge fastball">직구</span>
                <span>정직하고 일정한 속도로 곧게 날아오는 기본구</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge slowball">아리랑볼</span>
                <span>높은 포물선을 그리며 천천히 떨어지는 느린 공</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge changeup">체인지업</span>
                <span>타석 바로 앞에서 갑자기 속도가 뚝 떨어지는 변화구</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge curve">커브볼</span>
                <span>좌우로 크게 활처럼 휘어 들어오는 공</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge sinker">싱커</span>
                <span>홈플레이트 앞에서 바닥 쪽으로 급강하하는 공</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge zigzag">지그재그 마구</span>
                <span>번개처럼 좌우로 지그재그 꺾여 날아오는 고난도 마구</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge ghost">유령 마구</span>
                <span>공중에서 투명해졌다가 타석 앞에서 다시 나타나는 마구!</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge fireball">불꽃 광속구</span>
                <span>엄청난 속도로 불꽃을 뿜으며 꽂히는 최고속 마구</span>
              </div>
            </div>
          </div>

          {/* Section 4: Rules & High Scoring Tips */}
          <div className="baseball-guide-section">
            <h3 className="baseball-guide-heading">
              <Flame style={{ width: '18px', height: '18px', color: '#F43F5E' }} />
              <span>4. 고득점 꿀팁 & 명예의 전당 등록</span>
            </h3>
            <div className="baseball-tips-box">
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>만루 찬스를 노리세요:</strong> 1, 2, 3루 주자가 꽉 찼을 때 홈런을 치면 <strong>그랜드 슬램(만루홈런) 대량 득점</strong>이 터집니다!</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>연속 안타 콤보 (🔥 Combo):</strong> 아웃 없이 연속으로 안타를 칠 때마다 콤보 배율이 붙어 점수가 폭발합니다.</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>3아웃 룰:</strong> 3번 아웃되면 경기가 종료됩니다. 신중하게 공의 궤적을 끝까지 보고 휘두르세요!</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>명예의 전당 등록:</strong> 최종 점수가 <strong>100점을 초과</strong>하면 도촌초 실시간 랭킹에 이름을 남길 수 있습니다!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="baseball-modal-footer">
          <button className="baseball-start-btn" onClick={onClose}>
            <span>타석에 들어서기! (게임 시작)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
