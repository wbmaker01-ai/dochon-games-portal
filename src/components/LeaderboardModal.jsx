import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/leaderboard';
import { Trophy, X, Crown, Medal, User, Zap } from 'lucide-react';

export default function LeaderboardModal({ isOpen, onClose, activeTab = 'pacman' }) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      const data = getLeaderboard(currentTab);
      setScores(data);
    }
  }, [isOpen, currentTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Centered Popup Window Frame */}
      <div className="relative w-full max-w-lg bg-[#1C1F24] border-2 border-amber-400/50 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition flex items-center justify-center"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center justify-center text-center gap-1.5 pt-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black tracking-tight text-white">
              도촌초등학교 <span className="text-amber-400">명예의 전당</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            게임별 실시간 전교 하이스코어 순위입니다.
          </p>
        </div>

        {/* Game Tab Switcher */}
        <div className="flex items-center justify-center gap-2 bg-[#262A30] p-1.5 rx-full rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setCurrentTab('pacman')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'pacman'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🟡 도촌 팩맨</span>
          </button>

          <button
            onClick={() => setCurrentTab('dino')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              currentTab === 'dino'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🦖 도촌 공룡</span>
          </button>
        </div>

        {/* Leaderboard Score List */}
        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {scores.length === 0 ? (
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
                      <span className={`text-xs font-extrabold ${rank === 1 ? 'text-amber-300' : 'text-white'}`}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">
                      {item.score.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">점</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-500">
          도촌초등학교 게임 명예의 전당 · 하이스코어 랭킹
        </div>
      </div>
    </div>
  );
}
