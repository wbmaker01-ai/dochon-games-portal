import React, { useState } from 'react';
import PacManGame from './components/games/PacManGame';
import DinoGame from './components/games/DinoGame';
import GameCard from './components/GameCard';
import LeaderboardModal from './components/LeaderboardModal';
import { PLAYABLE_GAMES, COMING_SOON_GAMES, CATEGORIES } from './data/gamesData';
import { Trophy, X, Search, Lock, Gamepad2, PlusCircle } from 'lucide-react';

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('pacman');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [comingSoonList, setComingSoonList] = useState(COMING_SOON_GAMES);

  const filterGame = (game) => {
    const matchesCategory = filterCategory === 'ALL' || game.category === filterCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  };

  const filteredPlayable = PLAYABLE_GAMES.filter(filterGame);
  const filteredComingSoon = comingSoonList.filter(filterGame);

  const openLeaderboardFor = (gameKey) => {
    setLeaderboardTab(gameKey);
    setIsLeaderboardOpen(true);
  };

  const handleAddNewGameDemo = () => {
    const newId = `custom_game_${Date.now()}`;
    const newGame = {
      id: newId,
      title: `도촌 추가 게임 #${comingSoonList.length + 1}`,
      category: '신규',
      imageSrc: '/thumbnails/memory.svg',
      isPlayable: false,
      badgeText: 'NEW ⭐'
    };
    setComingSoonList(prev => [...prev, newGame]);
  };

  return (
    <div className="min-h-screen bg-[#141619] text-white flex flex-col items-center justify-center text-center selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Header Bar (100% Centered) */}
      <header className="sticky top-0 z-40 bg-[#1E2022]/95 backdrop-blur-md border-b border-slate-800 px-4 py-4 w-full flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl w-full flex flex-col items-center justify-center text-center gap-3">
          {/* Main Title & Subtitle */}
          <div className="flex flex-col items-center justify-center text-center gap-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              DOCHON <span className="text-amber-400">GAMES</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
              도촌초등학교·중학교 게임 종합 포털
            </p>
          </div>

          {/* Search Input Bar & Leaderboard Button (Centered Row) */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg mt-1">
            <div className="flex items-center bg-[#2A2D32] border border-slate-700/60 rounded-full px-4 py-2 flex-1 min-w-[220px] text-xs">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="게임을 검색하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white focus:outline-none w-full placeholder-slate-500 font-medium text-center"
              />
            </div>

            <button
              onClick={() => openLeaderboardFor('pacman')}
              className="btn-gold text-xs px-4 py-2 rounded-full font-black shadow-md flex items-center justify-center gap-1.5 shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-950" />
              <span>학교 랭킹</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Category Chips Bar (100% Centered) */}
      <nav className="bg-[#1E2022] border-b border-slate-800/80 px-4 py-2.5 w-full flex items-center justify-center text-center">
        <div className="max-w-4xl w-full flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar flex-wrap">
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

      {/* 3. Main Grid Gallery Container (100% Centered) */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center text-center gap-8">
        
        {/* SECTION 1: PLAYABLE GAMES (TOP ROW - CENTERED) */}
        {filteredPlayable.length > 0 && (
          <section className="flex flex-col items-center justify-center text-center gap-4 w-full">
            <div className="flex flex-col items-center justify-center text-center gap-1">
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
            <div className="game-tile-grid justify-items-center">
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

        {/* SECTION SEPARATOR / LINE BREAK */}
        <div className="w-full max-w-[820px] my-2 border-t-2 border-dashed border-slate-800/80 relative flex items-center justify-center">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#141619] px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Dochon Arcade
          </span>
        </div>

        {/* SECTION 2: COMING SOON GAMES (BOTTOM ROWS - CENTERED) */}
        {filteredComingSoon.length > 0 && (
          <section className="flex flex-col items-center justify-center text-center gap-4 w-full">
            <div className="flex flex-col items-center justify-center text-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-extrabold text-slate-300 tracking-tight">
                  🔒 순차 개장 준비중인 게임 (Coming Soon)
                </h2>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <span>총 <strong className="text-amber-400">{filteredComingSoon.length}개</strong>의 준비중인 게임</span>
                <button
                  onClick={handleAddNewGameDemo}
                  className="text-[11px] bg-[#2A2D32] hover:bg-slate-700 border border-slate-700 text-amber-300 px-3 py-1 rounded-full font-bold transition flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> 게임 아래쪽에 추가하기 (+Add)
                </button>
              </div>
            </div>

            {/* Coming Soon 5-Column Tile Matrix */}
            <div className="game-tile-grid justify-items-center">
              {filteredComingSoon.map((game, index) => (
                <GameCard
                  key={`${game.id}_${index}`}
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

      {/* 4. Game Canvas Modal */}
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

      {/* 5. Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        activeTab={leaderboardTab}
      />

      {/* 6. Centered Footer */}
      <footer className="bg-[#181A1C] border-t border-slate-800 py-6 px-4 text-center text-slate-500 text-xs w-full flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full flex flex-col items-center justify-center text-center gap-1.5">
          <p className="font-bold text-slate-400">도촌초등학교·중학교 게임 포털</p>
          <p className="text-[11px] text-slate-600">
            Google Games 타일 방식 모방 · 비영리 교육용 확장 포털
          </p>
        </div>
      </footer>
    </div>
  );
}
