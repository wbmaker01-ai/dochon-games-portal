// How to Play Guide Modal for Dochon Pangolin Adventure
import React from 'react';
import { X, Trophy, Sparkles, Heart, Zap, Flame, Compass } from 'lucide-react';

export default function PangolinHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="pangolin-modal-backdrop" onClick={onClose}>
      <div className="pangolin-guide-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pangolin-guide-header">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🦔</span>
            <h3 className="text-lg font-black text-amber-300">도촌 천산갑의 모험 게임 가이드</h3>
          </div>
          <button onClick={onClose} className="pangolin-guide-close-btn">
            <X className="w-5 h-5 text-slate-300 hover:text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="pangolin-guide-body">
          {/* Story Intro */}
          <div className="pangolin-guide-card bg-amber-950/40 border border-amber-500/30">
            <h4 className="text-sm font-black text-amber-200 flex items-center gap-1.5 mb-1.5">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              스토리 배경 (Google Pangolin Love 모티브)
            </h4>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              사랑하는 친구에게 감동적인 선물을 전하기 위해 떠나는 세계 여행! 가나의 카카오 숲, 인도의 향신료 언덕, 중국의 대나무 계곡, 필리핀의 별빛 해변까지 4대 테마 월드를 질주하며 완주선에 골인하세요!
            </p>
          </div>

          {/* Key Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
            <div className="pangolin-guide-card">
              <h4 className="text-xs font-black text-emerald-300 flex items-center gap-1.5 mb-2">
                <Compass className="w-3.5 h-3.5" />
                PC 키보드 조작
              </h4>
              <ul className="text-[11px] text-slate-300 space-y-1.5">
                <li><strong className="text-amber-400">좌 / 우 방향키 (또는 A, D)</strong>: 이동 및 걷기</li>
                <li><strong className="text-amber-400">Shift / Z / Ctrl</strong>: 몸을 둥글게 말아 데굴데굴 고속 롤링!</li>
                <li><strong className="text-amber-400">스페이스바 (또는 W, ⬆️)</strong>: 점프 & 공중 더블 점프</li>
              </ul>
            </div>

            <div className="pangolin-guide-card">
              <h4 className="text-xs font-black text-sky-300 flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5" />
                모바일 터치 조작
              </h4>
              <ul className="text-[11px] text-slate-300 space-y-1.5">
                <li><strong className="text-sky-400">좌/우 온스크린 버튼</strong>: 부드러운 방향 이동</li>
                <li><strong className="text-amber-400">⚡ 롤링 버튼</strong>: 즉시 몸을 말아 초고속 질주</li>
                <li><strong className="text-pink-400">🦘 점프 버튼</strong>: 2단 더블 점프 지원</li>
              </ul>
            </div>
          </div>

          {/* Items & Objects */}
          <div className="pangolin-guide-card mb-3">
            <h4 className="text-xs font-black text-purple-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              아이템 & 특수 기믹
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
                <div className="text-xl mb-1">🍫/🌺/🎵/✨</div>
                <div className="font-bold text-amber-200">스테이지 수집품</div>
                <div className="text-[10px] text-slate-400">기본 점수 + 콤보 배율</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
                <div className="text-xl mb-1">💖</div>
                <div className="font-bold text-pink-300">황금 하트</div>
                <div className="text-[10px] text-slate-400">+500점 & 제한시간 +10초</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
                <div className="text-xl mb-1">⚡</div>
                <div className="font-bold text-purple-300">슈퍼 롤링 젬</div>
                <div className="text-[10px] text-slate-400">5초 무적 & 마그넷 흡입</div>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
                <div className="text-xl mb-1">🍄</div>
                <div className="font-bold text-sky-300">스프링 버섯</div>
                <div className="text-[10px] text-slate-400">초고공 슈퍼 점프 발판</div>
              </div>
            </div>
          </div>

          {/* Score & Leaderboard Rules */}
          <div className="pangolin-guide-card bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-200">
            <strong className="text-rose-300 font-black flex items-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              도촌초등학교 명예의 전당 랭킹 등록 규칙
            </strong>
            4개 스테이지를 모두 완주하면 <strong className="text-amber-400">+5,000점의 대형 완주 보너스</strong>가 주어집니다! 획득 점수가 <strong className="text-yellow-300">100점을 초과</strong>한 경우에만 도촌초 실시간 명예의 전당에 이름을 올릴 수 있습니다.
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button onClick={onClose} className="pangolin-btn-start w-full sm:w-auto px-6 py-2">
            확인 및 게임하기
          </button>
        </div>
      </div>
    </div>
  );
}
