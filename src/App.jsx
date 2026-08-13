import React, { useState, useEffect } from 'react';
import PacManGame from './components/games/pacman/PacManGame';
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

  // Lock body scroll when a game modal is active (No ESC key exit to prevent accidental loss of gameplay progress)
  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [activeGame]);

  const filterGame = (game) => {
    const matchesCategory = filterCategory === 'ALL' || game.category === filterCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  };

  const filteredPlayable = PLAYABLE_GAMES.filter(filterGame);
  const filteredComingSoon = COMING_SOON_GAMES.filter(filterGame);

  const openInPageLeaderboardModal = (gameKey = 'pacman') => {
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

        {/* Search Bar & Pure In-Page Modal Button */}
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
            onClick={() => openInPageLeaderboardModal('pacman')}
            className="btn-gold shadow-md flex items-center gap-1.5"
            title="학교 랭킹 팝업 열기"
          >
            <Trophy className="w-4 h-4 text-slate-950" />
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

      {/* 4. Responsive Overlay Popup Modal (Safe Closing: Only Close Button Exits) */}
      {activeGame && (
        <div className="game-overlay">
          <div className="game-modal-box">
            {/* Modal Header Bar */}
            <div className="game-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FBBF24' }}>
                  {activeGame === 'pacman' ? '🕹️ 도촌 팩맨 (DOCHON PAC-MAN)' : '🦖 도촌 공룡 달리기'}
                </span>
                <span style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  color: '#FBBF24',
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase'
                }}>
                  Dochon Arcade
                </span>
              </div>

              <button
                onClick={() => setActiveGame(null)}
                className="game-modal-close-btn"
                title="게임 종료 및 닫기"
              >
                <X style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                <span>닫기</span>
              </button>
            </div>

            {/* Modal Game Content Area */}
            <div className="game-modal-body">
              {activeGame === 'pacman' && (
                <PacManGame onScoreSubmitted={() => openInPageLeaderboardModal('pacman')} />
              )}
              {activeGame === 'dino' && (
                <DinoGame onScoreSubmitted={() => openInPageLeaderboardModal('dino')} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Pure HTML/CSS In-Page Overlay Modal (Zero Browser Window Popups) */}
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
