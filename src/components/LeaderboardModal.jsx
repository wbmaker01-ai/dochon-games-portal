import React, { useState, useEffect } from 'react';
import { getLeaderboardFromDB } from '../utils/leaderboardApi';
import { Trophy, X, Crown, Medal, Zap, RefreshCw, Sparkles, Star, Heart } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose, activeTab = 'pacman' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadScores();
      const interval = setInterval(loadScores, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentTab]);

  const loadScores = async () => {
    setLoading(true);
    const data = await getLeaderboardFromDB(currentTab);
    setScores(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-overlay">
      {/* Colorful 3D Candy Pop Container Box */}
      <div className="leaderboard-modal-box">
        
        {/* Vibrant Red Close Button */}
        <button
          onClick={onClose}
          className="leaderboard-close-btn"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Playful Header with Colorful Badges */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 pt-1">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-2xl shadow-lg border-2 border-white rotate-3">
              <Trophy className="w-7 h-7 text-amber-950 fill-amber-900" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-md">
              도촌초등학교 <span className="text-amber-300">명예의 전당</span>
            </h2>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="bg-pink-500/30 text-pink-200 border border-pink-400/50 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm">
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> 도촌어린이 랭킹
            </span>
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" /> 실시간 클라우드 DB
            </span>
          </div>
        </div>

        {/* Colorful Game Tab Switcher */}
        <div className="flex items-center justify-center gap-2.5 bg-slate-900/80 p-2 rounded-2xl border-2 border-slate-700/80 w-full shadow-inner">
          <button
            onClick={() => setCurrentTab('pacman')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
              currentTab === 'pacman'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 scale-105 border-2 border-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🟡</span>
            <span>도촌 팩맨</span>
          </button>

          <button
            onClick={() => setCurrentTab('dino')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md ${
              currentTab === 'dino'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-emerald-950 scale-105 border-2 border-white'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span className="text-base">🦖</span>
            <span>도촌 공룡</span>
          </button>
        </div>

        {/* Leaderboard Score List with Colorful Rank Cards */}
        <div className="flex flex-col gap-2.5 max-h-[300px] md:max-h-[340px] overflow-y-auto pr-1">
          {loading && scores.length === 0 ? (
            <div className="py-8 text-center text-amber-300 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900/50 rounded-2xl border border-slate-700">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>클라우드 백엔드 DB에서 랭킹을 불러오는 중...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="py-8 text-center text-slate-300 text-xs font-bold bg-slate-900/50 rounded-2xl border border-slate-700">
              아직 등록된 랭킹 기록이 없습니다.<br />첫 번째 랭커에 도전해보세요! 🚀
            </div>
          ) : (
            scores.map((item, idx) => {
              const rank = idx + 1;
              let rankBadge = null;
              let rowClass = 'rank-other';
              let nameColor = 'text-white';
              let scoreColor = 'text-amber-300';

              if (rank === 1) {
                rowClass = 'rank-1';
                nameColor = 'text-amber-950 font-black';
                scoreColor = 'text-amber-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white">
                    <Crown className="w-4 h-4 text-yellow-200 fill-yellow-200" /> 1등
                  </div>
                );
              } else if (rank === 2) {
                rowClass = 'rank-2';
                nameColor = 'text-sky-950 font-black';
                scoreColor = 'text-sky-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-sky-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white">
                    <Medal className="w-4 h-4 text-sky-100" /> 2등
                  </div>
                );
              } else if (rank === 3) {
                rowClass = 'rank-3';
                nameColor = 'text-rose-950 font-black';
                scoreColor = 'text-rose-900 font-black';
                rankBadge = (
                  <div className="flex items-center gap-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-black shadow-md border border-white">
                    <Medal className="w-4 h-4 text-rose-100" /> 3등
                  </div>
                );
              } else {
                rankBadge = (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-extrabold border border-slate-600">
                    {rank}
                  </div>
                );
              }

              return (
                <div
                  key={item.id || idx}
                  className={`leaderboard-score-row ${rowClass}`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div className="flex flex-col text-left">
                      <span className={`text-sm md:text-base font-black ${nameColor}`}>
                        {item.name}
                      </span>
                      <span className={`text-[10px] ${rank <= 3 ? 'opacity-80 font-bold' : 'text-slate-400'}`}>
                        {item.date || '2026-08-13'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-xl border border-white/20">
                    <Zap className={`w-4 h-4 ${rank <= 3 ? scoreColor : 'text-amber-400'}`} />
                    <span className={`text-base md:text-lg font-black ${scoreColor}`}>
                      {item.score.toLocaleString()} <span className="text-[11px] font-bold opacity-80">점</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Vibrant Bottom Controls */}
        <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-amber-200 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 도촌초등학교 랭킹 포털
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 rounded-2xl text-xs font-black transition-all shadow-lg border-2 border-white hover:scale-105 active:scale-95"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
