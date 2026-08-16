import React from 'react';
import { X, Trophy, Swords, Zap, Shield, Sparkles, Flag, ArrowRight, Heart } from 'lucide-react';
import { SPORTS, TEAMS } from './championConstants';

export default function ChampionHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="champion-modal-backdrop" onClick={onClose}>
      <div className="champion-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="champion-modal-header">
          <div className="champion-modal-title">
            <span className="title-icon">🏝️</span>
            <h2>도촌 챔피언 아일랜드 플레이 가이드</h2>
          </div>
          <button className="champion-modal-close" onClick={onClose} aria-label="닫기">
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="champion-modal-body">
          {/* Section: Story & Goal */}
          <div className="guide-section highlight-box">
            <div className="section-title">
              <Sparkles className="icon-gold" size={18} />
              <h3>게임 스토리 & 승리 목표</h3>
            </div>
            <p>
              전설의 삼색 닌자 고양이 <strong>'럭키(Lucky)'</strong>가 되어 신비로운 챔피언 아일랜드를 자유롭게 탐험하세요!
              섬 곳곳에 위치한 <strong>4대 스포츠 경기장</strong>에서 전설의 챔피언들과 승부를 겨루어 <strong>4개의 성스러운 두루마리(Sacred Scrolls)</strong>를 획득하고 도촌초 명예의 전당 챔피언에 등극하세요!
            </p>
          </div>

          {/* Section: Controls */}
          <div className="guide-section">
            <div className="section-title">
              <Zap className="icon-blue" size={18} />
              <h3>조작 방법 (키보드 & 모바일 터치)</h3>
            </div>
            <div className="controls-grid">
              <div className="control-card">
                <span className="key-badge">W, A, S, D / 방향키</span>
                <span className="key-desc">섬 탐험 이동 / 패들·조준선·레인 조작</span>
              </div>
              <div className="control-card">
                <span className="key-badge">Space / Enter</span>
                <span className="key-desc">NPC 대화 / 경기장 입장 / 스매시·화살 발사·스프린트·점프</span>
              </div>
              <div className="control-card">
                <span className="key-badge">화면 가상 버튼 (📱)</span>
                <span className="key-desc">모바일 터치 가상 조이스틱 & 전용 액션 버튼 지원</span>
              </div>
            </div>
          </div>

          {/* Section: 4 Sacred Sports Arenas */}
          <div className="guide-section">
            <div className="section-title">
              <Swords className="icon-rose" size={18} />
              <h3>4대 올림픽 스포츠 종목 & 챔피언 공략</h3>
            </div>
            <div className="sports-guide-list">
              <div className="sport-card">
                <div className="sport-card-header">
                  <span className="sport-badge-icon">🏓</span>
                  <strong>{SPORTS.TABLE_TENNIS.name}</strong>
                  <span className="boss-tag">보스: {SPORTS.TABLE_TENNIS.boss}</span>
                </div>
                <p className="sport-desc">{SPORTS.TABLE_TENNIS.desc}</p>
                <div className="tip-badge">💡 팁: 랠리가 지속될수록 공이 빨라지며, <code>스페이스바</code>로 강력한 스매시를 날릴 수 있습니다!</div>
              </div>

              <div className="sport-card">
                <div className="sport-card-header">
                  <span className="sport-badge-icon">🎯</span>
                  <strong>{SPORTS.ARCHERY.name}</strong>
                  <span className="boss-tag">보스: {SPORTS.ARCHERY.boss}</span>
                </div>
                <p className="sport-desc">{SPORTS.ARCHERY.desc}</p>
                <div className="tip-badge">💡 팁: 10발 중 <strong>100점 이상만 획득하면 승리</strong>하며 두루마리를 획득합니다! (불스아이 1~2발로도 손쉽게 달성 가능)</div>
              </div>

              <div className="sport-card">
                <div className="sport-card-header">
                  <span className="sport-badge-icon">🏃</span>
                  <strong>{SPORTS.MARATHON.name}</strong>
                  <span className="boss-tag">보스: {SPORTS.MARATHON.boss}</span>
                </div>
                <p className="sport-desc">{SPORTS.MARATHON.desc}</p>
                <div className="tip-badge">💡 팁: 꽃게와 물웅덩이에 부딪히면 감속됩니다. 해변의 🍉 수박 부스트를 획득해 폭발적으로 질주하세요!</div>
              </div>

              <div className="sport-card">
                <div className="sport-card-header">
                  <span className="sport-badge-icon">🧗</span>
                  <strong>{SPORTS.CLIMBING.name}</strong>
                  <span className="boss-tag">보스: {SPORTS.CLIMBING.boss}</span>
                </div>
                <p className="sport-desc">{SPORTS.CLIMBING.desc}</p>
                <div className="tip-badge">💡 팁: 떨어지는 낙석을 좌우로 피하며 <code>스페이스바/위 방향키</code>로 다음 홀드로 안전하게 도약하세요!</div>
              </div>
            </div>
          </div>

          {/* Section: 4 Teams */}
          <div className="guide-section">
            <div className="section-title">
              <Flag className="icon-amber" size={18} />
              <h3>챔피언 아일랜드 4대 팀</h3>
            </div>
            <div className="teams-grid">
              {TEAMS.map(team => (
                <div key={team.id} className="team-intro-card" style={{ borderColor: team.color }}>
                  <div className="team-intro-icon">{team.icon}</div>
                  <div className="team-intro-name" style={{ color: team.color }}>{team.name}</div>
                  <div className="team-intro-motto">{team.motto}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Hall of Fame Tip */}
          <div className="guide-section highlight-box-gold">
            <div className="section-title">
              <Trophy className="icon-gold" size={18} />
              <h3>도촌초등학교 명예의 전당 랭킹 등록</h3>
            </div>
            <p>
              각 종목 승리와 두루마리 획득으로 <strong>100점을 초과</strong>하여 달성하면, 게임 종료 시 자신의 이름과 학반을 입력해 실시간 클라우드 명예의 전당에 영광의 챔피언으로 이름을 올릴 수 있습니다!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="champion-modal-footer">
          <button className="btn-start-adventure" onClick={onClose}>
            <span>모험 시작하기</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
