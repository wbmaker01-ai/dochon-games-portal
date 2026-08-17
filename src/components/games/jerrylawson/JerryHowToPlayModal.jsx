import React from 'react';
import { X, Play, Gamepad2, Award, Sparkles, BookOpen, Layers, Edit3, HelpCircle } from 'lucide-react';

export default function JerryHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              🕹️
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-200 tracking-wide">
                도촌 제리 로슨 (Jerry Lawson) 게임 가이드
              </h2>
              <p className="text-xs text-slate-400">8비트 레트로 아케이드 & 나만의 게임 메이커</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-sm">
          {/* 1. Jerry Lawson Story Cutscene Card */}
          <div className="rounded-xl border border-amber-500/40 overflow-hidden bg-slate-950/70 shadow-lg">
            <img
              src="/assets/jerrylawson/story_cutscene.jpg"
              alt="제리 로슨의 실험실"
              className="w-full h-44 object-cover"
            />
            <div className="p-4 bg-gradient-to-t from-slate-950 to-slate-900/90">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                <BookOpen className="w-4 h-4" />
                비디오 게임 카트리지의 아버지, 제리 로슨(1940~2011)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                제럴드 '제리' 로슨(Jerry Lawson)은 1976년 최초로 교체 가능한 <strong>롬 카트리지(ROM Cartridge)</strong>를
                탑재한 비디오 게임기 <em>Fairchild Channel F</em>를 탄생시킨 위대한 공학자입니다. 제리 로슨의 혁신 덕분에
                우리는 하나의 게임기에서 수많은 게임 팩을 교체하며 플레이하고, 나아가 직접 게임을 창작하는 시대를 맞이하게 되었습니다.
              </p>
            </div>
          </div>

          {/* 2. Controls */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <h3 className="text-amber-300 font-bold flex items-center gap-2 mb-3 text-sm">
              <Gamepad2 className="w-4 h-4" /> 기본 조작법
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-700">
                <span className="text-slate-400">좌우 이동</span>
                <span className="font-mono bg-slate-800 px-2 py-1 rounded text-amber-300 font-bold border border-slate-600">
                  ← / → 또는 A / D
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-700">
                <span className="text-slate-400">점프</span>
                <span className="font-mono bg-slate-800 px-2 py-1 rounded text-amber-300 font-bold border border-slate-600">
                  ↑ / W 또는 Space
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-700">
                <span className="text-slate-400">슈퍼 하이점프</span>
                <span className="text-emerald-400 font-bold">🦘 스프링 콘덴서 밟기</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-700">
                <span className="text-slate-400">몬스터 처치</span>
                <span className="text-rose-400 font-bold">👾 위에서 머리 밟기 (+100점)</span>
              </div>
            </div>
          </div>

          {/* 3. Items & Scoring */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <h3 className="text-amber-300 font-bold flex items-center gap-2 mb-3 text-sm">
              <Award className="w-4 h-4" /> 오브젝트 및 점수 획득 규칙
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2 bg-slate-900/50 rounded-lg">
                <span className="text-lg">🪙</span>
                <div>
                  <strong className="text-amber-300">전자 롬 칩 (코인):</strong> 개당 <strong>+50점</strong> 획득
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 bg-slate-900/50 rounded-lg">
                <span className="text-lg">👾</span>
                <div>
                  <strong className="text-rose-400">글리치 버그 (적):</strong> 머리를 밟아 처치 시 <strong>+100점</strong> 및 연속 처치 콤보 보너스! (옆이나 아래에서 닿으면 피해)
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 bg-slate-900/50 rounded-lg">
                <span className="text-lg">🏆</span>
                <div>
                  <strong className="text-amber-400">황금 마스터 카트리지 (골):</strong> 스테이지 클리어 포탈로 도달 시 <strong>+500점</strong> 및 남은 시간(초당 5점) 보너스 일괄 정산!
                </div>
              </div>
            </div>
          </div>

          {/* 4. Level Editor Guide */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-xl p-4 border border-indigo-500/40">
            <h3 className="text-indigo-300 font-bold flex items-center gap-2 mb-2 text-sm">
              <Edit3 className="w-4 h-4" /> 🛠️ 나만의 게임 제작 (레벨 에디터) 가이드
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              상단의 <strong>[🛠️ 레벨 에디터]</strong> 탭을 누르면 마우스 클릭과 드래그로 벽돌 블록, 스프링, 적, 코인을 자유롭게 배치하여 자신만의 레벨을 만들고, <strong>[▶️ 테스트 플레이]</strong> 버튼으로 즉시 플레이할 수 있습니다!
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-amber-300">🧱 블록</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-cyan-300">💻 발판</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-emerald-300">🦘 스프링</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-yellow-300">🪙 코인</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-rose-300">👾 글리치 버그</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-purple-300">🏆 골인 카트리지</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded border border-slate-700 text-slate-400">🧹 지우개</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
          >
            확인 및 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
}
