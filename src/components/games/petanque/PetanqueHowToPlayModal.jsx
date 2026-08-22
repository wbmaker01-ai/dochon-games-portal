// Dochon Pétanque Master How-to-Play Modal

import React from 'react';
import { X, Target, Crosshair, Award, Zap, HelpCircle, Flame, Sparkles } from 'lucide-react';

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
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇫🇷 🎯</span>
            <h2 className="text-lg font-black text-amber-300">
              도촌 페탕크 마스터 게임 방법
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="petanque-modal-body space-y-4 text-sm text-slate-200">
          
          {/* Section 1: Pétanque Core Rule */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <h3 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              1. 페탕크 기본 룰
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              목표 공인 <strong className="text-amber-300 font-bold">⭐ 뷔슈(Cochonnet)</strong>에 내 쇠구슬(도촌 청팀 🔵)을 상대(AI 백팀 🔴)보다 더 가깝게 붙여 점수를 획득하는 프랑스 전통 레저 스포츠입니다!
            </p>
          </div>

          {/* Section 2: 2 Tactical Shot Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60">
              <h4 className="font-bold text-blue-400 flex items-center gap-1 mb-1 text-xs">
                <span>🎯</span> 포앵테 (Point / 롤링 샷)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                낮은 탄도로 부드럽게 굴려 목표 공 바로 앞에 붙이는 정밀 투구 기술입니다. 수비 및 선공에 유리합니다!
              </p>
            </div>

            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60">
              <h4 className="font-bold text-rose-400 flex items-center gap-1 mb-1 text-xs">
                <span>💥</span> 티레 (Tirer / 타격 샷)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                높은 포물선으로 날아가 뷔슈에 가까이 붙은 상대 공을 직접 때려 멀리 튕겨내는 강력한 공격 기술입니다!
              </p>
            </div>
          </div>

          {/* Section 3: Match & Controls */}
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              3. 조작 방법 & 엔드 진행
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-white">각도 조절:</strong> 좌우 조준 슬라이더 또는 방향키(← / →)
              </li>
              <li>
                <strong className="text-white">파워 조절 & 발사:</strong> 파워 게이지 바 또는 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono">SPACE / 투구 버튼</kbd> 클릭
              </li>
              <li>
                <strong className="text-white">경기 구성:</strong> 총 3엔드 진행 (엔드당 나 3구 vs AI 3구 투구)
              </li>
              <li>
                <strong className="text-white">득점 계산:</strong> 상대의 가장 가까운 공보다 뷔슈에 더 가까운 내 공의 개수만큼 득점!
              </li>
            </ul>
          </div>

          {/* Section 4: Bonus Points */}
          <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 text-xs text-amber-200/90 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <strong className="text-amber-300">고득점 비결:</strong> 뷔슈 20cm 이내 안착(불스아이 +200점), 티레 상대 공 직접 명중(+180점), 3구 전승 스윕(+300점) 보너스를 노려보세요!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="petanque-modal-footer">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all active:scale-98 text-sm"
          >
            이해했습니다! 경기 시작 🚀
          </button>
        </div>

      </div>
    </div>
  );
}
