import React, { useState } from 'react';
import { getLeaderboard } from '../utils/leaderboard';
import { Trophy, X, Medal, Crown, Sparkles } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose, activeTab = 'pacman' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  if (!isOpen) return null;

  const data = getLeaderboard();
  const scores = data[currentTab] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl glass-panel glass-panel-gold p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2.5 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-amber-400/20 border-2 border-amber-400/50 rounded-2xl">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gradient-gold flex items-center gap-2">
              도촌 명예의 전당 <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300 font-bold">학교 친구들의 당당한 전교 랭킹을 확인하세요!</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3">
          <button
            onClick={() => setCurrentTab('pacman')}
            className={`px-4 py-2.5 rounded-xl font-black text-sm transition ${
              currentTab === 'pacman'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🕹️ 도촌 팩맨
          </button>
          <button
            onClick={() => setCurrentTab('dino')}
            className={`px-4 py-2.5 rounded-xl font-black text-sm transition ${
              currentTab === 'dino'
                ? 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/30 scale-105'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🦖 도촌 공룡 달리기
          </button>
          <button
            onClick={() => setCurrentTab('snake')}
            className={`px-4 py-2.5 rounded-xl font-black text-sm transition ${
              currentTab === 'snake'
                ? 'bg-purple-400 text-slate-950 shadow-lg shadow-purple-400/30 scale-105'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🐍 도촌 스네이크
          </button>
        </div>

        {/* Rankings Table */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
          {scores.length === 0 ? (
            <p className="text-center py-10 text-slate-400 font-bold">아직 등록된 전교 랭킹 기록이 없습니다.</p>
          ) : (
            scores.map((item, index) => (
              <div
                key={item.id || index}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                  index === 0
                    ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/15'
                    : index === 1
                    ? 'bg-slate-800/90 border-slate-400/60'
                    : index === 2
                    ? 'bg-amber-950/40 border-amber-700/60'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base">
                    {index === 0 ? (
                      <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
                    ) : index === 1 ? (
                      <Medal className="w-6 h-6 text-slate-200" />
                    ) : index === 2 ? (
                      <Medal className="w-6 h-6 text-amber-600" />
                    ) : (
                      <span className="text-slate-400 font-mono">#{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-black text-amber-300">{item.score.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-bold ml-1">점</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <button onClick={onClose} className="btn-outline text-xs px-6 py-2.5 font-bold">
            닫기 (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
