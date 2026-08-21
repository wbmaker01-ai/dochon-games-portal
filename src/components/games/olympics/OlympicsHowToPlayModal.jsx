import React from 'react';
import { X, Trophy, Flame, Zap, Award, Target, Navigation, ArrowRight } from 'lucide-react';

export default function OlympicsHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="olympics-modal-overlay">
      <div className="olympics-howto-modal">
        {/* Header */}
        <div className="olympics-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            <h3 className="text-lg font-black text-white">
              도촌 미니 올림픽 <span className="text-amber-400">게임 안내</span>
            </h3>
          </div>
          <button onClick={onClose} className="olympics-modal-close" title="닫기">
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="olympics-howto-content">
          
          {/* Intro Box */}
          <div className="olympics-howto-intro">
            <p className="text-xs text-amber-200 leading-relaxed font-bold">
              🔥 도촌초등학교 3대 스포츠 릴레이 챔피언십에 오신 것을 환영합니다!<br />
              각 종목의 최고 기록을 달성하여 금메달과 명예의 전당 1위에 도전하세요!
            </p>
          </div>

          {/* 3 Events Grid */}
          <div className="space-y-3.5 my-3">
            
            {/* Event 1: Hurdles */}
            <div className="olympics-event-card border-amber-500/30 bg-amber-950/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">🏃</span>
                <h4 className="text-sm font-black text-amber-400">
                  1종목: 100m 허들 달리기
                </h4>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc">
                <li><strong className="text-white">가속</strong>: 좌우 방향키(<kbd className="olympics-key">←</kbd> <kbd className="olympics-key">→</kbd>) 또는 A/D 키를 번갈아 빠르게 연타!</li>
                <li><strong className="text-white">점프</strong>: 허들 직전에 <kbd className="olympics-key">Space</kbd> 또는 <kbd className="olympics-key">↑</kbd> 키로 타이밍 점프.</li>
                <li><strong className="text-amber-300">팁</strong>: 허들에 걸리면 감속되므로 완벽한 타이밍에 점프하여 퍼펙트 보너스를 획득하세요.</li>
              </ul>
            </div>

            {/* Event 2: Basketball */}
            <div className="olympics-event-card border-orange-500/30 bg-orange-950/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">🏀</span>
                <h4 className="text-sm font-black text-orange-400">
                  2종목: 3점 슛 챌린지
                </h4>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc">
                <li><strong className="text-white">슛</strong>: 움직이는 타이밍 게이지가 초록색 <strong className="text-emerald-400">PERFECT ZONE</strong>에 왔을 때 <kbd className="olympics-key">Space</kbd> 키 입력!</li>
                <li><strong className="text-white">콤보</strong>: 연속 득점 시 점수가 2배로 폭등하는 불꽃 콤보 활성화!</li>
                <li><strong className="text-amber-300">팁</strong>: 마지막 8번째 공은 2배 점수를 주는 머니볼입니다.</li>
              </ul>
            </div>

            {/* Event 3: Canoe Slalom */}
            <div className="olympics-event-card border-cyan-500/30 bg-cyan-950/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">🛶</span>
                <h4 className="text-sm font-black text-cyan-400">
                  3종목: 급류 카누 슬라럼
                </h4>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc">
                <li><strong className="text-white">조종</strong>: 좌우 방향키(<kbd className="olympics-key">←</kbd> <kbd className="olympics-key">→</kbd>)로 물살을 타며 방향 조절.</li>
                <li><strong className="text-white">게이트</strong>: 녹색 슬라럼 게이트 사이를 정확히 통과하면 연속 보너스 점수!</li>
                <li><strong className="text-amber-300">팁</strong>: 바위나 통나무에 부딪히면 감속과 함께 감점이 적용됩니다.</li>
              </ul>
            </div>
          </div>

          {/* Medal Criteria */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center">
            <h5 className="text-xs font-black text-amber-300 mb-1 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" /> 올림픽 메달 획득 기준
            </h5>
            <div className="flex justify-around text-[11px] font-bold mt-1.5">
              <span className="text-yellow-400">🥇 금메달: 1,500점+</span>
              <span className="text-slate-300">🥈 은메달: 1,000점+</span>
              <span className="text-amber-600">🥉 동메달: 600점+</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="olympics-modal-footer">
          <button onClick={onClose} className="olympics-btn-primary w-full">
            <span>확인 완료! 올림픽 참가하기 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
