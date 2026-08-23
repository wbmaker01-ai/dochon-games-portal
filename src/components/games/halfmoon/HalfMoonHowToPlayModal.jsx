// Half Moon Game Guide & Educational Rules Modal

import React from 'react';
import { LUNAR_PHASES, SPECIAL_CARDS, SCORING_RULES } from './halfmoonConstants';
import { X, Sparkles, BookOpen, Moon, Award, Zap, Star, ShieldCheck } from 'lucide-react';

export default function HalfMoonHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const phasesList = Object.values(LUNAR_PHASES);
  const specialsList = Object.values(SPECIAL_CARDS);

  return (
    <div className="halfmoon-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="halfmoon-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="halfmoon-modal-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                반달 (Rise of the Half Moon) 게임 방법
              </h3>
              <p className="text-xs text-slate-400">
                달의 차고 기우는 주기(삭망월)를 활용한 두뇌 전략 카드 배틀
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="halfmoon-modal-content space-y-6">
          
          {/* Section 1: 달의 8대 위상 순서 (삭망월 주기) */}
          <section className="guide-section">
            <h4 className="guide-heading">
              <Moon className="w-4 h-4 text-amber-400" />
              <span>1. 달의 8가지 위상 주기 (순서대로 기억해요!)</span>
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              달은 약 29.5일 동안 아래 순서대로 모양이 변합니다. 연속된 위상을 인접하게 놓으면 높은 콤보 점수를 얻습니다!
            </p>

            <div className="lunar-phase-grid">
              {phasesList.map((phase) => (
                <div key={phase.id} className="phase-guide-card">
                  <span className="phase-guide-icon">{phase.icon}</span>
                  <div className="phase-guide-name">{phase.shortName}</div>
                  <div className="phase-guide-desc">{phase.koreanDesc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: 점수 획득 공식 (콤보 연계) */}
          <section className="guide-section">
            <h4 className="guide-heading">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>2. 점수 획득 & 콤보 규칙</span>
            </h4>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="guide-score-item">
                <span className="guide-score-badge bg-blue-500/20 text-blue-300">기본 착수</span>
                <span className="flex-1">카드를 보드에 내려놓을 때마다 기본 <strong>+20점</strong></span>
              </div>
              <div className="guide-score-item">
                <span className="guide-score-badge bg-amber-500/20 text-amber-300">위상 페어</span>
                <span className="flex-1">인접한 슬롯에 <strong>같은 위상</strong> 카드가 있으면 <strong>+60점</strong></span>
              </div>
              <div className="guide-score-item">
                <span className="guide-score-badge bg-emerald-500/20 text-emerald-300">연속 주기</span>
                <span className="flex-1">인접한 슬롯과 <strong>연속된 달의 변화 순서</strong>(예: 초승달 ➔ 상현달)일 때 <strong>+100점</strong></span>
              </div>
              <div className="guide-score-item">
                <span className="guide-score-badge bg-purple-500/20 text-purple-300">대칭 균형</span>
                <span className="flex-1">인접한 슬롯에 <strong>정반대 위상</strong>(예: 삭 ⚔️ 보름달)이 오면 <strong>+80점</strong></span>
              </div>
              <div className="guide-score-item">
                <span className="guide-score-badge bg-pink-500/20 text-pink-300">풀 사이클</span>
                <span className="flex-1">한 줄(3칸)이 <strong>완벽한 삭망 주기 순서</strong>로 이어지면 대박 <strong>+300점</strong>!</span>
              </div>
            </div>
          </section>

          {/* Section 3: 특수 와일드카드 */}
          <section className="guide-section">
            <h4 className="guide-heading">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>3. 판세를 뒤집는 특수 와일드카드</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {specialsList.map((special) => (
                <div key={special.id} className="special-guide-card">
                  <span className="text-2xl mb-1">{special.icon}</span>
                  <div className="font-bold text-white text-xs">{special.name}</div>
                  <div className="text-[11px] text-slate-300 mt-1">{special.koreanDesc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: 고득점 공략 팁 */}
          <section className="guide-section bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>도촌 챔피언이 되기 위한 고득점 꿀팁</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li>보드의 <strong>정중앙 슬롯</strong>은 최대 8개 방향과 인접하므로 콤보를 터뜨리기 가장 좋은 명당입니다!</li>
              <li>손패에서 카드를 고른 후 빈 슬롯에 마우스를 올리면 <strong>예상 획득 점수가 미리 표시</strong>됩니다.</li>
              <li>3개의 스테이지를 모두 클리어하면 거대한 <strong>스테이지 클리어 보너스</strong>를 획득하여 명예의 전당 1위에 오를 수 있습니다!</li>
            </ul>
          </section>

        </div>

        {/* Footer Button */}
        <div className="halfmoon-modal-footer">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>이해했어요! 게임 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
