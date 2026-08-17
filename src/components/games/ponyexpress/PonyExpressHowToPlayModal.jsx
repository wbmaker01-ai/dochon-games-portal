import React from 'react';
import { X, Trophy, Sparkles, Shield, Award } from 'lucide-react';

export default function PonyExpressHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/80 via-yellow-950/80 to-amber-950/80 border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐎</span>
            <div>
              <h2 className="text-lg font-black text-amber-300 tracking-tight">도촌 포니 익스프레스 게임 방법</h2>
              <p className="text-xs text-amber-200/70">100통의 편지를 모두 모아 서부 마을에 배달하세요!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* 1. Basic Rules */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2 text-base">
              <span>🎯</span> 기본 규칙 & 목표
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li>말을 타고 질주하며 길에 흩어진 <strong className="text-amber-300">총 100통의 편지</strong>를 수집합니다.</li>
              <li>상단, 중단, 하단 <strong className="text-emerald-300">3개의 레인</strong>을 빠르게 오가며 장애물을 피하세요.</li>
              <li>편지를 놓치지 않고 연속으로 수집하면 <strong className="text-amber-300">콤보 점수 보너스</strong>가 누적됩니다!</li>
              <li>최종 목적지인 웨스턴 타운에 무사히 도착하면 배달 완료 성적과 별점이 주어집니다.</li>
            </ul>
          </div>

          {/* 2. Controls */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2 text-base">
              <span>🕹️</span> 조작 방법
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-amber-300 mb-1">💻 PC (키보드)</p>
                <p className="text-slate-300">
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">↑</kbd> / <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">W</kbd> : 위쪽 레인 이동<br />
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">↓</kbd> / <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">S</kbd> : 아래쪽 레인 이동<br />
                  <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold">Space</kbd> : 장애물 점프
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-amber-300 mb-1">📱 모바일 / 태블릿</p>
                <p className="text-slate-300">
                  화면 하단의 <strong className="text-amber-300">▲ UP / ▼ DOWN</strong> 버튼 터치 또는 게임 화면 상하 스와이프 조작
                </p>
              </div>
            </div>
          </div>

          {/* 3. Items & Obstacles Guide */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2 text-base">
              <span>✉️</span> 아이템 & 장애물 도감
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-700 flex items-center gap-2">
                <span className="text-lg">✉️</span>
                <div>
                  <p className="font-bold text-white">우편 편지</p>
                  <p className="text-slate-400">+10점 (콤보 보너스)</p>
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-700 flex items-center gap-2">
                <span className="text-lg">🌟</span>
                <div>
                  <p className="font-bold text-amber-300">황금 특급 편지</p>
                  <p className="text-slate-400">+30점 고득점 편지</p>
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-700 flex items-center gap-2">
                <span className="text-lg">🥕</span>
                <div>
                  <p className="font-bold text-orange-400">말 당근</p>
                  <p className="text-slate-400">+20점 및 순간 가속</p>
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded border border-slate-700 flex items-center gap-2">
                <span className="text-lg">🌵</span>
                <div>
                  <p className="font-bold text-red-400">선인장 / 바위 / 울타리</p>
                  <p className="text-slate-400">충돌 시 점수 감점 & 감속</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Honor System */}
          <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 p-4 rounded-xl border border-amber-500/40">
            <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-amber-400" /> 도촌초 명예의 전당 등록 안내
            </h3>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              게임 클리어 후 <strong>100점을 초과</strong>하여 달성하면 도촌초등학교 전교 랭킹(명예의 전당)에 여러분의 이름을 남길 수 있습니다! 100통 만점에 도전해보세요!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
          >
            확인 및 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
