import React, { useState, useEffect } from 'react';
import { getLeaderboardFromDB } from '../utils/leaderboardApi';
import { Trophy, X, Crown, Medal, Zap, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Responsive In-Page Centered Popup Window Modal */}
      <div className="relative w-full max-w-lg bg-[#1C1F24] border-2 border-amber-400/50 rounded-3xl p-5 md:p-6 text-white shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Large Touch-Friendly Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2.5 rounded-full transition flex items-center justify-center shadow-lg"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center justify-center text-center gap-1 pt-1">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              도촌초등학교 <span className="text-amber-400">명예의 전당</span>
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>실시간 클라우드 DB 연동</span>
            <span className="bg-teal-950/80 text-teal-300 border border-teal-500/50 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Live DB
            </span>
          </div>
        </div>

        {/* Game Tab Switcher */}
        <div className="flex items-center justify-center gap-2 bg-[#262A30] p-1.5 rounded-2xl border border-slate-700/60 w-full">
          <button
            onClick={() => setCurrentTab('pacman')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'pacman'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🟡 도촌 팩맨</span>
          </button>

          <button
            onClick={() => setCurrentTab('dino')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'dino'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🦖 도촌 공룡</span>
          </button>
        </div>

        {/* Leaderboard Score List */}
        <div className="flex flex-col gap-2.5 max-h-[300px] md:max-h-[340px] overflow-y-auto pr-1">
          {loading && scores.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>클라우드 백엔드 DB에서 랭킹을 불러오는 중...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-semibold">
              아직 등록된 랭킹 기록이 없습니다.<br />첫 번째 랭커에 도전해보세요!
            </div>
          ) : (
            scores.map((item, idx) => {
              const rank = idx + 1;
              let rankBadge = null;
              let cardBg = 'bg-[#25282E] border-slate-700/50';

              if (rank === 1) {
                rankBadge = <Crown className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />;
                cardBg = 'bg-amber-400/10 border-amber-400/60';
              } else if (rank === 2) {
                rankBadge = <Medal className="w-5 h-5 text-slate-300 shrink-0" />;
                cardBg = 'bg-slate-800/80 border-slate-600/50';
              } else if (rank === 3) {
                rankBadge = <Medal className="w-5 h-5 text-amber-700 shrink-0" />;
                cardBg = 'bg-amber-900/20 border-amber-800/50';
              } else {
                rankBadge = <span className="w-5 text-center text-xs font-bold text-slate-500">{rank}</span>;
              }

              return (
                <div
                  key={item.id || idx}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${cardBg} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div className="flex flex-col text-left">
                      <span className={`text-xs md:text-sm font-extrabold ${rank === 1 ? 'text-amber-300' : 'text-white'}`}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.date || '2026-08-13'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm md:text-base font-black text-amber-400">
                      {item.score.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">점</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Close Button */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">도촌초등학교 게임 명예의 전당</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            닫기 (Close)
          </button>
        </div>
      </div>
    </div>
  );
}
