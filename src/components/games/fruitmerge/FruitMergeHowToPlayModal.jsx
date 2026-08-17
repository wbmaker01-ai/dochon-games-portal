import React from 'react';
import { FRUITS } from './fruitMergeConstants';
import { X, Sparkles, HelpCircle, Trophy, Lightbulb, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FruitMergeHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fruit-modal-backdrop" onClick={onClose}>
      <div className="fruit-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fruit-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 text-xl">
              🍉
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-1.5">
                도촌 과일 합치기 <span className="text-amber-400 text-sm font-normal">게임 설명서</span>
              </h2>
              <p className="text-xs text-emerald-200/80">같은 과일을 합쳐서 거대한 왕 수박을 완성하세요!</p>
            </div>
          </div>
          <button onClick={onClose} className="fruit-modal-close-btn" aria-label="닫기">
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Body Content */}
        <div className="fruit-modal-body space-y-5">
          {/* 1. Core Rule Summary */}
          <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm text-emerald-100/90 leading-relaxed">
              <strong className="text-amber-300 font-bold block mb-1 text-base">게임의 핵심 규칙</strong>
              상자 위에 나타나는 과일을 원하는 위치로 조준하여 떨어뜨립니다. 
              <strong className="text-white"> 같은 종류의 과일 2개가 서로 부딪히면 </strong> 
              한 단계 더 크고 점수가 높은 다음 과일로 즉시 진화합니다!
            </div>
          </div>

          {/* 2. 11 Fruit Evolution Chart */}
          <div>
            <h3 className="text-sm font-bold text-amber-300 mb-2.5 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              11단계 과일 진화 도감
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 custom-scroll">
              {FRUITS.map((fruit, idx) => (
                <div
                  key={fruit.level}
                  className="bg-slate-900/60 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl p-2.5 flex items-center gap-2.5 transition-all shadow-sm"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-inner font-bold"
                    style={{
                      backgroundColor: fruit.color,
                      boxShadow: `0 0 10px ${fruit.color}40`,
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    {fruit.emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{idx + 1}단계. {fruit.name}</span>
                    </div>
                    <div className="text-[11px] text-amber-300 font-semibold">
                      +{fruit.score}점
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Controls & Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5 mb-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                조작 방법 (PC & 모바일)
              </h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <strong>마우스/터치 드래그</strong>: 낙하 위치 좌우 조준</li>
                <li>• <strong>클릭/손 떼기</strong>: 과일 떨어뜨리기</li>
                <li>• <strong>흔들기 버튼(🎲)</strong>: 끼인 과일 흔들기 (게임당 2회)</li>
              </ul>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                고득점 비법 팁
              </h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <strong>큰 과일은 구석으로</strong>: 수박, 멜론은 바닥 한쪽에 배치!</li>
                <li>• <strong>연쇄 콤보 노리기</strong>: 연속 합체 시 콤보 배수 점수 획득</li>
                <li>• <strong>데드라인 주의</strong>: 상단 빨간선을 3초 이상 넘치면 게임오버!</li>
              </ul>
            </div>
          </div>

          {/* 4. Honor System Notice */}
          <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">
                <strong className="text-amber-300">100점 초과 달성 시</strong> 도촌초 명예의 전당에 이름을 등록할 수 있습니다!
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fruit-modal-footer">
          <button onClick={onClose} className="fruit-modal-ok-btn">
            확인하고 게임 시작하기 🍉
          </button>
        </div>
      </div>
    </div>
  );
}
