import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Shield,
  Flag,
  Pickaxe,
  Crown,
  Timer,
  Bomb,
  CheckCircle,
  AlertTriangle,
  Smile,
  Zap
} from 'lucide-react';
import { soundFx } from '../../../utils/audio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { getHighScore } from '../../../utils/leaderboard';
import {
  DIFFICULTIES,
  TILE_STATUS,
  NUMBER_COLORS,
  SCORING
} from './minesweeperConstants';
import {
  createEmptyBoard,
  initializeBoard,
  revealTile,
  toggleFlag,
  chordTile,
  checkWinCondition,
  autoFlagRemainingMines,
  revealAllMines,
  findSmartHint
} from './minesweeperLogic';
import MinesweeperHowToPlayModal from './MinesweeperHowToPlayModal';
import './minesweeper.css';

export default function MinesweeperGame({ onScoreSubmitted }) {
  const [difficultyKey, setDifficultyKey] = useState('easy');
  const activeDifficulty = DIFFICULTIES[difficultyKey];

  // Game Board & Status
  const [board, setBoard] = useState(() =>
    createEmptyBoard(activeDifficulty.rows, activeDifficulty.cols)
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [smiley, setSmiley] = useState('😊');

  // Stats & Timers
  const [flagsCount, setFlagsCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => getHighScore('minesweeper') || 0);

  // Kid-Friendly Features: Safety Shield & Mobile Mode Switcher
  const [shieldAvailable, setShieldAvailable] = useState(true);
  const [mobileMode, setMobileMode] = useState('dig'); // 'dig' | 'flag'
  const [coachMsg, setCoachMsg] = useState('🌱 첫 번째 잔디밭은 100% 안전해요! 마음에 드는 곳을 클릭해보세요.');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Victory Submission Form
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Touch Long-press Handler
  const longPressTimerRef = useRef(null);
  const isLongPressRef = useRef(false);

  // Timer Tick
  useEffect(() => {
    let timer;
    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStatus]);

  // Reset / Change Difficulty Game
  const startNewGame = useCallback((diffKey = difficultyKey) => {
    const diff = DIFFICULTIES[diffKey];
    setBoard(createEmptyBoard(diff.rows, diff.cols));
    setIsInitialized(false);
    setGameStatus('idle');
    setSmiley('😊');
    setFlagsCount(0);
    setTimeElapsed(0);
    setScore(0);
    setShieldAvailable(true);
    setSubmitted(false);
    setStudentName('');
    setCoachMsg('🌱 첫 번째 잔디밭은 100% 안전해요! 마음에 드는 곳을 콕 눌러보세요.');
  }, [difficultyKey]);

  // Handle Difficulty Switch
  const handleDifficultyChange = (key) => {
    setDifficultyKey(key);
    startNewGame(key);
  };

  // 1. Tile Click (Dig / Open)
  const handleTileClick = (r, c) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    // In Flag Mode (Mobile):
    if (mobileMode === 'flag') {
      handleToggleFlag(r, c);
      return;
    }

    let currentBoard = board;

    // First Click: Generate 100% Safe Opening Board
    if (!isInitialized) {
      currentBoard = initializeBoard(
        activeDifficulty.rows,
        activeDifficulty.cols,
        activeDifficulty.mines,
        r,
        c
      );
      setIsInitialized(true);
      setGameStatus('playing');
    }

    const tile = currentBoard[r][c];

    // Chording if already revealed
    if (tile.status === TILE_STATUS.REVEALED) {
      if (tile.adjacentMines > 0) {
        handleChord(r, c, currentBoard);
      }
      return;
    }

    if (tile.status === TILE_STATUS.FLAGGED) return;

    // Normal Reveal
    const res = revealTile(currentBoard, r, c);

    // Hit Mine!
    if (res.hitMine) {
      // 🛡️ Safety Shield Check (1-time save for elementary students)
      if (shieldAvailable) {
        setShieldAvailable(false);
        soundFx.playMilestone(); // Shield sound
        
        // Auto convert exploded mine to flag/shielded
        const savedBoard = currentBoard.map(row => row.map(t => ({ ...t })));
        savedBoard[r][c].status = TILE_STATUS.FLAGGED;
        setBoard(savedBoard);
        setFlagsCount(prev => prev + 1);
        setCoachMsg('🛡️ [안심 보호막 발동!] 지뢰를 밟았지만 방패가 막아주고 깃발(🚩)로 안전하게 표시했어요!');
        return;
      }

      // No shield -> Game Over
      soundFx.playGameOver();
      const finalBoard = revealAllMines(res.board, r, c);
      setBoard(finalBoard);
      setGameStatus('lost');
      setSmiley('😵');
      setCoachMsg('💥 아쉽게도 지뢰를 밟았어요! [스마일리 😊]나 [다시 도전]을 눌러 재도전해보세요.');
      return;
    }

    // Safe Open
    soundFx.playPacmanWaka();
    const newlyPoints = res.newlyRevealed * SCORING.TILE_REVEAL;
    setScore(prev => prev + newlyPoints);
    setBoard(res.board);

    // Check Win
    if (checkWinCondition(res.board, activeDifficulty.mines)) {
      handleGameWin(res.board, newlyPoints);
    }
  };

  // 2. Toggle Flag (Right click or Flag Mode)
  const handleToggleFlag = (r, c, e) => {
    if (e) e.preventDefault();
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    const res = toggleFlag(board, r, c);
    setBoard(res.board);
    setFlagsCount(prev => prev + res.flagCountDelta);

    if (res.newStatus === TILE_STATUS.FLAGGED) {
      soundFx.playCardFlip();
      setCoachMsg('🚩 깃발을 꽂았어요! 실수로 누르지 않도록 안전하게 보호됩니다.');
    } else {
      soundFx.playCardPlace();
    }
  };

  // 3. Chording (Double click on revealed number tile)
  const handleChord = (r, c, currentBoard = board) => {
    const res = chordTile(currentBoard, r, c);
    if (res.newlyRevealed === 0 && !res.hitMine) return;

    if (res.hitMine) {
      if (shieldAvailable) {
        setShieldAvailable(false);
        soundFx.playMilestone();
        setCoachMsg('🛡️ [안심 보호막 발동!] 번개 오픈 중 지뢰가 있었지만 방패가 지켜주었습니다!');
        setBoard(res.board);
        return;
      }
      soundFx.playGameOver();
      const finalBoard = revealAllMines(res.board);
      setBoard(finalBoard);
      setGameStatus('lost');
      setSmiley('😵');
      setCoachMsg('💥 깃발 위치가 잘못되어 지뢰가 터졌어요! 다시 차근차근 추리해보세요.');
      return;
    }

    soundFx.playSnakeEat();
    const chordPoints = res.newlyRevealed * SCORING.TILE_REVEAL + SCORING.CHORD_BONUS;
    setScore(prev => prev + chordPoints);
    setBoard(res.board);

    if (checkWinCondition(res.board, activeDifficulty.mines)) {
      handleGameWin(res.board, chordPoints);
    }
  };

  // 4. Game Win Celebration
  const handleGameWin = (finalBoard, lastPoints = 0) => {
    const flaggedBoard = autoFlagRemainingMines(finalBoard);
    setBoard(flaggedBoard);
    setGameStatus('won');
    setSmiley('😎');

    // Calculate final score bonuses
    const timeBonus = Math.max(0, (activeDifficulty.targetTime - timeElapsed) * 10);
    const shieldBonus = shieldAvailable ? SCORING.SHIELD_UNUSED_BONUS : 0;
    const finalScoreCalc = score + lastPoints + activeDifficulty.baseClearBonus + timeBonus + shieldBonus;

    setScore(finalScoreCalc);
    soundFx.playSolitaireWin();

    // Confetti Fireworks
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setCoachMsg(`🎉 축하합니다! 모든 지뢰를 완벽하게 찾아냈습니다! (보너스 +${activeDifficulty.baseClearBonus + timeBonus + shieldBonus}점)`);
  };

  // 5. Smart Hint Feature
  const handleSmartHint = () => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    if (!isInitialized) {
      setCoachMsg('💡 첫 번째 잔디밭을 먼저 아무 곳이나 열어주세요!');
      return;
    }

    const hint = findSmartHint(board);
    if (hint) {
      soundFx.playHintSound();
      const hintBoard = board.map((row, r) =>
        row.map((tile, c) => ({
          ...tile,
          isHinted: r === hint.r && c === hint.c
        }))
      );
      setBoard(hintBoard);
      setCoachMsg(`${hint.title} : ${hint.message}`);
    } else {
      setCoachMsg('🧐 현재 확실한 힌트를 찾을 수 없어요. 다른 열린 숫자들을 찬찬히 관찰해보세요!');
    }
  };

  // 6. Hall of Fame High Score Submission (Rule: score > 100)
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || submitted || score <= 100) return;

    await submitScoreToDB('minesweeper', studentName.trim(), score);
    setSubmitted(true);
    if (onScoreSubmitted) {
      onScoreSubmitted();
    }
  };

  // 7. Touch Handlers for Mobile (Long Press for Flag)
  const handleTouchStart = (r, c) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      handleToggleFlag(r, c);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const remainingMinesDisplay = activeDifficulty.mines - flagsCount;

  // Responsive Grid Tile Size
  const tileSize = Math.max(24, Math.min(42, Math.floor(640 / activeDifficulty.cols)));

  return (
    <div className="minesweeper-wrapper">
      
      {/* 1. Header Bar: Difficulty Selector & Header Controls */}
      <div className="minesweeper-header-bar">
        <div className="minesweeper-controls-row">
          
          {/* Difficulty Chips */}
          <div className="minesweeper-diff-chips">
            {Object.keys(DIFFICULTIES).filter(k => k !== 'custom').map(key => {
              const diff = DIFFICULTIES[key];
              const isActive = difficultyKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDifficultyChange(key)}
                  className={`minesweeper-diff-chip ${isActive ? 'active' : ''}`}
                >
                  <span>{diff.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Action Tools */}
          <div className="minesweeper-tools-group">
            <button
              onClick={handleSmartHint}
              className="minesweeper-tool-btn btn-ms-hint"
              title="확실한 안전 칸이나 지뢰 칸 힌트 보기"
              disabled={gameStatus === 'won' || gameStatus === 'lost'}
            >
              <Lightbulb className="w-3.5 h-3.5 text-slate-950" />
              <span>💡 힌트</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="minesweeper-tool-btn btn-ms-rule"
              title="게임 방법 및 초등학생 꿀팁 보기"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>📖 룰북</span>
            </button>

            <button
              onClick={() => {
                const m = soundFx.toggleMute();
                setIsMuted(m);
              }}
              className="minesweeper-tool-btn btn-ms-audio"
              title="효과음 켜기/끄기"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* 2. Google Style Dashboard Banner */}
        <div className="minesweeper-dashboard">
          {/* Left: Remaining Mines Counter */}
          <div className="ms-counter-box" title="남은 지뢰 개수">
            <Bomb className="w-4 h-4 text-rose-400" />
            <span>{String(remainingMinesDisplay).padStart(3, '0')}</span>
          </div>

          {/* Center: Smiley Face Reset Button */}
          <button
            onClick={() => startNewGame()}
            className="ms-smiley-btn"
            title="새 게임 시작하기"
          >
            {smiley}
          </button>

          {/* Right: Timer Counter */}
          <div className="ms-counter-box time" title="경과 시간">
            <Timer className="w-4 h-4 text-sky-400" />
            <span>{String(timeElapsed).padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-bar: Mobile Mode Switcher & Safety Shield Status */}
      <div className="minesweeper-subbar">
        {/* Mobile / Touch Dig vs Flag Mode Toggle */}
        <div className="ms-mobile-mode-group">
          <button
            onClick={() => setMobileMode('dig')}
            className={`ms-mode-btn ${mobileMode === 'dig' ? 'active dig' : ''}`}
          >
            <Pickaxe className="w-3.5 h-3.5" />
            <span>⛏️ 파기 모드</span>
          </button>
          <button
            onClick={() => setMobileMode('flag')}
            className={`ms-mode-btn ${mobileMode === 'flag' ? 'active flag' : ''}`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>🚩 깃발 모드</span>
          </button>
        </div>

        {/* Safety Shield Guard Badge */}
        <div className={`ms-shield-badge ${!shieldAvailable ? 'used' : ''}`}>
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {shieldAvailable ? '🛡️ 안심 보호막 1회 대기중' : '🛡️ 보호막 사용 완료'}
          </span>
        </div>

        {/* Real-Time Score Badge */}
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>점수: {score.toLocaleString()}점</span>
        </div>
      </div>

      {/* 4. The Grass Grid Board Area */}
      <div className="minesweeper-board-container" style={{ position: 'relative' }}>
        <div
          className="minesweeper-grid"
          style={{
            gridTemplateColumns: `repeat(${activeDifficulty.cols}, ${tileSize}px)`,
            gridTemplateRows: `repeat(${activeDifficulty.rows}, ${tileSize}px)`,
            gap: '1px'
          }}
          onMouseDown={() => {
            if (gameStatus === 'playing') setSmiley('😮');
          }}
          onMouseUp={() => {
            if (gameStatus === 'playing') setSmiley('😊');
          }}
        >
          {board.map((row, r) =>
            row.map((tile, c) => {
              const isEvenGrid = (r + c) % 2 === 0;
              let tileClass = 'ms-tile ';

              if (tile.status === TILE_STATUS.HIDDEN) {
                tileClass += isEvenGrid ? 'hidden light-grass' : 'hidden dark-grass';
              } else if (tile.status === TILE_STATUS.REVEALED) {
                tileClass += isEvenGrid ? 'revealed light-dirt' : 'revealed dark-dirt';
              } else if (tile.status === TILE_STATUS.FLAGGED) {
                tileClass += isEvenGrid ? 'hidden light-grass flagged' : 'hidden dark-grass flagged';
              } else if (tile.status === TILE_STATUS.EXPLODED) {
                tileClass += 'exploded';
              }

              if (tile.isHinted) tileClass += ' hinted';
              if (tile.isWrongFlag) tileClass += ' wrong-flag';

              // Display Content
              let content = null;
              if (tile.status === TILE_STATUS.FLAGGED) {
                content = <span style={{ fontSize: `${tileSize * 0.55}px` }}>🚩</span>;
              } else if (tile.status === TILE_STATUS.EXPLODED) {
                content = <span style={{ fontSize: `${tileSize * 0.6}px` }}>💥</span>;
              } else if (tile.status === TILE_STATUS.REVEALED) {
                if (tile.isMine) {
                  content = <span style={{ fontSize: `${tileSize * 0.55}px` }}>💣</span>;
                } else if (tile.adjacentMines > 0) {
                  content = (
                    <span style={{ color: NUMBER_COLORS[tile.adjacentMines], fontSize: `${tileSize * 0.58}px` }}>
                      {tile.adjacentMines}
                    </span>
                  );
                }
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={tileClass}
                  style={{
                    width: `${tileSize}px`,
                    height: `${tileSize}px`
                  }}
                  onClick={() => {
                    if (!isLongPressRef.current) {
                      handleTileClick(r, c);
                    }
                  }}
                  onContextMenu={(e) => handleToggleFlag(r, c, e)}
                  onTouchStart={() => handleTouchStart(r, c)}
                  onTouchEnd={handleTouchEnd}
                >
                  {content}
                </div>
              );
            })
          )}
        </div>

        {/* 5. VICTORY MODAL OVERLAY */}
        {gameStatus === 'won' && (
          <div className="ms-result-overlay">
            <div className="ms-result-box">
              <Crown className="w-14 h-14 text-amber-400 fill-amber-400 animate-bounce" />
              <h2 className="ms-result-title">🎉 지뢰찾기 클리어 성공! 🎉</h2>
              <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0 }}>
                도촌초등학교 최고의 추리 마스터로 인정합니다! 🌿
              </p>

              <div className="ms-stats-grid">
                <div className="ms-stat-card">
                  <span className="ms-stat-label">최종 점수</span>
                  <span className="ms-stat-val" style={{ color: '#FBBF24' }}>
                    {score.toLocaleString()}점
                  </span>
                </div>
                <div className="ms-stat-card">
                  <span className="ms-stat-label">소요 시간</span>
                  <span className="ms-stat-val" style={{ color: '#38BDF8' }}>
                    {timeElapsed}초
                  </span>
                </div>
                <div className="ms-stat-card">
                  <span className="ms-stat-label">난이도</span>
                  <span className="ms-stat-val" style={{ color: '#34D399' }}>
                    {activeDifficulty.name.replace(/[^\uAC00-\uD7A3]/g, '')}
                  </span>
                </div>
              </div>

              {/* Hall of Fame Score Submission (Rule: score > 100) */}
              {score > 100 ? (
                !submitted ? (
                  <form onSubmit={handleScoreSubmit} className="ms-score-form">
                    <label style={{ fontSize: '11px', fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 도촌 명예의 전당 점수 등록
                    </label>
                    <input
                      type="text"
                      placeholder="예: 홍길동"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="ms-score-input"
                      maxLength={16}
                      required
                    />
                    <button type="submit" className="btn-ms-submit">
                      <Trophy className="w-4 h-4" /> 랭킹 등록하기
                    </button>
                  </form>
                ) : (
                  <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)', border: '1px solid #10B981', color: '#6EE7B7', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                    ✅ 도촌 명예의 전당에 랭킹이 성공적으로 등록되었습니다!
                  </div>
                )
              ) : (
                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid #334155', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', color: '#94A3B8' }}>
                  💡 100점을 초과 달성하면 명예의 전당에 점수를 등록할 수 있어요!
                </div>
              )}

              <button onClick={() => startNewGame()} className="btn-ms-retry">
                <RotateCcw className="w-4 h-4" /> 다시 도전하기
              </button>
            </div>
          </div>
        )}

        {/* 6. GAME OVER OVERLAY */}
        {gameStatus === 'lost' && (
          <div className="ms-result-overlay">
            <div className="ms-result-box gameover">
              <Bomb className="w-14 h-14 text-rose-500 animate-pulse" />
              <h2 className="ms-result-title gameover">💥 앗! 지뢰가 터졌어요! 💥</h2>
              <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0 }}>
                실망하지 마세요! 숫자의 단서를 하나씩 모으면 다음엔 꼭 성공할 수 있어요.
              </p>

              <div className="ms-stats-grid">
                <div className="ms-stat-card">
                  <span className="ms-stat-label">획득 점수</span>
                  <span className="ms-stat-val" style={{ color: '#FBBF24' }}>
                    {score.toLocaleString()}점
                  </span>
                </div>
                <div className="ms-stat-card">
                  <span className="ms-stat-label">진행 시간</span>
                  <span className="ms-stat-val" style={{ color: '#38BDF8' }}>
                    {timeElapsed}초
                  </span>
                </div>
                <div className="ms-stat-card">
                  <span className="ms-stat-label">난이도</span>
                  <span className="ms-stat-val" style={{ color: '#34D399' }}>
                    {activeDifficulty.name.replace(/[^\uAC00-\uD7A3]/g, '')}
                  </span>
                </div>
              </div>

              {/* 100-Point Rule for Game Over */}
              {score > 100 ? (
                !submitted ? (
                  <form onSubmit={handleScoreSubmit} className="ms-score-form">
                    <label style={{ fontSize: '11px', fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 도촌 명예의 전당 점수 등록
                    </label>
                    <input
                      type="text"
                      placeholder="예: 홍길동"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="ms-score-input"
                      maxLength={16}
                      required
                    />
                    <button type="submit" className="btn-ms-submit">
                      <Trophy className="w-4 h-4" /> 랭킹 등록하기
                    </button>
                  </form>
                ) : (
                  <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.8)', border: '1px solid #10B981', color: '#6EE7B7', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                    ✅ 도촌 명예의 전당에 랭킹이 성공적으로 등록되었습니다!
                  </div>
                )
              ) : null}

              <button onClick={() => startNewGame()} className="btn-ms-retry">
                <RotateCcw className="w-4 h-4" /> 다시 도전하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Bottom Coach Message Banner */}
      <div className="ms-coach-banner">
        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{coachMsg}</span>
      </div>

      {/* 8. Elementary School How-to-Play Modal */}
      <MinesweeperHowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
