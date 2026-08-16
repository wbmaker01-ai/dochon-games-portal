import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GRID_SIZE,
  TILE_COLORS,
  GAME_SETTINGS
} from './colortileConstants';
import {
  createInitialBoard,
  getMatchingTilesForCell,
  findValidMoves,
  getHintMove,
  countRemainingTiles,
  shuffleExistingTiles,
  soundManager
} from './colortileLogic';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import ColorTileHowToPlayModal from './ColorTileHowToPlayModal';
import './colortile.css';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Trophy,
  Shuffle,
  Lightbulb,
  Award,
  Crown,
  Heart
} from 'lucide-react';

export default function ColorTileGame({ onScoreSubmitted }) {
  // Game Setup & Modes
  const [gameMode, setGameMode] = useState('timeattack'); // 'timeattack' | 'zen'
  const [board, setBoard] = useState(() => createInitialBoard(GRID_SIZE));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SETTINGS.INITIAL_TIME);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [matchCountTotal, setMatchCountTotal] = useState(0);
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'gameover' | 'cleared'

  // Items & Helpers
  const [hintsLeft, setHintsLeft] = useState(GAME_SETTINGS.INITIAL_HINTS);
  const [shufflesLeft, setShufflesLeft] = useState(GAME_SETTINGS.INITIAL_SHUFFLES);
  const [hintCell, setHintCell] = useState(null);

  // Hover & Cross Ray Highlights
  const [hoveredCell, setHoveredCell] = useState(null);
  const [activeRays, setActiveRays] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [missMarkers, setMissMarkers] = useState([]);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Leaderboard Registration State
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const boardRef = useRef(null);
  const comboTimerRef = useRef(null);
  const lastMatchTimeRef = useRef(Date.now());

  // Mute sync
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Main Game Timer for 'timeattack'
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'timeattack') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          handleGameOver('timeover');
          return 0;
        }
        return Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // Check Remaining Tiles & Auto-Clear Condition
  const remainingTiles = countRemainingTiles(board);

  useEffect(() => {
    if (remainingTiles === 0 && gameState === 'playing') {
      handleGameClear();
    } else if (gameState === 'playing') {
      // Check if valid moves exist
      const validMoves = findValidMoves(board);
      if (validMoves.length === 0 && remainingTiles > 0) {
        // No valid moves left: Auto shuffle if available, or force shuffle
        if (shufflesLeft > 0) {
          handleShuffle(true);
        } else {
          // If no shuffles left, give one emergency shuffle
          setBoard(prev => shuffleExistingTiles(prev));
          triggerFloatingText('자동 재배치!', '#38BDF8', 50, 50);
        }
      }
    }
  }, [board, remainingTiles, gameState]);

  // Reset & Start New Game
  const startNewGame = useCallback((mode = gameMode) => {
    setGameMode(mode);
    setBoard(createInitialBoard(GRID_SIZE));
    setScore(0);
    setTimeLeft(GAME_SETTINGS.INITIAL_TIME);
    setCombo(1);
    setMaxCombo(1);
    setMatchCountTotal(0);
    setGameState('playing');
    setHintsLeft(GAME_SETTINGS.INITIAL_HINTS);
    setShufflesLeft(GAME_SETTINGS.INITIAL_SHUFFLES);
    setHintCell(null);
    setHoveredCell(null);
    setActiveRays([]);
    setFloatingTexts([]);
    setMissMarkers([]);
    setPlayerName('');
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, [gameMode]);

  // Handle Game Over
  const handleGameOver = (reason) => {
    setGameState('gameover');
    soundManager.playGameOver();
  };

  // Handle All Tiles Cleared Victory
  const handleGameClear = () => {
    setGameState('cleared');
    soundManager.playVictory();
    const timeBonus = gameMode === 'timeattack' ? Math.floor(timeLeft * 100) : 1000;
    const finalBonus = GAME_SETTINGS.CLEARED_ALL_BONUS + timeBonus;
    setScore(prev => prev + finalBonus);
    triggerFloatingText(`PERFECT CLEAR! +${finalBonus}`, '#FBBF24', 50, 50);
  };

  // Trigger floating Juice text
  const triggerFloatingText = (text, color, percentX, percentY) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, color, x: percentX, y: percentY }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 750);
  };

  // Trigger floating miss X marker
  const triggerMissMarker = (percentX, percentY) => {
    const id = Date.now() + Math.random();
    setMissMarkers(prev => [...prev, { id, x: percentX, y: percentY }]);
    setTimeout(() => {
      setMissMarkers(prev => prev.filter(item => item.id !== id));
    }, 400);
  };

  // Cell Click Handler
  const handleCellClick = (row, col) => {
    if (gameState !== 'playing') return;

    // Must click an EMPTY cell
    if (board[row][col] !== null) {
      soundManager.playTick();
      return;
    }

    const matchResult = getMatchingTilesForCell(board, row, col);

    if (matchResult.matched) {
      // 1. Success Match!
      const count = matchResult.matchedTiles.length;
      
      // Calculate Combo
      const now = Date.now();
      let currentCombo = combo;
      if (now - lastMatchTimeRef.current < GAME_SETTINGS.COMBO_TIMEOUT_MS) {
        currentCombo = combo + 1;
      } else {
        currentCombo = 1;
      }
      lastMatchTimeRef.current = now;
      setCombo(currentCombo);
      setMaxCombo(prev => Math.max(prev, currentCombo));

      // Reset Combo Timer
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(1);
      }, GAME_SETTINGS.COMBO_TIMEOUT_MS);

      // Score Calculation
      let basePoints = GAME_SETTINGS.BASE_SCORE_2_TILES;
      let timeAdd = GAME_SETTINGS.TIME_BONUS_2_TILES;
      if (count === 3) {
        basePoints = GAME_SETTINGS.BASE_SCORE_3_TILES;
        timeAdd = GAME_SETTINGS.TIME_BONUS_3_TILES;
      } else if (count >= 4) {
        basePoints = GAME_SETTINGS.BASE_SCORE_4_TILES;
        timeAdd = GAME_SETTINGS.TIME_BONUS_4_TILES;
      }

      const comboMultiplier = 1 + (currentCombo - 1) * 0.25;
      const earnedScore = Math.round(basePoints * comboMultiplier);

      setScore(prev => prev + earnedScore);
      setMatchCountTotal(prev => prev + count);

      if (gameMode === 'timeattack') {
        setTimeLeft(prev => Math.min(99.9, parseFloat((prev + timeAdd).toFixed(1))));
      }

      // Audio & VFX
      soundManager.playMatch(currentCombo, count);
      setActiveRays(matchResult.rays);
      setTimeout(() => setActiveRays([]), 300);

      // Remove matched tiles from board
      setBoard(prev => {
        const nextBoard = prev.map(r => [...r]);
        for (const t of matchResult.matchedTiles) {
          nextBoard[t.r][t.c] = null;
        }
        return nextBoard;
      });

      // Clear Hint if this move was the hint
      if (hintCell && hintCell.r === row && hintCell.c === col) {
        setHintCell(null);
      }

      // Floating Score & Combo Text
      const clickPercentX = ((col + 0.5) / GRID_SIZE) * 100;
      const clickPercentY = ((row + 0.5) / GRID_SIZE) * 100;

      const firstColorObj = TILE_COLORS.find(c => c.id === matchResult.matchedTiles[0]?.colorId);
      const glowCol = firstColorObj ? firstColorObj.mainColor : '#FBBF24';

      let textMsg = `+${earnedScore}`;
      if (count >= 4) textMsg = `💥 SUPER MATCH! +${earnedScore}`;
      else if (currentCombo >= 3) textMsg = `🔥 COMBO x${currentCombo}! +${earnedScore}`;

      triggerFloatingText(textMsg, glowCol, clickPercentX, clickPercentY);

    } else {
      // 2. Miss Click (No match from this empty cell)
      soundManager.playMiss();
      setCombo(1);

      const clickPercentX = ((col + 0.5) / GRID_SIZE) * 100;
      const clickPercentY = ((row + 0.5) / GRID_SIZE) * 100;

      triggerMissMarker(clickPercentX, clickPercentY);

      if (gameMode === 'timeattack') {
        setTimeLeft(prev => Math.max(0, parseFloat((prev - GAME_SETTINGS.MISS_PENALTY_TIME).toFixed(1))));
        triggerFloatingText('-1.0s', '#EF4444', clickPercentX, clickPercentY);
      }
    }
  };

  // Hint Button Handler
  const handleUseHint = () => {
    if (hintsLeft <= 0 || gameState !== 'playing') return;
    const bestMove = getHintMove(board);
    if (bestMove) {
      setHintsLeft(prev => prev - 1);
      setHintCell({ r: bestMove.r, c: bestMove.c });
      soundManager.playHint();
      triggerFloatingText('💡 힌트 발견!', '#38BDF8', ((bestMove.c + 0.5) / GRID_SIZE) * 100, ((bestMove.r + 0.5) / GRID_SIZE) * 100);

      // Auto dismiss hint highlight after 4 seconds
      setTimeout(() => {
        setHintCell(null);
      }, 4000);
    }
  };

  // Shuffle Button Handler
  const handleShuffle = (isAuto = false) => {
    if (!isAuto && (shufflesLeft <= 0 || gameState !== 'playing')) return;
    
    if (!isAuto) {
      setShufflesLeft(prev => prev - 1);
    }
    
    soundManager.playShuffle();
    setBoard(prev => shuffleExistingTiles(prev));
    setHintCell(null);
    triggerFloatingText('🔀 타일 재배치 완료!', '#8B5CF6', 50, 50);
  };

  // Leaderboard Score Submit
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || score <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('colortile', playerName.trim(), score);
      setIsSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Highlight calculations for hover cross lines
  const isCellInCrossHover = (r, c) => {
    if (!hoveredCell) return false;
    return (hoveredCell.r === r || hoveredCell.c === c) && board[r][c] === null;
  };

  const isHitTargetTile = (r, c) => {
    if (!hoveredCell || board[hoveredCell.r][hoveredCell.c] !== null) return false;
    // Check if (r, c) is one of the 4 first tiles hit by the hover
    const hitTiles = getMatchingTilesForCell(board, hoveredCell.r, hoveredCell.c).allHitTiles;
    return hitTiles?.some(t => t.r === r && t.c === c);
  };

  // Time progress bar width & color
  const timePercent = Math.min(100, (timeLeft / GAME_SETTINGS.INITIAL_TIME) * 100);
  const timeBarColor = timeLeft > 25 ? '#10B981' : timeLeft > 10 ? '#F59E0B' : '#EF4444';

  return (
    <div className="colortile-container">
      
      {/* 1. Header Bar with Mode Switch, Sound, Help & Restart */}
      <div className="colortile-header-bar">
        <div className="colortile-title-group">
          <span className="colortile-title-text">
            <span>🧩</span>
            <span>도촌 <span className="colortile-title-highlight">컬러 타일</span></span>
          </span>

          {/* Mode Selector */}
          <div className="colortile-mode-toggle">
            <button
              onClick={() => startNewGame('timeattack')}
              className={`colortile-mode-btn ${gameMode === 'timeattack' ? 'active' : ''}`}
              title="60초 타임어택 (명예의 전당 랭킹 도전)"
            >
              <Clock style={{ width: '12px', height: '12px' }} />
              <span>타임어택</span>
            </button>
            <button
              onClick={() => startNewGame('zen')}
              className={`colortile-mode-btn ${gameMode === 'zen' ? 'active' : ''}`}
              title="시간 제한 없이 편안하게 즐기는 힐링 모드"
            >
              <Sparkles style={{ width: '12px', height: '12px' }} />
              <span>힐링 퍼즐</span>
            </button>
          </div>
        </div>

        <div className="colortile-top-tools">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="colortile-tool-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX style={{ width: '14px', height: '14px', color: '#EF4444' }} /> : <Volume2 style={{ width: '14px', height: '14px', color: '#38BDF8' }} />}
          </button>

          {/* How To Play Modal */}
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="colortile-tool-btn"
            title="게임 방법 설명서"
          >
            <HelpCircle style={{ width: '14px', height: '14px', color: '#FBBF24' }} />
            <span>방법</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => startNewGame()}
            className="colortile-tool-btn"
            title="게임 처음부터 다시 시작"
          >
            <RotateCcw style={{ width: '14px', height: '14px', color: '#34D399' }} />
            <span>재시작</span>
          </button>
        </div>
      </div>

      {/* 2. HUD Dashboard Bar */}
      <div className="colortile-hud-bar">
        {/* Score */}
        <div className="colortile-hud-card">
          <span className="colortile-hud-label">
            <Trophy style={{ width: '12px', height: '12px', color: '#FBBF24' }} />
            점수
          </span>
          <span className="colortile-hud-val score">{score.toLocaleString()}</span>
        </div>

        {/* Timer / Mode Display */}
        <div className="colortile-hud-card">
          <span className="colortile-hud-label">
            <Clock style={{ width: '12px', height: '12px', color: '#38BDF8' }} />
            {gameMode === 'timeattack' ? '남은 시간' : '게임 모드'}
          </span>
          <span className={`colortile-hud-val time ${gameMode === 'timeattack' && timeLeft <= 10 ? 'warning' : ''}`}>
            {gameMode === 'timeattack' ? `${timeLeft.toFixed(1)}초` : '무제한 🌿'}
          </span>
        </div>

        {/* Combo Multiplier */}
        <div className="colortile-hud-card">
          <span className="colortile-hud-label">
            <Zap style={{ width: '12px', height: '12px', color: '#A78BFA' }} />
            연속 콤보
          </span>
          <span className="colortile-hud-val combo">
            {combo > 1 ? `x${combo}` : '1.0x'}
          </span>
        </div>

        {/* Remaining Tiles */}
        <div className="colortile-hud-card">
          <span className="colortile-hud-label">
            <Heart style={{ width: '12px', height: '12px', color: '#EC4899' }} />
            남은 타일
          </span>
          <span className="colortile-hud-val">{remainingTiles}개</span>
        </div>
      </div>

      {/* Time Progress Bar for Time Attack */}
      {gameMode === 'timeattack' && (
        <div className="colortile-time-progress-bar">
          <div
            className="colortile-time-progress-fill"
            style={{
              width: `${timePercent}%`,
              backgroundColor: timeBarColor
            }}
          />
        </div>
      )}

      {/* 3. Action Items (Hint & Shuffle) */}
      <div className="colortile-actions-row">
        <button
          onClick={handleUseHint}
          disabled={hintsLeft <= 0 || gameState !== 'playing'}
          className="colortile-action-btn"
          title="매칭 가능한 최적의 빈 칸 힌트 (3회 제공)"
        >
          <Lightbulb style={{ width: '15px', height: '15px', color: '#FBBF24' }} />
          <span>힌트</span>
          <span className="colortile-badge-count">{hintsLeft}</span>
        </button>

        <button
          onClick={() => handleShuffle(false)}
          disabled={shufflesLeft <= 0 || gameState !== 'playing'}
          className="colortile-action-btn"
          title="타일 위치 무작위 셔플 (2회 제공)"
        >
          <Shuffle style={{ width: '15px', height: '15px', color: '#A78BFA' }} />
          <span>셔플</span>
          <span className="colortile-badge-count shuffle">{shufflesLeft}</span>
        </button>
      </div>

      {/* 4. 14x14 Game Board Matrix */}
      <div className="colortile-board-outer" ref={boardRef}>
        <div className="colortile-board-grid">
          {board.map((rowArr, r) =>
            rowArr.map((cellColorId, c) => {
              const isEmpty = cellColorId === null;
              const isCross = isEmpty && isCellInCrossHover(r, c);
              const isHint = hintCell && hintCell.r === r && hintCell.c === c;
              const isTargetHit = !isEmpty && isHitTargetTile(r, c);
              const colorObj = cellColorId ? TILE_COLORS.find(col => col.id === cellColorId) : null;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHoveredCell({ r, c })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`colortile-cell ${isEmpty ? 'empty' : ''} ${isCross ? 'cross-highlight' : ''} ${isHint ? 'hint-highlight' : ''}`}
                >
                  {!isEmpty && colorObj && (
                    <div
                      className={`colortile-block ${isTargetHit ? 'hit-target' : ''}`}
                      style={{
                        background: colorObj.bgGradient,
                        border: `1px solid ${colorObj.borderColor}`,
                        boxShadow: isTargetHit
                          ? `0 0 12px ${colorObj.mainColor}`
                          : `0 2px 4px rgba(0,0,0,0.3)`
                      }}
                    >
                      <span className="colortile-block-symbol">{colorObj.symbol}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SVG Laser Beam Ray Traces */}
        {activeRays.length > 0 && (
          <svg className="colortile-ray-svg">
            {activeRays.map((ray, idx) => {
              const x1 = ((ray.fromC + 0.5) / GRID_SIZE) * 100 + '%';
              const y1 = ((ray.fromR + 0.5) / GRID_SIZE) * 100 + '%';
              const x2 = ((ray.toC + 0.5) / GRID_SIZE) * 100 + '%';
              const y2 = ((ray.toR + 0.5) / GRID_SIZE) * 100 + '%';
              const colorObj = TILE_COLORS.find(c => c.id === ray.colorId);
              const strokeColor = colorObj ? colorObj.mainColor : '#FBBF24';

              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  className="colortile-ray-line"
                />
              );
            })}
          </svg>
        )}

        {/* Floating Juice Texts */}
        {floatingTexts.map(item => (
          <div
            key={item.id}
            className="colortile-floating-item"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              color: item.color
            }}
          >
            {item.text}
          </div>
        ))}

        {/* Miss X Markers */}
        {missMarkers.map(item => (
          <div
            key={item.id}
            className="colortile-miss-marker"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`
            }}
          >
            ✕
          </div>
        ))}

        {/* 5. Game Over / Victory Overlay Screen */}
        {gameState !== 'playing' && (
          <div className="colortile-overlay-modal">
            <div className="colortile-modal-icon">
              {gameState === 'cleared' ? '🏆' : '⏰'}
            </div>
            
            <h2 className="colortile-modal-title">
              {gameState === 'cleared' ? 'ALL CLEARED! 완벽 클리어!' : 'GAME OVER! 시간 종료!'}
            </h2>
            
            <p className="colortile-modal-subtitle">
              {gameState === 'cleared'
                ? '모든 컬러 타일을 완벽하게 정리했습니다! 최고의 집중력입니다!'
                : '제한 시간이 모두 소진되었습니다. 멋진 도전이었습니다!'}
            </p>

            <div className="colortile-score-summary-box">
              <div className="colortile-summary-stat">
                <span className="colortile-summary-label">최종 점수</span>
                <span className="colortile-summary-val">{score.toLocaleString()}점</span>
              </div>
              <div className="colortile-summary-stat">
                <span className="colortile-summary-label">최대 콤보</span>
                <span className="colortile-summary-val" style={{ color: '#A78BFA' }}>{maxCombo}x</span>
              </div>
              <div className="colortile-summary-stat">
                <span className="colortile-summary-label">제거 타일</span>
                <span className="colortile-summary-val" style={{ color: '#38BDF8' }}>{matchCountTotal}개</span>
              </div>
            </div>

            {/* Hall of Fame Score Registration Form */}
            {/* Rule: Hide score registration form completely when score <= 100 */}
            {score > 100 && (
              <form onSubmit={handleScoreSubmit} className="colortile-hof-form">
                <div style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Crown style={{ width: '13px', height: '13px' }} />
                  <span>도촌초 명예의 전당 점수 등록</span>
                </div>

                {!isSubmitted ? (
                  <div className="colortile-hof-input-row">
                    <input
                      type="text"
                      className="colortile-hof-input"
                      placeholder="예: 홍길동"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={10}
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      disabled={!playerName.trim() || isSubmitting}
                      className="colortile-hof-submit-btn"
                    >
                      {isSubmitting ? '등록 중...' : '등록하기 🏆'}
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#34D399', fontSize: '12px', fontWeight: 800 }}>
                    ✅ 명예의 전당에 성공적으로 등록되었습니다!
                  </div>
                )}
              </form>
            )}

            {/* Restart Button */}
            <button
              onClick={() => startNewGame()}
              className="colortile-restart-btn"
            >
              <RotateCcw style={{ width: '16px', height: '16px' }} />
              <span>한 번 더 도전하기</span>
            </button>
          </div>
        )}

      </div>

      {/* How to Play Modal */}
      <ColorTileHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

    </div>
  );
}
