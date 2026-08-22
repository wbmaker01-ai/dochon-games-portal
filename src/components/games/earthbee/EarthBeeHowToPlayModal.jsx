import React from 'react';
import { X, Sparkles, Wind, Flower2, Clock, Trophy, Heart } from 'lucide-react';

export default function EarthBeeHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="earthbee-modal-backdrop" onClick={onClose}>
      <div className="earthbee-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="earthbee-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <h3 className="text-lg font-black text-amber-300">
              도촌 꿀벌의 비행 — 게임 방법
            </h3>
          </div>
          <button onClick={onClose} className="earthbee-modal-close" title="닫기">
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="earthbee-modal-body space-y-4 text-sm text-slate-200">
          {/* 1. Control */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-amber-500/20 flex gap-3 items-start">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-300 shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200 mb-1">1. 꿀벌 조종 및 비행</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                마우스 이동, 모바일 화면 터치 드래그, 또는 키보드 방향키(<kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono">↑ ↓ ← →</kbd>) 및 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono">WASD</kbd> 키를 사용하여 꿀벌을 자유롭게 비행시킬 수 있습니다.
              </p>
            </div>
          </div>

          {/* 2. Pollination & Bloom */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-emerald-500/20 flex gap-3 items-start">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300 shrink-0">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-200 mb-1">2. 꽃가루 수분 & 꽃 피우기</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                만개한 꽃에 다가가 <strong className="text-yellow-300">꽃가루✨</strong>를 묻힌 후, 아직 피지 않은 봉오리로 날아가 꽃가루를 전달하세요! 꽃이 활짝 피어나며 주변 정원이 화사해집니다.
              </p>
            </div>
          </div>

          {/* 3. Combo & Time Bonus */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-pink-500/20 flex gap-3 items-start">
            <div className="p-2 bg-pink-500/20 rounded-xl text-pink-300 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-pink-200 mb-1">3. 연속 콤보 & 보너스 시간 (최대 45초)</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                시간이 끝나기 전에 연속으로 꽃을 피우면 <strong className="text-pink-300">최대 x5배 콤보 점수</strong>와 <strong className="text-sky-300">추가 시간 ⏰</strong>을 획득합니다. 시간은 최대 45초까지 누적되며 후반으로 갈수록 긴장감이 높아집니다.
              </p>
            </div>
          </div>

          {/* 4. Eco Level Up & Sunset Clear */}
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-purple-500/20 flex gap-3 items-start">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-purple-200 mb-1">4. 생태계 레벨업 & 60송이 일몰 완성</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                꽃을 피워 <strong className="text-purple-300">총 60송이 개화 완성</strong> 시 황금빛 노을과 함께 <strong className="text-yellow-300">완벽 개화 보너스(+1,000점)</strong>를 획득하며 승리합니다! <strong className="text-amber-300">100점을 초과</strong>하면 도촌초 명예의 전당에 이름을 남길 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="earthbee-modal-footer">
          <button onClick={onClose} className="earthbee-modal-btn-confirm">
            <span>확인하고 날아보기 🐝</span>
          </button>
        </div>
      </div>
    </div>
  );
}
