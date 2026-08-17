import React from 'react';
import { X, Play, Gamepad2, Award, Sparkles, BookOpen, Layers, Edit3, Trophy, ChevronRight } from 'lucide-react';

export default function JerryHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const baseUrl = import.meta.env.BASE_URL || '/';
  const cutsceneUrl = `${baseUrl}assets/jerrylawson/story_cutscene.jpg`;

  return (
    <div className="jerry-modal-overlay" onClick={onClose}>
      <div className="jerry-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="jerry-modal-header">
          <div className="jerry-modal-title-box">
            <div className="jerry-modal-icon-wrap">
              🕹️
            </div>
            <div>
              <h2 className="jerry-modal-title">도촌 제리 로슨 (Jerry Lawson) 게임 가이드</h2>
              <p className="jerry-modal-subtitle">8비트 레트로 아케이드 & 나만의 게임 메이커</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="jerry-modal-close-btn"
            title="가이드 닫기"
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="jerry-modal-body">
          {/* 1. Cutscene Story Card */}
          <div className="jerry-cutscene-wrap">
            <img
              src={cutsceneUrl}
              alt="제리 로슨의 실험실"
              className="jerry-cutscene-img"
            />
            <div className="jerry-cutscene-caption">
              <div className="jerry-cutscene-title">
                <BookOpen style={{ width: '16px', height: '16px', color: '#FFD700' }} />
                <span>비디오 게임 카트리지의 아버지, 제리 로슨(1940~2011)</span>
              </div>
              <p className="jerry-cutscene-desc">
                제럴드 '제리' 로슨(Jerry Lawson)은 1976년 최초로 교체 가능한 <strong>롬 카트리지(ROM Cartridge)</strong>를
                탑재한 비디오 게임기 <em>Fairchild Channel F</em>를 탄생시킨 위대한 공학자입니다. 제리 로슨의 혁신 덕분에
                우리는 하나의 게임기에서 수많은 게임 팩을 교체하며 플레이하고, 나아가 직접 게임을 창작하는 시대를 맞이하게 되었습니다.
              </p>
            </div>
          </div>

          {/* 2. Controls Section */}
          <div className="jerry-guide-section">
            <h3 className="jerry-guide-heading">
              <Gamepad2 style={{ width: '18px', height: '18px', color: '#FFD700' }} />
              <span>1. 기본 조작 방법</span>
            </h3>
            <div className="jerry-guide-grid">
              <div className="jerry-guide-item">
                <span style={{ color: '#94A3B8' }}>좌우 이동</span>
                <span className="jerry-kbd">← / → 또는 A / D</span>
              </div>
              <div className="jerry-guide-item">
                <span style={{ color: '#94A3B8' }}>점프</span>
                <span className="jerry-kbd">↑ / W 또는 Space</span>
              </div>
              <div className="jerry-guide-item">
                <span style={{ color: '#94A3B8' }}>슈퍼 하이점프</span>
                <span style={{ color: '#00FF66', fontWeight: 700 }}>🦘 스프링 콘덴서</span>
              </div>
              <div className="jerry-guide-item">
                <span style={{ color: '#94A3B8' }}>몬스터 처치</span>
                <span style={{ color: '#FF2E63', fontWeight: 700 }}>👾 머리 밟기 (+100점)</span>
              </div>
            </div>
          </div>

          {/* 3. Items & Scoring Guide */}
          <div className="jerry-guide-section">
            <h3 className="jerry-guide-heading">
              <Award style={{ width: '18px', height: '18px', color: '#FFD700' }} />
              <span>2. 오브젝트 및 점수 획득 규칙</span>
            </h3>
            <div className="jerry-item-row">
              <div className="jerry-item-icon">🪙</div>
              <div className="jerry-item-info">
                <strong>전자 롬 칩 (코인):</strong>
                <p>개당 <strong style={{ color: '#FFD700' }}>+50점</strong> 획득</p>
              </div>
            </div>
            <div className="jerry-item-row">
              <div className="jerry-item-icon">👾</div>
              <div className="jerry-item-info">
                <strong>글리치 버그 (적):</strong>
                <p>머리를 밟아 처치 시 <strong style={{ color: '#FF6B6B' }}>+100점</strong> 및 연속 콤보 보너스! (옆/아래 피격 시 데미지)</p>
              </div>
            </div>
            <div className="jerry-item-row">
              <div className="jerry-item-icon">🏆</div>
              <div className="jerry-item-info">
                <strong>황금 마스터 카트리지 (골):</strong>
                <p>스테이지 클리어 포탈 도달 시 <strong style={{ color: '#FFD700' }}>+500점</strong> 및 남은 시간(초당 5점) 보너스 정산!</p>
              </div>
            </div>
          </div>

          {/* 4. Level Editor Guide */}
          <div className="jerry-guide-section editor-theme">
            <h3 className="jerry-guide-heading" style={{ color: '#00FFF5' }}>
              <Edit3 style={{ width: '18px', height: '18px', color: '#00FFF5' }} />
              <span>3. 🛠️ 나만의 게임 제작 (레벨 에디터) 가이드</span>
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
              상단의 <strong>[🛠️ 에디터]</strong> 탭을 누르면 마우스 클릭과 드래그로 블록, 스프링, 적, 코인을 자유롭게 배치하여 자신만의 레벨을 만들고, <strong>[▶️ 테스트 플레이]</strong> 버튼으로 즉시 플레이할 수 있습니다!
            </p>
            <div className="jerry-pills-wrap">
              <span className="jerry-pill">🧱 블록</span>
              <span className="jerry-pill">💻 발판</span>
              <span className="jerry-pill">🦘 스프링</span>
              <span className="jerry-pill">🪙 코인</span>
              <span className="jerry-pill">⚡ 스파크</span>
              <span className="jerry-pill">👾 글리치 버그</span>
              <span className="jerry-pill">🏆 골인 카트리지</span>
              <span className="jerry-pill">🧹 지우개</span>
            </div>
          </div>

          {/* 5. Honor System Guide */}
          <div className="jerry-guide-section honor-theme">
            <h3 className="jerry-guide-heading" style={{ color: '#FFB800' }}>
              <Trophy style={{ width: '18px', height: '18px', color: '#FFB800' }} />
              <span>4. 도촌초 명예의 전당 등록 안내</span>
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
              게임 플레이 후 <strong style={{ color: '#FFD700' }}>100점을 초과</strong>하여 달성하면 도촌초등학교 실시간 명예의 전당에 여러분의 이름을 남길 수 있습니다!
            </p>
          </div>
        </div>

        {/* Modal Footer with Premium Design Button */}
        <div className="jerry-modal-footer">
          <button
            onClick={onClose}
            className="jerry-modal-confirm-btn"
          >
            <Play style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
            <span>확인 및 게임 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
}
