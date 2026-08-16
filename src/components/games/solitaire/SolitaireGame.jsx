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
  Undo2,
  Lightbulb,
  Zap,
  CheckCircle,
  Crown,
  Layers,
  ArrowRight,
  Flame,
  Wand2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { soundFx } from '../../../utils/audio';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { getHighScore } from '../../../utils/leaderboard';
import {
  SUITS,
  SUIT_KEYS,
  DRAW_MODES,
  SCORING
} from './solitaireConstants';
import {
  dealGame,
  canMoveToFoundation,
  canMoveToTableau,
  canAutoComplete,
  getNextAutoCompleteStep,
  findSmartHint,
  checkWinCondition,
  checkIsDeadEnd,
  applyMagicShuffle
} from './solitaireLogic';
import SolitaireHowToPlayModal from './SolitaireHowToPlayModal';
import './solitaire.css';

export default function SolitaireGame({ onScoreSubmitted }) {
  // Game Board State (Default to 100% Solvable Deals)
  const [gameState, setGameState] = useState(() => dealGame(true));
  const [history, setHistory] = useState([]);
  const [drawMode, setDrawMode] = useState('one'); // 'one' (1장 뽑기 - 기본값) or 'three' (3장)
  
  // Scoring & Stats
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [highScore, setHighScore] = useState(() => getHighScore('solitaire') || 0);

  // Kid Friendly Features: Smart Hint, Dead-End Detection & Magic Shuffle
  const [hint, setHint] = useState(null);
  const [coachMsg, setCoachMsg] = useState('💡 카드를 클릭하면 가장 알맞은 위치로 자동 이동해요! 막힐 땐 [힌트]를 눌러보세요.');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeadEnd, setIsDeadEnd] = useState(false);
  const [magicShuffleCount, setMagicShuffleCount] = useState(0);

  // Victory & Auto Complete
  const [isWon, setIsWon] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // 🌟 4-King Free Slot Rule Check
  const kingColumnsCount = gameState.tableau.filter(col => col.length > 0 && col[0].rank === 13).length;
  const isAllKingsPlaced = kingColumnsCount >= 4;

  // Auto-Start Timer on first interaction
  const startTimer = useCallback(() => {
    if (!isTimerRunning && !isWon) {
      setIsTimerRunning(true);
    }
  }, [isTimerRunning, isWon]);

  useEffect(() => {
    let timer;
    if (isTimerRunning && !isWon) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, isWon]);

  // Save snapshot before state mutation for Unlimited Undo
  const saveSnapshot = useCallback(() => {
    setHistory(prev => [
      ...prev,
      {
        gameState: JSON.parse(JSON.stringify(gameState)),
        score,
        moves
      }
    ]);
  }, [gameState, score, moves]);

  // Dead-End Checker: Runs after moves or stock draws
  useEffect(() => {
    if (!isWon && !isAutoCompleting && moves > 0) {
      const dead = checkIsDeadEnd(gameState);
      if (dead) {
        setIsDeadEnd(true);
        setCoachMsg('🧐 더 이상 이동할 카드가 없어요! [🪄 마법의 셔플]로 막힌 카드를 풀어보세요.');
      } else {
        setIsDeadEnd(false);
      }
    }
  }, [gameState, isWon, isAutoCompleting, moves]);

  // Magic Shuffle Handler (🪄 초등학생 구원 찬스)
  const handleMagicShuffle = () => {
    if (isWon || isAutoCompleting) return;
    saveSnapshot();
    startTimer();

    const shuffledState = applyMagicShuffle(gameState);
    setGameState(shuffledState);
    setMagicShuffleCount(prev => prev + 1);
    setIsDeadEnd(false);
    setHint(null);
    setCoachMsg('🪄 [마법의 셔플 찬스] 카드를 마법처럼 다시 섞었습니다! 새로운 길을 열어보세요 ✨');
    soundFx.playMagicShuffle();
  };

  // Undo Last Move
  const handleUndo = () => {
    if (history.length === 0 || isWon || isAutoCompleting) return;
    const lastSnapshot = history[history.length - 1];
    setGameState(lastSnapshot.gameState);
    setScore(lastSnapshot.score);
    setMoves(lastSnapshot.moves);
    setHistory(prev => prev.slice(0, -1));
    setHint(null);
    setIsDeadEnd(false);
    setCoachMsg('↩️ 이전 상태로 되돌렸습니다.');
    soundFx.playCardFlip();
  };

  // Start New 100% Solvable Game
  const handleNewGame = () => {
    const freshState = dealGame(true);
    setGameState(freshState);
    setHistory([]);
    setScore(0);
    setMoves(0);
    setTimeElapsed(0);
    setIsTimerRunning(false);
    setIsWon(false);
    setIsAutoCompleting(false);
    setHint(null);
    setIsDeadEnd(false);
    setSubmitted(false);
    setMagicShuffleCount(0);
    setCoachMsg('🃏 100% 클리어 가능한 새 게임이 시작되었습니다! 카드를 옮겨보세요.');
    soundFx.playCardFlip();
  };

  // Stock Pile Click (Draw card or recycle)
  const handleStockClick = () => {
    if (isWon || isAutoCompleting) return;
    startTimer();
    saveSnapshot();
    setHint(null);

    const { stock, waste } = gameState;
    const count = drawMode === 'one' ? 1 : 3;

    if (stock.length > 0) {
      // Draw cards from Stock to Waste
      const drawCards = stock.slice(-count).map(c => ({ ...c, faceUp: true }));
      const newStock = stock.slice(0, -count);
      const newWaste = [...waste, ...drawCards];

      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: newWaste
      }));
      setMoves(prev => prev + 1);
      soundFx.playCardFlip();
      setCoachMsg(`🃏 덱에서 카드 ${drawCards.length}장을 뽑았습니다.`);
    } else if (waste.length > 0) {
      // Recycle Waste back to Stock
      const newStock = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
      const penalty = drawMode === 'one' ? SCORING.RECYCLE_WASTE_PENALTY : 0;
      
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: []
      }));
      if (penalty < 0) {
        setScore(prev => Math.max(0, prev + penalty));
      }
      setMoves(prev => prev + 1);
      soundFx.playCardFlip();
      setCoachMsg('🔄 카드 덱을 다시 뒤집어 모았습니다!');
    }
  };

  // Helper to reveal newly exposed tableau card
  const cleanAndRevealTableau = (tableau) => {
    let gainedScore = 0;
    const newTableau = tableau.map(col => {
      const newCol = [...col];
      if (newCol.length > 0) {
        const topCard = newCol[newCol.length - 1];
        if (!topCard.faceUp) {
          topCard.faceUp = true;
          gainedScore += SCORING.FLIP_TABLEAU_CARD;
        }
      }
      return newCol;
    });
    return { newTableau, gainedScore };
  };

  // Check victory condition
  useEffect(() => {
    if (!isWon && checkWinCondition(gameState.foundations)) {
      setIsWon(true);
      setIsTimerRunning(false);
      setIsAutoCompleting(false);
      setIsDeadEnd(false);
      soundFx.playSolitaireWin();

      // Bonus Time Score Calculation
      const timeBonus = Math.max(0, 400 - timeElapsed * 2);
      const finalScore = score + SCORING.VICTORY_BASE_BONUS + timeBonus;
      setScore(finalScore);

      if (finalScore > highScore) {
        setHighScore(finalScore);
      }

      // Launch Confetti Celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 350);
    }
  }, [gameState.foundations, isWon, score, timeElapsed, highScore]);

  // Handle direct click on face-down card to reveal (초등학생 마법의 카드 뒤집기)
  const handleFaceDownCardClick = (colIdx, cardIdx) => {
    if (isWon || isAutoCompleting) return;
    saveSnapshot();
    startTimer();

    const { tableau } = gameState;
    const newTableau = tableau.map((col, cIdx) => {
      if (cIdx !== colIdx) return col;
      return col.map((c, rIdx) => {
        if (rIdx === cardIdx) {
          return { ...c, faceUp: true };
        }
        return c;
      });
    });

    const flippedCard = newTableau[colIdx][cardIdx];

    setGameState(prev => ({
      ...prev,
      tableau: newTableau
    }));
    setScore(prev => prev + SCORING.FLIP_TABLEAU_CARD);
    setMoves(prev => prev + 1);
    setIsDeadEnd(false);
    setHint(null);
    soundFx.playCardFlip();
    setCoachMsg(`🔮 [마법의 카드 뒤집기] 숨겨져 있던 [${flippedCard.suitSymbol} ${flippedCard.rankLabel}] 카드를 열었습니다! ✨`);
  };

  // Helper toolbar button: Flip first available hidden card
  const handleFlipAnyHiddenCard = () => {
    if (isWon || isAutoCompleting) return;
    const { tableau } = gameState;
    for (let c = 0; c < 7; c++) {
      const hIdx = tableau[c].findIndex(card => !card.faceUp);
      if (hIdx >= 0) {
        handleFaceDownCardClick(c, hIdx);
        return;
      }
    }
    setCoachMsg('✨ 바닥에 더 이상 숨겨진 카드가 없어요! 모든 카드가 열려 있습니다.');
  };

  // SMART AUTO MOVE (Tap-to-Move / Click Card)
  const handleSmartCardClick = (card, sourceInfo) => {
    if (isWon || isAutoCompleting || !card || !card.faceUp) return;
    startTimer();
    setHint(null);

    const { tableau, waste, foundations } = gameState;

    // 0. Try Foundation to Tableau (완성칸에서 바닥으로 카드 내리기)
    if (sourceInfo.type === 'foundation') {
      for (let targetColIdx = 0; targetColIdx < 7; targetColIdx++) {
        const targetCol = tableau[targetColIdx];
        if (canMoveToTableau(card, targetCol, gameState)) {
          saveSnapshot();
          const newFoundations = {
            ...foundations,
            [sourceInfo.suit]: foundations[sourceInfo.suit].slice(0, -1)
          };
          let newTableau = tableau.map(col => [...col]);
          newTableau[targetColIdx] = [...newTableau[targetColIdx], card];

          setGameState(prev => ({
            ...prev,
            tableau: newTableau,
            foundations: newFoundations
          }));
          setMoves(prev => prev + 1);
          setIsDeadEnd(false);
          soundFx.playCardPlace();
          setCoachMsg(`💡 완성칸의 [${card.suitSymbol} ${card.rankLabel}] 카드를 바닥으로 다시 내렸습니다.`);
          return;
        }
      }
      soundFx.playCardFlip();
      setCoachMsg(`🧐 완성칸의 [${card.suitSymbol} ${card.rankLabel}] 카드를 내릴 수 있는 바닥 자리가 아직 없어요.`);
      return;
    }

    // 1. Try Foundation First
    const targetFoundation = foundations[card.suit];
    if (canMoveToFoundation(card, targetFoundation)) {
      saveSnapshot();

      const newFoundations = {
        ...foundations,
        [card.suit]: [...targetFoundation, card]
      };

      let newTableau = [...tableau];
      let newWaste = [...waste];
      let addScore = SCORING.TABLEAU_TO_FOUNDATION;

      if (sourceInfo.type === 'waste') {
        newWaste = waste.slice(0, -1);
        addScore = SCORING.WASTE_TO_FOUNDATION;
      } else if (sourceInfo.type === 'tableau') {
        const col = [...tableau[sourceInfo.colIndex]];
        col.pop();
        newTableau[sourceInfo.colIndex] = col;
      }

      const { newTableau: cleanedTableau, gainedScore } = cleanAndRevealTableau(newTableau);

      setGameState(prev => ({
        ...prev,
        tableau: cleanedTableau,
        waste: newWaste,
        foundations: newFoundations
      }));
      setScore(prev => prev + addScore + gainedScore);
      setMoves(prev => prev + 1);
      setIsDeadEnd(false);
      soundFx.playCardSnap();
      setCoachMsg(`🌟 [${card.suitSymbol} ${card.rankLabel}] 카드를 완성칸으로 올렸습니다! (+${addScore}점)`);
      return;
    }

    // 2. Try Tableau Move
    let movingCards = [card];
    if (sourceInfo.type === 'tableau') {
      const col = tableau[sourceInfo.colIndex];
      const cardIdx = col.findIndex(c => c.id === card.id);
      if (cardIdx >= 0) {
        movingCards = col.slice(cardIdx);
      }
    }

    for (let targetColIdx = 0; targetColIdx < 7; targetColIdx++) {
      if (sourceInfo.type === 'tableau' && sourceInfo.colIndex === targetColIdx) continue;
      const targetCol = tableau[targetColIdx];

      if (canMoveToTableau(movingCards[0], targetCol, gameState)) {
        if (targetCol.length === 0 && sourceInfo.type === 'tableau') {
          const col = tableau[sourceInfo.colIndex];
          if (col[0].id === card.id && col.length === movingCards.length) {
            continue;
          }
        }

        saveSnapshot();
        let newTableau = tableau.map(col => [...col]);
        let newWaste = [...waste];
        let addScore = 0;

        if (sourceInfo.type === 'waste') {
          newWaste = waste.slice(0, -1);
          addScore = SCORING.WASTE_TO_TABLEAU;
        } else if (sourceInfo.type === 'tableau') {
          const fromCol = newTableau[sourceInfo.colIndex];
          const splitIdx = fromCol.findIndex(c => c.id === card.id);
          newTableau[sourceInfo.colIndex] = fromCol.slice(0, splitIdx);
        }

        newTableau[targetColIdx] = [...newTableau[targetColIdx], ...movingCards];

        const { newTableau: cleanedTableau, gainedScore } = cleanAndRevealTableau(newTableau);

        setGameState(prev => ({
          ...prev,
          tableau: cleanedTableau,
          waste: newWaste
        }));
        setScore(prev => prev + addScore + gainedScore);
        setMoves(prev => prev + 1);
        setIsDeadEnd(false);
        soundFx.playCardPlace();
        setCoachMsg(`💡 [${card.suitSymbol} ${card.rankLabel}] 카드를 바닥으로 옮겼습니다.`);
        return;
      }
    }

    // If no valid move found
    soundFx.playCardFlip();
    setCoachMsg(`🧐 [${card.suitSymbol} ${card.rankLabel}] 카드는 지금 옮길 수 있는 자리가 없어요. [힌트]를 확인해보세요!`);
  };

  // Smart Hint Click
  const handleHintClick = () => {
    if (isWon || isAutoCompleting) return;
    const foundHint = findSmartHint(gameState);
    setHint(foundHint);
    setCoachMsg(foundHint.message);
    soundFx.playHintSound();
  };

  // Auto-Complete Mode for Solved Boards
  const isAutoReady = canAutoComplete(gameState);

  const handleAutoComplete = () => {
    if (isAutoCompleting || isWon) return;
    setIsAutoCompleting(true);
    setIsDeadEnd(false);
    setCoachMsg('✨ 남은 카드를 자동으로 완성칸에 차곡차곡 정리하는 중입니다!');
  };

  useEffect(() => {
    let autoTimer;
    if (isAutoCompleting && !isWon) {
      autoTimer = setTimeout(() => {
        const step = getNextAutoCompleteStep(gameState);
        if (step) {
          const { tableau, foundations } = gameState;
          const newFoundations = {
            ...foundations,
            [step.toSuit]: [...foundations[step.toSuit], step.card]
          };
          const newTableau = tableau.map((col, idx) => {
            if (idx === step.fromCol) {
              return col.slice(0, -1);
            }
            return col;
          });

          setGameState(prev => ({
            ...prev,
            tableau: newTableau,
            foundations: newFoundations
          }));
          setScore(prev => prev + SCORING.TABLEAU_TO_FOUNDATION);
          setMoves(prev => prev + 1);
          soundFx.playCardSnap();
        } else {
          setIsAutoCompleting(false);
        }
      }, 120);
    }
    return () => clearTimeout(autoTimer);
  }, [isAutoCompleting, gameState, isWon]);

  // Hall of Fame Score Submission
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    if (!cleanName || score <= 100) return;

    try {
      await submitScoreToDB('solitaire', cleanName, score);
      setSubmitted(true);
      if (onScoreSubmitted) {
        onScoreSubmitted();
      }
    } catch (err) {
      console.error('Failed to submit solitaire score:', err);
    }
  };

  // Format Time Helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="solitaire-wrapper">
      {/* 1. Header & Status Bar */}
      <div className="solitaire-status-bar">
        <div className="solitaire-stat-item">
          <span>점수</span>
          <span className="solitaire-stat-val score">{score}점</span>
        </div>

        <div className="solitaire-stat-item">
          <span>이동</span>
          <span className="solitaire-stat-val">{moves}회</span>
        </div>

        <div className="solitaire-stat-item">
          <span>시간</span>
          <span className="solitaire-stat-val">{formatTime(timeElapsed)}</span>
        </div>

        <div className="solitaire-stat-item hidden sm:flex">
          <span>최고 기록</span>
          <span className="solitaire-stat-val">{highScore}점</span>
        </div>
      </div>

      {/* 2. Elementary Student Friendly Coaching Banner */}
      <div className={`solitaire-coach-banner ${isDeadEnd ? 'banner-deadend' : ''}`}>
        <div className="solitaire-coach-text">
          {isDeadEnd ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 fill-rose-400" />
          ) : (
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400" />
          )}
          <span>{coachMsg}</span>
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className="solitaire-toolbar">
        {/* Draw Mode Switch */}
        <button
          onClick={() => {
            const nextMode = drawMode === 'one' ? 'three' : 'one';
            setDrawMode(nextMode);
            setCoachMsg(nextMode === 'one' ? '🟢 1장 뽑기(쉬움) 모드로 변경되었습니다.' : '🔴 3장 뽑기(도전) 모드로 변경되었습니다.');
          }}
          className="btn-solitaire btn-sol-slate"
          title="난이도 / 카드 뽑는 개수 변경"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{drawMode === 'one' ? '1장 뽑기 (쉬움)' : '3장 뽑기 (도전)'}</span>
        </button>

        {/* Smart Hint Button */}
        <button
          onClick={handleHintClick}
          className="btn-solitaire btn-sol-amber"
          title="이동 가능한 카드를 알려주는 친절한 스마트 힌트"
        >
          <Lightbulb className="w-4 h-4 fill-current" />
          <span>💡 힌트 보기</span>
        </button>

        {/* 🪄 Magic Shuffle Button (막힘 탈출 슈퍼 파워 찬스) */}
        <button
          onClick={handleMagicShuffle}
          className={`btn-solitaire btn-sol-magic ${isDeadEnd ? 'animate-bounce' : ''}`}
          title="막혔을 때 뒷면 카드를 다시 섞어 새로운 길을 열어주는 마법의 셔플!"
        >
          <Wand2 className="w-4 h-4 text-pink-300 fill-pink-400" />
          <span>🪄 마법의 셔플 {magicShuffleCount > 0 && `(${magicShuffleCount})`}</span>
        </button>

        {/* 🔮 Magic Card Flip Button (초등학생 숨겨진 카드 직접 뒤집기) */}
        <button
          onClick={handleFlipAnyHiddenCard}
          className="btn-solitaire btn-sol-cyan"
          title="막혔을 때 숨겨진 뒷면 카드 1장을 바로 열어주는 마법의 뒤집기!"
        >
          <Eye className="w-4 h-4 text-cyan-200" />
          <span>🔮 카드 뒤집기</span>
        </button>

        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || isWon || isAutoCompleting}
          className="btn-solitaire btn-sol-blue"
          style={{ opacity: history.length === 0 ? 0.5 : 1 }}
          title="이전 수 되돌리기"
        >
          <Undo2 className="w-4 h-4" />
          <span>실행 취소 ({history.length})</span>
        </button>

        {/* Auto-Complete Button (Active when board is solved) */}
        {isAutoReady && !isWon && (
          <button
            onClick={handleAutoComplete}
            className="btn-solitaire btn-sol-autocomplete"
            title="남은 카드를 모두 완성칸으로 자동 정리"
          >
            <Sparkles className="w-4 h-4" />
            <span>🎉 자동 완성하기</span>
          </button>
        )}

        {/* How to Play Guide Modal Button */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="btn-solitaire btn-sol-purple"
          title="초등학생 맞춤 규칙 설명서 열기"
        >
          <HelpCircle className="w-4 h-4" />
          <span>📖 게임 방법</span>
        </button>

        {/* New Game Button */}
        <button
          onClick={handleNewGame}
          className="btn-solitaire btn-sol-emerald"
          title="새 게임 시작하기 (100% 클리어 가능 보장)"
        >
          <RotateCcw className="w-4 h-4" />
          <span>새 게임</span>
        </button>

        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(soundFx.toggleMute())}
          className="btn-solitaire btn-sol-slate"
          title="효과음 켜기/끄기"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? '음소거' : '소리 ON'}</span>
        </button>
      </div>

      {/* 4. Solitaire Game Board Table */}
      <div className="solitaire-board">
        
        {/* TOP ROW: 7-Column Grid Layout (Exactly matching Tableau Column Widths & Alignment) */}
        <div className="solitaire-top-row">
          {/* Col 1: Stock Pile (카드 뽑기 더미) */}
          <div
            onClick={handleStockClick}
            className={`solitaire-card-slot slot-stock ${
              hint && hint.highlightZone === 'stock' ? 'slot-highlight' : ''
            }`}
            title="카드 뽑기 더미 (클릭하여 새 카드 확인)"
          >
            {gameState.stock.length > 0 ? (
              <div className="solitaire-card card-back">
                <span className="stock-count-badge">
                  {gameState.stock.length}장
                </span>
              </div>
            ) : (
              <div className="stock-empty-box">
                <RotateCcw className="w-6 h-6 text-amber-300/80 mb-1" />
                <span className="text-[11px] text-amber-200 font-black">다시 모으기</span>
              </div>
            )}
          </div>

          {/* Col 2: Waste Pile (뒤집은 카드) */}
          <div
            className={`solitaire-card-slot slot-waste ${
              hint && hint.highlightZone === 'waste' ? 'slot-highlight' : ''
            }`}
          >
            {gameState.waste.length > 0 ? (() => {
              const topWasteCard = gameState.waste[gameState.waste.length - 1];
              const isHintCard = hint && hint.highlightCardId === topWasteCard.id;
              return (
                <div
                  onClick={() => handleSmartCardClick(topWasteCard, { type: 'waste' })}
                  className={`solitaire-card ${topWasteCard.color === 'red' ? 'card-red' : 'card-black'} ${
                    isHintCard ? 'card-highlight-hint' : ''
                  }`}
                  title="클릭하여 바닥이나 완성칸으로 이동"
                >
                  <div className="card-corner">
                    <span className="card-rank-text">{topWasteCard.rankLabel}</span>
                    <span className="card-suit-mini">{topWasteCard.suitSymbol}</span>
                  </div>
                  <div className="card-center-icon">{topWasteCard.suitSymbol}</div>
                  <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                    <span className="card-rank-text">{topWasteCard.rankLabel}</span>
                    <span className="card-suit-mini">{topWasteCard.suitSymbol}</span>
                  </div>
                </div>
              );
            })() : (
              <div className="waste-empty-placeholder">
                <span className="text-[11px] text-white/30 font-bold">뽑은 카드</span>
              </div>
            )}
          </div>

          {/* Col 3: Middle Spacer (중앙 여백) */}
          <div className="solitaire-top-spacer" />

          {/* Col 4, 5, 6, 7: 4 Foundation Piles (♠, ♥, ♦, ♣) */}
          {SUIT_KEYS.map(suitKey => {
            const suitObj = SUITS[suitKey.toUpperCase()];
            const pile = gameState.foundations[suitKey] || [];
            const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
            const isTargetHint = hint && hint.targetZone === `foundation-${suitKey}`;

            return (
              <div
                key={suitKey}
                onClick={() => {
                  if (topCard) {
                    handleSmartCardClick(topCard, { type: 'foundation', suit: suitKey });
                  }
                }}
                className={`solitaire-card-slot slot-foundation ${
                  isTargetHint ? 'slot-highlight' : ''
                }`}
                title={`${suitObj.name} 완성칸 (A부터 K까지 쌓기)`}
              >
                {topCard ? (
                  <div className={`solitaire-card ${topCard.color === 'red' ? 'card-red' : 'card-black'}`}>
                    <div className="card-corner">
                      <span className="card-rank-text">{topCard.rankLabel}</span>
                      <span className="card-suit-mini">{topCard.suitSymbol}</span>
                    </div>
                    <div className="card-center-icon">{topCard.suitSymbol}</div>
                    <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                      <span className="card-rank-text">{topCard.rankLabel}</span>
                      <span className="card-suit-mini">{topCard.suitSymbol}</span>
                    </div>
                  </div>
                ) : (
                  <div className="foundation-empty-slot">
                    <span className={`foundation-watermark ${suitObj.color === 'red' ? 'text-rose-400/50' : 'text-slate-300/40'}`}>
                      {suitObj.symbol}
                    </span>
                    <span className="foundation-a-badge">A</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM ROW: 7 Tableau Columns */}
        <div className="solitaire-tableau-row">
          {gameState.tableau.map((col, colIdx) => {
            const isColTargetHint = hint && hint.targetZone === `tableau-${colIdx}`;

            return (
              <div
                key={colIdx}
                className={`solitaire-tableau-col ${isColTargetHint && col.length === 0 ? 'slot-highlight' : ''}`}
              >
                {/* Empty slot placeholder for King or Free Slot */}
                {col.length === 0 && (
                  <div
                    className={`solitaire-card-slot slot-tableau ${
                      isAllKingsPlaced ? 'slot-free-cell' : ''
                    } ${isColTargetHint ? 'slot-highlight' : ''}`}
                  >
                    {isAllKingsPlaced ? (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <span className="text-xs font-black text-amber-300 animate-pulse">🌟 자유</span>
                        <span className="text-[9px] text-emerald-300 font-extrabold leading-tight">어떤 카드든 OK</span>
                      </div>
                    ) : (
                      <span className="text-xs font-black opacity-40">👑 K</span>
                    )}
                  </div>
                )}

                {/* Overlapping Cards in Column */}
                {col.map((card, cardIdx) => {
                  const isHintCard = hint && hint.highlightCardId === card.id;
                  const isTargetCard = hint && hint.targetZone === `tableau-${colIdx}` && cardIdx === col.length - 1;
                  let topOffset = 0;
                  for (let i = 0; i < cardIdx; i++) {
                    topOffset += col[i].faceUp ? 24 : 14;
                  }

                  return (
                    <div
                      key={card.id}
                      className={`solitaire-tableau-card-wrapper ${!card.faceUp ? 'card-back-wrapper-clickable' : ''}`}
                      style={{ top: `${topOffset}px`, zIndex: cardIdx + 1 }}
                      onClick={!card.faceUp ? () => handleFaceDownCardClick(colIdx, cardIdx) : undefined}
                    >
                      {card.faceUp ? (
                        <div
                          onClick={() => handleSmartCardClick(card, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx })}
                          className={`solitaire-card ${card.color === 'red' ? 'card-red' : 'card-black'} ${
                            isHintCard ? 'card-highlight-hint' : ''
                          } ${isTargetCard ? 'card-target-hint' : ''}`}
                        >
                          <div className="card-corner">
                            <span className="card-rank-text">{card.rankLabel}</span>
                            <span className="card-suit-mini">{card.suitSymbol}</span>
                          </div>
                          <div className="card-center-icon">{card.suitSymbol}</div>
                          <div className="card-corner" style={{ transform: 'rotate(180deg)' }}>
                            <span className="card-rank-text">{card.rankLabel}</span>
                            <span className="card-suit-mini">{card.suitSymbol}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="solitaire-card card-back card-back-clickable"
                          title="클릭하여 마법처럼 이 뒷면 카드를 바로 열어 확인하기!"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 5. DEAD-END RESCUE MODAL OVERLAY (막힘 탈출 도우미 모달) */}
        {isDeadEnd && !isWon && (
          <div className="solitaire-deadend-overlay">
            <div className="solitaire-deadend-box">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wand2 className="w-7 h-7 text-pink-400 fill-pink-400 animate-spin" />
                <h3 className="text-xl font-black text-amber-300">더 이상 옮길 카드가 없어요!</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                잠시 길이 막혔더라도 실망하지 마세요! <strong>[마법의 셔플]</strong>이나 <strong>[🔮 카드 뒤집기]</strong>로 새로운 길을 바로 열 수 있어요.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 justify-center w-full">
                <button onClick={handleMagicShuffle} className="btn-solitaire btn-sol-magic py-3 px-4 text-xs sm:text-sm font-black shadow-xl">
                  <Wand2 className="w-4 h-4" /> 🪄 마법의 셔플
                </button>
                <button onClick={handleFlipAnyHiddenCard} className="btn-solitaire btn-sol-cyan py-3 px-4 text-xs sm:text-sm font-black shadow-xl">
                  <Eye className="w-4 h-4" /> 🔮 카드 뒤집기
                </button>
                <button onClick={handleUndo} className="btn-solitaire btn-sol-blue py-3 px-4 text-xs sm:text-sm font-black shadow-xl">
                  <Undo2 className="w-4 h-4" /> ↩️ 되돌리기
                </button>
                <button onClick={handleNewGame} className="btn-solitaire btn-sol-emerald py-3 px-4 text-xs sm:text-sm font-black shadow-xl">
                  <RotateCcw className="w-4 h-4" /> 🎲 새 게임
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. VICTORY CELEBRATION MODAL OVERLAY */}
        {isWon && (
          <div className="solitaire-victory-overlay">
            <Crown className="w-16 h-16 text-amber-400 fill-amber-400 animate-bounce mb-2" />
            <h2 className="solitaire-victory-title">🎉 솔리테어 클리어 성공! 🎉</h2>
            <p className="text-sm sm:text-base text-slate-200 font-bold">
              축하합니다! 모든 카드를 완성칸에 완벽히 정리했습니다!
            </p>

            <div className="solitaire-victory-stats">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">최종 점수</span>
                <span className="text-2xl font-black text-amber-400">{score}점</span>
              </div>
              <div className="w-[1px] bg-slate-700" />
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">총 이동 횟수</span>
                <span className="text-lg font-black text-white">{moves}회</span>
              </div>
              <div className="w-[1px] bg-slate-700" />
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400">클리어 시간</span>
                <span className="text-lg font-black text-emerald-400">{formatTime(timeElapsed)}</span>
              </div>
            </div>

            {/* Hall of Fame Score Submission (100-Point Rule) */}
            {score > 100 ? (
              !submitted ? (
                <form onSubmit={handleScoreSubmit} className="solitaire-score-form">
                  <label className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 도촌 명예의 전당 점수 등록
                  </label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="solitaire-score-input"
                    maxLength={16}
                    required
                  />
                  <button type="submit" className="btn-solitaire btn-sol-amber justify-center py-2.5 text-sm font-black shadow-lg">
                    <Trophy className="w-4 h-4 text-slate-950" /> 랭킹 등록하기
                  </button>
                </form>
              ) : (
                <p className="text-emerald-400 font-black bg-emerald-950/80 border border-emerald-500 py-2.5 px-5 rounded-xl text-sm">
                  ✅ 도촌 명예의 전당에 성공적으로 등록되었습니다!
                </p>
              )
            ) : (
              <div className="bg-slate-900/80 border border-slate-700 p-3 rounded-xl max-w-xs text-center">
                <p className="text-xs text-emerald-400 font-black mb-1">
                  💡 100점 초과 달성 시 랭킹에 등록할 수 있어요!
                </p>
                <p className="text-[11px] text-slate-400">
                  더 빠르게 클리어하여 100점을 돌파해보세요 🃏
                </p>
              </div>
            )}

            <button onClick={handleNewGame} className="btn-solitaire btn-sol-emerald mt-4 px-8 py-3 text-sm">
              <RotateCcw className="w-4 h-4" /> 다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* 7. Elementary Student How-to-Play Modal */}
      <SolitaireHowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
