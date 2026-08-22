import React, { useState, useEffect, useMemo } from 'react';
import PacManGame from './components/games/pacman/PacManGame';
import DinoGame from './components/games/dino/DinoGame';
import SnakeGame from './components/games/snake/SnakeGame';
import SolitaireGame from './components/games/solitaire/SolitaireGame';
import MinesweeperGame from './components/games/minesweeper/MinesweeperGame';
import BaseballGame from './components/games/baseball/BaseballGame';
import GnomeGame from './components/games/gnome/GnomeGame';
import ColorTileGame from './components/games/colortile/ColorTileGame';
import PopcornGame from './components/games/popcorn/PopcornGame';
import DonutTicTacToeGame from './components/games/donut_tictactoe/DonutTicTacToeGame';
import ChampionGame from './components/games/champion/ChampionGame';
import CricketGame from './components/games/cricket/CricketGame';
import PonyExpressGame from './components/games/ponyexpress/PonyExpressGame';
import JerryLawsonGame from './components/games/jerrylawson/JerryLawsonGame';
import MagicCatGame from './components/games/magic/MagicCatGame';
import FruitMergeGame from './components/games/fruitmerge/FruitMergeGame';
import BrickBreakerGame from './components/games/brickbreaker/BrickBreakerGame';
import SkyJumperGame from './components/games/skyjumper/SkyJumperGame';
import KidsCodingGame from './components/games/kidscoding/KidsCodingGame';
import BubbleTeaGame from './components/games/bubbletea/BubbleTeaGame';
import PizzaGame from './components/games/pizza/PizzaGame';
import EarthBeeGame from './components/games/earthbee/EarthBeeGame';
import OlympicsGame from './components/games/olympics/OlympicsGame';
import PangolinGame from './components/games/pangolin/PangolinGame';
import GameCard from './components/GameCard';
import LeaderboardModal from './components/LeaderboardModal';
import ChangelogModal from './components/ChangelogModal';
import GuideModal from './components/GuideModal';
import RulesNoticeModal from './components/RulesNoticeModal';
import { PLAYABLE_GAMES, COMING_SOON_GAMES, CATEGORY_DEFINITIONS } from './data/gamesData';
import { getLatestVersion } from './data/changelogData';
import { getLeaderboardFromDB } from './utils/leaderboardApi';
import { getRankedPlayableGames } from './utils/rankingAlgorithm';
import { haptics } from './utils/haptics';
import { Trophy, X, Lock, Gamepad2, Dices, Heart, Crown, History, HelpCircle, Smartphone, RotateCcw, ShieldCheck } from 'lucide-react';

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
    // Fetch top scores and activity counts directly from Cloud DB
    async function fetchTopScores() {
      const topResults = {};
      const countResults = {};
      for (const game of PLAYABLE_GAMES) {
        try {
          const list = await getLeaderboardFromDB(game.id);
          if (list && list.length > 0) {
            topResults[game.id] = list[0];
            countResults[game.id] = list.length;
          }
        } catch (e) {}
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
    if (filterCategory === 'FAVORITES') {
      return favorites.includes(game.id);
    }
    if (filterCategory !== 'ALL') {
      return game.category === filterCategory;
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
  const featuredScoreUnit = featuredGame.id === 'dino' ? 'm' : '점';

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

        {/* Quick Action Button Toolbar: Random Game, School Leaderboard, Update History & Guide */}
        <div className="portal-search-row">
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {/* 🎲 Lucky Random Pick Button */}
            <button
              onClick={handleRandomPlay}
              className="btn-dice shadow-md flex items-center gap-1.5"
              title="어떤 게임을 할지 고민될 때! 랜덤 게임 시작"
            >
              <Dices className="w-4 h-4 text-emerald-300" />
              <span>랜덤 게임</span>
            </button>

            {/* 🏆 School Ranking Button */}
            <button
              onClick={() => openInPageLeaderboardModal(featuredGame.id)}
              className="btn-gold shadow-md flex items-center gap-1.5"
              title="학교 랭킹 팝업 열기"
            >
              <Trophy className="w-4 h-4 text-slate-950" />
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
                  {activeGame === 'pacman' && '🕹️ 도촌 팩맨 (DOCHON PAC-MAN)'}
                  {activeGame === 'dino' && '🦖 도촌 공룡 달리기 (DOCHON DINO RUN)'}
                  {activeGame === 'snake' && '🐍 도촌 스네이크 (DOCHON SNAKE MASTER)'}
                  {activeGame === 'solitaire' && '🃏 도촌 솔리테어 (DOCHON SOLITAIRE)'}
                  {activeGame === 'minesweeper' && '💣 도촌 지뢰찾기 (DOCHON MINESWEEPER)'}
                  {activeGame === 'baseball' && '⚾ 도촌 야구왕 (DOCHON BASEBALL KING)'}
                  {activeGame === 'gnome' && '🌿 도촌 정원 요정 (DOCHON GARDEN GNOMES)'}
                  {activeGame === 'colortile' && '🧩 도촌 컬러 타일 (DOCHON COLOR TILE)'}
                  {activeGame === 'popcorn' && '🍿 도촌 팝콘 (DOCHON POPCORN SURVIVAL)'}
                  {activeGame === 'tictactoe' && '🍩 도촌 도넛 틱택토 (DONUT TIC-TAC-TOE)'}
                  {activeGame === 'champion' && '🏆 도촌 챔피언 아일랜드 (CHAMPION ISLAND)'}
                  {activeGame === 'cricket' && '🏏 도촌 크리켓 (DOCHON CRICKET)'}
                  {activeGame === 'ponyexpress' && '🐎 도촌 포니 익스프레스 (PONY EXPRESS)'}
                  {activeGame === 'jerrylawson' && '🕹️ 도촌 제리 로슨 (JERRY LAWSON)'}
                  {activeGame === 'magic' && '🧙 도촌 마법 고양이 (MAGIC CAT ACADEMY)'}
                  {activeGame === 'fruitmerge' && '🍉 도촌 과일 합치기 (DOCHON FRUIT MERGE)'}
                  {activeGame === 'brickbreaker' && '🧱 도촌 벽돌 격파왕 (DOCHON BRICK BREAKER)'}
                  {activeGame === 'skyjumper' && '🚀 도촌 스카이 점퍼 (DOCHON SKY JUMPER)'}
                  {activeGame === 'kidscoding' && '🐰 도촌 코딩 토끼 (DOCHON KIDS CODING)'}
                  {activeGame === 'bubbletea' && '🧋 도촌 버블티 카페 (DOCHON BUBBLE TEA CAFE)'}
                  {activeGame === 'pizza' && '🍕 도촌 피자 마스터 (DOCHON PIZZA MASTER)'}
                  {activeGame === 'earthbee' && '🐝 도촌 꿀벌의 비행 (DOCHON EARTH BEE)'}
                  {activeGame === 'olympics' && '🏅 도촌 미니 올림픽 (DOCHON MINI OLYMPICS)'}
                  {activeGame === 'pangolin' && '🦔 도촌 천산갑의 모험 (PANGOLIN ADVENTURE)'}
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

            {/* Mobile / Tablet In-Game Landscape Orientation Advice Toast (개선안 2) */}
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

            {/* Modal Game Content Area */}
            <div className="game-modal-body">
              {activeGame === 'pacman' && (
                <PacManGame onScoreSubmitted={() => openInPageLeaderboardModal('pacman')} />
              )}
              {activeGame === 'dino' && (
                <DinoGame onScoreSubmitted={() => openInPageLeaderboardModal('dino')} />
              )}
              {activeGame === 'snake' && (
                <SnakeGame onScoreSubmitted={() => openInPageLeaderboardModal('snake')} />
              )}
              {activeGame === 'solitaire' && (
                <SolitaireGame onScoreSubmitted={() => openInPageLeaderboardModal('solitaire')} />
              )}
              {activeGame === 'minesweeper' && (
                <MinesweeperGame onScoreSubmitted={() => openInPageLeaderboardModal('minesweeper')} />
              )}
              {activeGame === 'baseball' && (
                <BaseballGame onScoreSubmitted={() => openInPageLeaderboardModal('baseball')} />
              )}
              {activeGame === 'gnome' && (
                <GnomeGame onScoreSubmitted={() => openInPageLeaderboardModal('gnome')} />
              )}
              {activeGame === 'colortile' && (
                <ColorTileGame onScoreSubmitted={() => openInPageLeaderboardModal('colortile')} />
              )}
              {activeGame === 'popcorn' && (
                <PopcornGame onScoreSubmitted={() => openInPageLeaderboardModal('popcorn')} />
              )}
              {activeGame === 'tictactoe' && (
                <DonutTicTacToeGame onScoreSubmitted={() => openInPageLeaderboardModal('tictactoe')} />
              )}
              {activeGame === 'champion' && (
                <ChampionGame onScoreSubmitted={() => openInPageLeaderboardModal('champion')} />
              )}
              {activeGame === 'cricket' && (
                <CricketGame onScoreSubmitted={() => openInPageLeaderboardModal('cricket')} />
              )}
              {activeGame === 'ponyexpress' && (
                <PonyExpressGame onScoreSubmitted={() => openInPageLeaderboardModal('ponyexpress')} />
              )}
              {activeGame === 'jerrylawson' && (
                <JerryLawsonGame onScoreSubmitted={() => openInPageLeaderboardModal('jerrylawson')} />
              )}
              {activeGame === 'magic' && (
                <MagicCatGame onScoreSubmitted={() => openInPageLeaderboardModal('magic')} />
              )}
              {activeGame === 'fruitmerge' && (
                <FruitMergeGame onScoreSubmitted={() => openInPageLeaderboardModal('fruitmerge')} />
              )}
              {activeGame === 'brickbreaker' && (
                <BrickBreakerGame onScoreSubmitted={() => openInPageLeaderboardModal('brickbreaker')} />
              )}
              {activeGame === 'skyjumper' && (
                <SkyJumperGame onScoreSubmitted={() => openInPageLeaderboardModal('skyjumper')} />
              )}
              {activeGame === 'kidscoding' && (
                <KidsCodingGame onScoreSubmitted={() => openInPageLeaderboardModal('kidscoding')} />
              )}
              {activeGame === 'bubbletea' && (
                <BubbleTeaGame onScoreSubmitted={() => openInPageLeaderboardModal('bubbletea')} />
              )}
              {activeGame === 'pizza' && (
                <PizzaGame onScoreSubmitted={() => openInPageLeaderboardModal('pizza')} />
              )}
              {activeGame === 'earthbee' && (
                <EarthBeeGame onScoreSubmitted={() => openInPageLeaderboardModal('earthbee')} />
              )}
              {activeGame === 'olympics' && (
                <OlympicsGame onScoreSubmitted={() => openInPageLeaderboardModal('olympics')} />
              )}
              {activeGame === 'pangolin' && (
                <PangolinGame onScoreSubmitted={() => openInPageLeaderboardModal('pangolin')} />
              )}
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
