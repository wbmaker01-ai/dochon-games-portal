import React from 'react';
import { X, Trophy, Sparkles, Flame, Target, Zap, Shield, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function CricketHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="cricket-modal-overlay" onClick={onClose}>
      <div className="cricket-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cricket-modal-header">
          <div className="cricket-modal-title-box">
            <div className="cricket-modal-icon-wrap">
              <span style={{ fontSize: '24px' }}>🏏</span>
            </div>
            <div>
              <h2 className="cricket-modal-title">도촌 크리켓 플레이 가이드</h2>
              <p className="cricket-modal-subtitle">달팽이 볼러의 마구를 쳐내고 통쾌한 6점 홈런을 날려보세요!</p>
            </div>
          </div>
          <button className="cricket-modal-close-btn" onClick={onClose} title="가이드 닫기">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="cricket-modal-body">
          {/* Section 1: Controls */}
          <div className="cricket-guide-section">
            <h3 className="cricket-guide-heading">
              <Target style={{ width: '18px', height: '18px', color: '#FBBF24' }} />
              <span>1. 초간단 원버튼 조작법</span>
            </h3>
            <div className="cricket-guide-grid">
              <div className="cricket-guide-card">
                <div className="cricket-guide-card-icon">⌨️</div>
                <div className="cricket-guide-card-text">
                  <strong>PC 키보드</strong>
                  <p><kbd>Spacebar</kbd> 또는 <kbd>Enter</kbd> 키를 눌러 배트 스윙</p>
                </div>
              </div>
              <div className="cricket-guide-card">
                <div className="cricket-guide-card-icon">🖱️ / 📱</div>
                <div className="cricket-guide-card-text">
                  <strong>마우스 & 모바일 터치</strong>
                  <p>화면 아무 곳이나 <strong>클릭</strong> 또는 <strong>터치</strong>하면 배트 스윙!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Timing & Hits */}
          <div className="cricket-guide-section">
            <h3 className="cricket-guide-heading">
              <Sparkles style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
              <span>2. 타격 타이밍과 득점 규칙 (크리켓 룰)</span>
            </h3>
            <div className="cricket-timing-table">
              <div className="timing-row six-row">
                <span className="timing-badge six-badge">SIX! 6점 홈런</span>
                <span className="timing-desc">정타 완벽 타이밍! 관중석 밖으로 날아가는 <strong>대형 홈런</strong> (PERFECT)</span>
              </div>
              <div className="timing-row four-row">
                <span className="timing-badge four-badge">FOUR! 4점 바운더리</span>
                <span className="timing-desc">경기장 경계선을 뚫고 나가는 통쾌한 <strong>4점 장타</strong> (GREAT)</span>
              </div>
              <div className="timing-row two-row">
                <span className="timing-badge two-badge">2 RUNS (2점)</span>
                <span className="timing-desc">외야로 보낸 안타로 귀뚜라미 타자들이 <strong>2회 왕복 주루</strong> (GOOD)</span>
              </div>
              <div className="timing-row one-row">
                <span className="timing-badge one-badge">1 RUN (1점)</span>
                <span className="timing-desc">내야로 굴러간 공으로 <strong>1회 주루 득점</strong> (OK)</span>
              </div>
              <div className="timing-row out-row">
                <span className="timing-badge out-badge">WICKET! (아웃)</span>
                <span className="timing-desc">타이밍을 놓치거나 헛스윙하여 <strong>위켓이 쓰러지면 즉시 게임 종료!</strong></span>
              </div>
            </div>
          </div>

          {/* Section 3: Pitch Types */}
          <div className="cricket-guide-section">
            <h3 className="cricket-guide-heading">
              <Zap style={{ width: '18px', height: '18px', color: '#A855F7' }} />
              <span>3. 달팽이 볼러의 다양한 마구</span>
            </h3>
            <p className="cricket-guide-p">점수가 높아질수록 투구 속도가 빨라지며 고난도 마구가 날아옵니다!</p>
            <div className="pitch-types-grid">
              <div className="pitch-card">
                <span className="pitch-badge fastball">정통 직구</span>
                <span>바운드되어 정직하고 시원하게 솟구치는 기본 직구</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge slowball">바운드 아리랑볼</span>
                <span>지면에 닿은 후 높게 튀어 오르는 느린 완급조절 공</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge changeup">감속 체인지업</span>
                <span>빠르게 오다가 지면 바운드 순간 속도가 뚝 떨어지는 공</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge slider">스네이크 슬라이더</span>
                <span>바운드 직후 날카롭게 바깥쪽으로 휘어지는 변화구</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge googly">구글리 스핀</span>
                <span>역회전을 먹어 안쪽으로 급격히 꺾여 들어오는 스핀볼</span>
              </div>
              <div className="pitch-card">
                <span className="pitch-badge fireball">불꽃 요커</span>
                <span>엄청난 속도로 불꽃을 뿜으며 위켓 밑동을 찌르는 최고속 마구</span>
              </div>
            </div>
          </div>

          {/* Section 4: Rules & High Scoring Tips */}
          <div className="cricket-guide-section">
            <h3 className="cricket-guide-heading">
              <Flame style={{ width: '18px', height: '18px', color: '#F43F5E' }} />
              <span>4. 고득점 꿀팁 & 명예의 전당 등록</span>
            </h3>
            <div className="cricket-tips-box">
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>서든데스 단판 승부:</strong> 단 한 번이라도 위켓이 쓰러지면 바로 게임이 끝납니다! 공이 바운드되는 순간의 높이와 궤적을 끝까지 관찰하세요.</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>바운드 직후를 노리세요:</strong> 공이 땅에 튀어 오른 직후 타석에 도달할 때가 가장 정타(6점 홈런)가 터지는 황금 타이밍입니다.</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>스피드 레벨업 (⚡ SPEED Lv.1~6):</strong> 점수가 오를수록 달팽이의 투구가 점점 더 빨라집니다.</span>
              </div>
              <div className="tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>명예의 전당 등록:</strong> 최종 점수가 <strong>100점을 초과</strong>하면 도촌초 실시간 랭킹에 이름을 남길 수 있습니다!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="cricket-modal-footer">
          <button className="cricket-modal-btn" onClick={onClose}>
            확인 및 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
