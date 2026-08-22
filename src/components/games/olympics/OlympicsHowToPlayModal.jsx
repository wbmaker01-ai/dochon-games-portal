import React from 'react';
import { X, Award, Target, Zap, Flame } from 'lucide-react';

export default function OlympicsHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="olympics-modal-overlay">
      <div className="olympics-howto-modal">
        {/* Header */}
        <div className="olympics-modal-header">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏅</span>
            <div>
              <h3 className="text-xl font-black text-white leading-tight">
                도촌 미니 올림픽 <span className="text-amber-400">게임 방법</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-bold">
                초등학생 맞춤 3대 릴레이 스포츠 챔피언십
              </p>
            </div>
          </div>
          <button onClick={onClose} className="olympics-modal-close" title="닫기">
            <X className="w-6 h-6 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="olympics-howto-content space-y-3">
          
          {/* Intro Box */}
          <div className="olympics-howto-intro">
            <p className="text-xs text-amber-200 leading-relaxed font-bold">
              🔥 3개 종목의 점수를 합산하여 최종 올림픽 순위와 메달이 결정됩니다!<br />
              최고 점수를 기록하여 도촌초 명예의 전당 1위에 도전하세요!
            </p>
          </div>

          {/* 3 Events Grid */}
          <div className="space-y-3">
            
            {/* Event 1: Hurdles */}
            <div className="olympics-event-card border-amber-500/40 bg-amber-950/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">🏃</span>
                <h4 className="text-sm font-black text-amber-400">
                  1종목: 100m 허들 달리기
                </h4>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 pl-4 list-disc font-medium">
                <li><strong className="text-white">가속</strong>: 좌우 키(<kbd className="olympics-key">←</kbd> <kbd className="olympics-key">→</kbd> 또는 <kbd className="olympics-key">A</kbd> <kbd className="olympics-key">D</kbd>)를 번갈아 빠르게 연타!</li>
                <li><strong className="text-white">점프</strong>: 허들 바로 앞에서 <kbd className="olympics-key">Space</kbd> 또는 <kbd className="olympics-key">↑</kbd> 키로 타이밍 점프.</li>
                <li><strong className="text-amber-300">핵심 팁</strong>: 완벽한 타이밍에 점프하면 <span className="text-emerald-400 font-black">+80점 퍼펙트 보너스</span> 획득!</li>
              </ul>
            </div>

            {/* Event 2: Basketball */}
            <div className="olympics-event-card border-orange-500/40 bg-orange-950/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">🏀</span>
                <h4 className="text-sm font-black text-orange-400">
                  2종목: 3점 슛 챌린지
                </h4>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 pl-4 list-disc font-medium">
                <li><strong className="text-white">슛 던지기</strong>: 타이밍 바가 초록색 <strong className="text-emerald-400">PERFECT ZONE</strong>에 도달했을 때 <kbd className="olympics-key">Space</kbd> 키 입력!</li>
                <li><strong className="text-white">연속 콤보</strong>: 연속 클린 득점 시 점수가 폭등하는 불꽃 콤보 활성화!</li>
                <li><strong className="text-amber-300">핵심 팁</strong>: 마지막 8번째 공은 <span className="text-cyan-400 font-black">200점 보너스 머니볼</span>입니다.</li>
              </ul>
            </div>

            {/* Event 3: Canoe Slalom */}
            <div className="olympics-event-card border-cyan-500/40 bg-cyan-950/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">🛶</span>
                <h4 className="text-sm font-black text-cyan-400">
                  3종목: 급류 카누 슬라럼
                </h4>
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 pl-4 list-disc font-medium">
                <li><strong className="text-white">방향 조종</strong>: 좌우 방향키(<kbd className="olympics-key">←</kbd> <kbd className="olympics-key">→</kbd>)로 물살을 타며 방향 조절.</li>
                <li><strong className="text-white">게이트 통과</strong>: 녹색 슬라럼 게이트 사이를 정확히 통과하면 연속 보너스 점수!</li>
                <li><strong className="text-amber-300">핵심 팁</strong>: 바위와 통나무에 부딪히면 감속 및 충돌 감점이 적용됩니다.</li>
              </ul>
            </div>
          </div>

          {/* Medal Criteria */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center">
            <h5 className="text-xs font-black text-amber-300 mb-1.5 flex items-center justify-center gap-1">
              <Award className="w-4 h-4 text-amber-400" /> 올림픽 종합 메달 획득 기준
            </h5>
            <div className="flex justify-around text-xs font-black">
              <span className="text-yellow-400">🥇 금메달: 1,500점+</span>
              <span className="text-slate-300">🥈 은메달: 1,000점+</span>
              <span className="text-amber-600">🥉 동메달: 600점+</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4">
          <button onClick={onClose} className="olympics-btn-primary w-full py-3 text-sm font-black">
            <span>확인 완료! 올림픽 참가하기 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}
