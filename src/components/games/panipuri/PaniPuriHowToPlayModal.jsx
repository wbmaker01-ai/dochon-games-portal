// Dochon Pani Puri Master - How to Play Guide Modal Component

import React from 'react';
import { X, Sparkles, Flame, Clock, Trophy, Heart, CheckCircle2 } from 'lucide-react';
import { PANI_FLAVORS } from './panipuriConstants';

export default function PaniPuriHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="panipuri-modal-backdrop" onClick={onClose}>
      <div
        className="panipuri-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="panipuri-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🫓</span>
            <div>
              <h2 className="text-xl font-black text-amber-400">
                파니 푸리 마스터 게임 가이드
              </h2>
              <p className="text-xs text-slate-300">
                인도 최고 길거리 간식 파니 푸리 서빙 타이쿤!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="panipuri-btn-close"
            aria-label="가이드 닫기"
          >
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="panipuri-modal-body space-y-4 text-sm text-slate-200">
          
          {/* Step 1: Core Rules */}
          <div className="panipuri-guide-section">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">1</span>
              주문 확인 및 서빙 방법
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              손님 머리 위의 말풍선에서 <strong className="text-amber-200">원하는 맛과 수량</strong>을 확인하세요.
              하단의 <strong className="text-emerald-300">파니 단지(Matka)</strong>를 클릭하여 푸리에 소스를 채우고,
              주문과 일치하면 <strong className="text-amber-300">[서빙하기]</strong> 버튼을 누릅니다!
            </p>
            <div className="bg-slate-950/70 border border-amber-400/30 rounded-lg p-2 text-[11px] text-amber-200 flex items-center gap-2">
              <span>⌨️</span>
              <div>
                <strong>키보드 조작 지원:</strong> <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-600 font-mono text-amber-300">Enter</kbd> 키로 즉시 서빙 완료, <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-600 font-mono text-cyan-300">1~4</kbd> 키로 향신료 담기, <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-600 font-mono text-rose-300">C</kbd> 키로 비우기 가능!
              </div>
            </div>
          </div>

          {/* Step 2: 4 Flavors Guide */}
          <div className="panipuri-guide-section">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">2</span>
              4대 시그니처 파니(양념수) 맛
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="panipuri-flavor-badge bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-xl">
                <span className="text-base mr-1">🌿</span>
                <div>
                  <span className="font-bold text-emerald-300 text-xs">{PANI_FLAVORS.MINT.name}</span>
                  <p className="text-[10px] text-slate-400">{PANI_FLAVORS.MINT.description}</p>
                </div>
              </div>

              <div className="panipuri-flavor-badge bg-amber-950/60 border border-amber-500/40 p-2 rounded-xl">
                <span className="text-base mr-1">🍯</span>
                <div>
                  <span className="font-bold text-amber-300 text-xs">{PANI_FLAVORS.TAMARIND.name}</span>
                  <p className="text-[10px] text-slate-400">{PANI_FLAVORS.TAMARIND.description}</p>
                </div>
              </div>

              <div className="panipuri-flavor-badge bg-rose-950/60 border border-rose-500/40 p-2 rounded-xl">
                <span className="text-base mr-1">🌶️</span>
                <div>
                  <span className="font-bold text-rose-300 text-xs">{PANI_FLAVORS.CHILI.name}</span>
                  <p className="text-[10px] text-slate-400">{PANI_FLAVORS.CHILI.description}</p>
                </div>
              </div>

              <div className="panipuri-flavor-badge bg-yellow-950/60 border border-yellow-500/40 p-2 rounded-xl">
                <span className="text-base mr-1">🥭</span>
                <div>
                  <span className="font-bold text-yellow-300 text-xs">{PANI_FLAVORS.MANGO.name}</span>
                  <p className="text-[10px] text-slate-400">{PANI_FLAVORS.MANGO.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Fever & High Score Tips */}
          <div className="panipuri-guide-section">
            <h3 className="font-bold text-amber-300 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black">3</span>
              콤보 & 골든 피버(Fever) 타임
            </h3>
            <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside">
              <li>
                실수 없이 연속으로 서빙 성공 시 <strong className="text-amber-300">콤보 배수 보너스</strong>가 쌓입니다.
              </li>
              <li>
                피버 게이지 100% 달성 시 <strong className="text-yellow-300">골든 피버 발동</strong>! 8초 동안 모든 점수 2배!
              </li>
              <li>
                빠르게 서빙할수록 <strong className="text-cyan-300">시간 추가 보너스</strong> 획득! (손님이 늘어날수록 주문이 다양해지고 속도가 빨라집니다)
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Button */}
        <div className="panipuri-modal-footer">
          <button
            onClick={onClose}
            className="panipuri-btn-primary w-full py-2.5 rounded-xl font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg"
          >
            이해했어요! 게임 시작하기 ✨
          </button>
        </div>
      </div>
    </div>
  );
}
