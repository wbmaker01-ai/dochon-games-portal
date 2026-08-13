import React, { useState } from 'react';
import PacManGame from './components/games/PacManGame';
import DinoGame from './components/games/DinoGame';
import GameCard from './components/GameCard';
import LeaderboardModal from './components/LeaderboardModal';
import { PLAYABLE_GAMES, COMING_SOON_GAMES, CATEGORIES } from './data/gamesData';
import { Trophy, X, Search, Lock, Gamepad2 } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('pacman');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filterGame = (game) => {
    const matchesCategory = filterCategory === 'ALL' || game.category === filterCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  };

  const filteredPlayable = PLAYABLE_GAMES.filter(filterGame);
  const filteredComingSoon = COMING_SOON_GAMES.filter(filterGame);

  const openLeaderboardFor = (gameKey) => {
    setLeaderboardTab(gameKey);
    setIsLeaderboardOpen(true);
  };

  return (
    <div className="portal-wrapper">
      {/* 1. Centered Header Bar */}
      <header className="portal-header">
        <div className="portal-title-box">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            DOCHON GAMES <span className="text-amber-400">PORTAL</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
            도촌초등학교 게임 종합 포털
          </p>
        </div>

        {/* Search Bar & Leaderboard Button */}
        <div className="portal-search-row">
          <div className="portal-search-input">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="게임을 검색하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => openLeaderboardFor('pacman')}
            className="btn-gold shadow-md"
          >
            <Trophy className="w-3.5 h-3.5 text-slate-950" />
            <span>학교 랭킹</span>
          </button>
        </div>
      </header>

      {/* 2. Centered Category Filter Chips Bar */}
      <nav className="portal-nav">
        <div className="portal-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                  : 'bg-[#2A2D32] text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {cat === 'ALL' ? '전체 보기' : cat}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. Centered Main Grid Container */}
      <main className="portal-main">
        {/* SECTION 1: PLAYABLE GAMES (TOP ROW) */}
        {filteredPlayable.length > 0 && (
          <section className="portal-section">
            <div className="portal-section-title">
              <div className="flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black text-amber-300 tracking-tight uppercase">
                  🔥 즉시 플레이 가능 게임 (Playable Games)
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold">
                클릭 시 게임이 바로 실행되며 점수가 학교 랭킹에 기록됩니다!
              </p>
            </div>

            {/* Playable Games Grid (Top Row) */}
            <div className="game-tile-grid">
              {filteredPlayable.map(game => (
                <GameCard
                  key={game.id}
                  title={game.title}
                  category={game.category}
                  imageSrc={game.imageSrc}
                  isPlayable={true}
                  badgeText={game.badgeText}
                  onPlay={() => setActiveGame(game.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION SEPARATOR LINE DIVIDER */}
        <div className="portal-divider">
          <span className="portal-divider-badge">
            Dochon Arcade
          </span>
        </div>

        {/* SECTION 2: COMING SOON GAMES (BOTTOM ROWS) */}
        {filteredComingSoon.length > 0 && (
          <section className="portal-section">
            <div className="portal-section-title">
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-extrabold text-slate-300 tracking-tight">
                  🔒 순차 개장 준비중인 게임 (Coming Soon)
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                총 <strong className="text-amber-400">{filteredComingSoon.length}개</strong>의 준비중인 게임
              </p>
            </div>

            {/* Coming Soon 5-Column Tile Matrix */}
            <div className="game-tile-grid">
              {filteredComingSoon.map(game => (
                <GameCard
                  key={game.id}
                  title={game.title}
                  category={game.category}
                  imageSrc={game.imageSrc}
                  isPlayable={false}
                  badgeText={game.badgeText}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 4. Game Modal Frame */}
      {activeGame && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl my-auto">
            <button
              onClick={() => setActiveGame(null)}
              className="absolute -top-12 right-0 text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition flex items-center gap-1 text-xs font-black px-4 shadow-xl"
            >
              <X className="w-5 h-5" /> 닫기 (Esc)
            </button>

            {activeGame === 'pacman' && (
              <PacManGame onScoreSubmitted={() => openLeaderboardFor('pacman')} />
            )}
            {activeGame === 'dino' && (
              <DinoGame onScoreSubmitted={() => openLeaderboardFor('dino')} />
            )}
          </div>
        </div>
      )}

      {/* 5. Leaderboard Popup Window Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        activeTab={leaderboardTab}
      />

      {/* 6. Centered Footer */}
      <footer className="portal-footer">
        <p className="font-bold text-slate-400">도촌초등학교 게임 포털</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Google Games 타일 방식 모방 · 비영리 교육용 확장 포털
        </p>
      </footer>
    </div>
  );
}
