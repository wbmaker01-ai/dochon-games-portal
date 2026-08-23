import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, RotateCcw, Volume2, VolumeX, HelpCircle, Sparkles, 
  Brain, Music, Layers, Zap, Clock, Award, CheckCircle2, AlertCircle, Play, ChevronRight 
} from 'lucide-react';
import { submitScoreToDB } from '../../../utils/leaderboardApi';
import { haptics } from '../../../utils/haptics';
import { 
  GAME_MODES, CARD_THEMES, CARD_DIFFICULTIES, SIMON_BUTTONS 
} from './memoryConstants';
import { memoryAudio } from './memoryAudio';
import MemoryHowToPlayModal from './MemoryHowToPlayModal';
import './memory.css';

export default function MemoryGame({ onScoreSubmitted }) {
  // Navigation & Mode
  const [gameMode, setGameMode] = useState(GAME_MODES.CARD_MATCH); // 'card_match' or 'simon_rhythm'
  const [inGame, setInGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Common Score & Leaderboard Submission
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [comboText, setComboText] = useState('');

  // ----------------------------------------------------
  // Mode 1: Card Match States
  // ----------------------------------------------------
  const [selectedTheme, setSelectedTheme] = useState('ANIMALS');
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  // ----------------------------------------------------
  // Mode 2: Simon Rhythm States
  // ----------------------------------------------------
  const [simonRound, setSimonRound] = useState(1);
  const [simonSequence, setSimonSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activeSimonButton, setActiveSimonButton] = useState(null);
  const [isSimonPlayingSequence, setIsSimonPlayingSequence] = useState(false);
  const [simonStatusText, setSimonStatusText] = useState('집중하세요!');

  // Timer Ref
  const timerRef = useRef(null);

  // Sound Mute Toggle
  const handleToggleMute = () => {
    const muted = memoryAudio.toggleMute();
    setIsMuted(muted);
    haptics.light();
  };

  // Combo trigger helper
  const triggerComboFeedback = (newCombo) => {
    if (newCombo >= 2) {
      setComboText(`🔥 ${newCombo}연속 콤보! +${newCombo * 100}점`);
      setTimeout(() => setComboText(''), 1000);
    }
  };

  // ====================================================
  // Mode 1: Card Match Logic
  // ====================================================
  const initCardMatch = useCallback(() => {
    const diff = CARD_DIFFICULTIES[selectedDifficulty];
    const theme = CARD_THEMES[selectedTheme];
    
    // Pick required number of unique card pairs
    const chosenCards = theme.cards.slice(0, diff.pairs);
    
    // Duplicate for pairs and add unique instance ids
    const deck = [];
    chosenCards.forEach(card => {
      deck.push({ ...card, instanceId: `${card.id}_1`, pairKey: card.id });
      deck.push({ ...card, instanceId: `${card.id}_2`, pairKey: card.id });
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setTimeLeft(diff.timeLimit);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setInGame(true);
    setGameOver(false);
    setGameWon(false);
    setSubmitSuccess(false);
    setIsProcessingMatch(false);
  }, [selectedDifficulty, selectedTheme]);

  // Card Match Timer
  useEffect(() => {
    if (inGame && gameMode === GAME_MODES.CARD_MATCH && !gameOver && !gameWon) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleCardMatchTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [inGame, gameMode, gameOver, gameWon]);

  const handleCardMatchTimeUp = () => {
    setGameOver(true);
    memoryAudio.playGameOver();
    haptics.error();
  };

  // Handle Card Click
  const handleCardClick = (index) => {
    if (!inGame || isProcessingMatch || gameOver || gameWon) return;
    if (flippedIndices.includes(index) || matchedIds.includes(cards[index].instanceId)) return;

    memoryAudio.playCardFlip();
    haptics.light();

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessingMatch(true);

      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // MATCH SUCCESS!
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);

        const diff = CARD_DIFFICULTIES[selectedDifficulty];
        const matchBaseScore = 150;
        const comboBonus = (nextCombo - 1) * 80;
        setScore(s => s + matchBaseScore + comboBonus);

        memoryAudio.playMatchSuccess(nextCombo);
        haptics.success();
        triggerComboFeedback(nextCombo);

        setMatchedIds(prev => [...prev, firstCard.instanceId, secondCard.instanceId]);
        setFlippedIndices([]);
        setIsProcessingMatch(false);

        // Check Victory
        const diffPairs = diff.pairs;
        if (matchedIds.length + 2 >= diffPairs * 2) {
          handleCardMatchWin(nextCombo);
        }
      } else {
        // MISMATCH
        setCombo(0);
        memoryAudio.playMismatch();
        haptics.medium();

        setTimeout(() => {
          setFlippedIndices([]);
          setIsProcessingMatch(false);
        }, 750);
      }
    }
  };

  const handleCardMatchWin = (finalCombo) => {
    clearInterval(timerRef.current);
    const diff = CARD_DIFFICULTIES[selectedDifficulty];
    const timeBonus = timeLeft * diff.timeBonusMultiplier;
    const accuracyBonus = Math.max(0, (diff.pairs * 2.5 - moves) * 30);
    const totalFinalScore = Math.max(diff.minScore, score + 150 + diff.baseScore + timeBonus + accuracyBonus);

    setScore(Math.round(totalFinalScore));
    setGameWon(true);
    setGameOver(true);
    memoryAudio.playGameWin();
    haptics.success();
  };

  // ====================================================
  // Mode 2: Simon Rhythm Logic
  // ====================================================
  const initSimonGame = useCallback(() => {
    setSimonRound(1);
    setSimonSequence([]);
    setPlayerStep(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setInGame(true);
    setGameOver(false);
    setGameWon(false);
    setSubmitSuccess(false);
    setIsSimonPlayingSequence(true);
    setSimonStatusText('첫 번째 멜로디를 잘 듣고 기억하세요!');

    // Start with 1 random button
    const firstBtn = Math.floor(Math.random() * 4);
    const initialSeq = [firstBtn];
    setSimonSequence(initialSeq);

    setTimeout(() => {
      playSimonSequence(initialSeq);
    }, 800);
  }, []);

  // Play Sequence with lights and audio
  const playSimonSequence = (sequence) => {
    setIsSimonPlayingSequence(true);
    setSimonStatusText('🎶 도촌 멜로디가 연주 중입니다...');

    sequence.forEach((btnId, idx) => {
      setTimeout(() => {
        const btnObj = SIMON_BUTTONS[btnId];
        setActiveSimonButton(btnId);
        memoryAudio.playSimonTone(btnObj.freq, 0.4);

        setTimeout(() => {
          setActiveSimonButton(null);
        }, 320);

        if (idx === sequence.length - 1) {
          setTimeout(() => {
            setIsSimonPlayingSequence(false);
            setPlayerStep(0);
            setSimonStatusText('👉 여러분의 차례입니다! 순서대로 눌러보세요.');
          }, 450);
        }
      }, idx * 600 + 400);
    });
  };

  // Handle Simon Button Click
  const handleSimonButtonClick = (btnId) => {
    if (!inGame || isSimonPlayingSequence || gameOver) return;

    const btnObj = SIMON_BUTTONS[btnId];
    setActiveSimonButton(btnId);
    memoryAudio.playSimonTone(btnObj.freq, 0.3);
    haptics.light();

    setTimeout(() => {
      setActiveSimonButton(null);
    }, 200);

    // Validate Input
    if (simonSequence[playerStep] === btnId) {
      // Correct step
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      if (nextStep === simonSequence.length) {
        // ROUND COMPLETE!
        const nextRound = simonRound + 1;
        const roundScore = simonRound * 250;
        const newScore = score + roundScore;
        setScore(newScore);
        setSimonRound(nextRound);
        setCombo(c => c + 1);

        memoryAudio.playRoundClear();
        haptics.success();
        setSimonStatusText(`🎉 라운드 ${simonRound} 성공! +${roundScore}점`);

        const nextBtn = Math.floor(Math.random() * 4);
        const nextSeq = [...simonSequence, nextBtn];
        setSimonSequence(nextSeq);

        setTimeout(() => {
          playSimonSequence(nextSeq);
        }, 1200);
      }
    } else {
      // WRONG STEP - GAME OVER
      setGameOver(true);
      setSimonStatusText('앗! 순서가 틀렸습니다.');
      memoryAudio.playGameOver();
      haptics.error();
    }
  };

  // ====================================================
  // Submit High Score to Leaderboard
  // ====================================================
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || score <= 100) return;

    setIsSubmitting(true);
    try {
      await submitScoreToDB('memory', playerName.trim(), score);
      setSubmitSuccess(true);
      haptics.success();

      // Trigger automatic tab switch in Leaderboard modal
      if (onScoreSubmitted) {
        onScoreSubmitted('memory');
      }
    } catch (err) {
      console.error('Score submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Grid Column Class for Card Match
  const getGridColsClass = () => {
    const cols = CARD_DIFFICULTIES[selectedDifficulty].cols;
    if (cols === 5) return 'grid-cols-4 sm:grid-cols-5';
    return 'grid-cols-3 sm:grid-cols-4';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-5 select-none text-slate-100 font-sans">
      
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 sm:p-4 mb-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-xl sm:text-2xl">
            🧠
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 leading-tight">
              도촌 기억력 마스터
            </h1>
            <p className="text-[11px] sm:text-xs text-indigo-300/80 font-medium">
              {gameMode === GAME_MODES.CARD_MATCH ? '🃏 3D 카드 짝 맞추기 퍼즐' : '🎵 멜로디 & 순서 기억 챌린지'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsHowToPlayOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition"
            title="게임 방법"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">가이드</span>
          </button>

          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition ${
              isMuted 
                ? 'bg-rose-950/60 border-rose-600/50 text-rose-300' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {inGame && (
            <button
              onClick={() => {
                clearInterval(timerRef.current);
                setInGame(false);
                setGameOver(false);
                setGameWon(false);
                haptics.light();
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/40 flex items-center gap-1 text-xs font-bold transition"
              title="모드 변경 / 나가기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">메뉴</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Combo Banner */}
      {comboText && (
        <div className="absolute top-20 z-40 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-sm rounded-full shadow-lg combo-pop">
          {comboText}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 1: Game Mode & Options Selection Menu */}
      {/* ---------------------------------------------------- */}
      {!inGame && !gameOver && (
        <div className="w-full bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-fade-in max-w-2xl">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            도촌초 어린이 두뇌 훈련 프로젝트
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 text-white">
            플레이할 모드를 선택하세요!
          </h2>

          {/* Mode Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
            
            {/* Mode A: Card Match */}
            <button
              onClick={() => {
                setGameMode(GAME_MODES.CARD_MATCH);
                haptics.light();
              }}
              className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                gameMode === GAME_MODES.CARD_MATCH
                  ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-indigo-400 shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🃏</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">
                  인기 모드
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">3D 카드 짝 맞추기</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                엎어진 카드를 2장씩 뒤집어 같은 짝을 찾고 콤보와 스피드 기록을 세우세요!
              </p>
            </button>

            {/* Mode B: Simon Rhythm */}
            <button
              onClick={() => {
                setGameMode(GAME_MODES.SIMON_RHYTHM);
                haptics.light();
              }}
              className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                gameMode === GAME_MODES.SIMON_RHYTHM
                  ? 'bg-gradient-to-br from-cyan-900/80 to-blue-900/80 border-cyan-400 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                  : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🎵</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-300">
                  구글 두들 스타일
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">멜로디 & 순서 기억</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                빛나는 동물 악기 버튼이 연주하는 소리 순서를 기억하여 차례대로 터치하세요!
              </p>
            </button>
          </div>

          {/* Mode-Specific Sub Options */}
          {gameMode === GAME_MODES.CARD_MATCH && (
            <div className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
              
              {/* Theme Picker */}
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 카드 테마 선택
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.keys(CARD_THEMES).map(themeKey => {
                    const t = CARD_THEMES[themeKey];
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => {
                          setSelectedTheme(themeKey);
                          haptics.light();
                        }}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Picker */}
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 난이도 선택
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(CARD_DIFFICULTIES).map(diffKey => {
                    const d = CARD_DIFFICULTIES[diffKey];
                    const isSelected = selectedDifficulty === diffKey;
                    return (
                      <button
                        key={diffKey}
                        onClick={() => {
                          setSelectedDifficulty(diffKey);
                          haptics.light();
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                          isSelected
                            ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                            : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div>{d.name}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">제한시간 {d.timeLimit}초</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={() => {
              if (gameMode === GAME_MODES.CARD_MATCH) {
                initCardMatch();
              } else {
                initSimonGame();
              }
              haptics.medium();
            }}
            className="w-full py-4 px-8 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-400 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl shadow-indigo-500/40 flex items-center justify-center gap-3 transition transform hover:scale-[1.02] active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>게임 시작하기!</span>
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 2-A: Card Match Active Gameplay */}
      {/* ---------------------------------------------------- */}
      {inGame && !gameOver && gameMode === GAME_MODES.CARD_MATCH && (
        <div className="w-full flex flex-col items-center">
          
          {/* Status HUD */}
          <div className="w-full max-w-2xl bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 sm:p-4 mb-4 flex items-center justify-around text-center shadow-lg">
            <div>
              <div className="text-[11px] text-indigo-300 font-bold flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> 남은 시간
              </div>
              <div className={`text-xl sm:text-2xl font-black ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                {timeLeft}초
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div>
              <div className="text-[11px] text-indigo-300 font-bold flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> 맞춘 짝
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300">
                {matchedIds.length / 2} / {CARD_DIFFICULTIES[selectedDifficulty].pairs}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div>
              <div className="text-[11px] text-indigo-300 font-bold flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-pink-400" /> 점수
              </div>
              <div className="text-xl sm:text-2xl font-black text-pink-300">
                {score.toLocaleString()}점
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className={`memory-card-grid ${getGridColsClass()}`}>
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIds.includes(card.instanceId);
              const isMatched = matchedIds.includes(card.instanceId);

              return (
                <div
                  key={card.instanceId}
                  onClick={() => handleCardClick(idx)}
                  className="memory-perspective aspect-[3/4] cursor-pointer"
                >
                  <div
                    className={`memory-card-inner relative w-full h-full rounded-xl sm:rounded-2xl shadow-md ${
                      isFlipped ? 'memory-card-flipped' : ''
                    }`}
                  >
                    {/* Card Back (Hidden pattern) */}
                    <div className="memory-card-back absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-900 border-2 border-indigo-400/50 flex flex-col items-center justify-center hover:border-indigo-300 transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm sm:text-base border border-indigo-400/30">
                        ?
                      </div>
                    </div>

                    {/* Card Front (Revealed Content) */}
                    <div
                      className={`memory-card-front absolute inset-0 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${
                        isMatched
                          ? 'bg-slate-800/90 border-emerald-400 ring-2 ring-emerald-400/60'
                          : 'bg-slate-800 border-indigo-400 shadow-xl'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl filter drop-shadow-md">
                        {card.emoji}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-200 mt-1">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 2-B: Simon Rhythm Active Gameplay */}
      {/* ---------------------------------------------------- */}
      {inGame && !gameOver && gameMode === GAME_MODES.SIMON_RHYTHM && (
        <div className="w-full flex flex-col items-center max-w-md animate-fade-in">
          
          {/* Status HUD */}
          <div className="w-full bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 sm:p-4 mb-4 flex items-center justify-around text-center shadow-lg">
            <div>
              <div className="text-[11px] text-cyan-300 font-bold">현재 라운드</div>
              <div className="text-2xl font-black text-cyan-400">STAGE {simonRound}</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <div className="text-[11px] text-pink-300 font-bold">누적 점수</div>
              <div className="text-2xl font-black text-pink-400">{score.toLocaleString()}점</div>
            </div>
          </div>

          {/* Guide Text Banner */}
          <div className="w-full py-2 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs font-bold text-indigo-200 mb-6">
            {simonStatusText}
          </div>

          {/* 4 Simon Rhythm Sound Buttons Grid */}
          <div className="grid grid-cols-2 gap-4 w-full p-2">
            {SIMON_BUTTONS.map(btn => {
              const isActive = activeSimonButton === btn.id;

              return (
                <button
                  key={btn.id}
                  disabled={isSimonPlayingSequence}
                  onClick={() => handleSimonButtonClick(btn.id)}
                  className={`simon-btn aspect-square rounded-3xl flex flex-col items-center justify-center p-4 border-2 transition-all ${
                    btn.bgClass
                  } ${
                    isActive ? btn.glowClass : 'opacity-90 hover:opacity-100 shadow-lg'
                  } ${
                    isSimonPlayingSequence ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <span className="text-4xl sm:text-5xl mb-1 filter drop-shadow-md">
                    {btn.icon}
                  </span>
                  <span className="text-sm font-black tracking-wide">
                    {btn.name}
                  </span>
                  <span className="text-[11px] font-bold opacity-80">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 3: Game Over & Leaderboard Registration Screen */}
      {/* ---------------------------------------------------- */}
      {gameOver && (
        <div className="w-full max-w-lg bg-slate-900/95 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center animate-fade-in">
          
          {/* Result Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 text-3xl mb-4">
            {gameWon ? '🏆' : '🧠'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
            {gameWon ? '미션 클리어 성공!' : '도전 종료!'}
          </h2>
          <p className="text-xs text-indigo-300 mb-6">
            {gameMode === GAME_MODES.CARD_MATCH 
              ? '모든 카드의 짝을 완벽하게 맞추셨습니다!' 
              : `스테이지 ${simonRound}단계까지 성공하셨습니다!`}
          </p>

          {/* Final Score Box */}
          <div className="w-full bg-slate-800/80 border border-indigo-500/30 rounded-2xl p-4 mb-6">
            <div className="text-xs font-bold text-indigo-300 mb-1">최종 획득 점수</div>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              {score.toLocaleString()} <span className="text-xl text-amber-200">점</span>
            </div>
            {maxCombo >= 2 && (
              <div className="text-xs font-bold text-pink-400 mt-1">
                최대 연속 콤보: {maxCombo}회 달성! 🔥
              </div>
            )}
          </div>

          {/* Leaderboard Submission Section (Rule: score > 100 only) */}
          {score > 100 ? (
            <div className="w-full bg-slate-800/60 border border-amber-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>도촌초 명예의 전당 랭킹 등록</span>
              </div>

              {!submitSuccess ? (
                <form onSubmit={handleScoreSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="예: 홍길동"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 text-sm font-semibold text-center focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !playerName.trim()}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{isSubmitting ? '기록 등록 중...' : '명예의 전당 점수 등록'}</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>점수가 명예의 전당에 성공적으로 등록되었습니다! 🎉</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-slate-400 text-xs mb-6">
              💡 100점 초과 달성 시 명예의 전당에 점수를 등록할 수 있습니다.
            </div>
          )}

          {/* Bottom Control Buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={() => {
                if (gameMode === GAME_MODES.CARD_MATCH) {
                  initCardMatch();
                } else {
                  initSimonGame();
                }
                haptics.medium();
              }}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform hover:scale-[1.02] active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기</span>
            </button>

            <button
              onClick={() => {
                setInGame(false);
                setGameOver(false);
                setGameWon(false);
                haptics.light();
              }}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition"
            >
              모드 선택 메뉴
            </button>
          </div>
        </div>
      )}

      {/* How to Play Guide Modal */}
      <MemoryHowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}
