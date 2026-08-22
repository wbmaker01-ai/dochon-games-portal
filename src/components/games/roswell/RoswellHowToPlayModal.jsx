import React from 'react';
import { HelpCircle, X, Compass, Key, Sparkles, Trophy, Zap, ShieldCheck } from 'lucide-react';

export default function RoswellHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="roswell-modal-backdrop">
      <div className="roswell-modal-box">
        {/* Header */}
        <div className="roswell-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
              🛸
            </div>
            <div>
              <h2 className="text-lg font-black text-emerald-300 flex items-center gap-1.5">
                도촌 UFO 탈출작전 가이드
              </h2>
              <p className="text-xs text-slate-400">구글 두들 로즈웰 66주년 기념작 모티브 어드벤처</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="roswell-icon-btn"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="roswell-modal-body space-y-4 text-sm text-slate-200">
          
          {/* Story */}
          <div className="bg-slate-800/60 border border-emerald-500/30 rounded-2xl p-3.5">
            <h3 className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5">
              <span>📖</span> 불시착 스토리
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              도촌초등학교 인근 시골 마을에 불시착한 외계인을 도와주세요!<br />
              마을 곳곳(들판, 헛간, 농가)에 흩어진 <strong className="text-emerald-400">3가지 핵심 UFO 부품</strong>을 찾아 비행접시를 수리하고 무사히 우주로 탈출시키는 포인트 앤 클릭 어드벤처 퍼즐입니다.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎮</span> 게임 조작 방법
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong className="text-white">화면 터치/클릭:</strong> 원하는 지점을 클릭하면 외계인이 해당 위치로 걸어갑니다.</li>
              <li><strong className="text-white">좌우 화살표 (◀ / ▶):</strong> 클릭하여 다른 장소(불시착지, 들판, 헛간, 농가)로 이동합니다.</li>
              <li><strong className="text-white">사물 조사 및 상호작용:</strong> 수상하거나 반짝이는 물건을 클릭하여 조사하거나 획득합니다.</li>
              <li><strong className="text-white">인벤토리 아이템 사용:</strong> 하단 가방에서 아이템을 선택(터치)한 상태로 대상 사물을 클릭합니다.</li>
            </ul>
          </div>

          {/* 3 UFO Parts Mission */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3.5 space-y-2">
            <h3 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>💎</span> 회수해야 할 3대 부품
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-900/60 border border-emerald-500/20 p-2 rounded-xl">
                <div className="text-xl mb-1">💎</div>
                <div className="font-bold text-emerald-300">에너지 코어</div>
                <div className="text-[10px] text-slate-400">들판 잠자는 소</div>
              </div>
              <div className="bg-slate-900/60 border border-emerald-500/20 p-2 rounded-xl">
                <div className="text-xl mb-1">🔮</div>
                <div className="font-bold text-cyan-300">조종석 유리 돔</div>
                <div className="text-[10px] text-slate-400">헛간 풍차 지붕</div>
              </div>
              <div className="bg-slate-900/60 border border-emerald-500/20 p-2 rounded-xl">
                <div className="text-xl mb-1">📡</div>
                <div className="font-bold text-purple-300">추진 안테나</div>
                <div className="text-[10px] text-slate-400">농부의 침실</div>
              </div>
            </div>
          </div>

          {/* Leaderboard Rule Notice */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-200/90 flex items-start gap-2">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">명예의 전당 랭킹 팁:</strong> 탈출에 성공하면 기본 1,200점 + 남은 시간 비례 보너스 점수가 가산됩니다. 빠른 속도로 퍼즐을 풀어 1위 챔피언에 등극해보세요!
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="roswell-modal-footer">
          <button
            onClick={onClose}
            className="roswell-modal-confirm-btn"
          >
            외계인 탈출 도우러 가기!
          </button>
        </div>
      </div>
    </div>
  );
}
