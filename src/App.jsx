import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import GameCard from './components/GameCard';
import LeaderboardModal from './components/LeaderboardModal';
import ChangelogModal from './components/ChangelogModal';
import GuideModal from './components/GuideModal';
import RulesNoticeModal from './components/RulesNoticeModal';
import GameErrorBoundary from './components/GameErrorBoundary';
import { PLAYABLE_GAMES, COMING_SOON_GAMES, CATEGORY_DEFINITIONS } from './data/gamesData';
import { getLatestVersion } from './data/changelogData';
import { getAllLeaderboardsFromDB } from './utils/leaderboardApi';
import { getRankedPlayableGames } from './utils/rankingAlgorithm';
import { soundFx } from './utils/audio';
import { haptics } from './utils/haptics';
import { Trophy, X, Lock, Gamepad2, Dices, Heart, Crown, History, HelpCircle, Smartphone, RotateCcw, ShieldCheck, Search, Volume2, VolumeX } from 'lucide-react';

const GAME_COMPONENTS = {
  pacman: lazy(() => import('./components/games/pacman/PacManGame')),
  dino: lazy(() => import('./components/games/dino/DinoGame')),
  snake: lazy(() => import('./components/games/snake/SnakeGame')),
  solitaire: lazy(() => import('./components/games/solitaire/SolitaireGame')),
  minesweeper: lazy(() => import('./components/games/minesweeper/MinesweeperGame')),
  baseball: lazy(() => import('./components/games/baseball/BaseballGame')),
  gnome: lazy(() => import('./components/games/gnome/GnomeGame')),
  colortile: lazy(() => import('./components/games/colortile/ColorTileGame')),
  popcorn: lazy(() => import('./components/games/popcorn/PopcornGame')),
  tictactoe: lazy(() => import('./components/games/donut_tictactoe/DonutTicTacToeGame')),
  champion: lazy(() => import('./components/games/champion/ChampionGame')),
  cricket: lazy(() => import('./components/games/cricket/CricketGame')),
  ponyexpress: lazy(() => import('./components/games/ponyexpress/PonyExpressGame')),
  jerrylawson: lazy(() => import('./components/games/jerrylawson/JerryLawsonGame')),
  magic: lazy(() => import('./components/games/magic/MagicCatGame')),
  fruitmerge: lazy(() => import('./components/games/fruitmerge/FruitMergeGame')),
  brickbreaker: lazy(() => import('./components/games/brickbreaker/BrickBreakerGame')),
  skyjumper: lazy(() => import('./components/games/skyjumper/SkyJumperGame')),
  kidscoding: lazy(() => import('./components/games/kidscoding/KidsCodingGame')),
  bubbletea: lazy(() => import('./components/games/bubbletea/BubbleTeaGame')),
  pizza: lazy(() => import('./components/games/pizza/PizzaGame')),
  earthbee: lazy(() => import('./components/games/earthbee/EarthBeeGame')),
  olympics: lazy(() => import('./components/games/olympics/OlympicsGame')),
  pangolin: lazy(() => import('./components/games/pangolin/PangolinGame')),
  roswell: lazy(() => import('./components/games/roswell/RoswellGame')),
  petanque: lazy(() => import('./components/games/petanque/PetanqueGame')),
  halfmoon: lazy(() => import('./components/games/halfmoon/HalfMoonGame')),
  panipuri: lazy(() => import('./components/games/panipuri/PaniPuriGame')),
  memory: lazy(() => import('./components/games/memory/MemoryGame')),
  ghoulduel: lazy(() => import('./components/games/ghoulduel/GhoulDuelGame')),
  snowball: lazy(() => import('./components/games/snowball/SnowballGame')),
  schooltag: lazy(() => import('./components/games/schooltag/SchoolTagGame')),
};

export default function App() {
  const [activeGame, setActiveGame] = useState(null);
  const [isRulesOpen, setIsRulesOpen] = useState(() => {
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hideDate = localStorage.getItem('dochon_rules_hide_today');
      return hideDate !== today;
    } catch (e) {
      return true;
    }
  });
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGameOrientationDismissed, setIsGameOrientationDismissed] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('pacman');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(() => soundFx.muted);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Local Play Counts Tracking for Engagement Score
  const [playCounts, setPlayCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('dochon_play_counts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Top Champions Data & Activity Count for Playable Games
  const [topScores, setTopScores] = useState({});
  const [leaderboardCounts, setLeaderboardCounts] = useState({});

  useEffect(() => {
    // Fetch top scores and activity counts directly from Cloud DB in a single batch request
    async function fetchTopScores() {
      const topResults = {};
      const countResults = {};
      try {
        const allLeaderboards = await getAllLeaderboardsFromDB();
        for (const game of PLAYABLE_GAMES) {
          const list = allLeaderboards[game.id];
          if (list && list.length > 0) {
            topResults[game.id] = list[0];
            countResults[game.id] = list.length;
          }
        }
      } catch (e) {
        console.warn('[App] Batch leaderboard fetch error:', e);
      }
      setTopScores(topResults);
      setLeaderboardCounts(countResults);
    }
    fetchTopScores();
  }, [isLeaderboardOpen]);

  // Lock body scroll when a game modal is active
  useEffect(() => {
    if (activeGame) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [activeGame]);

  const toggleFavorite = (gameId) => {
    setFavorites(prev => {
      const next = prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId];
      try {
        localStorage.setItem('dochon_favorites', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handlePlayGame = (gameId) => {
    setPlayCounts(prev => {
      const next = { ...prev, [gameId]: (prev[gameId] || 0) + 1 };
      try {
        localStorage.setItem('dochon_play_counts', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setActiveGame(gameId);
  };

  // 🚀 [추천 1: 실시간 랭킹 등록 활성도] + [추천 3: 신작 부스트] 하이브리드 인기 순위 계산
  const rankedPlayableGames = useMemo(() => {
    return getRankedPlayableGames(PLAYABLE_GAMES, {
      leaderboardCounts,
      topScores,
      playCounts,
      favorites,
    });
  }, [leaderboardCounts, topScores, playCounts, favorites]);

  // Lucky Random Game Picker (🎲)
  const handleRandomPlay = () => {
    const randomGame = PLAYABLE_GAMES[Math.floor(Math.random() * PLAYABLE_GAMES.length)];
    if (randomGame) {
      handlePlayGame(randomGame.id);
    }
  };

  // Filtering Logic
  const allGames = [...rankedPlayableGames, ...COMING_SOON_GAMES];

  const filterGame = (game) => {
    // 1. Category filter
    if (filterCategory === 'FAVORITES') {
      if (!favorites.includes(game.id)) return false;
    } else if (filterCategory !== 'ALL') {
      if (game.category !== filterCategory) return false;
    }

    // 2. Real-time Search Query filter (supports Korean title, English title, description, category)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = game.title && game.title.toLowerCase().includes(q);
      const matchEng = game.englishTitle && game.englishTitle.toLowerCase().includes(q);
      const matchDesc = game.description && game.description.toLowerCase().includes(q);
      const matchCat = game.category && game.category.toLowerCase().includes(q);
      if (!matchTitle && !matchEng && !matchDesc && !matchCat) return false;
    }

    return true;
  };

  const filteredPlayable = rankedPlayableGames.filter(filterGame);
  const filteredComingSoon = COMING_SOON_GAMES.filter(filterGame);

  // Category counts calculation
  const getCategoryCount = (catId) => {
    if (catId === 'ALL') return allGames.length;
    if (catId === 'FAVORITES') return favorites.length;
    return allGames.filter(g => g.category === catId).length;
  };

  const handleToggleGlobalMute = () => {
    const nextMuted = soundFx.toggleMute();
    setIsMuted(nextMuted);
    try { haptics.light(); } catch (e) {}
  };

  const openInPageLeaderboardModal = (gameKey = 'pacman') => {
    setLeaderboardTab(gameKey);
    setIsLeaderboardOpen(true);
  };

  // Random / Auto-cycling Featured Game Algorithm for Hero Banner
  const [featuredGameIndex, setFeaturedGameIndex] = useState(() =>
    Math.floor(Math.random() * PLAYABLE_GAMES.length)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedGameIndex(prev => (prev + 1) % PLAYABLE_GAMES.length);
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  const featuredGame = PLAYABLE_GAMES[featuredGameIndex] || PLAYABLE_GAMES[0];
  const featuredChampion = topScores[featuredGame.id] || { name: '도촌 학생', score: 0 };
  const featuredScoreUnit = featuredGame.scoreUnit || (featuredGame.id === 'dino' ? 'm' : '점');

  const getChallengeBtnText = (game) => {
    if (game.id === 'pacman') return '🔥 팩맨 챔피언에 도전하기';
    if (game.id === 'dino') return '🔥 공룡 달리기 챔피언에 도전하기';
    if (game.id === 'snake') return '🔥 스네이크 챔피언에 도전하기';
    if (game.id === 'solitaire') return '🔥 솔리테어 챔피언에 도전하기';
    if (game.id === 'minesweeper') return '🔥 지뢰찾기 챔피언에 도전하기';
    if (game.id === 'baseball') return '🔥 야구왕 챔피언에 도전하기';
    return `🔥 ${game.title.replace('도촌 ', '')} 챔피언에 도전하기`;
  };

  return (
    <div className="portal-wrapper">
      
      {/* 1. Centered Header Bar */}
      <header className="portal-header">
        <div className="portal-title-box">
          <div className="portal-title-heading-row">
            <span className="portal-title-icon animate-bounce">🎮</span>
            <h1 className="portal-title-text">
              DOCHON GAMES <span className="text-amber-400">PORTAL</span>
            </h1>
            <span className="portal-title-icon animate-bounce">✨</span>
          </div>
          <p className="portal-subtitle-text">
            도촌초등학교 아케이드 게임 종합 포털
          </p>
        </div>

        {/* Quick Action Button Toolbar: Random Game, School Leaderboard, Update History, Guide, Rules & Sound Mute */}
        <div className="portal-search-row">
          <div className="portal-header-btn-row">
            {/* 🎲 Lucky Random Pick Button */}
            <button
              onClick={handleRandomPlay}
              className="btn-dice shadow-md flex items-center gap-1.5"
              title="어떤 게임을 할지 고민될 때! 랜덤 게임 시작"
            >
              <Dices className="w-3.5 h-3.5 text-emerald-300" />
              <span>랜덤 게임</span>
            </button>

            {/* 🏆 School Ranking Button */}
            <button
              onClick={() => openInPageLeaderboardModal(featuredGame.id)}
              className="btn-gold shadow-md flex items-center gap-1.5"
              title="학교 랭킹 팝업 열기"
            >
              <Trophy className="w-3.5 h-3.5 text-slate-950" />
              <span>학교 랭킹</span>
            </button>

            {/* 📜 Update History Button (Placed next to School Ranking) */}
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="btn-changelog shadow-md flex items-center gap-1.5"
              title="포털 업데이트 및 개선 내역 확인하기"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>업데이트</span>
            </button>

            {/* 💡 Portal Guide & Instructions Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="btn-guide shadow-md flex items-center gap-1.5"
              title="도촌 게임 포털 이용안내 확인하기"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>이용안내</span>
            </button>

            {/* 🛡️ Portal Safety & Rules Notice Modal Button */}
            <button
              onClick={() => setIsRulesOpen(true)}
              className="btn-rules shadow-md flex items-center gap-1.5"
              title="도촌초 게임 이용 및 안전 수칙 확인하기"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>이용수칙</span>
            </button>

            {/* 🔊 Beautiful Global Sound Mute Toggle Button */}
            <button
              onClick={handleToggleGlobalMute}
              className={`btn-sound-toggle shadow-md ${isMuted ? 'sound-off' : 'sound-on'}`}
              title={isMuted ? '전체 효과음 켜기 (현재 음소거 상태)' : '전체 효과음 끄기 (현재 사운드 켜짐)'}
              aria-label={isMuted ? '전체 효과음 켜기' : '전체 효과음 끄기'}
            >
              <span className={`sound-indicator-dot ${isMuted ? 'muted' : 'active'}`} />
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              ) : (
                <Volume2 className="w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
              )}
              <span>사운드</span>
              <span className={`sound-status-tag ${isMuted ? 'off' : 'on'}`}>
                {isMuted ? 'OFF' : 'ON'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Interactive Hero Hall of Fame Showcase Banner with Random/Auto-cycling Champions */}
      <section className="portal-hero-section">
        <div className="portal-hero-banner">
          <div className="portal-hero-content">
            <div className="portal-hero-champion-box">
              <div className="portal-hero-crown">
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="portal-hero-champion-info">
                <span className="portal-hero-champion-title">
                  👑 {featuredGame.title} 1위 챔피언&nbsp;&nbsp;
                </span>
                <span className="portal-hero-champion-name">
                  {featuredChampion.name || '도촌 학생'}
                  <strong className="portal-hero-champion-score">
                    ({featuredChampion.score ? featuredChampion.score.toLocaleString() : 0}{featuredScoreUnit})
                  </strong>
                </span>
              </div>
            </div>

            <div className="portal-hero-actions">
              <button
                onClick={() => handlePlayGame(featuredGame.id)}
                className="btn-hero-play"
              >
                <span>{getChallengeBtnText(featuredGame)}</span>
              </button>
              <button
                onClick={() => openInPageLeaderboardModal(featuredGame.id)}
                className="btn-hero-ranking"
              >
                <span>🏆 {featuredGame.title} 랭킹 보기</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🔍 Realtime Search Input Bar */}
      <div style={{ maxWidth: '640px', margin: '0 auto 16px auto', padding: '0 16px', width: '100%' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1.5px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '8px 14px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
        }}>
          <Search style={{ width: '18px', height: '18px', color: '#FBBF24', marginRight: '10px', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="찾고 싶은 게임을 검색해보세요 (예: 팩맨, 야구, 달리기, 틱택토)..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#CBD5E1',
                cursor: 'pointer',
                marginLeft: '8px',
                flexShrink: 0
              }}
              title="검색어 지우기"
            >
              <X style={{ width: '13px', height: '13px' }} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Centered Category Filter Chips Bar with Pictograms & Counters */}
      <nav className="portal-nav">
        <div className="portal-categories">
          {CATEGORY_DEFINITIONS.map(cat => {
            const count = getCategoryCount(cat.id);
            const isActive = filterCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`portal-category-chip ${isActive ? 'active' : ''}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`portal-category-counter ${isActive ? 'active' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. Centered Main Grid Container */}
      <main className="portal-main">
        {/* Search Empty State */}
        {searchQuery.trim() && filteredPlayable.length === 0 && filteredComingSoon.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '20px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            margin: '24px auto',
            maxWidth: '500px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginBottom: '6px' }}>
              '{searchQuery}' 검색 결과가 없습니다
            </h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
              게임 제목, 한글/영문 키워드, 카테고리로 다시 검색해보세요.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                color: '#F8FAFC',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              전체 게임 목록 보기
            </button>
          </div>
        )}

        {/* SECTION 1: PLAYABLE GAMES */}
        {filteredPlayable.length > 0 && (
          <section className="portal-section">
            <div className="portal-section-title">
              <div className="flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400 animate-pulse" />
                <h2 className="text-base font-black text-amber-300 tracking-tight uppercase">
                  ⚡ 즉시 플레이 가능 게임 (Playable Games)
                </h2>
              </div>
              <p className="text-[11px] text-slate-300 font-semibold">
                클릭 시 게임이 바로 시작되며 점수가 실시간 학교 랭킹에 기록됩니다!
              </p>
            </div>

            {/* Playable Games Grid (Top Row with Pulse Glow) */}
            <div className="game-tile-grid">
              {filteredPlayable.map(game => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  category={game.category}
                  imageSrc={game.imageSrc}
                  isPlayable={true}
                  badgeText={game.badgeText}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={toggleFavorite}
                  topScore={topScores[game.id]}
                  onPlay={() => handlePlayGame(game.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION SEPARATOR LINE DIVIDER */}
        <div className="portal-divider">
          <span className="portal-divider-badge">
            Dochon Arcade Matrix
          </span>
        </div>

        {/* SECTION 2: COMING SOON GAMES */}
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
                총 <strong className="text-amber-400">{filteredComingSoon.length}개</strong>의 신작 게임이 순차적으로 공개됩니다.
              </p>
            </div>

            {/* Coming Soon Tile Matrix */}
            <div className="game-tile-grid">
              {filteredComingSoon.map(game => (
                <GameCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  category={game.category}
                  imageSrc={game.imageSrc}
                  isPlayable={false}
                  badgeText={game.badgeText}
                  isFavorite={favorites.includes(game.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {/* EMPTY FAVORITES NOTICE */}
        {filterCategory === 'FAVORITES' && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center my-6 bg-slate-900/60 border border-pink-500/20 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 border-2 border-pink-500/30 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-pink-500/10 animate-bounce">
              💖
            </div>
            <h3 className="text-base sm:text-lg font-black text-pink-200 mb-1.5">
              아직 즐겨찾기에 등록된 게임이 없어요!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              원하는 게임 카드 우측 상단의 <strong className="text-pink-400">하트(💖)</strong>를 클릭하면<br />
              나만의 즐겨찾기 목록에 등록되어 빠르게 찾아볼 수 있습니다.
            </p>
          </div>
        )}
      </main>

      {/* 5. Responsive Overlay Popup Modal for Active Game */}
      {activeGame && (
        <div className="game-overlay">
          <div className="game-modal-box">
            {/* Modal Header Bar */}
            <div className="game-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FBBF24' }}>
                  {(() => {
                    const g = PLAYABLE_GAMES.find(item => item.id === activeGame);
                    return g ? `${g.iconEmoji || '🎮'} ${g.title} (${g.englishTitle || g.title})` : '도촌 게임';
                  })()}
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
                onClick={() => {
                  haptics.light();
                  setActiveGame(null);
                }}
                className="game-modal-close-btn"
                title="게임 종료 및 닫기"
              >
                <X style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                <span>닫기</span>
              </button>
            </div>

            {/* Mobile / Tablet In-Game Landscape Orientation Advice Toast */}
            {!isGameOrientationDismissed && (
              <div className="in-game-orientation-toast">
                <div className="in-game-orientation-toast-content">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                  <span>스마트폰을 가로로 돌리면 훨씬 넓고 쾌적하게 플레이할 수 있어요! 🔄</span>
                </div>
                <button
                  onClick={() => {
                    haptics.light();
                    setIsGameOrientationDismissed(true);
                  }}
                  className="in-game-orientation-dismiss"
                  title="안내 닫기"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modal Game Content Area with Code Splitting Suspense & Error Boundary */}
            <div className="game-modal-body">
              <GameErrorBoundary onClose={() => setActiveGame(null)} onRetry={() => {}}>
                <Suspense fallback={
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '340px',
                    gap: '14px',
                    color: '#FFD166'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '3px solid rgba(255, 209, 102, 0.2)',
                      borderTopColor: '#FFD166',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>게임을 불러오는 중...</span>
                  </div>
                }>
                  {(() => {
                    const SelectedGameComponent = GAME_COMPONENTS[activeGame];
                    if (!SelectedGameComponent) return null;
                    return (
                      <SelectedGameComponent
                        onScoreSubmitted={() => openInPageLeaderboardModal(activeGame)}
                      />
                    );
                  })()}
                </Suspense>
              </GameErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* 6. Pure HTML/CSS In-Page Overlay Modal for School Leaderboard */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        activeTab={leaderboardTab}
      />

      {/* 7. Pure HTML/CSS In-Page Overlay Modal for Changelog Release Notes */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* 8. Pure HTML/CSS In-Page Overlay Modal for Portal Guide & Mobile Advice */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* 9. Pure HTML/CSS In-Page Overlay Modal for Portal Rules & Safety Notice */}
      <RulesNoticeModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* 9. Centered Footer */}
      <footer className="portal-footer">
        <p className="font-bold text-amber-200/80">도촌초등학교 게임 포털</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Google Games 타일 방식 모방 · 비영리 초등학교 교육용 아케이드 포털
        </p>
      </footer>
    </div>
  );
}
