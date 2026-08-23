// Dochon Half Moon (Rise of the Half Moon) Main Game Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LUNAR_PHASES,
  SPECIAL_CARDS,
  GAME_STATES,
  STAGES,
  SCORING_RULES
} from './halfmoonConstants';
import {
  createShuffledDeck,
  createEmptyBoard,
  evaluateMoveScore,
  getBestAIMove,
  applyBoardSideEffects
} from './halfmoonLogic';
import { halfMoonAudio } from './halfmoonAudio';
import HalfMoonBoard from './HalfMoonBoard';
import HalfMoonHand from './HalfMoonHand';
import HalfMoonHowToPlayModal from './HalfMoonHowToPlayModal';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  HelpCircle,
  Award,
  Sparkles,
  Send,
  Moon,
  Bot,
  Zap,
  ChevronRight,
  ShieldAlert,
  Star
} from 'lucide-react';
import './halfmoon.css';

export default function HalfMoonGame({ onScoreSubmitted }) {
  // Game Flow States
  const [gameState, setGameState] = useState(GAME_STATES.INTRO);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentTurn, setCurrentTurn] = useState('PLAYER'); // 'PLAYER' | 'AI'
  const [isMuted, setIsMuted] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  // Scores
  const [totalGameScore, setTotalGameScore] = useState(0);
  const [stageScore, setStageScore] = useState({ player: 0, ai: 0 });
  const [recentComboMessage, setRecentComboMessage] = useState(null);

  // Board & Decks
  const [board, setBoard] = useState([]);
  const [drawDeck, setDrawDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [aiHand, setAiHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [lastMoveSlot, setLastMoveSlot] = useState(null);

  // Leaderboard Registration States
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentStageConfig = STAGES[currentStageIndex] || STAGES[0];

  // Sound Mute Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    halfMoonAudio.setMuted(nextMuted);
    haptics.selection();
  };

  // Start / Init Stage
  const initStage = useCallback((stageIdx = 0, keepTotalScore = 0) => {
    const stageConf = STAGES[stageIdx] || STAGES[0];
    setCurrentStageIndex(stageIdx);
    setGameState(GAME_STATES.PLAYING);
    setCurrentTurn('PLAYER');
    setSelectedCard(null);
    setLastMoveSlot(null);
    setRecentComboMessage(null);
    setStageScore({ player: 0, ai: 0 });

    const newDeck = createShuffledDeck(stageConf.allowSpecials);
    const newBoard = createEmptyBoard(stageConf.gridSize.rows, stageConf.gridSize.cols);

    // Deal hands
    const handCount = stageConf.handSize;
    const pHand = newDeck.splice(0, handCount);
    const aHand = newDeck.splice(0, handCount);

    setBoard(newBoard);
    setDrawDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);

    if (stageIdx === 0 && keepTotalScore === 0) {
      setTotalGameScore(0);
      setIsSubmitted(false);
      setPlayerName('');
    }
  }, []);

  // Check if board is full or both hands empty
  const isBoardFull = useCallback((currentBoard) => {
    for (let r = 0; r < currentBoard.length; r++) {
      for (let c = 0; c < currentBoard[0].length; c++) {
        if (currentBoard[r][c] === null) return false;
      }
    }
    return true;
  }, []);

  // Handle Player Card Selection
  const handleSelectCard = (card) => {
    if (currentTurn !== 'PLAYER') return;
    haptics.selection();
    halfMoonAudio.playCardSelect();
    setSelectedCard(prev => (prev && prev.uid === card.uid ? null : card));
  };

  // Handle Card Placement on Board Slot
  const handleSlotClick = (row, col) => {
    if (currentTurn !== 'PLAYER' || !selectedCard) return;
    if (board[row][col] !== null) return;

    haptics.medium();
    halfMoonAudio.playCardPlace();

    // Evaluate Move Points
    const evalResult = evaluateMoveScore(board, row, col, selectedCard, 'PLAYER');
    const earnedPoints = evalResult.score;

    if (evalResult.details.length > 0) {
      const topDetail = evalResult.details[0];
      setRecentComboMessage(topDetail.message);
      halfMoonAudio.playPhaseMatch(evalResult.details.length);
    }

    if (selectedCard.type === 'SPECIAL') {
      halfMoonAudio.playSpecialActivate();
    }

    // Place card on board
    let nextBoard = board.map(r => [...r]);
    nextBoard[row][col] = { ...selectedCard, owner: 'PLAYER' };
    nextBoard = applyBoardSideEffects(nextBoard, row, col, selectedCard, 'PLAYER');

    // Update Player Hand & Draw Replacement
    const nextDeck = [...drawDeck];
    let nextPlayerHand = playerHand.filter(c => c.uid !== selectedCard.uid);
    if (nextDeck.length > 0) {
      const newCard = nextDeck.shift();
      nextPlayerHand.push(newCard);
    }

    setBoard(nextBoard);
    setDrawDeck(nextDeck);
    setPlayerHand(nextPlayerHand);
    setSelectedCard(null);
    setLastMoveSlot({ row, col, owner: 'PLAYER' });

    const newPlayerStageScore = stageScore.player + earnedPoints;
    const newTotalScore = totalGameScore + earnedPoints;
    setStageScore(prev => ({ ...prev, player: newPlayerStageScore }));
    setTotalGameScore(newTotalScore);

    // Check Stage End Condition
    if (isBoardFull(nextBoard) || (nextPlayerHand.length === 0 && aiHand.length === 0)) {
      handleStageEnd(nextBoard, newPlayerStageScore, stageScore.ai, newTotalScore);
      return;
    }

    // Pass turn to Luna AI
    setCurrentTurn('AI');
  };

  // Luna AI Turn Handler
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || currentTurn !== 'AI') return;

    const timer = setTimeout(() => {
      if (aiHand.length === 0) {
        setCurrentTurn('PLAYER');
        return;
      }

      const bestMove = getBestAIMove(board, aiHand, currentStageConfig.aiLevel);
      if (!bestMove) {
        // No valid moves left
        handleStageEnd(board, stageScore.player, stageScore.ai, totalGameScore);
        return;
      }

      halfMoonAudio.playCardPlace();

      const { row, col, card, handIndex, score, details } = bestMove;

      if (details && details.length > 0) {
        setRecentComboMessage(`🤖 Luna: ${details[0].message}`);
        halfMoonAudio.playPhaseMatch(1);
      }

      let nextBoard = board.map(r => [...r]);
      nextBoard[row][col] = { ...card, owner: 'AI' };
      nextBoard = applyBoardSideEffects(nextBoard, row, col, card, 'AI');

      const nextDeck = [...drawDeck];
      let nextAiHand = aiHand.filter((_, idx) => idx !== handIndex);
      if (nextDeck.length > 0) {
        const newCard = nextDeck.shift();
        nextAiHand.push(newCard);
      }

      setBoard(nextBoard);
      setDrawDeck(nextDeck);
      setAiHand(nextAiHand);
      setLastMoveSlot({ row, col, owner: 'AI' });

      const newAiStageScore = stageScore.ai + score;
      setStageScore(prev => ({ ...prev, ai: newAiStageScore }));

      // Check Stage End Condition
      if (isBoardFull(nextBoard) || (playerHand.length === 0 && nextAiHand.length === 0)) {
        handleStageEnd(nextBoard, stageScore.player, newAiStageScore, totalGameScore);
        return;
      }

      setCurrentTurn('PLAYER');
    }, 900);

    return () => clearTimeout(timer);
  }, [currentTurn, gameState, board, aiHand, drawDeck, currentStageConfig, isBoardFull, playerHand.length, stageScore, totalGameScore]);

  // Stage End Evaluation
  const handleStageEnd = (finalBoard, pScore, aScore, runningTotal) => {
    // Count board territory
    let pCards = 0;
    let aCards = 0;
    finalBoard.forEach(row => {
      row.forEach(c => {
        if (c) {
          if (c.owner === 'PLAYER') pCards++;
          else if (c.owner === 'AI') aCards++;
        }
      });
    });

    let bonus = 0;
    if (pCards > aCards) {
      bonus += SCORING_RULES.BOARD_CONTROL_WIN;
    }
    if (pScore > aScore) {
      bonus += SCORING_RULES.STAGE_CLEAR_BONUS;
    }

    const finalStageTotal = runningTotal + bonus;
    setTotalGameScore(finalStageTotal);

    if (pScore >= aScore) {
      // Stage Cleared!
      halfMoonAudio.playStageClear();
      haptics.success();
      if (currentStageIndex + 1 < STAGES.length) {
        setGameState(GAME_STATES.ROUND_RESULT);
      } else {
        // Final Game Clear!
        halfMoonAudio.playFullCycleFanfare();
        setGameState(GAME_STATES.GAME_CLEAR);
      }
    } else {
      // Stage Defeat
      halfMoonAudio.playGameOver();
      haptics.error();
      setGameState(GAME_STATES.GAME_OVER);
    }
  };

  // Leaderboard Score Submit
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || totalGameScore <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('halfmoon', playerName.trim(), totalGameScore);
      setIsSubmitted(true);
      haptics.success();
      if (onScoreSubmitted) {
        setTimeout(() => {
          onScoreSubmitted();
        }, 600);
      }
    } catch (err) {
      console.error('Score submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="halfmoon-game-root">
      
      {/* 1. Header Toolbar */}
      <header className="halfmoon-header-bar">
        <div className="halfmoon-title-badge">
          <Moon className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span className="halfmoon-title-text">반달 (Rise of the Half Moon)</span>
        </div>

        <div className="halfmoon-header-actions">
          {/* Audio Toggle */}
          <button
            onClick={toggleMute}
            className="halfmoon-tool-btn"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>

          {/* Guide Modal Trigger */}
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="halfmoon-tool-btn"
            title="게임 방법 및 달의 위상 도감"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline text-xs font-semibold">게임방법</span>
          </button>

          {/* Restart Button */}
          <button
            onClick={() => initStage(0, 0)}
            className="halfmoon-tool-btn"
            title="처음부터 다시하기"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </header>

      {/* 2. Main Game Viewport */}
      <main className="halfmoon-viewport">

        {/* --- INTRO SCREEN --- */}
        {gameState === GAME_STATES.INTRO && (
          <div className="halfmoon-intro-overlay animate-fade-in">
            <div className="halfmoon-intro-card">
              <div className="intro-moon-visual animate-bounce-slow">
                🌙
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                반달 <span className="text-amber-400">Rise of the Half Moon</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                달의 8가지 위상(삭, 초승달, 상현달, 보름달 등)을 연결하여 우주의 신비를 완성하고, 달의 정령 Luna를 이겨보세요!
              </p>

              <div className="intro-action-box mt-6">
                <button
                  onClick={() => initStage(0, 0)}
                  className="halfmoon-btn-primary"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>게임 시작하기</span>
                </button>

                <button
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="halfmoon-btn-secondary mt-3"
                >
                  <HelpCircle className="w-4 h-4 text-amber-300" />
                  <span>달의 위상 룰북 보기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- PLAYING VIEW --- */}
        {gameState === GAME_STATES.PLAYING && (
          <div className="halfmoon-play-layout">
            
            {/* Top Match Status Dashboard */}
            <div className="halfmoon-dashboard">
              <div className="dashboard-stage-info">
                <span className="stage-pill">{currentStageConfig.name}</span>
                <span className="stage-subtitle hidden sm:inline">{currentStageConfig.subtitle}</span>
              </div>

              <div className="dashboard-scores-row">
                <div className="score-badge player-badge">
                  <span className="score-label">내 점수</span>
                  <span className="score-val">{stageScore.player}점</span>
                </div>
                <div className="score-vs-divider">VS</div>
                <div className="score-badge ai-badge">
                  <span className="score-label">Luna AI</span>
                  <span className="score-val">{stageScore.ai}점</span>
                </div>
                <div className="score-badge total-badge">
                  <span className="score-label">누적 점수</span>
                  <span className="score-val text-amber-300 font-extrabold">{totalGameScore}점</span>
                </div>
              </div>
            </div>

            {/* In-Game Live Combo Message Toast */}
            {recentComboMessage && (
              <div className="halfmoon-combo-toast animate-slide-down">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{recentComboMessage}</span>
              </div>
            )}

            {/* AI Top Hand Rack (Hidden Deck) */}
            <HalfMoonHand
              cards={aiHand}
              isPlayer={false}
              isTurn={currentTurn === 'AI'}
            />

            {/* Center Grid Board */}
            <HalfMoonBoard
              board={board}
              selectedCard={selectedCard}
              onSlotClick={handleSlotClick}
              currentTurn={currentTurn}
              lastMoveSlot={lastMoveSlot}
            />

            {/* Player Bottom Hand Rack */}
            <HalfMoonHand
              cards={playerHand}
              selectedCard={selectedCard}
              onSelectCard={handleSelectCard}
              isPlayer={true}
              isTurn={currentTurn === 'PLAYER'}
              deckRemaining={drawDeck.length}
            />

          </div>
        )}

        {/* --- STAGE CLEARED (ROUND RESULT) OVERLAY --- */}
        {gameState === GAME_STATES.ROUND_RESULT && (
          <div className="halfmoon-result-overlay animate-fade-in">
            <div className="halfmoon-result-card">
              <div className="result-icon-glow">✨</div>
              <h3 className="text-xl font-bold text-emerald-400">스테이지 클리어!</h3>
              <p className="text-xs text-slate-300 mt-1">
                {currentStageConfig.name}을(를) 성공적으로 완료했습니다.
              </p>

              <div className="result-score-summary mt-4">
                <div className="result-row">
                  <span>라운드 획득 점수</span>
                  <span className="font-bold text-white">+{stageScore.player}점</span>
                </div>
                <div className="result-row highlight-row">
                  <span>총 누적 점수</span>
                  <span className="font-extrabold text-amber-400 text-base">{totalGameScore}점</span>
                </div>
              </div>

              <button
                onClick={() => initStage(currentStageIndex + 1, totalGameScore)}
                className="halfmoon-btn-primary mt-5"
              >
                <span>다음 스테이지로 진격</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- GAME CLEAR (ALL STAGES BEATEN) OVERLAY --- */}
        {gameState === GAME_STATES.GAME_CLEAR && (
          <div className="halfmoon-result-overlay animate-fade-in">
            <div className="halfmoon-result-card">
              <div className="result-crown-glow">👑</div>
              <h3 className="text-2xl font-black text-amber-400">최종 대승리! 도촌 천문 마스터</h3>
              <p className="text-xs text-slate-300 mt-1">
                모든 스테이지를 통과하고 우주의 균형을 되찾았습니다!
              </p>

              <div className="final-score-display my-4">
                <span className="text-xs text-amber-200">최종 달성 점수</span>
                <strong className="text-3xl font-black text-amber-300 tracking-wider">
                  {totalGameScore.toLocaleString()}점
                </strong>
              </div>

              {/* 100점 이하 점수 등록 차단 규칙 (score <= 100) */}
              {totalGameScore > 100 ? (
                <div className="halfmoon-hall-box">
                  <div className="halfmoon-hall-title">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>명예의 전당 랭킹 등록</span>
                  </div>

                  {isSubmitted ? (
                    <div className="halfmoon-hall-success-pill">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>성공적으로 랭킹에 등록되었습니다!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="halfmoon-hall-form-row">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        disabled={isSubmitting}
                        className="halfmoon-hall-input"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="halfmoon-hall-btn-submit"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium mb-3">
                  100점 초과 달성 시 명예의 전당 랭킹에 기록할 수 있습니다.
                </p>
              )}

              <button
                onClick={() => initStage(0, 0)}
                className="halfmoon-btn-secondary mt-3"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>처음부터 다시 도전하기</span>
              </button>
            </div>
          </div>
        )}

        {/* --- GAME OVER OVERLAY --- */}
        {gameState === GAME_STATES.GAME_OVER && (
          <div className="halfmoon-result-overlay animate-fade-in">
            <div className="halfmoon-result-card">
              <div className="text-3xl mb-2">🌑</div>
              <h3 className="text-xl font-bold text-red-400">달의 정령 Luna의 승리</h3>
              <p className="text-xs text-slate-300 mt-1">
                Luna의 점수가 더 높았습니다. 다시 전략을 세워 도전해보세요!
              </p>

              <div className="final-score-display my-4">
                <span className="text-xs text-slate-400">최종 획득 점수</span>
                <strong className="text-2xl font-bold text-slate-200">
                  {totalGameScore.toLocaleString()}점
                </strong>
              </div>

              {/* 100점 초과 달성 시 명예의 전당 등록 가능 */}
              {totalGameScore > 100 ? (
                <div className="halfmoon-hall-box">
                  <div className="halfmoon-hall-title">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>명예의 전당 랭킹 등록</span>
                  </div>

                  {isSubmitted ? (
                    <div className="halfmoon-hall-success-pill">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>성공적으로 랭킹에 등록되었습니다!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleScoreSubmit} className="halfmoon-hall-form-row">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="예: 홍길동"
                        maxLength={10}
                        required
                        disabled={isSubmitting}
                        className="halfmoon-hall-input"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !playerName.trim()}
                        className="halfmoon-hall-btn-submit"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? '등록 중...' : '등록'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium mb-3">
                  100점 초과 달성 시 명예의 전당 랭킹에 기록할 수 있습니다.
                </p>
              )}

              <button
                onClick={() => initStage(0, 0)}
                className="halfmoon-btn-primary mt-3"
              >
                <RotateCcw className="w-4 h-4" />
                <span>재도전하기</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 3. Educational How-To-Play Modal */}
      <HalfMoonHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

    </div>
  );
}
