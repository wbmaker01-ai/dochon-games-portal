import React from 'react';
import { X, Sparkles, Wand2, Zap, Heart, Shield, Trophy, Flame } from 'lucide-react';
import { SYMBOLS } from './magicConstants';

export default function MagicCatHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="magic-modal-backdrop" onClick={onClose}>
      <div className="magic-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="magic-modal-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Wand2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                🧙‍♂️ 도촌 매직 캣 아카데미 게임 방법
              </h3>
              <p className="text-xs text-purple-200">
                마법 지팡이로 기호를 화면에 그려 침공한 유령들을 물리치세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="magic-modal-body space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Story intro */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30">
            <h4 className="text-xs font-black text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> 모모의 대마법서 탈환 대작전!
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              장난꾸러기 악령들이 마법학교에 침입해 가장 소중한 <strong className="text-amber-200">대마법서</strong>를 훔쳐 달아났습니다!
              마우스 드래그나 화면 터치로 다가오는 유령 머리 위의 <strong className="text-purple-300">마법 문양</strong>을 그려 유령 군단을 정화하세요!
            </p>
          </div>

          {/* 6 Core Magic Symbols Grid */}
          <div>
            <h4 className="text-xs font-black text-purple-300 mb-2 flex items-center gap-1.5">
              ✨ 6대 마법 주문 심볼 그리는 법
            </h4>
            <div className="magic-symbols-grid">
              {Object.values(SYMBOLS).map((sym) => (
                <div
                  key={sym.id}
                  className="magic-symbol-card"
                >
                  <div
                    className="magic-symbol-icon"
                    style={{
                      backgroundColor: `${sym.color}22`,
                      color: sym.color,
                      border: `1.5px solid ${sym.color}`
                    }}
                  >
                    {sym.char}
                  </div>
                  <span className="text-xs font-bold text-white">{sym.name}</span>
                  <span className="text-[11px] text-slate-300 mt-1 leading-tight">{sym.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Spells Callout */}
          <div className="magic-callout-grid">
            <div className="p-3 rounded-xl bg-violet-950/60 border border-violet-500/40">
              <div className="flex items-center gap-1.5 text-violet-300 font-bold text-xs mb-1">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>번개 (⚡) 광역 마법</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                번개 기호를 그리면 화면 내에 번개 기호를 달고 있는 <strong>모든 유령을 동시에 타격</strong>하여 시원하게 정화합니다!
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs mb-1">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span>하트 (❤️) 생명력 회복</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                하트 기호를 그리거나 연속 콤보를 달성하면 잃어버린 생명력(<strong>+1 HP</strong>)을 즉시 회복할 수 있습니다!
              </p>
            </div>
          </div>

          {/* Stages & Pro Tips */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
            <h4 className="text-xs font-black text-amber-300 mb-2 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> 고득점 마스터 비법 (도촌 랭킹 TIP)
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-amber-200">연속 콤보 유지:</strong> 실수 없이 기호를 연속으로 맞히면 콤보 점수(Combo x 25)가 폭발적으로 증가합니다.
              </li>
              <li>
                <strong className="text-emerald-300">위험 순위 파악:</strong> 모모에게 가장 가까이 접근한 유령의 머리 위 기호를 먼저 그려 방어하세요.
              </li>
              <li>
                <strong className="text-purple-300">5단계 거대 보스 결전:</strong> 옥상 보스전에서는 보스의 콤보 기호 라인을 연속으로 빠르게 그려야 합니다.
              </li>
              <li>
                <strong className="text-amber-300">도촌 명예의 전당:</strong> 최종 100점을 초과하면 전교 랭킹에 자랑스러운 이름을 남길 수 있습니다!
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="magic-modal-footer">
          <button onClick={onClose} className="magic-btn-primary w-full">
            <span>✨ 준비 완료! 마법학교 구하러 가기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
